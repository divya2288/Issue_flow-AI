import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileWarning,
  FolderOpen,
  ShieldAlert,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { getIssues } from "../services/api";

function StatCard({ icon, label, value, iconClass }) {
  return (
    <div className="dashboard-stat-card">
      <div className={`dashboard-stat-icon ${iconClass}`}>
        {icon}
      </div>

      <div className="dashboard-stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const className = status
    ? status.toLowerCase().replace(/\s+/g, "-")
    : "open";

  return (
    <span className={`dashboard-status-badge ${className}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const className = priority
    ? priority.toLowerCase().replace(/\s+/g, "-")
    : "medium";

  return (
    <span className={`dashboard-priority-badge ${className}`}>
      {priority}
    </span>
  );
}

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIssues();
  }, []);

  async function loadIssues() {
    try {
      const data = await getIssues();
      setIssues(data);
    } catch (error) {
      console.error("Failed to load issues:", error);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const open = issues.filter((i) => i.status === "Open").length;

    const inProgress = issues.filter(
      (i) => i.status === "In Progress"
    ).length;

    const resolved = issues.filter(
      (i) => i.status === "Resolved"
    ).length;

    const highCritical = issues.filter(
      (i) => i.priority === "High" || i.priority === "Critical"
    ).length;

    const critical = issues.filter(
      (i) => i.priority === "Critical"
    ).length;

    return {
      total: issues.length,
      open,
      inProgress,
      resolved,
      highCritical,
      critical,
    };
  }, [issues]);

  const statusData = useMemo(() => {
    const statuses = ["Open", "In Progress", "Resolved"];

    return statuses
      .map((status) => ({
        name: status,
        value: issues.filter((issue) => issue.status === status).length,
      }))
      .filter((item) => item.value > 0);
  }, [issues]);

  const priorityData = useMemo(() => {
    const priorities = ["Low", "Medium", "High", "Critical"];

    return priorities.map((priority) => ({
      name: priority,
      value: issues.filter(
        (issue) => issue.priority === priority
      ).length,
    }));
  }, [issues]);

  const statusColors = {
    Open: "#4f46e5",
    "In Progress": "#f59e0b",
    Resolved: "#10b981",
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <div className="dashboard-topbar">
        <div>
          <h1>Dashboard</h1>
          <p>
            Overview of your organization's reported issues.
          </p>
        </div>

        <div className="dashboard-ai-label">
          <ShieldAlert size={18} />
          <span>IssueFlow AI</span>
        </div>
      </div>


      {/* STAT CARDS */}
      <div className="dashboard-stats">

        <StatCard
          icon={<FileWarning size={22} />}
          label="Total Issues"
          value={stats.total}
          iconClass="blue"
        />

        <StatCard
          icon={<FolderOpen size={22} />}
          label="Open"
          value={stats.open}
          iconClass="indigo"
        />

        <StatCard
          icon={<Clock3 size={22} />}
          label="In Progress"
          value={stats.inProgress}
          iconClass="orange"
        />

        <StatCard
          icon={<CheckCircle2 size={22} />}
          label="Resolved"
          value={stats.resolved}
          iconClass="green"
        />

        <StatCard
          icon={<ShieldAlert size={22} />}
          label="High / Critical"
          value={stats.highCritical}
          iconClass="red"
        />

      </div>


      {/* CRITICAL WARNING */}
      {stats.critical > 0 && (
        <div className="dashboard-critical-alert">

          <div className="critical-alert-icon">
            <AlertTriangle size={22} />
          </div>

          <div>
            <h3>Critical issues require attention</h3>
            <p>
              There are {stats.critical} critical issue
              {stats.critical !== 1 ? "s" : ""} currently recorded.
            </p>
          </div>

        </div>
      )}


      {/* CHART SECTION */}
      <div className="dashboard-chart-grid">

        {/* STATUS */}
        <div className="dashboard-panel">

          <div className="dashboard-panel-header">
            <div>
              <h2>Issues by Status</h2>
              <p>Current distribution of issue status</p>
            </div>
          </div>

          <div className="dashboard-chart">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={108}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={statusColors[entry.name]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />

                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="dashboard-no-data">
                No status data available
              </div>
            )}

            {statusData.length > 0 && (
              <div className="chart-center-label">
                <strong>{stats.total}</strong>
                <span>Total</span>
              </div>
            )}
          </div>

          <div className="chart-legend">
            {statusData.map((item) => (
              <div
                className="chart-legend-item"
                key={item.name}
              >
                <span
                  className="legend-dot"
                  style={{
                    background: statusColors[item.name],
                  }}
                />

                <span>{item.name}</span>

                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

        </div>


        {/* PRIORITY */}
        <div className="dashboard-panel">

          <div className="dashboard-panel-header">
            <div>
              <h2>Issues by Priority</h2>
              <p>Distribution based on severity</p>
            </div>
          </div>

          <div className="dashboard-bar-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -15,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip />

                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  fill="#4f46e5"
                  barSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>


      {/* RECENT ISSUES */}
      <div className="dashboard-panel recent-issues-panel">

        <div className="dashboard-panel-header">
          <div>
            <h2>Recent Issues</h2>
            <p>Latest issues reported in the system</p>
          </div>

          <span className="recent-count">
            {issues.length} total
          </span>
        </div>


        {issues.length === 0 ? (
          <div className="dashboard-no-issues">
            No issues have been reported yet.
          </div>
        ) : (
          <div className="recent-issues-table">

            <div className="recent-table-header">
              <span>ID</span>
              <span>Issue</span>
              <span>Reporter</span>
              <span>Status</span>
              <span>Priority</span>
            </div>

            {issues.map((issue) => (
              <div
                className="recent-table-row"
                key={issue.id}
                onClick={() => {
                  window.location.href = `/issues/${issue.id}`;
                }}
              >

                <span className="issue-number">
                  #{issue.id}
                </span>

                <div className="recent-issue-info">
                  <strong>{issue.title}</strong>

                  <span>
                    {issue.description?.length > 75
                      ? `${issue.description.substring(0, 75)}...`
                      : issue.description}
                  </span>
                </div>

                <span className="reporter-name">
                  {issue.reporter}
                </span>

                <StatusBadge status={issue.status} />

                <PriorityBadge priority={issue.priority} />

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}