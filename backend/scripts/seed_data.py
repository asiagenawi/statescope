"""Populate the database with seed data from JSON files."""

import json
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'education_policy.db')
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')


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
        seed = json.load(f)

    # Insert topics
    for t in seed['topics']:
        db.execute(
            'INSERT OR IGNORE INTO topics (name, description) VALUES (?, ?)',
            (t['name'], t['description'])
        )
    db.commit()
    print(f'Loaded {len(seed["topics"])} topics')

    # Build lookup maps
    state_map = {}
    for row in db.execute('SELECT id, code FROM states').fetchall():
        state_map[row['code']] = row['id']

    topic_map = {}
    for row in db.execute('SELECT id, name FROM topics').fetchall():
        topic_map[row['name']] = row['id']

    # Insert policies
    count = 0
    for p in seed['policies']:
        state_id = state_map.get(p['state']) if p['state'] else None
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

        # Link topics
        for topic_name in p.get('topics', []):
            tid = topic_map.get(topic_name)
            if tid:
                db.execute(
                    'INSERT OR IGNORE INTO policy_topics (policy_id, topic_id) VALUES (?, ?)',
                    (policy_id, tid)
                )
        count += 1

    db.commit()
    db.close()
    print(f'Loaded {count} policies')
    print('Seed complete!')


if __name__ == '__main__':
    seed()
