import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronRight,
  AlertCircle,
  Clock3,
  CheckCircle2,
  FileWarning,
} from "lucide-react";

import { getIssues } from "../services/api";

function StatusBadge({ status }) {
  const value = status || "Open";

  return (
    <span
      className={`issue-status-badge ${value
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
    >
      {value}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const value = priority || "Medium";

  return (
    <span
      className={`issue-priority-badge ${value.toLowerCase()}`}
    >
      <span className="priority-dot" />
      {value}
    </span>
  );
}

function CategoryBadge({ category }) {
  return (
    <span className="issue-category-badge">
      {category || "Other"}
    </span>
  );
}

export default function Issues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    loadIssues();
  }, []);

  async function loadIssues() {
    try {
      const data = await getIssues();
      setIssues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load issues:", error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        issues
          .map((issue) => issue.category)
          .filter(Boolean)
      ),
    ];
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesSearch =
        !query ||
        issue.title?.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query) ||
        issue.reporter?.toLowerCase().includes(query) ||
        issue.department?.toLowerCase().includes(query);

      const matchesStatus =
        status === "All" || issue.status === status;

      const matchesPriority =
        priority === "All" || issue.priority === priority;

      const matchesCategory =
        category === "All" || issue.category === category;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory
      );
    });
  }, [issues, search, status, priority, category]);

  const stats = useMemo(() => {
    return {
      total: issues.length,

      open: issues.filter(
        (issue) => issue.status === "Open"
      ).length,

      progress: issues.filter(
        (issue) => issue.status === "In Progress"
      ).length,

      critical: issues.filter(
        (issue) => issue.priority === "Critical"
      ).length,
    };
  }, [issues]);

  function clearFilters() {
    setSearch("");
    setStatus("All");
    setPriority("All");
    setCategory("All");
  }

  const hasFilters =
    search ||
    status !== "All" ||
    priority !== "All" ||
    category !== "All";

  if (loading) {
    return (
      <div className="issues-page-new">
        <div className="issues-loading">
          <div className="loading-spinner" />
          Loading issues...
        </div>
      </div>
    );
  }

  return (
    <div className="issues-page-new">

      {/* PAGE HEADER */}

      <div className="issues-page-header">

        <div>
          <div className="breadcrumb">
            Issue Management
            <ChevronRight size={14} />
            Issues
          </div>

          <h1>Issues</h1>

          <p>
            Track, search and manage reported issues across
            your organization.
          </p>
        </div>

        <button
          className="report-issue-top-button"
          onClick={() => {
            window.location.href = "/create";
          }}
        >
          + Report Issue
        </button>

      </div>


      {/* QUICK STATS */}

      <div className="issues-summary-grid">

        <div className="issues-summary-card">
          <div className="summary-icon blue">
            <FileWarning size={19} />
          </div>

          <div>
            <span>Total issues</span>
            <strong>{stats.total}</strong>
          </div>
        </div>


        <div className="issues-summary-card">
          <div className="summary-icon indigo">
            <AlertCircle size={19} />
          </div>

          <div>
            <span>Open</span>
            <strong>{stats.open}</strong>
          </div>
        </div>


        <div className="issues-summary-card">
          <div className="summary-icon orange">
            <Clock3 size={19} />
          </div>

          <div>
            <span>In progress</span>
            <strong>{stats.progress}</strong>
          </div>
        </div>


        <div className="issues-summary-card">
          <div className="summary-icon red">
            <AlertCircle size={19} />
          </div>

          <div>
            <span>Critical</span>
            <strong>{stats.critical}</strong>
          </div>
        </div>

      </div>


      {/* FILTER AREA */}

      <div className="issues-filter-card">

        <div className="issues-search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search by title, description, reporter or department..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search && (
            <button
              className="search-clear"
              onClick={() => setSearch("")}
            >
              <X size={16} />
            </button>
          )}

        </div>


        <div className="issues-filter-row">

          <div className="filter-label">
            <SlidersHorizontal size={15} />
            Filters
          </div>


          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>


          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value)
            }
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>


          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All"
                  ? "All Categories"
                  : item}
              </option>
            ))}
          </select>


          {hasFilters && (
            <button
              className="clear-filter-button"
              onClick={clearFilters}
            >
              <X size={15} />
              Clear
            </button>
          )}

        </div>

      </div>


      {/* ISSUE TABLE */}

      <div className="issues-list-card">

        <div className="issues-list-header">

          <div>
            <h2>All Issues</h2>

            <p>
              Showing{" "}
              <strong>{filteredIssues.length}</strong>{" "}
              of {issues.length} issues
            </p>
          </div>

        </div>


        {filteredIssues.length === 0 ? (

          <div className="issues-empty">

            <div className="empty-icon">
              <Search size={25} />
            </div>

            <h3>No issues found</h3>

            <p>
              Try changing your search or filter
              criteria.
            </p>

            {hasFilters && (
              <button
                className="clear-filter-button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}

          </div>

        ) : (

          <div className="issues-table-wrapper">

            <table className="issues-table-new">

              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Reporter</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>


              <tbody>

                {filteredIssues.map((issue) => (

                  <tr
                    key={issue.id}
                    onClick={() => {
                      window.location.href =
                        `/issues/${issue.id}`;
                    }}
                  >

                    <td>
                      <div className="issue-main-cell">

                        <span className="issue-id">
                          #{issue.id}
                        </span>

                        <div>
                          <strong>
                            {issue.title}
                          </strong>

                          <p>
                            {issue.description?.length >
                            85
                              ? `${issue.description.substring(
                                  0,
                                  85
                                )}...`
                              : issue.description}
                          </p>
                        </div>

                      </div>
                    </td>


                    <td>
                      <div className="reporter-cell">
                        <div className="reporter-avatar">
                          {(issue.reporter || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {issue.reporter}
                          </strong>

                          <span>
                            {issue.department}
                          </span>
                        </div>
                      </div>
                    </td>


                    <td>
                      <CategoryBadge
                        category={issue.category}
                      />
                    </td>


                    <td>
                      <PriorityBadge
                        priority={issue.priority}
                      />
                    </td>


                    <td>
                      <StatusBadge
                        status={issue.status}
                      />
                    </td>


                    <td>
                      <div className="issue-row-arrow">
                        <ChevronRight size={18} />
                      </div>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}