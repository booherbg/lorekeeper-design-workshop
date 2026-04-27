#!/usr/bin/env python3
"""
Extract human prompts from Claude Code JSONL session files and rebuild
checkpoint logs with verbatim prompts + session summary context.

Also generates docs/sessions.html as a browsable report.

Usage:
    python3 scripts/extract-sessions.py

Reads from:
    ~/.claude/projects/-Users-blaine-workspace-lorekeeper-design-workshop/*.jsonl
    docs/PROMPTS/SESSION-SUMMARIES/*.md

Writes to:
    docs/PROMPTS/001.md ... 00N.md  (checkpoint logs, overwritten)
    docs/sessions.html              (browsable HTML report)
"""

import json
import glob
import os
import re
from datetime import datetime, timezone
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
CLAUDE_DIR = Path.home() / ".claude" / "projects" / "-Users-blaine-workspace-lorekeeper-design-workshop"
SUMMARIES_DIR = PROJECT_DIR / "docs" / "PROMPTS" / "SESSION-SUMMARIES"
PROMPTS_DIR = PROJECT_DIR / "docs" / "PROMPTS"
OUTPUT_HTML = PROJECT_DIR / "docs" / "sessions.html"

# Map JSONL files to workshop sessions by UUID prefix.
# Order matters — this is the session sequence.
SESSION_MAP = [
    {
        "session": 1,
        "title": "Design Sprint",
        "subtitle": "~1 hour · Phases 1-4",
        "files": ["9c68b90d-b32c-4d6d-9101-30ef0914ae49.jsonl"],
    },
    {
        "session": 2,
        "title": "Spec Hardening",
        "subtitle": "~45 min · Pre-build audit",
        "files": ["1f587b75-c363-49c1-b6ca-73fbfdb9b649.jsonl"],
    },
    {
        "session": 3,
        "title": "Overnight Build",
        "subtitle": "~30 min unattended · Slices 4-7",
        "files": [
            "e95d49bd-b96c-45ee-ae12-0317be49717d.jsonl",
            "47d78f5d-8240-4a1f-94bc-d1e863f11bab.jsonl",
        ],
    },
    {
        "session": 4,
        "title": "Review & Polish",
        "subtitle": "~45 min · UI + MCP setup",
        "files": ["47d78f5d-8240-4a1f-94bc-d1e863f11bab.jsonl"],
    },
    {
        "session": 5,
        "title": "MCP Deep Dive & Install Script",
        "subtitle": "~1 hour · Activation",
        "files": ["cf5216a9-2f5e-4ca4-9dc8-3b3418ba6f25.jsonl"],
    },
    {
        "session": 6,
        "title": "Voice & Easter Egg",
        "subtitle": "~20 min · Stretch feature",
        "files": ["f290fdda-dc24-474f-94b5-71f4e876fe8f.jsonl"],
    },
]

# Sessions 3 and 4 share a JSONL file. Split by this prompt.
SESSION_3_4_SPLIT_MARKER = "Im back"


def extract_human_prompts(jsonl_path):
    """Extract human prompts with timestamps from a JSONL file."""
    prompts = []
    with open(jsonl_path) as f:
        for line in f:
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue

            if d.get("type") != "user" or d.get("isMeta", False):
                continue

            msg = d.get("message", {})
            if not isinstance(msg, dict) or msg.get("role") != "user":
                continue

            content = msg.get("content", "")
            has_image = False
            if isinstance(content, list):
                has_image = any(p.get("type") == "image" for p in content)
                texts = [p.get("text", "") for p in content if p.get("type") == "text"]
                text = " ".join(texts).strip()
            else:
                text = str(content).strip()

            # Skip system noise
            if not text or text.startswith("<local-command") or text.startswith("<command-name>"):
                continue
            if text.startswith("<bash-input>") or text.startswith("<bash-stdout>"):
                continue
            if text == "[Request interrupted by user]":
                continue

            # Strip leading horizontal rules (session dividers pasted in)
            if text.startswith("─" * 10):
                continue

            ts = d.get("timestamp", "")
            if ts:
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    time_str = dt.strftime("%H:%M")
                except (ValueError, TypeError):
                    time_str = ""
            else:
                time_str = ""

            prompts.append({
                "time": time_str,
                "text": text,
                "has_image": has_image,
            })

    return prompts


def is_handoff_prompt(text):
    """Detect if a prompt is a handoff/system prompt (not a real user interaction)."""
    return (
        text.startswith("You are the AI tutor") or
        text.startswith("You are starting a fresh session") or
        text.startswith("load the handoff")
    )


def split_session_3_4(prompts):
    """Session 3 (overnight) and 4 (review) share a JSONL. Split at 'Im back'."""
    split_idx = None
    for i, p in enumerate(prompts):
        if SESSION_3_4_SPLIT_MARKER in p["text"]:
            split_idx = i
            break

    if split_idx is not None:
        return prompts[:split_idx], prompts[split_idx:]
    return prompts, []


def load_summary(session_num):
    """Load session summary markdown."""
    path = SUMMARIES_DIR / f"{session_num:03d}.md"
    if path.exists():
        return path.read_text()
    return ""


def clean_prompt_text(text):
    """Clean up a prompt for display — remove XML tags but keep content."""
    # Remove common XML wrapper tags but keep the text
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()


