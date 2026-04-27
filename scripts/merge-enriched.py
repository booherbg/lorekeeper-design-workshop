#!/usr/bin/env python3
"""
Merge enriched response details into curated checkpoint logs.

Takes the curated logs (with titles and "what happened" summaries) and
adds expandable <details> blocks with assistant response text from the
enriched versions.

Matches entries by prompt text similarity.

Usage:
    python3 scripts/merge-enriched.py
"""

import re
from pathlib import Path
from difflib import SequenceMatcher

PROJECT_DIR = Path(__file__).resolve().parent.parent
PROMPTS_DIR = PROJECT_DIR / "docs" / "PROMPTS"


def parse_curated_entries(text):
    """Parse curated checkpoint log into entries."""
    entries = []
    chunks = re.split(r'^## ', text, flags=re.MULTILINE)
    header = chunks[0]  # Everything before first ##

    for chunk in chunks[1:]:
        entries.append("## " + chunk)

    return header, entries


def extract_prompts_from_entry(entry):
    """Get the blockquoted prompts from an entry."""
    prompts = []
    for line in entry.split('\n'):
        if line.startswith('> '):
            prompts.append(line[2:].strip())
    return ' '.join(prompts)


def parse_enriched_entries(text):
    """Parse enriched log into {prompt_text: details_block} map."""
    entries = {}
    chunks = re.split(r'^## ', text, flags=re.MULTILINE)[1:]

    for chunk in chunks:
        lines = chunk.strip().split('\n')
        prompts = []
        details_block = None

        in_details = False
        details_lines = []

        for line in lines:
            if line.startswith('> '):
                prompts.append(line[2:].strip())
            elif '<details>' in line:
                in_details = True
                details_lines.append(line)
            elif '</details>' in line:
                details_lines.append(line)
                in_details = False
            elif in_details:
                details_lines.append(line)

        prompt_key = ' '.join(prompts)
        if details_lines:
            details_block = '\n'.join(details_lines)

        if prompt_key:
            entries[prompt_key] = details_block

    return entries


def find_best_match(prompt, enriched_keys, threshold=0.5):
    """Find the best matching enriched entry by prompt similarity."""
    best_score = 0
    best_key = None
    # Use first 200 chars for matching (prompts can be long)
    prompt_short = prompt[:200]
    for key in enriched_keys:
        key_short = key[:200]
        score = SequenceMatcher(None, prompt_short, key_short).ratio()
        if score > best_score:
            best_score = score
            best_key = key
    if best_score >= threshold:
        return best_key
    return None


def merge_entry(curated_entry, details_block):
    """Add details block to a curated entry, before any Files touched line."""
    if not details_block:
        return curated_entry

    # Don't add if entry already has a details block
    if '<details>' in curated_entry:
        return curated_entry

    lines = curated_entry.rstrip().split('\n')

    # Find insertion point: after "What happened" paragraph, before "Files touched"
    insert_idx = len(lines)
    for i, line in enumerate(lines):
        if line.startswith('**Files touched:**'):
            insert_idx = i
            break

    merged = lines[:insert_idx]
    merged.append('')
    merged.append(details_block)
    merged.append('')
    merged.extend(lines[insert_idx:])

    return '\n'.join(merged)


def main():
    for session_num in range(1, 8):
        curated_path = PROMPTS_DIR / f"{session_num:03d}.md"
        enriched_path = PROMPTS_DIR / f"{session_num:03d}.enriched.md"

        if not curated_path.exists():
            continue
        if not enriched_path.exists():
            print(f"Session {session_num}: no enriched file, skipping")
            continue

        curated_text = curated_path.read_text()
        enriched_text = enriched_path.read_text()

        header, curated_entries = parse_curated_entries(curated_text)
        enriched_map = parse_enriched_entries(enriched_text)
        enriched_keys = list(enriched_map.keys())

        merged_count = 0
        new_entries = []
        for entry in curated_entries:
            prompt = extract_prompts_from_entry(entry)
            if not prompt:
                new_entries.append(entry)
                continue

            match_key = find_best_match(prompt, enriched_keys)
            if match_key and enriched_map[match_key]:
                entry = merge_entry(entry, enriched_map[match_key])
                enriched_keys.remove(match_key)
                merged_count += 1

            new_entries.append(entry)

        result = header + '\n'.join(new_entries)
        curated_path.write_text(result)
        print(f"Session {session_num}: merged {merged_count} response details")


if __name__ == "__main__":
    main()
