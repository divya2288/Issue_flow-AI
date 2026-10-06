import sqlite3
from pathlib import Path


DATABASE = Path(__file__).resolve().parent / "issues.db"


def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_db_connection()
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                reporter TEXT NOT NULL,
                department TEXT NOT NULL,
                category TEXT NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Open',
                ai_summary TEXT,
                ai_action TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.commit()
    finally:
        connection.close()


def create_test_issue():
    connection = get_db_connection()

    connection.execute(
        """
        INSERT INTO issues
        (title, description, reporter, department, category, priority)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            "VPN connection issue",
            "VPN disconnects frequently while accessing internal applications.",
            "Ragul",
            "IT",
            "Network",
            "High",
        ),
    )

    connection.commit()
    connection.close()