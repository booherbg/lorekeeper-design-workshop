#!/usr/bin/env python3
"""
Generate docs/sessions.html from checkpoint logs and session summaries.

Reads from:
    docs/PROMPTS/001.md ... 00N.md            (checkpoint logs with verbatim prompts)
    docs/PROMPTS/SESSION-SUMMARIES/001.md ...  (session summaries)

Writes to:
    docs/sessions.html

Usage:
    python3 scripts/build-sessions.py
"""

import re
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
PROMPTS_DIR = PROJECT_DIR / "docs" / "PROMPTS"
SUMMARIES_DIR = PROMPTS_DIR / "SESSION-SUMMARIES"
OUTPUT_HTML = PROJECT_DIR / "docs" / "sessions.html"

SESSION_META = {
    1: {"title": "Design Sprint", "subtitle": "~1 hour · Phases 1-4"},
    2: {"title": "Spec Hardening", "subtitle": "~45 min · Pre-build audit"},
    3: {"title": "Overnight Build", "subtitle": "~30 min unattended · Slices 4-7"},
    4: {"title": "Review & Polish", "subtitle": "~45 min · UI + MCP setup"},
    5: {"title": "MCP Deep Dive & Install Script", "subtitle": "~1 hour · Activation"},
    6: {"title": "Voice & Easter Egg", "subtitle": "~20 min · Stretch feature"},
    7: {"title": "Session Tooling & Retrospective", "subtitle": "~30 min · Meta"},
}


def html_escape(text):
    return (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))


def parse_checkpoint_log(text):
    """Parse a checkpoint log into entries with title, prompts, context, and response details."""
    entries = []
    chunks = re.split(r'^## ', text, flags=re.MULTILINE)[1:]

    for chunk in chunks:
        lines = chunk.strip().split('\n')
        heading = lines[0].strip()

        prompts = []
        context = []
        files = []
        response_detail = []
        in_blockquote = False
        in_details = False
        current_quote = []

        for line in lines[1:]:
            stripped = line.strip()

            if '<details>' in stripped:
                in_details = True
                continue
            if '</details>' in stripped:
                in_details = False
                continue
            if in_details:
                if not stripped.startswith('<summary>'):
                    response_detail.append(line.rstrip())
                continue

            if stripped.startswith('> '):
                if not in_blockquote and current_quote:
                    prompts.append('\n'.join(current_quote))
                    current_quote = []
                in_blockquote = True
                current_quote.append(stripped[2:])
            elif in_blockquote and stripped.startswith('>'):
                current_quote.append(stripped[1:].strip() if len(stripped) > 1 else '')
            else:
                if in_blockquote and current_quote:
                    prompts.append('\n'.join(current_quote))
                    current_quote = []
                    in_blockquote = False

                if stripped.startswith('**What happened:**'):
                    ctx = stripped.replace('**What happened:**', '').strip()
                    context.append(ctx)
                elif stripped.startswith('**Files touched:**'):
                    f = stripped.replace('**Files touched:**', '').strip()
                    files.append(f)
                elif stripped and not stripped.startswith('**') and context and not in_details:
                    context.append(stripped)

        if current_quote:
            prompts.append('\n'.join(current_quote))

        detail_text = '\n'.join(response_detail).strip()
        # Strip [...]  truncation markers for cleaner display
        detail_text = detail_text.replace('\n\n[...]', '').strip()

        entries.append({
            'heading': heading,
            'prompts': prompts,
            'context': ' '.join(context),
            'files': ' '.join(files),
            'response': detail_text,
        })

    return entries


def load_summary_text(session_num):
    """Load the Summary section from a session summary file."""
    path = SUMMARIES_DIR / f"{session_num:03d}.md"
    if not path.exists():
        return ""
    text = path.read_text()
    m = re.search(r'## Summary\n\n(.+?)(?=\n## |\Z)', text, re.DOTALL)
    return m.group(1).strip() if m else ""


