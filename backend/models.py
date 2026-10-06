from datetime import datetime

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class Issue(db.Model):

    __tablename__ = "issues"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    reporter = db.Column(
        db.String(100),
        nullable=False
    )

    department = db.Column(
        db.String(100),
        nullable=False
    )

    category = db.Column(
        db.String(100),
        nullable=False,
        default="Other"
    )

    priority = db.Column(
        db.String(20),
        nullable=False,
        default="Medium"
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Open"
    )

    ai_summary = db.Column(
        db.Text,
        nullable=True
    )

    ai_action = db.Column(
        db.Text,
        nullable=True
    )

    ai_impact = db.Column(
        db.String(30),
        nullable=True
    )

    ai_reason = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    activities = db.relationship(
        "Activity",
        backref="issue",
        lazy=True,
        cascade="all, delete-orphan"
    )


class Activity(db.Model):

    __tablename__ = "activities"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    issue_id = db.Column(
        db.Integer,
        db.ForeignKey("issues.id"),
        nullable=False
    )

    action = db.Column(
        db.String(200),
        nullable=False
    )

    details = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )