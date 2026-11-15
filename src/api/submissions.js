import { api, withQuery } from "./client";

export const submissionApi = {
  // Nộp lần đầu hoặc nộp lại (BE tự lưu bản cũ vào lịch sử + tăng version, reset điểm)
  submit: ({ assignment_id, content, repository_url, file }) => {
    const fd = new FormData();
    fd.append("assignment_id", assignment_id);
    if (content) fd.append("content", content);
    if (repository_url) fd.append("repository_url", repository_url);
    if (file) fd.append("file", file); // Tên field bắt buộc là "file"
    return api("/submissions", { method: "POST", body: fd });
  },
  getMine: (assignmentId) => api(`/submissions/my-submission/${assignmentId}`),
  // params: { page, limit }
  getByAssignment: (assignmentId, params) => api(withQuery(`/submissions/assignment/${assignmentId}`, params)),
  // => { data: { current, history: [...] } } (history: các version cũ, mới nhất trước)
  getHistory: (submissionId) => api(`/submissions/${submissionId}/history`),
  grade: (id, score, feedback) => api(`/submissions/${id}/grade`, { method: "PUT", body: { score, feedback } }),
};