def simple_markdown_to_html(text):
    """Minimal markdown→HTML for response details. Handles paragraphs, bold, code, lists."""
    paragraphs = re.split(r'\n\n+', text.strip())
    html_parts = []
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if p.startswith('- ') or p.startswith('* '):
            items = re.split(r'\n[*-] ', '\n' + p)
            li = ''.join(f'<li>{html_escape(i.strip())}</li>' for i in items if i.strip())
            html_parts.append(f'<ul class="list-disc ml-5 space-y-1">{li}</ul>')
        elif re.match(r'^\d+\.', p):
            items = re.split(r'\n\d+\.\s*', '\n' + p)
            li = ''.join(f'<li>{html_escape(i.strip())}</li>' for i in items if i.strip())
            html_parts.append(f'<ol class="list-decimal ml-5 space-y-1">{li}</ol>')
        else:
            escaped = html_escape(p)
            escaped = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', escaped)
            escaped = re.sub(r'`(.+?)`', r'<code class="bg-surface-300 px-1 rounded text-xs">\1</code>', escaped)
            html_parts.append(f'<p>{escaped}</p>')
    return '\n'.join(html_parts)


def build_entry_html(entry):
    """Build HTML for a single checkpoint entry."""
    heading = entry['heading']
    prompts = entry['prompts']
    context = entry['context']
    files = entry['files']
    response = entry.get('response', '')

    prompt_blocks = []
    for p in prompts:
        escaped = html_escape(p)
        has_screenshot = '[screenshot]' in p
        badge = ' <span class="inline-block bg-surface-300 text-text-400 text-xs px-1.5 py-0.5 rounded ml-1">screenshot</span>' if has_screenshot else ''
        escaped = escaped.replace('[screenshot]', '').strip()

        if len(p) > 200:
            short = html_escape(p[:200]) + "..."
            prompt_blocks.append(f'''
            <details class="group">
              <summary class="prompt bg-surface-100 rounded p-3 text-sm text-text-200">{short}{badge}</summary>
              <div class="bg-surface-200 rounded p-3 ml-4 mt-1 text-sm text-text-300 whitespace-pre-wrap">{escaped}</div>
            </details>''')
        else:
            prompt_blocks.append(f'''
            <div class="prompt bg-surface-100 rounded p-3 text-sm text-text-200">{escaped}{badge}</div>''')

    prompts_html = '\n'.join(prompt_blocks)

    context_html = ''
    if context:
        context_html = f'<div class="response bg-surface-100 rounded p-3 mt-1 ml-4 text-sm text-text-300">{html_escape(context)}</div>'

    response_html = ''
    if response:
        response_body = simple_markdown_to_html(response)
        response_html = f'''
              <details class="ml-4 mt-1">
                <summary class="text-xs text-text-400 cursor-pointer hover:text-text-300">Show full response</summary>
                <div class="response bg-surface-200 rounded p-4 mt-1 text-sm text-text-300 space-y-2">{response_body}</div>
              </details>'''

    files_html = ''
    if files:
        files_html = f'<div class="text-xs text-text-400 mt-1 ml-4"><span class="font-mono">{html_escape(files)}</span></div>'

    return f'''
          <details>
            <summary class="text-sm font-medium text-text-200 py-2">{html_escape(heading)}</summary>
            <div class="ml-4 mt-1 space-y-1">
              {prompts_html}
              {context_html}
              {response_html}
              {files_html}
            </div>
          </details>'''


