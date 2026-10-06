# IssueFlow AI

> Report. Prioritize. Resolve.

IssueFlow AI is a mini Problem-Solving and Issue Management System designed to help teams report, manage, prioritize, track, and analyze technical issues in a structured way.

The system combines traditional issue management with AI-assisted issue triage to help users understand the category, priority, impact, and recommended first action for an issue.

---

## Problem Statement

In many organizations, issues are reported through different channels such as:

- WhatsApp
- Email
- Verbal communication
- Informal messages

This makes it difficult to:

- Track issues systematically
- Prioritize critical problems
- Monitor issue status
- Identify recurring or similar issues
- Understand business impact
- Maintain a history of issue changes

IssueFlow AI provides a centralized platform to manage these problems.

---

## Key Features

### Dashboard

The dashboard provides an overview of the issue management system.

It displays:

- Total issues
- Open issues
- In-progress issues
- Resolved issues
- High/Critical issues
- Issue status distribution
- Issue priority distribution
- Recent issues
- Critical issue warnings

---

### Report Issue

Users can create a new issue by providing:

- Issue title
- Description
- Reporter
- Department
- Category
- Priority

The system also provides AI-assisted analysis before submitting the issue.

---

### AI-Powered Issue Analysis

IssueFlow AI integrates Gemini to assist with technical issue triage.

The AI analyzes:

- Category
- Priority
- Business impact
- Issue summary
- Suggested first action
- Reason for the recommended priority

The AI recommendation is treated as an assistant rather than an automatic decision.

The user can review the recommendation before saving the issue.

---

### Similar Issue Detection

The system checks whether an issue is similar to previously reported issues.

This helps users:

- Identify possible duplicate reports
- Avoid unnecessary duplicate issues
- Find related problems
- Reuse previous issue information

The current implementation uses text similarity with Python's `SequenceMatcher`.

---

### Issue Management

Each issue has a dedicated details page where users can view:

- Issue description
- Reporter
- Department
- Category
- Priority
- Status
- Creation information
- AI analysis
- Activity history

Users can update:

- Status
- Priority
- Category

---

### Activity Timeline

The application maintains an activity timeline for issue changes.

This provides a simple history of issue management actions such as:

- Issue reported
- Status changes
- Priority changes
- Category changes

---

### Responsive UI

The application is designed to work across different screen sizes.

The interface includes:

- Responsive dashboard
- Responsive issue listing
- Responsive issue details
- Responsive forms
- Mobile-friendly layouts

---

# Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Recharts
- Lucide React

## Backend

- Python
- Flask
- Flask-SQLAlchemy
- Flask-CORS

## Database

- SQLite

## AI

- Google Gemini API

---

# System Architecture

```text
                    ┌─────────────────────┐
                    │      User           │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │                     │
                    │ Dashboard           │
                    │ Issues              │
                    │ Report Issue        │
                    │ Issue Details       │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Flask Backend    │
                    │                     │
                    │ Issue Management    │
                    │ Similarity Check    │
                    │ AI Analysis         │
                    └───────┬─────┬───────┘
                            │     │
                ┌───────────┘     └────────────┐
                ▼                              ▼
       ┌─────────────────┐            ┌─────────────────┐
       │ SQLite Database │            │  Gemini API     │
       │                 │            │                 │
       │ Issues          │            │ AI Triage       │
       │ Activities      │            │ Analysis        │
       └─────────────────┘            └─────────────────┘