import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Bot,
  Check,
  FileText,
  Loader2,
  Save,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import {
  analyzeIssue,
  deleteIssue,
  getIssue,
  updateIssue,
} from "../services/api";

export default function IssueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ==================================================
  // STATE
  // ==================================================

  const [issue, setIssue] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    category: "Other",
    priority: "Medium",
    status: "Open",
  });

  const [aiResult, setAiResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");

  // ==================================================
  // LOAD ISSUE
  // ==================================================

  async function loadIssue() {
    try {
      setLoading(true);
      setError("");

      const data = await getIssue(id);

      setIssue(data);

      // Current workflow values
      setEditForm({
        category: data.category || "Other",
        priority: data.priority || "Medium",
        status: data.status || "Open",
      });

      // Load saved AI analysis if available
      if (
        data.ai_summary ||
        data.ai_action ||
        data.ai_impact ||
        data.ai_reason
      ) {
        setAiResult({
          summary: data.ai_summary || "",
          suggested_action: data.ai_action || "",
          impact: data.ai_impact || "",
          reason: data.ai_reason || "",
          category: data.category || "Other",
          priority: data.priority || "Medium",
        });
      } else {
        setAiResult(null);
      }
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to load issue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIssue();
  }, [id]);

  // ==================================================
  // MANAGEMENT FORM
  // ==================================================

  function handleEditChange(field, value) {
    setEditForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ==================================================
  // SAVE STATUS / PRIORITY / CATEGORY
  // ==================================================

  async function handleSaveChanges() {
    if (!issue) return;

    setError("");
    setSaving(true);

    try {
      const updated = await updateIssue(issue.id, {
        status: editForm.status,
        priority: editForm.priority,
        category: editForm.category,
      });

      setIssue((previous) => ({
        ...previous,
        ...updated,
      }));

      // Reload issue so the activity timeline
      // contains the latest changes.
      await loadIssue();
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Unable to update the issue."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==================================================
  // DELETE ISSUE
  // ==================================================

  async function handleDelete() {
    if (!issue) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete Issue #${issue.id}?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await deleteIssue(issue.id);

      navigate("/issues");
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Unable to delete the issue."
      );

      setDeleting(false);
    }
  }

  // ==================================================
  // AI ANALYSIS
  // ==================================================

  async function handleAIAnalysis() {
    if (!issue) return;

    setAiError("");
    setAnalyzing(true);

    try {
      const result = await analyzeIssue(
        issue.title,
        issue.description
      );

      setAiResult(result);
    } catch (err) {
      console.error(err);

      setAiError(
        err.message ||
          "AI analysis failed. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="page-container">
        <div className="panel empty-state">
          <Loader2
            size={28}
            className="spin"
          />

          <p>Loading issue...</p>
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR / NOT FOUND
  // ==================================================

  if (error || !issue) {
    return (
      <div className="page-container">
        <div className="alert error-alert">
          <TriangleAlert size={18} />

          <span>
            {error || "Issue not found."}
          </span>
        </div>

        <button
          type="button"
          className="back-link"
          onClick={() => navigate("/issues")}
        >
          <ArrowLeft size={17} />
          Back to Issues
        </button>
      </div>
    );
  }

  // ==================================================
  // CRITICAL ISSUE
  // ==================================================

  const isCritical =
    issue.priority === "Critical";

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="page-container">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="details-header">

        <div className="details-header-top">

          <button
            type="button"
            className="back-link"
            onClick={() => navigate("/issues")}
          >
            <ArrowLeft size={17} />
            Back to Issues
          </button>

          <div className="details-breadcrumb">
            Issue Management
            <span>/</span>
            Issue #{issue.id}
          </div>

        </div>

        <div className="details-header-main">

          <div className="details-header-content">

            <h1>{issue.title}</h1>

            <p>
              Reported by{" "}
              <strong>{issue.reporter}</strong>
            </p>

          </div>

          <div className="details-header-actions">

            <div className="details-badges">

              <span
                className={`priority-badge ${issue.priority
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {issue.priority}
              </span>

              <span
                className={`status-badge ${issue.status
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {issue.status}
              </span>

            </div>

            <div className="details-action-buttons">

              <button
                type="button"
                className="delete-button"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 size={16} />

                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          ERROR MESSAGE
          ================================================= */}

      {error && (
        <div className="alert error-alert">
          <TriangleAlert size={17} />

          <span>{error}</span>
        </div>
      )}

      {/* =================================================
          CRITICAL WARNING
          ================================================= */}

      {isCritical && (
        <div className="details-critical-warning">

          <TriangleAlert size={23} />

          <div>

            <strong>
              Critical issue requires attention
            </strong>

            <p>
              This issue is marked as Critical
              and should be prioritized.
            </p>

          </div>

        </div>
      )}

      {/* =================================================
          MAIN LAYOUT
          ================================================= */}

      <div className="details-layout">

        {/* =================================================
            LEFT COLUMN
            ================================================= */}

        <div className="details-main">

          {/* =================================================
              ISSUE DESCRIPTION
              ================================================= */}

          <section className="panel detail-panel">

            <div className="panel-title">

              <div>

                <h2>
                  Issue Description
                </h2>

                <p>
                  Details provided by the reporter.
                </p>

              </div>

            </div>

            <div className="issue-description">
              {issue.description}
            </div>

          </section>

          {/* =================================================
              ISSUE INFORMATION
              ================================================= */}

          <section className="panel detail-panel">

            <div className="panel-title">

              <div>

                <h2>
                  Issue Information
                </h2>

                <p>
                  Current issue metadata.
                </p>

              </div>

            </div>

            <div className="info-grid">

              <div className="info-item">

                <span>
                  <FileText size={14} />
                  Reporter
                </span>

                <strong>
                  {issue.reporter}
                </strong>

              </div>

              <div className="info-item">

                <span>
                  Department
                </span>

                <strong>
                  {issue.department}
                </strong>

              </div>

              <div className="info-item">

                <span>
                  Category
                </span>

                <strong>
                  {issue.category}
                </strong>

              </div>

              <div className="info-item">

                <span>
                  Priority
                </span>

                <strong>
                  {issue.priority}
                </strong>

              </div>

              <div className="info-item">

                <span>
                  Status
                </span>

                <strong>
                  {issue.status}
                </strong>

              </div>

              <div className="info-item">

                <span>
                  Created
                </span>

                <strong>
                  {issue.created_at || "—"}
                </strong>

              </div>

            </div>

          </section>

          {/* =================================================
              AI ANALYSIS
              ================================================= */}

          <section className="panel detail-panel">

            <div className="panel-title">

              <div className="ai-heading">

                <div className="ai-heading-icon">
                  <Bot size={19} />
                </div>

                <div>

                  <h2>
                    AI Analysis
                  </h2>

                  <p>
                    AI-assisted issue triage.
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="ai-button"
                onClick={handleAIAnalysis}
                disabled={analyzing}
              >

                {analyzing ? (
                  <>
                    <Loader2
                      size={15}
                      className="spin"
                    />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Bot size={15} />
                    Analyze with AI
                  </>
                )}

              </button>

            </div>

            {/* AI ERROR */}

            {aiError && (
              <div className="alert error-alert">

                <TriangleAlert size={17} />

                <span>{aiError}</span>

              </div>
            )}

            {/* AI LOADING */}

            {analyzing && (
              <div className="details-ai-empty">

                <Loader2
                  size={28}
                  className="spin"
                />

                <h3>
                  Analyzing issue...
                </h3>

                <p>
                  Gemini is evaluating the issue
                  category, priority and impact.
                </p>

              </div>
            )}

            {/* NO AI RESULT */}

            {!analyzing && !aiResult && (
              <div className="details-ai-empty">

                <ShieldCheck
                  size={30}
                  color="#6366f1"
                />

                <h3>
                  No analysis yet
                </h3>

                <p>
                  Click{" "}
                  <strong>
                    Analyze with AI
                  </strong>{" "}
                  to generate an AI-assisted
                  recommendation.
                </p>

              </div>
            )}

            {/* AI RESULT */}

            {!analyzing && aiResult && (
              <div className="details-ai-results">

                <div className="ai-result-grid">

                  <div className="ai-result-box">

                    <span>
                      Category
                    </span>

                    <strong>
                      {aiResult.category ||
                        issue.category ||
                        "Other"}
                    </strong>

                  </div>

                  <div className="ai-result-box">

                    <span>
                      Priority
                    </span>

                    <strong>
                      {aiResult.priority ||
                        issue.priority ||
                        "Medium"}
                    </strong>

                  </div>

                  <div className="ai-result-box">

                    <span>
                      Business Impact
                    </span>

                    <strong>
                      {aiResult.impact ||
                        "Medium"}
                    </strong>

                  </div>

                </div>

                <div className="ai-text-section">

                  <span>
                    AI Summary
                  </span>

                  <p>
                    {aiResult.summary ||
                      "No summary available."}
                  </p>

                </div>

                <div className="ai-text-section">

                  <span>
                    Suggested Action
                  </span>

                  <p>
                    {aiResult.suggested_action ||
                      "No suggested action available."}
                  </p>

                </div>

                <div className="ai-text-section">

                  <span>
                    Reason
                  </span>

                  <p>
                    {aiResult.reason ||
                      "No reasoning available."}
                  </p>

                </div>

              </div>
            )}

          </section>

          {/* =================================================
              ACTIVITY TIMELINE
              ================================================= */}

          <section className="panel detail-panel">

            <div className="panel-title">

              <div>

                <h2>
                  Activity Timeline
                </h2>

                <p>
                  History of issue changes.
                </p>

              </div>

            </div>

            {issue.activities &&
            issue.activities.length > 0 ? (

              <div className="timeline">

                {issue.activities
                  .slice()
                  .reverse()
                  .map((activity) => (

                    <div
                      className="timeline-item"
                      key={activity.id}
                    >

                      <div className="timeline-dot">
                        <Check size={13} />
                      </div>

                      <div className="timeline-content">

                        <strong>
                          {activity.action}
                        </strong>

                        <p>
                          {activity.details}
                        </p>

                        <span>
                          {activity.created_at}
                        </span>

                      </div>

                    </div>

                  ))}

              </div>

            ) : (

              <div className="timeline-empty">
                No activity recorded yet.
              </div>

            )}

          </section>

        </div>

        {/* =================================================
            RIGHT COLUMN
            ================================================= */}

        <aside className="details-sidebar">

          {/* =================================================
              CURRENT STATUS
              ================================================= */}

          <section className="panel current-status-panel">

            <div className="panel-title">

              <div>

                <h2>
                  Current Status
                </h2>

                <p>
                  Issue workflow state.
                </p>

              </div>

            </div>

            <div className="current-status-display">

              <span
                className={`status-badge ${issue.status
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {issue.status}
              </span>

              <span
                className={`priority-badge ${issue.priority
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {issue.priority}
              </span>

            </div>

          </section>

          {/* =================================================
              QUICK MANAGEMENT
              ================================================= */}

          <section className="panel management-panel">

            <div className="panel-title">

              <div>

                <h2>
                  Quick Management
                </h2>

                <p>
                  Update workflow values.
                </p>

              </div>

            </div>

            <div className="management-form">

              {/* STATUS */}

              <div className="form-group">

                <label>
                  Status
                </label>

                <select
                  value={editForm.status}
                  onChange={(event) =>
                    handleEditChange(
                      "status",
                      event.target.value
                    )
                  }
                >
                  <option>
                    Open
                  </option>

                  <option>
                    In Progress
                  </option>

                  <option>
                    Resolved
                  </option>
                </select>

              </div>

              {/* PRIORITY */}

              <div className="form-group">

                <label>
                  Priority
                </label>

                <select
                  value={editForm.priority}
                  onChange={(event) =>
                    handleEditChange(
                      "priority",
                      event.target.value
                    )
                  }
                >
                  <option>
                    Low
                  </option>

                  <option>
                    Medium
                  </option>

                  <option>
                    High
                  </option>

                  <option>
                    Critical
                  </option>
                </select>

              </div>

              {/* CATEGORY */}

              <div className="form-group">

                <label>
                  Category
                </label>

                <select
                  value={editForm.category}
                  onChange={(event) =>
                    handleEditChange(
                      "category",
                      event.target.value
                    )
                  }
                >
                  <option>
                    Hardware
                  </option>

                  <option>
                    Software
                  </option>

                  <option>
                    Network
                  </option>

                  <option>
                    Infrastructure
                  </option>

                  <option>
                    Security
                  </option>

                  <option>
                    Access
                  </option>

                  <option>
                    Other
                  </option>
                </select>

              </div>

              {/* SAVE */}

              <button
                type="button"
                className="primary-button details-save-button"
                onClick={handleSaveChanges}
                disabled={saving}
              >

                {saving ? (
                  <>
                    <Loader2
                      size={15}
                      className="spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Save Changes
                  </>
                )}

              </button>

            </div>

          </section>

        </aside>

      </div>

    </div>
  );
}