def generate_html(sessions):
    total_prompts = sum(
        sum(len(e['prompts']) for e in s['entries'])
        for s in sessions
    )

    session_blocks = []
    for s in sessions:
        num = s['num']
        meta = SESSION_META.get(num, {"title": f"Session {num}", "subtitle": ""})
        summary = s['summary']
        entries = s['entries']

        summary_html = f'<p class="text-text-300 text-sm mb-4">{html_escape(summary)}</p>' if summary else ''

        entries_html = '\n'.join(build_entry_html(e) for e in entries)

        session_blocks.append(f'''
    <div class="mb-8">
      <details{"" if num > 1 else " open"}>
        <summary class="text-xl font-semibold text-text-100 py-3">Session {num}: {html_escape(meta["title"])} <span class="text-sm font-normal text-text-400 ml-2">{html_escape(meta["subtitle"])}</span></summary>
        <div class="mt-4 ml-4">
          {summary_html}
          <div class="space-y-1">
            {entries_html}
          </div>
        </div>
      </details>
    </div>''')

    sessions_html = '\n'.join(session_blocks)

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lorekeeper Workshop Sessions</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {{
      theme: {{
        extend: {{
          colors: {{
            surface: {{ 50: '#1a1a1f', 100: '#22222a', 200: '#2a2a34', 300: '#33333f', 400: '#3d3d4a' }},
            text: {{ 100: '#f0ede8', 200: '#d4cfc6', 300: '#9e978b', 400: '#6e685e' }},
            ember: {{ 400: '#e8884d', 500: '#d97742', 600: '#c4632e' }},
          }}
        }}
      }}
    }}
  </script>
  <style>
    details summary {{ cursor: pointer; list-style: none; }}
    details summary::-webkit-details-marker {{ display: none; }}
    details summary::before {{ content: '\\25B6'; display: inline-block; margin-right: 0.5rem; font-size: 0.7em; transition: transform 0.15s; color: #d97742; }}
    details[open] summary::before {{ transform: rotate(90deg); }}
    .prompt {{ border-left: 3px solid #d97742; }}
    .response {{ border-left: 3px solid #3d3d4a; }}
  </style>
</head>
<body class="bg-surface-50 text-text-200 min-h-screen">
  <div class="max-w-4xl mx-auto px-6 py-12">

    <h1 class="text-3xl font-bold text-text-100 mb-2">Lorekeeper Workshop Sessions</h1>
    <p class="text-text-300 mb-8">{len(sessions)} sessions, {total_prompts} prompts, 1 complete application. April 26-27, 2026.</p>

    {sessions_html}

    <div class="mt-12 pt-8 border-t border-surface-300">
      <h2 class="text-lg font-semibold text-text-100 mb-4">By the numbers</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-surface-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-ember-400">{len(sessions)}</div>
          <div class="text-xs text-text-400 mt-1">sessions</div>
        </div>
        <div class="bg-surface-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-ember-400">{total_prompts}</div>
          <div class="text-xs text-text-400 mt-1">human prompts</div>
        </div>
        <div class="bg-surface-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-ember-400">136</div>
          <div class="text-xs text-text-400 mt-1">tests passing</div>
        </div>
        <div class="bg-surface-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-ember-400">22</div>
          <div class="text-xs text-text-400 mt-1">MCP tools</div>
        </div>
        <div class="bg-surface-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-ember-400">7</div>
          <div class="text-xs text-text-400 mt-1">vertical slices</div>
        </div>
        <div class="bg-surface-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-ember-400">4</div>
          <div class="text-xs text-text-400 mt-1">spec documents</div>
        </div>
        <div class="bg-surface-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-ember-400">15</div>
          <div class="text-xs text-text-400 mt-1">templates</div>
        </div>
        <div class="bg-surface-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-ember-400">1</div>
          <div class="text-xs text-text-400 mt-1">easter egg</div>
        </div>
      </div>
    </div>

  </div>
</body>
</html>'''


def main():
    sessions = []

    log_files = sorted(PROMPTS_DIR.glob('[0-9][0-9][0-9].md'))
    for log_path in log_files:
        num = int(log_path.stem)
        text = log_path.read_text()
        entries = parse_checkpoint_log(text)
        summary = load_summary_text(num)

        sessions.append({
            'num': num,
            'entries': entries,
            'summary': summary,
        })

        prompt_count = sum(len(e['prompts']) for e in entries)
        print(f"Session {num}: {prompt_count} prompts, {len(entries)} entries")

    html = generate_html(sessions)
    OUTPUT_HTML.write_text(html)
    print(f"\nWrote {OUTPUT_HTML}")


if __name__ == "__main__":
    main()
