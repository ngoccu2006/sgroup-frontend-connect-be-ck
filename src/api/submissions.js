import { api } from "./client";

export const submissionApi = {
  submit: ({ assignment_id, content, repository_url, file }) => {
    const fd = new FormData();
    fd.append("assignment_id", assignment_id);
    if (content) fd.append("content", content);
    if (repository_url) fd.append("repository_url", repository_url);
    if (file) fd.append("file", file);
    return api("/submissions", { method: "POST", body: fd });
  },
  getMine: (assignmentId) => api(`/submissions/my-submission/${assignmentId}`),
  getByAssignment: (assignmentId, params = {}) => {
    const queryParts = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });
    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return api(`/submissions/assignment/${assignmentId}${queryString}`);
  },
  grade: (id, score, feedback) => api(`/submissions/${id}/grade`, { method: "PUT", body: { score, feedback } }),
};
