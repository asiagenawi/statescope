"""Research AI-in-education policies for all 50 states + DC.

Phase A: Claude API baseline knowledge (batches of ~5 states)
Phase B: Web search for 2025-2026 data via NCSL and state legislature sites

Usage:
    cd backend
    source venv/bin/activate
    python scripts/research_policies.py [--phase a|b|both] [--states CA,NY,TX]

Requires ANTHROPIC_API_KEY in .env
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import config

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
OUTPUT_PATH = os.path.join(DATA_DIR, 'researched_policies.json')
SEED_PATH = os.path.join(DATA_DIR, 'seed_policies.json')

ALL_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "DC",
]

STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
}

VALID_POLICY_TYPES = {"bill", "guidance", "executive_order"}
VALID_STATUSES = {"introduced", "enacted", "failed", "active"}
VALID_TOPICS = {
    "AI Literacy", "Student Privacy", "Teacher Training", "Curriculum",
    "Assessment", "Procurement", "Task Forces", "Academic Integrity",
    "Equity & Access", "Data Governance", "Workforce Development", "Research",
}

BATCH_SIZE = 5


def validate_policy(policy):
    """Validate a policy entry. Returns list of error strings (empty = valid)."""
    errors = []
    state = policy.get("state")
    if state is not None and state not in ALL_STATES:
        errors.append(f"Invalid state: {state}")
    if policy.get("policy_type") not in VALID_POLICY_TYPES:
        errors.append(f"Invalid policy_type: {policy.get('policy_type')}")
    if policy.get("status") not in VALID_STATUSES:
        errors.append(f"Invalid status: {policy.get('status')}")
    if policy.get("level") not in ("state", "federal"):
        errors.append(f"Invalid level: {policy.get('level')}")
    for field in ["date_introduced", "date_enacted"]:
        val = policy.get(field)
        if val:
            try:
                datetime.strptime(val, "%Y-%m-%d")
            except ValueError:
                errors.append(f"Invalid {field} format: {val}")
    for topic in policy.get("topics", []):
        if topic not in VALID_TOPICS:
            errors.append(f"Invalid topic: {topic}")
    if not policy.get("title"):
        errors.append("Missing title")
    return errors


def extract_json(text):
    """Extract JSON from Claude's response text."""
    # Try to find JSON block in markdown code fence
    match = re.search(r'```(?:json)?\s*(\[[\s\S]*?\])\s*```', text)
    if match:
        return json.loads(match.group(1))
    match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', text)
    if match:
        parsed = json.loads(match.group(1))
        # If it's a dict mapping state codes to arrays, flatten
        if all(isinstance(v, list) for v in parsed.values()):
            result = []
            for policies in parsed.values():
                result.extend(policies)
            return result
        return [parsed]
    # Try raw JSON
    for start in range(len(text)):
        if text[start] in '[{':
            try:
                parsed = json.loads(text[start:])
                if isinstance(parsed, dict):
                    if all(isinstance(v, list) for v in parsed.values()):
                        result = []
                        for policies in parsed.values():
                            result.extend(policies)
                        return result
                    return [parsed]
                return parsed
            except json.JSONDecodeError:
                continue
    raise ValueError("Could not extract JSON from response")


def phase_a_research(client, states):
    """Phase A: Use Claude API to get baseline policy data."""
    all_policies = []
    batches = [states[i:i + BATCH_SIZE] for i in range(0, len(states), BATCH_SIZE)]

    for batch_num, batch in enumerate(batches, 1):
        state_names = [f"{STATE_NAMES[s]} ({s})" for s in batch]
        print(f"\n  Batch {batch_num}/{len(batches)}: {', '.join(batch)}")

        prompt = f"""Research real, verifiable AI-in-education policies for these US states: {', '.join(state_names)}.

For EACH state, find ALL of these that exist:
1. State legislation (bills) related to AI in K-12 or higher education
2. Executive orders addressing AI in education
3. State department of education guidance on AI

For each policy, return a JSON object with these fields:
- "state": two-letter code (e.g., "CA")
- "title": official title with bill number if applicable
- "description": 1-2 sentence description
- "policy_type": "bill", "guidance", or "executive_order"
- "level": "state"
- "status": "enacted", "introduced", "failed", or "active"
- "date_introduced": "YYYY-MM-DD" format
- "date_enacted": "YYYY-MM-DD" or null
- "bill_number": e.g., "HB 1234" or null for guidance/EOs
- "sponsor": bill sponsor name or null
- "summary_text": detailed 2-3 sentence summary
- "source_url": direct link to the legislation or official government page
- "topics": array of applicable topics from: {json.dumps(sorted(VALID_TOPICS))}

CRITICAL RULES:
- ONLY include REAL, VERIFIABLE policies with real bill numbers and real dates.
- Do NOT fabricate or hallucinate any policy.
- Source URLs must point to real official government websites.
- If a state genuinely has no AI-in-education policy yet, return an empty array for it.
- Cover policies from 2023 through present.

Return a JSON array of all policies found across these states:
```json
[{{"state": "XX", "title": "...", ...}}, ...]
```"""

        try:
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                messages=[{"role": "user", "content": prompt}],
            )
            text = message.content[0].text
            policies = extract_json(text)

            valid_count = 0
            for p in policies:
                errors = validate_policy(p)
                if errors:
                    print(f"    SKIP (validation): {p.get('title', '?')} - {errors}")
                else:
                    all_policies.append(p)
                    valid_count += 1

            print(f"    Found {valid_count} valid policies")

        except Exception as e:
            print(f"    ERROR: {e}")

        # Rate-limit between batches
        if batch_num < len(batches):
            time.sleep(2)

    return all_policies


