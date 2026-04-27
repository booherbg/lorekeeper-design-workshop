#!/usr/bin/env python3
"""
Enrich checkpoint logs with assistant response summaries extracted from
Claude Code JSONL session history.

Reads human→assistant exchange pairs from JSONL, truncates assistant
responses to a readable summary, and outputs enriched checkpoint logs
alongside the originals.

Usage:
    python3 scripts/enrich-sessions.py

Writes enriched versions to docs/PROMPTS/001.enriched.md, etc.
Review and merge into the main checkpoint logs manually.
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime

BASE = Path(os.path.expanduser(
    "~/.claude/projects/-Users-blaine-workspace-lorekeeper-design-workshop"
))
PROJECT_DIR = Path(__file__).resolve().parent.parent
PROMPTS_DIR = PROJECT_DIR / "docs" / "PROMPTS"

SESSION_FILES = {
    1: ["9c68b90d-b32c-4d6d-9101-30ef0914ae49.jsonl"],
    2: ["1f587b75-c363-49c1-b6ca-73fbfdb9b649.jsonl"],
    3: ["e95d49bd-b96c-45ee-ae12-0317be49717d.jsonl",
        "47d78f5d-8240-4a1f-94bc-d1e863f11bab.jsonl"],
    4: ["47d78f5d-8240-4a1f-94bc-d1e863f11bab.jsonl"],
    5: ["cf5216a9-2f5e-4ca4-9dc8-3b3418ba6f25.jsonl"],
    6: ["f290fdda-dc24-474f-94b5-71f4e876fe8f.jsonl"],
}

SESSION_3_4_SPLIT = "Im back"


def is_noise(text):
    return (not text or
            text.startswith("<local-command") or
            text.startswith("<command-name>") or
            text.startswith("<bash-") or
            text == "[Request interrupted by user]" or
            text.startswith("─" * 10))


def is_handoff(text):
    return (text.startswith("You are the AI tutor") or
            text.startswith("You are starting a fresh session") or
            text.startswith("load the handoff"))


def extract_text(content):
    if isinstance(content, list):
        return " ".join(
            p.get("text", "") for p in content if p.get("type") == "text"
        ).strip()
    return str(content).strip()


def extract_exchanges(fnames):
    """Extract human→assistant pairs from JSONL files."""
    messages = []
    for fname in fnames:
        path = BASE / fname
        if not path.exists():
            continue
        with open(path) as f:
            for line in f:
                try:
                    d = json.loads(line)
                    if d.get("type") in ("user", "assistant"):
                        messages.append(d)
                except json.JSONDecodeError:
                    continue

    exchanges = []
    for i, msg in enumerate(messages):
        if msg["type"] != "user" or msg.get("isMeta", False):
            continue

        m = msg.get("message", {})
        if not isinstance(m, dict) or m.get("role") != "user":
            continue

        text = extract_text(m.get("content", ""))
        if is_noise(text):
            continue

        has_image = False
        content = m.get("content", "")
        if isinstance(content, list):
            has_image = any(p.get("type") == "image" for p in content)

        ts = msg.get("timestamp", "")
        time_str = ""
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                time_str = dt.strftime("%H:%M")
            except (ValueError, TypeError):
                pass

        # Collect assistant response text (skip tool calls)
        response_parts = []
        for j in range(i + 1, len(messages)):
            if (messages[j]["type"] == "user" and
                    not messages[j].get("isMeta", False)):
                break
            if messages[j]["type"] == "assistant":
                am = messages[j].get("message", {})
                ac = am.get("content", [])
                if isinstance(ac, list):
                    for part in ac:
                        if part.get("type") == "text" and part.get("text", "").strip():
                            response_parts.append(part["text"].strip())

        exchanges.append({
            "time": time_str,
            "human": text,
            "has_image": has_image,
            "response": "\n\n".join(response_parts) if response_parts else "",
        })

    return exchanges


def truncate_response(text, max_chars=1500):
    """Truncate to roughly max_chars, breaking at paragraph boundaries."""
    if len(text) <= max_chars:
        return text
    # Find last paragraph break before limit
    cut = text[:max_chars].rfind("\n\n")
    if cut < max_chars // 2:
        cut = text[:max_chars].rfind("\n")
    if cut < max_chars // 2:
        cut = max_chars
    return text[:cut].rstrip() + "\n\n[...]"


def split_session_3_4(exchanges):
    for i, ex in enumerate(exchanges):
        if SESSION_3_4_SPLIT in ex["human"]:
            return exchanges[:i], exchanges[i:]
    return exchanges, []


def build_enriched_log(session_num, exchanges):
    lines = [f"# Checkpoint Log — Session {session_num:03d}\n"]

    entry_num = 0
    for ex in exchanges:
        if is_handoff(ex["human"]):
            continue

        entry_num += 1
        time_note = f" ({ex['time']} UTC)" if ex["time"] else ""
        image_note = " [screenshot]" if ex["has_image"] else ""

        lines.append(f"## {entry_num}.{time_note}\n")
        # Quote each line of the prompt
        for pline in ex["human"].split("\n"):
            lines.append(f"> {pline}")
        if image_note:
            lines[-1] += image_note
        lines.append("")

        if ex["response"]:
            truncated = truncate_response(ex["response"])
            lines.append("<details>")
            resp_lines = truncated.split("\n")
            summary = resp_lines[0][:150]
            lines.append(f"<summary><strong>Response:</strong> {summary}</summary>\n")
            lines.append(truncated)
            lines.append("\n</details>\n")
        else:
            lines.append("*No text response — tool calls only.*\n")

    return "\n".join(lines)


def main():
    exchange_cache = {}

    for session_num, fnames in SESSION_FILES.items():
        cache_key = tuple(fnames)
        if cache_key not in exchange_cache:
            exchange_cache[cache_key] = extract_exchanges(fnames)

        exchanges = exchange_cache[cache_key]

        if session_num == 3:
            s3, s4 = split_session_3_4(exchanges)
            exchanges = s3
            exchange_cache["_s4"] = s4
        elif session_num == 4:
            exchanges = exchange_cache.get("_s4", exchanges)

        enriched = build_enriched_log(session_num, exchanges)
        out_path = PROMPTS_DIR / f"{session_num:03d}.enriched.md"
        out_path.write_text(enriched)

        count = len([e for e in exchanges if not is_handoff(e["human"])])
        print(f"Session {session_num}: {count} exchanges → {out_path.name}")


if __name__ == "__main__":
    main()
