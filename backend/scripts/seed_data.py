"""Populate the database with seed data from JSON files.

Uses upsert logic so it's safe to re-run without creating duplicates.
Matches by (state_id, bill_number) for bills, (state_id, title) for guidance/EOs.
"""

import json
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'education_policy.db')
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')


def upsert_policy(db, p, state_map, topic_map):
    """Insert or update a single policy. Returns (policy_id, was_new)."""
    state_id = state_map.get(p['state']) if p['state'] else None

    # Find existing policy: match by (state_id, bill_number) for bills,
    # or (state_id, title) for guidance/executive_orders
    existing = None
    if p.get('bill_number'):
        existing = db.execute(
            'SELECT id FROM policies WHERE state_id IS ? AND bill_number = ?',
            (state_id, p['bill_number'])
        ).fetchone()
    if not existing:
        existing = db.execute(
            'SELECT id FROM policies WHERE state_id IS ? AND title = ?',
            (state_id, p['title'])
        ).fetchone()

    if existing:
        policy_id = existing[0]
        db.execute('''
            UPDATE policies SET
                title = ?, description = ?, policy_type = ?, level = ?, status = ?,
                date_introduced = ?, date_enacted = ?,
                bill_number = ?, sponsor = ?, summary_text = ?, source_url = ?
            WHERE id = ?
        ''', (
            p['title'], p['description'], p['policy_type'],
            p['level'], p['status'],
            p['date_introduced'], p.get('date_enacted'),
            p.get('bill_number'), p.get('sponsor'),
            p.get('summary_text'), p.get('source_url'),
            policy_id,
        ))
        # Clear old topic links and re-add
        db.execute('DELETE FROM policy_topics WHERE policy_id = ?', (policy_id,))
        was_new = False
    else:
        cursor = db.execute(
            '''INSERT INTO policies
               (state_id, title, description, policy_type, level, status,
                date_introduced, date_enacted, bill_number, sponsor, summary_text, source_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (state_id, p['title'], p['description'], p['policy_type'],
             p['level'], p['status'], p['date_introduced'], p.get('date_enacted'),
             p.get('bill_number'), p.get('sponsor'), p.get('summary_text'),
             p.get('source_url'))
        )
        policy_id = cursor.lastrowid
        was_new = True

    # Link topics
    for topic_name in p.get('topics', []):
        tid = topic_map.get(topic_name)
        if tid:
            db.execute(
                'INSERT OR IGNORE INTO policy_topics (policy_id, topic_id) VALUES (?, ?)',
                (policy_id, tid)
            )

    return policy_id, was_new


def seed():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row

    # Load states
    with open(os.path.join(DATA_DIR, 'states.json')) as f:
        states = json.load(f)

    for s in states:
        db.execute(
            'INSERT OR IGNORE INTO states (name, code, fips, region) VALUES (?, ?, ?, ?)',
            (s['name'], s['code'], s['fips'], s['region'])
        )
    db.commit()
    print(f'Loaded {len(states)} states')

    # Load seed policies
    with open(os.path.join(DATA_DIR, 'seed_policies.json')) as f:
        seed_data = json.load(f)

    # Insert topics
    for t in seed_data['topics']:
        db.execute(
            'INSERT OR IGNORE INTO topics (name, description) VALUES (?, ?)',
            (t['name'], t['description'])
        )
    db.commit()
    print(f'Loaded {len(seed_data["topics"])} topics')

    # Build lookup maps
    state_map = {}
    for row in db.execute('SELECT id, code FROM states').fetchall():
        state_map[row['code']] = row['id']

    topic_map = {}
    for row in db.execute('SELECT id, name FROM topics').fetchall():
        topic_map[row['name']] = row['id']

    # Upsert policies
    new_count = 0
    updated_count = 0
    for p in seed_data['policies']:
        policy_id, was_new = upsert_policy(db, p, state_map, topic_map)
        if was_new:
            new_count += 1
        else:
            updated_count += 1

    db.commit()
    db.close()
    print(f'Policies: {new_count} new, {updated_count} updated')
    print('Seed complete!')


if __name__ == '__main__':
    seed()
