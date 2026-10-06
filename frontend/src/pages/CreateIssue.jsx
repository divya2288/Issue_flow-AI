import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  FileText,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  WandSparkles,
} from "lucide-react";

import {
  analyzeIssue,
  createIssue,
  findSimilarIssues,
} from "../services/api";

export default function CreateIssue() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    reporter: "",
    department: "",
    category: "Other",
    priority: "Medium",
  });

  const [aiResult, setAiResult] = useState(null);
  const [similarIssues, setSimilarIssues] = useState([]);

  const [analyzing, setAnalyzing] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // --------------------------------------------------
  // AI ANALYSIS
  // --------------------------------------------------

  async function handleAIAnalysis() {
    setError("");
    setSuccess("");

    if (!form.title.trim() || !form.description.trim()) {
      setError(
        "Please enter the issue title and description before using AI analysis."
      );
      return;
    }

    setAnalyzing(true);

    try {
      const result = await analyzeIssue(
        form.title,
        form.description
      );

      setAiResult(result);

      // AI can suggest values, but user can still edit them.
      if (result.category) {
        setForm((previous) => ({
          ...previous,
          category: result.category,
        }));
      }

      if (result.priority) {
        setForm((previous) => ({
          ...previous,
          priority: result.priority,
        }));
      }

      setSuccess(
        "AI analysis completed. Review the recommendation before saving."
      );
    } catch (err) {
      console.error("AI analysis error:", err);

      setError(
        err.message || "AI analysis failed. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  // --------------------------------------------------
  // SIMILAR / DUPLICATE ISSUE DETECTION
  // --------------------------------------------------

  async function handleDuplicateCheck() {
    setError("");
    setSuccess("");

    if (!form.title.trim() || !form.description.trim()) {
      setError(
        "Enter the issue title and description before checking for similar issues."
      );
      return;
    }

    setCheckingDuplicates(true);

    try {
      const results = await findSimilarIssues(
        form.title,
        form.description
      );

      setSimilarIssues(results || []);

      if (!results || results.length === 0) {
        setSuccess(
          "No similar issues were found."
        );
      } else {
        setSuccess(
          `${results.length} similar issue${
            results.length !== 1 ? "s" : ""
          } found. Review them before submitting.`
        );
      }
    } catch (err) {
      console.error(
        "Duplicate detection error:",
        err
      );

      setSimilarIssues([]);

      setError(
        err.message ||
          "Unable to check for similar issues."
      );
    } finally {
      setCheckingDuplicates(false);
    }
  }

  // --------------------------------------------------
  // APPLY AI RECOMMENDATION
  // --------------------------------------------------

  function applyAIRecommendation() {
    if (!aiResult) return;

    setForm((previous) => ({
      ...previous,
      category:
        aiResult.category || previous.category,
      priority:
        aiResult.priority || previous.priority,
    }));

    setSuccess(
      "AI recommendation applied. Review the values before submitting."
    );
  }

  // --------------------------------------------------
  // CREATE ISSUE
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.reporter.trim() ||
      !form.department.trim()
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,

        // Save AI information along with the issue.
        ai_summary: aiResult?.summary || "",
        ai_action:
          aiResult?.suggested_action || "",
        ai_impact:
          aiResult?.impact || "",
        ai_reason:
          aiResult?.reason || "",
      };

      const created = await createIssue(payload);

      // Navigate to the newly created issue.
      navigate(`/issues/${created.id}`);
    } catch (err) {
      console.error("Create issue error:", err);

      setError(
        err.message ||
          "Unable to create the issue."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="create-issue-page">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="create-page-header">

        <button
          type="button"
          className="back-link"
          onClick={() => navigate("/issues")}
        >
          <ArrowLeft size={17} />
          Back to Issues
        </button>

        <div className="create-header-content">

          <div>
            <div className="create-breadcrumb">
              Issue Management
              <span>/</span>
              Report Issue
            </div>

            <h1>Report a new issue</h1>

            <p>
              Capture the problem clearly and use AI
              to help classify and prioritize it.
            </p>
          </div>

          <div className="create-ai-badge">
            <Sparkles size={17} />
            AI Assisted
          </div>

        </div>
      </div>

      {/* =========================================
          ERROR MESSAGE
      ========================================= */}

      {error && (
        <div className="create-alert error">
          <TriangleAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* =========================================
          SUCCESS MESSAGE
      ========================================= */}

      {success && (
        <div className="create-alert success">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* =========================================
          MAIN FORM
      ========================================= */}

      <form
        className="create-issue-layout"
        onSubmit={handleSubmit}
      >

        {/* =======================================
            LEFT COLUMN
        ======================================= */}

        <div className="create-form-column">

          {/* ISSUE INFORMATION */}

          <div className="create-form-card">

            <div className="create-card-header">

              <div className="create-card-icon">
                <FileText size={19} />
              </div>

              <div>
                <h2>Issue information</h2>

                <p>
                  Provide enough detail for accurate
                  triage and resolution.
                </p>
              </div>

            </div>

            {/* TITLE */}

            <div className="create-form-group">

              <label>
                Issue title
                <span>*</span>
              </label>

              <input
                type="text"
                placeholder="Example: Production server vulnerability detected"
                value={form.title}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value
                  )
                }
              />

            </div>

            {/* DESCRIPTION */}

            <div className="create-form-group">

              <label>
                Description
                <span>*</span>
              </label>

              <textarea
                placeholder="Describe what happened, where it happened, who is affected, and any relevant symptoms..."
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
              />

              <small>
                Clear technical details improve AI
                classification and duplicate detection.
              </small>

            </div>

            {/* REPORTER + DEPARTMENT */}

            <div className="create-two-column">

              <div className="create-form-group">

                <label>
                  Reporter
                  <span>*</span>
                </label>

                <input
                  type="text"
                  placeholder="Your name"
                  value={form.reporter}
                  onChange={(event) =>
                    updateField(
                      "reporter",
                      event.target.value
                    )
                  }
                />

              </div>

              <div className="create-form-group">

                <label>
                  Department
                  <span>*</span>
                </label>

                <input
                  type="text"
                  placeholder="Example: IT / Security / HR"
                  value={form.department}
                  onChange={(event) =>
                    updateField(
                      "department",
                      event.target.value
                    )
                  }
                />

              </div>

            </div>

            {/* CATEGORY + PRIORITY */}

            <div className="create-two-column">

              <div className="create-form-group">

                <label>Category</label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value
                    )
                  }
                >
                  <option value="Other">
                    Other
                  </option>

                  <option value="Hardware">
                    Hardware
                  </option>

                  <option value="Software">
                    Software
                  </option>

                  <option value="Network">
                    Network
                  </option>

                  <option value="Infrastructure">
                    Infrastructure
                  </option>

                  <option value="Security">
                    Security
                  </option>

                  <option value="Access">
                    Access
                  </option>
                </select>

              </div>

              <div className="create-form-group">

                <label>Priority</label>

                <select
                  value={form.priority}
                  onChange={(event) =>
                    updateField(
                      "priority",
                      event.target.value
                    )
                  }
                >
                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                  <option value="Critical">
                    Critical
                  </option>
                </select>

              </div>

            </div>

          </div>

          {/* =====================================
              DUPLICATE DETECTION
          ===================================== */}

          <div className="duplicate-card">

            <div className="duplicate-card-content">

              <div className="duplicate-icon">
                <Copy size={19} />
              </div>

              <div>
                <h3>
                  Check for similar issues
                </h3>

                <p>
                  Find existing issues that may describe
                  the same problem before creating a new
                  record.
                </p>
              </div>

            </div>

            <button
              type="button"
              className="secondary-action"
              onClick={handleDuplicateCheck}
              disabled={checkingDuplicates}
            >
              {checkingDuplicates ? (
                <>
                  <Loader2
                    size={16}
                    className="spin"
                  />
                  Checking...
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Find Similar
                </>
              )}
            </button>

          </div>

          {/* =====================================
              SIMILAR RESULTS
          ===================================== */}

          {similarIssues.length > 0 && (

            <div className="similar-results-card">

              <div className="similar-results-header">

                <div>

                  <h3>
                    Similar issues found
                  </h3>

                  <p>
                    Review these before submitting a
                    potentially duplicate issue.
                  </p>

                </div>

                <span>
                  {similarIssues.length} match
                  {similarIssues.length !== 1
                    ? "es"
                    : ""}
                </span>

              </div>

              <div className="similar-results-list">

                {similarIssues.map((issue) => (

                  <div
                    className="similar-result"
                    key={issue.id}
                  >

                    <div className="similar-result-main">

                      <strong>
                        #{issue.id}{" "}
                        {issue.title}
                      </strong>

                      <p>
                        {issue.description}
                      </p>

                    </div>

                    <div className="similar-result-meta">

                      <span>
                        {Math.round(
                          (issue.similarity || 0) * 100
                        )}
                        % similar
                      </span>

                      <span>
                        {issue.status}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          )}

        </div>

        {/* =======================================
            RIGHT AI COLUMN
        ======================================= */}

        <aside className="ai-assistant-column">

          {/* AI ASSISTANT */}

          <div className="ai-assistant-card">

            <div className="ai-assistant-header">

              <div className="ai-orb">
                <Bot size={21} />
              </div>

              <div>

                <span className="ai-overline">
                  IssueFlow AI
                </span>

                <h2>
                  Triage Assistant
                </h2>

              </div>

            </div>

            {/* AI INTRO */}

            <div className="ai-intro">

              <Sparkles size={16} />

              <p>
                Analyze the issue description to
                suggest a category, priority, impact
                and first action.
              </p>

            </div>

            {/* ANALYZE BUTTON */}

            <button
              type="button"
              className="ai-analyze-button"
              onClick={handleAIAnalysis}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2
                    size={17}
                    className="spin"
                  />
                  Analyzing issue...
                </>
              ) : (
                <>
                  <WandSparkles size={17} />
                  Analyze with AI
                </>
              )}
            </button>

            {/* EMPTY STATE */}

            {!aiResult && !analyzing && (

              <div className="ai-empty-state">

                <div className="ai-empty-icon">
                  <Lightbulb size={20} />
                </div>

                <strong>
                  No analysis yet
                </strong>

                <p>
                  Enter the issue details and click
                  Analyze with AI.
                </p>

              </div>

            )}

            {/* LOADING STATE */}

            {analyzing && (

              <div className="ai-analyzing-state">

                <div className="ai-loading-ring">

                  <Loader2
                    size={22}
                    className="spin"
                  />

                </div>

                <strong>
                  Reviewing the issue...
                </strong>

                <p>
                  Gemini is evaluating category,
                  priority and business impact.
                </p>

              </div>

            )}

            {/* AI RESULT */}

            {aiResult && !analyzing && (

              <div className="ai-result-section">

                <div className="ai-result-heading">

                  <div>

                    <span>
                      AI recommendation
                    </span>

                    <h3>
                      Review before applying
                    </h3>

                  </div>

                  <ShieldCheck
                    size={20}
                    color="#4f46e5"
                  />

                </div>

                {/* RECOMMENDATIONS */}

                <div className="ai-recommendation-grid">

                  <div className="ai-recommendation">

                    <span>
                      Category
                    </span>

                    <strong>
                      {aiResult.category ||
                        "Other"}
                    </strong>

                  </div>

                  <div className="ai-recommendation">

                    <span>
                      Priority
                    </span>

                    <strong
                      className={`ai-priority-text ${
                        aiResult.priority
                          ?.toLowerCase()
                          .replace(/\s+/g, "-") ||
                        ""
                      }`}
                    >
                      {aiResult.priority ||
                        "Medium"}
                    </strong>

                  </div>

                  <div className="ai-recommendation">

                    <span>
                      Business impact
                    </span>

                    <strong>
                      {aiResult.impact ||
                        "Medium"}
                    </strong>

                  </div>

                </div>

                {/* AI SUMMARY */}

                <div className="ai-detail-box">

                  <span>
                    AI Summary
                  </span>

                  <p>
                    {aiResult.summary ||
                      "No summary available."}
                  </p>

                </div>

                {/* SUGGESTED ACTION */}

                <div className="ai-detail-box action">

                  <span>
                    Suggested action
                  </span>

                  <p>
                    {aiResult.suggested_action ||
                      "No action available."}
                  </p>

                </div>

                {/* REASON */}

                <div className="ai-detail-box reason">

                  <span>
                    Why this priority?
                  </span>

                  <p>
                    {aiResult.reason ||
                      "No reasoning available."}
                  </p>

                </div>

                {/* APPLY */}

                <button
                  type="button"
                  className="apply-ai-button"
                  onClick={applyAIRecommendation}
                >
                  <Check size={17} />
                  Apply AI Recommendation
                </button>

                <p className="human-review-note">
                  AI suggestions are advisory. Review
                  and confirm the values before saving.
                </p>

              </div>

            )}

          </div>

          {/* =====================================
              SUBMIT CARD
          ===================================== */}

          <div className="submit-card">

            <div>

              <strong>
                Ready to report?
              </strong>

              <p>
                The issue will be created with an
                initial Open status.
              </p>

            </div>

            <button
              type="submit"
              className="submit-issue-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="spin"
                  />
                  Creating...
                </>
              ) : (
                <>
                  Report Issue
                  <Check size={17} />
                </>
              )}
            </button>

          </div>

        </aside>

      </form>

    </div>
  );
}