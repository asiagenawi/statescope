"""Fetch federal bills from Congress.gov API and upsert into the database.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/fetch_congress.py

Requires CONGRESS_API_KEY in .env (get one free at https://api.data.gov/signup/)
"""

import json
import os
import sqlite3
import sys

# Add parent dir to path so we can import services/config
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import config
from services.congress_service import fetch_all_bills

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DB_PATH = config.DATABASE_PATH

# Topic keyword mapping: map bill subjects/title keywords to our topic IDs
TOPIC_KEYWORDS = {
    'AI Literacy': ['literacy', 'literate'],
    'Student Privacy': ['privacy', 'student data', 'ferpa'],
    'Teacher Training': ['teacher', 'educator', 'professional development', 'training'],
    'Curriculum': ['curriculum', 'standards', 'course'],
    'Assessment': ['assessment', 'testing', 'evaluation'],
    'Procurement': ['procurement', 'vendor', 'purchasing'],
    'Task Forces': ['task force', 'commission', 'committee', 'study', 'advisory'],
    'Academic Integrity': ['integrity', 'cheating', 'plagiarism'],
    'Equity & Access': ['equity', 'access', 'underserved', 'disadvantaged', 'digital divide'],
    'Data Governance': ['data governance', 'data management', 'transparency'],
    'Workforce Development': ['workforce', 'career', 'job', 'employment'],
    'Research': ['research', 'study', 'grant', 'fund'],
}


def match_topics(bill):
    """Match a bill to topic names based on title, summary, and subjects."""
    searchable = ' '.join([
        bill.get('title', ''),
        bill.get('summary_text', '') or '',
        bill.get('description', ''),
        ' '.join(bill.get('subjects', [])),
    ]).lower()

    matched = []
    for topic_name, keywords in TOPIC_KEYWORDS.items():
        if any(kw in searchable for kw in keywords):
            matched.append(topic_name)

    return matched if matched else ['Research']  # Default fallback


def upsert_bill(db, bill, topic_map):
    """Insert or update a bill in the database. Returns (policy_id, was_new)."""
    # Check if bill already exists by bill_number
    existing = db.execute(
        'SELECT id FROM policies WHERE bill_number = ? AND level = ?',
        (bill['bill_number'], 'federal')
    ).fetchone()

    if existing:
        policy_id = existing[0]
        db.execute('''
            UPDATE policies SET
                title = ?, description = ?, status = ?,
                date_introduced = ?, date_enacted = ?,
                sponsor = ?, summary_text = ?, source_url = ?
            WHERE id = ?
        ''', (
            bill['title'], bill['description'], bill['status'],
            bill['date_introduced'], bill.get('date_enacted'),
            bill.get('sponsor'), bill.get('summary_text'), bill.get('source_url'),
            policy_id,
        ))
        # Clear old topic links
        db.execute('DELETE FROM policy_topics WHERE policy_id = ?', (policy_id,))
        was_new = False
    else:
        cursor = db.execute('''
            INSERT INTO policies
            (state_id, title, description, policy_type, level, status,
             date_introduced, date_enacted, bill_number, sponsor, summary_text, source_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            None,  # federal bills have no state
            bill['title'], bill['description'], bill['policy_type'],
            bill['level'], bill['status'],
            bill['date_introduced'], bill.get('date_enacted'),
            bill['bill_number'], bill.get('sponsor'),
            bill.get('summary_text'), bill.get('source_url'),
        ))
        policy_id = cursor.lastrowid
        was_new = True

    # Link topics
    topics = match_topics(bill)
    for topic_name in topics:
        topic_id = topic_map.get(topic_name)
        if topic_id:
            db.execute(
                'INSERT OR IGNORE INTO policy_topics (policy_id, topic_id) VALUES (?, ?)',
                (policy_id, topic_id)
            )

    return policy_id, was_new


def main():
    if not config.CONGRESS_API_KEY:
        print('Error: CONGRESS_API_KEY not set in .env')
        print('Get a free key at https://api.data.gov/signup/')
        sys.exit(1)

    # Load bill numbers list
    with open(os.path.join(DATA_DIR, 'bill_numbers.json')) as f:
        data = json.load(f)
    bill_list = data['bills']

    print(f'Fetching {len(bill_list)} bills from Congress.gov API...\n')
    bills = fetch_all_bills(bill_list)
    print(f'\nFetched {len(bills)} bills successfully.\n')

    # Open database
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row

    # Build topic lookup
    topic_map = {}
    for row in db.execute('SELECT id, name FROM topics').fetchall():
        topic_map[row['name']] = row['id']

    new_count = 0
    updated_count = 0

    for bill in bills:
        policy_id, was_new = upsert_bill(db, bill, topic_map)
        if was_new:
            new_count += 1
            print(f'  NEW: {bill["bill_number"]} - {bill["title"][:60]}')
        else:
            updated_count += 1
            print(f'  UPDATED: {bill["bill_number"]} - {bill["title"][:60]}')

    db.commit()
    db.close()

    print(f'\nDone! {new_count} new, {updated_count} updated.')


if __name__ == '__main__':
    main()
