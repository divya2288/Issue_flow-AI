import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <ShieldCheck size={22} />
        </div>

        <div>
          <h2>IssueFlow AI</h2>
          <span>Issue Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/issues"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <ListTodo size={18} />
          <span>Issues</span>
        </NavLink>

        <NavLink
          to="/create"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <PlusCircle size={18} />
          <span>Report Issue</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <span>IssueFlow AI</span>
        <small>AI-assisted issue management</small>
      </div>
    </aside>
  );
}