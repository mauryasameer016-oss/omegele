import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE,
            role TEXT DEFAULT 'user',
            is_banned INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            last_seen TEXT
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user1_id INTEGER,
            user2_id INTEGER,
            user1_socket TEXT,
            user2_socket TEXT,
            started_at TEXT DEFAULT (datetime('now')),
            ended_at TEXT,
            duration_seconds INTEGER,
            session_type TEXT DEFAULT 'text',
            FOREIGN KEY(user1_id) REFERENCES users(id),
            FOREIGN KEY(user2_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS connection_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            partner_id INTEGER,
            partner_username TEXT,
            partner_socket TEXT,
            connected_at TEXT DEFAULT (datetime('now')),
            disconnected_at TEXT,
            session_type TEXT DEFAULT 'text',
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporter_id INTEGER,
            reported_id INTEGER,
            reason TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            resolved INTEGER DEFAULT 0,
            FOREIGN KEY(reporter_id) REFERENCES users(id),
            FOREIGN KEY(reported_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS admin_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER,
            action TEXT,
            target_user_id INTEGER,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(admin_id) REFERENCES users(id)
        );
    ''')

    # Seed admin user
    from werkzeug.security import generate_password_hash
    admin_pw = generate_password_hash('admin123')
    cur.execute('''
        INSERT OR IGNORE INTO users (username, password_hash, email, role)
        VALUES (?, ?, ?, ?)
    ''', ('admin', admin_pw, 'admin@strangerchat.com', 'admin'))

    conn.commit()
    conn.close()
    print("Database initialized.")
