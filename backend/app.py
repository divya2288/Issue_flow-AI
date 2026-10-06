import os
import re
from datetime import datetime
from difflib import SequenceMatcher

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from models import db, Issue, Activity
from ai_service import analyze_issue


# ============================================================
# Configuration
# ============================================================

load_dotenv()

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "issues.db")

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DATABASE_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


# ============================================================
# Database Initialization
# ============================================================

with app.app_context():
    db.create_all()


# ============================================================
# Helper Functions
# ============================================================

def activity_to_dict(activity):
    return {
        "id": activity.id,
        "issue_id": activity.issue_id,
        "action": activity.action,
        "details": activity.details,
        "created_at": (
            activity.created_at.strftime("%Y-%m-%d %H:%M:%S")
            if activity.created_at
            else None
        ),
    }


def issue_to_dict(issue):
    """
    Convert an Issue database object into JSON-ready data.

    Activities are included directly so every issue response
    contains its complete activity history.
    """

    activities = sorted(
        issue.activities,
        key=lambda activity: activity.created_at
        if activity.created_at
        else datetime.min
    )

    return {
        "id": issue.id,
        "title": issue.title,
        "description": issue.description,
        "reporter": issue.reporter,
        "department": issue.department,
        "category": issue.category,
        "priority": issue.priority,
        "status": issue.status,

        # AI information
        "ai_summary": issue.ai_summary,
        "ai_action": issue.ai_action,
        "ai_impact": issue.ai_impact,
        "ai_reason": issue.ai_reason,

        # Timestamps
        "created_at": (
            issue.created_at.strftime("%Y-%m-%d %H:%M:%S")
            if issue.created_at
            else None
        ),

        "updated_at": (
            issue.updated_at.strftime("%Y-%m-%d %H:%M:%S")
            if issue.updated_at
            else None
        ),

        # Activity history
        "activities": [
            activity_to_dict(activity)
            for activity in activities
        ],
    }


def normalize_text(text):
    """
    Convert text into a simplified form so similar
    issue descriptions can be compared.
    """

    if not text:
        return ""

    text = text.lower()

    # Remove special characters
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text


def similarity_score(text1, text2):
    """
    Calculate similarity between two pieces of text.

    Uses SequenceMatcher for a lightweight prototype
    without requiring a vector database.
    """

    text1 = normalize_text(text1)
    text2 = normalize_text(text2)

    if not text1 or not text2:
        return 0

    return SequenceMatcher(
        None,
        text1,
        text2
    ).ratio()


# ============================================================
# Home
# ============================================================

@app.route("/")
def home():
    return jsonify({
        "message": "IssueFlow AI API is running"
    })


# ============================================================
# Get All Issues
# ============================================================

@app.route("/api/issues", methods=["GET"])
def get_issues():

    issues = (
        Issue.query
        .order_by(Issue.created_at.desc())
        .all()
    )

    return jsonify([
        issue_to_dict(issue)
        for issue in issues
    ])


# ============================================================
# Get Single Issue
# ============================================================

@app.route("/api/issues/<int:issue_id>", methods=["GET"])
def get_issue(issue_id):

    issue = db.session.get(Issue, issue_id)

    if not issue:
        return jsonify({
            "error": "Issue not found"
        }), 404

    return jsonify(
        issue_to_dict(issue)
    )


# ============================================================
# Create Issue
# ============================================================

@app.route("/api/issues", methods=["POST"])
def create_issue():

    data = request.get_json() or {}

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    required_fields = [
        "title",
        "description",
        "reporter",
        "department"
    ]

    for field in required_fields:

        if not data.get(field):
            return jsonify({
                "error": f"{field} is required"
            }), 400

    issue = Issue(
        title=data["title"].strip(),

        description=data["description"].strip(),

        reporter=data["reporter"].strip(),

        department=data["department"].strip(),

        category=data.get(
            "category",
            "Other"
        ),

        priority=data.get(
            "priority",
            "Medium"
        ),

        status="Open",

        # AI analysis
        ai_summary=data.get("ai_summary"),

        ai_action=data.get("ai_action"),

        ai_impact=data.get("ai_impact"),

        ai_reason=data.get("ai_reason")
    )

    db.session.add(issue)

    # Generate issue ID before creating activities
    db.session.flush()

    # --------------------------------------------------------
    # Initial Activity
    # --------------------------------------------------------

    db.session.add(
        Activity(
            issue_id=issue.id,
            action="Issue reported",
            details="Issue was created."
        )
    )

    # --------------------------------------------------------
    # AI Activity
    # --------------------------------------------------------

    if data.get("ai_summary"):

        db.session.add(
            Activity(
                issue_id=issue.id,
                action="AI analysis completed",
                details=(
                    "Issue was analyzed using the "
                    "AI triage assistant."
                )
            )
        )

    db.session.commit()

    return jsonify(
        issue_to_dict(issue)
    ), 201


# ============================================================
# Update Issue
# ============================================================

