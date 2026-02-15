import sqlite3
import config


def get_db():
    db = sqlite3.connect(config.DATABASE_PATH)
    db.row_factory = sqlite3.Row
    return db
