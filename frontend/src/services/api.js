const API_URL = "https://issueflow-ai-backend.onrender.com/api";

async function request(url, options = {}) {
  const response = await fetch(url, options);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export async function getIssues() {
  return request(`${API_URL}/issues`);
}

export async function getIssue(issueId) {
  return request(`${API_URL}/issues/${issueId}`);
}

export async function createIssue(issueData) {
  return request(`${API_URL}/issues`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(issueData),
  });
}

export async function updateIssue(issueId, issueData) {
  return request(`${API_URL}/issues/${issueId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(issueData),
  });
}

export async function deleteIssue(issueId) {
  return request(`${API_URL}/issues/${issueId}`, {
    method: "DELETE",
  });
}

export async function analyzeIssue(title, description) {
  return request(`${API_URL}/issues/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      description,
    }),
  });
}

export async function findSimilarIssues(title, description) {
  return request(`${API_URL}/issues/similar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      description,
    }),
  });
}