def generate_checkpoint_log(session_info, prompts):
    """Generate a checkpoint log markdown file with verbatim prompts."""
    lines = [f"# Checkpoint Log — Session {session_info['session']:03d}\n"]

    entry_num = 0
    for p in prompts:
        if is_handoff_prompt(p["text"]):
            continue

        entry_num += 1
        text = p["text"]
        image_note = " [screenshot]" if p.get("has_image") else ""
        time_note = f" ({p['time']} UTC)" if p["time"] else ""

        lines.append(f"## {entry_num}.{time_note}\n")
        lines.append(f"> {text}{image_note}\n")

    return "\n".join(lines)


def html_escape(text):
    return (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))


def generate_html(all_sessions):
    """Generate the sessions.html report."""

    session_blocks = []
    total_prompts = 0

    for s in all_sessions:
        prompts = s["prompts"]
        summary = s["summary"]
        total_prompts += len([p for p in prompts if not is_handoff_prompt(p["text"])])

        # Extract summary sections
        summary_html = ""
        if summary:
            # Pull out the Summary section
            m = re.search(r'## Summary\n\n(.+?)(?=\n## |\Z)', summary, re.DOTALL)
            if m:
                summary_html = f'<p class="text-text-300 text-sm mb-4">{html_escape(m.group(1).strip())}</p>'

        prompt_items = []
        for p in prompts:
            if is_handoff_prompt(p["text"]):
                continue

            text = p["text"]
            image_badge = ' <span class="inline-block bg-surface-300 text-text-400 text-xs px-1.5 py-0.5 rounded">screenshot</span>' if p.get("has_image") else ""
            time_badge = f'<span class="text-text-400 text-xs font-mono">{p["time"]}</span> ' if p["time"] else ""

            # Truncate display for very long prompts, but show full on expand
            display = html_escape(text)
            if len(text) > 200:
                short = html_escape(text[:200]) + "..."
                prompt_items.append(f'''
          <details class="group">
            <summary class="prompt bg-surface-100 rounded p-3 text-sm text-text-200 flex items-start gap-2">
              {time_badge}<span>{short}{image_badge}</span>
            </summary>
            <div class="bg-surface-200 rounded p-3 ml-4 mt-1 text-sm text-text-300 whitespace-pre-wrap">{display}</div>
          </details>''')
            else:
                prompt_items.append(f'''
          <div class="prompt bg-surface-100 rounded p-3 text-sm text-text-200 flex items-start gap-2">
            {time_badge}<span>{display}{image_badge}</span>
          </div>''')

        prompts_html = "\n".join(prompt_items)

        num = s["session"]
        session_blocks.append(f'''
    <div class="mb-8">
      <details{"" if num > 1 else " open"}>
        <summary class="text-xl font-semibold text-text-100 py-3">Session {num}: {html_escape(s["title"])} <span class="text-sm font-normal text-text-400 ml-2">{html_escape(s["subtitle"])}</span></summary>
        <div class="mt-4 ml-4">
          {summary_html}
          <h3 class="text-sm font-semibold text-text-300 uppercase tracking-wider mb-3">Prompts</h3>
          <div class="space-y-2">
            {prompts_html}
          </div>
        </div>
      </details>
    </div>''')

    sessions_html = "\n".join(session_blocks)

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
    <p class="text-text-300 mb-8">{len(all_sessions)} sessions, {total_prompts} prompts, 1 complete application. April 26-27, 2026.</p>

    {sessions_html}

    <!-- Stats -->
    <div class="mt-12 pt-8 border-t border-surface-300">
      <h2 class="text-lg font-semibold text-text-100 mb-4">By the numbers</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-surface-100 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-ember-400">{len(all_sessions)}</div>
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
    all_sessions = []

    # Cache extracted prompts by file to avoid re-reading shared files
    prompt_cache = {}

    for sinfo in SESSION_MAP:
        session_prompts = []
        for fname in sinfo["files"]:
            fpath = CLAUDE_DIR / fname
            if not fpath.exists():
                print(f"  WARNING: {fname} not found, skipping")
                continue

            if fname not in prompt_cache:
                prompt_cache[fname] = extract_human_prompts(fpath)

            session_prompts.extend(prompt_cache[fname])

        # Handle the session 3/4 split
        if sinfo["session"] == 3:
            s3, s4 = split_session_3_4(session_prompts)
            session_prompts = s3
            # Stash s4 prompts for session 4
            prompt_cache["_session_4_split"] = s4
        elif sinfo["session"] == 4:
            session_prompts = prompt_cache.get("_session_4_split", session_prompts)

        summary = load_summary(sinfo["session"])

        all_sessions.append({
            "session": sinfo["session"],
            "title": sinfo["title"],
            "subtitle": sinfo["subtitle"],
            "prompts": session_prompts,
            "summary": summary,
        })

        user_prompts = [p for p in session_prompts if not is_handoff_prompt(p["text"])]
        print(f"Session {sinfo['session']}: {sinfo['title']} — {len(user_prompts)} prompts")

    # Write checkpoint logs
    for s in all_sessions:
        log_path = PROMPTS_DIR / f"{s['session']:03d}.md"
        log_content = generate_checkpoint_log(s, s["prompts"])
        log_path.write_text(log_content)
        print(f"  Wrote {log_path.name}")

    # Write HTML
    html = generate_html(all_sessions)
    OUTPUT_HTML.write_text(html)
    print(f"\nWrote {OUTPUT_HTML}")


if __name__ == "__main__":
    main()
