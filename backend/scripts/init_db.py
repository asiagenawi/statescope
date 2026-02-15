"""Initialize the SQLite database from schema.sql."""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'education_policy.db')
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'docs', 'schema.sql')


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    with open(SCHEMA_PATH) as f:
        schema = f.read()

    db = sqlite3.connect(DB_PATH)
    db.executescript(schema)
    db.close()
    print(f'Database created at {os.path.abspath(DB_PATH)}')


if __name__ == '__main__':
    init_db()
