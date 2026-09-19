"""Export the seeded database to a static JSON snapshot for the frontend.

The database is derived, not authoritative -- it is rebuilt from the checked-in
JSON in backend/data/ on every deploy and nothing mutates it at runtime. So the
frontend can read this snapshot directly instead of calling the API, which means
the map paints without waiting on a (free-tier, cold-starting) backend.

Run after init_db.py and seed_data.py:
    python backend/scripts/export_static_data.py
"""

import json
import os
import sys

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, BACKEND_DIR)

from models.queries import get_all_states, get_all_topics  # noqa: E402
from models.database import get_db  # noqa: E402

OUT_PATH = os.path.abspath(os.path.join(
    BACKEND_DIR, '..', 'frontend', 'public', 'data', 'snapshot.json'
))

# The date the tracker is stated as current to. This is a claim the interface
# makes in the utility bar and in every citation, so it should only move when
# the sources have actually been re-checked -- a rebuild alone does not make the
# data fresher. Set to 2026-09 at the maintainer's direction.
DATA_UPDATED = '2026-09'


def get_all_policies_with_state():
    """Every policy with its state code/name attached, newest first.

    Mirrors get_state_policies() in models/queries.py but fetches all states at
    once so the frontend can group client-side instead of making a request per
    state click.
    """
    db = get_db()
    rows = db.execute('''
        SELECT p.*, s.code as state_code, s.name as state_name
        FROM policies p
        LEFT JOIN states s ON p.state_id = s.id
        ORDER BY p.date_introduced DESC
    ''').fetchall()
    db.close()
    return [dict(r) for r in rows]


def get_policy_topics():
    """policy_id -> [topic_id] so Trends can filter by topic without the API."""
    db = get_db()
    rows = db.execute('SELECT policy_id, topic_id FROM policy_topics').fetchall()
    db.close()
    mapping = {}
    for r in rows:
        mapping.setdefault(str(r['policy_id']), []).append(r['topic_id'])
    return mapping


def export():
    snapshot = {
        'data_updated': DATA_UPDATED,
        'states': get_all_states(),
        'policies': get_all_policies_with_state(),
        'topics': get_all_topics(),
        'policy_topics': get_policy_topics(),
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w') as f:
        json.dump(snapshot, f, separators=(',', ':'))

    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f'Wrote {OUT_PATH}')
    print(f'  {len(snapshot["states"])} states, {len(snapshot["policies"])} policies, '
          f'{len(snapshot["topics"])} topics ({size_kb:.0f} KB)')


if __name__ == '__main__':
    export()
