import { HashRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Issues from "./pages/Issues";
import CreateIssue from "./pages/CreateIssue";
import IssueDetails from "./pages/IssueDetails";

import "./App.css";

function App() {
  return (
    <HashRouter>
      <div className="app">
        <Sidebar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route path="/issues" element={<Issues />} />

            <Route path="/create" element={<CreateIssue />} />

            <Route
              path="/issues/:id"
              element={<IssueDetails />}
            />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;