def phase_b_search(client):
    """Phase B: Web search for recent (2025-2026) AI-in-education legislation."""
    import requests
    from bs4 import BeautifulSoup

    all_policies = []

    # Search NCSL AI legislation tracker
    ncsl_urls = [
        "https://www.ncsl.org/technology-and-communication/artificial-intelligence-2024-legislation",
        "https://www.ncsl.org/technology-and-communication/artificial-intelligence-2025-legislation",
    ]

    for url in ncsl_urls:
        print(f"\n  Fetching: {url}")
        try:
            resp = requests.get(url, timeout=30, headers={
                "User-Agent": "Mozilla/5.0 (compatible; StateScope/1.0; education-research)"
            })
            if resp.status_code != 200:
                print(f"    HTTP {resp.status_code}")
                continue

            soup = BeautifulSoup(resp.text, "html.parser")
            # Extract text content for Claude to parse
            main_content = soup.find("main") or soup.find("article") or soup.find("body")
            if not main_content:
                print("    Could not find main content")
                continue

            # Get text, limiting to a reasonable size
            text_content = main_content.get_text(separator="\n", strip=True)[:15000]

            # Use Claude to extract education-related AI policies
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                messages=[{"role": "user", "content": f"""Extract AI-in-EDUCATION policies from this NCSL legislation tracker page.
Only include bills specifically about AI in education, schools, students, teachers, or curriculum.
Skip general AI bills that don't relate to education.

For each policy, return JSON with: state, title, description, policy_type ("bill"),
level ("state"), status, date_introduced, date_enacted, bill_number, sponsor, summary_text,
source_url, topics (from: {json.dumps(sorted(VALID_TOPICS))}).

Page content:
{text_content}

Return a JSON array:
```json
[...]
```"""}],
            )

            policies = extract_json(message.content[0].text)
            valid_count = 0
            for p in policies:
                errors = validate_policy(p)
                if not errors:
                    all_policies.append(p)
                    valid_count += 1
            print(f"    Found {valid_count} education-related policies")

        except Exception as e:
            print(f"    ERROR: {e}")

        time.sleep(2)

    return all_policies


def deduplicate(policies):
    """Remove duplicate policies by (state, bill_number) or (state, title)."""
    seen = set()
    unique = []
    for p in policies:
        if p.get("bill_number"):
            key = (p["state"], p["bill_number"])
        else:
            key = (p["state"], p["title"])
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique


def main():
    parser = argparse.ArgumentParser(description="Research AI-in-education policies")
    parser.add_argument("--phase", choices=["a", "b", "both"], default="both",
                        help="Which phase to run (default: both)")
    parser.add_argument("--states", type=str, default=None,
                        help="Comma-separated state codes (default: all)")
    args = parser.parse_args()

    if not config.ANTHROPIC_API_KEY:
        print("Error: ANTHROPIC_API_KEY not set in .env")
        sys.exit(1)

    import anthropic
    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    states = args.states.split(",") if args.states else ALL_STATES
    all_policies = []

    # Load existing researched data if it exists
    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH) as f:
            existing = json.load(f)
        all_policies.extend(existing)
        print(f"Loaded {len(existing)} existing researched policies")

    if args.phase in ("a", "both"):
        print("\n=== Phase A: Claude API baseline research ===")
        phase_a = phase_a_research(client, states)
        all_policies.extend(phase_a)
        print(f"\nPhase A total: {len(phase_a)} policies")

    if args.phase in ("b", "both"):
        print("\n=== Phase B: Web search for recent legislation ===")
        phase_b = phase_b_search(client)
        all_policies.extend(phase_b)
        print(f"\nPhase B total: {len(phase_b)} policies")

    # Deduplicate
    all_policies = deduplicate(all_policies)

    # Summary
    states_covered = set(p["state"] for p in all_policies if p.get("state"))
    print(f"\n=== Summary ===")
    print(f"Total policies: {len(all_policies)}")
    print(f"States covered: {len(states_covered)}/51")
    print(f"Missing states: {sorted(set(ALL_STATES) - states_covered)}")

    # Write output
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(all_policies, f, indent=2)
    print(f"\nWritten to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