@app.route("/api/issues/<int:issue_id>", methods=["PUT"])
@app.route("/api/issues/<int:issue_id>", methods=["PUT"])
def update_issue(issue_id):

    issue = db.session.get(Issue, issue_id)

    if not issue:
        return jsonify({
            "error": "Issue not found"
        }), 404

    data = request.get_json() or {}

    # ----------------------------------------------
    # Title
    # ----------------------------------------------

    if "title" in data:
        new_title = data["title"].strip()

        if not new_title:
            return jsonify({
                "error": "Title is required"
            }), 400

        old_title = issue.title

        if old_title != new_title:
            issue.title = new_title

            db.session.add(
                Activity(
                    issue_id=issue.id,
                    action="Title updated",
                    details=f"{old_title} → {new_title}"
                )
            )

    # ----------------------------------------------
    # Description
    # ----------------------------------------------

    if "description" in data:
        new_description = data["description"].strip()

        if not new_description:
            return jsonify({
                "error": "Description is required"
            }), 400

        if issue.description != new_description:
            issue.description = new_description

            db.session.add(
                Activity(
                    issue_id=issue.id,
                    action="Description updated",
                    details="Issue description was updated."
                )
            )

    # ----------------------------------------------
    # Reporter
    # ----------------------------------------------

    if "reporter" in data:
        new_reporter = data["reporter"].strip()

        if not new_reporter:
            return jsonify({
                "error": "Reporter is required"
            }), 400

        if issue.reporter != new_reporter:
            old_reporter = issue.reporter
            issue.reporter = new_reporter

            db.session.add(
                Activity(
                    issue_id=issue.id,
                    action="Reporter updated",
                    details=f"{old_reporter} → {new_reporter}"
                )
            )

    # ----------------------------------------------
    # Department
    # ----------------------------------------------

    if "department" in data:
        new_department = data["department"].strip()

        if not new_department:
            return jsonify({
                "error": "Department is required"
            }), 400

        if issue.department != new_department:
            old_department = issue.department
            issue.department = new_department

            db.session.add(
                Activity(
                    issue_id=issue.id,
                    action="Department updated",
                    details=f"{old_department} → {new_department}"
                )
            )

    # ----------------------------------------------
    # Status
    # ----------------------------------------------

    if "status" in data:

        old_status = issue.status
        new_status = data["status"]

        allowed_statuses = [
            "Open",
            "In Progress",
            "Resolved"
        ]

        if new_status not in allowed_statuses:
            return jsonify({
                "error": "Invalid status"
            }), 400

        if old_status != new_status:

            issue.status = new_status

            db.session.add(
                Activity(
                    issue_id=issue.id,
                    action="Status changed",
                    details=f"{old_status} → {new_status}"
                )
            )

    # ----------------------------------------------
    # Priority
    # ----------------------------------------------

    if "priority" in data:

        old_priority = issue.priority
        new_priority = data["priority"]

        allowed_priorities = [
            "Low",
            "Medium",
            "High",
            "Critical"
        ]

        if new_priority not in allowed_priorities:
            return jsonify({
                "error": "Invalid priority"
            }), 400

        if old_priority != new_priority:

            issue.priority = new_priority

            db.session.add(
                Activity(
                    issue_id=issue.id,
                    action="Priority changed",
                    details=f"{old_priority} → {new_priority}"
                )
            )

    # ----------------------------------------------
    # Category
    # ----------------------------------------------

    if "category" in data:

        old_category = issue.category
        new_category = data["category"]

        if old_category != new_category:

            issue.category = new_category

            db.session.add(
                Activity(
                    issue_id=issue.id,
                    action="Category changed",
                    details=f"{old_category} → {new_category}"
                )
            )

    # ----------------------------------------------
    # Update timestamp
    # ----------------------------------------------

    issue.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify(
        issue_to_dict(issue)
    )

# ============================================================
# Delete Issue
# ============================================================

@app.route("/api/issues/<int:issue_id>", methods=["DELETE"])
def delete_issue(issue_id):

    issue = db.session.get(
        Issue,
        issue_id
    )

    if not issue:

        return jsonify({
            "error": "Issue not found"
        }), 404

    db.session.delete(issue)

    db.session.commit()

    return jsonify({
        "message": "Issue deleted successfully"
    })


# ============================================================
# AI Issue Analysis
# ============================================================

@app.route("/api/issues/analyze", methods=["POST"])
def analyze_issue_route():

    data = request.get_json() or {}

    title = data.get(
        "title",
        ""
    ).strip()

    description = data.get(
        "description",
        ""
    ).strip()

    if not title or not description:

        return jsonify({
            "error": (
                "Title and description are required."
            )
        }), 400

    try:

        result = analyze_issue(
            title,
            description
        )

        return jsonify(result), 200

    except Exception as error:

        print(
            "AI ANALYSIS ERROR:",
            str(error)
        )

        return jsonify({
            "error": "AI analysis failed",
            "details": str(error)
        }), 500


# ============================================================
# Similar / Duplicate Issue Detection
# ============================================================

@app.route("/api/issues/similar", methods=["POST"])
def find_similar_issues():

    data = request.get_json() or {}

    title = data.get(
        "title",
        ""
    ).strip()

    description = data.get(
        "description",
        ""
    ).strip()

    if not title and not description:

        return jsonify({
            "error": (
                "Title or description is required"
            )
        }), 400

    new_issue_text = (
        f"{title} {description}"
    )

    existing_issues = Issue.query.all()

    similar_issues = []

    for issue in existing_issues:

        existing_text = (
            f"{issue.title} "
            f"{issue.description}"
        )

        score = similarity_score(
            new_issue_text,
            existing_text
        )

        # Prototype threshold
        if score >= 0.30:

            similar_issues.append({

                "id": issue.id,

                "title": issue.title,

                "description": issue.description,

                "status": issue.status,

                "priority": issue.priority,

                "category": issue.category,

                "similarity": round(
                    score * 100,
                    1
                )
            })

    similar_issues.sort(
        key=lambda item: item["similarity"],
        reverse=True
    )

    return jsonify(
        similar_issues[:5]
    )


# ============================================================
# Run Application
# ============================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )



