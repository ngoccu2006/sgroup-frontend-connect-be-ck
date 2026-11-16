import { api, withQuery } from "./client";

// params: { page, limit, sortBy: created_at|title|deadline|maximum_score, sortOrder, q, fromDate, toDate }
export const assignmentApi = {
  create: (payload) => api("/assignments", { method: "POST", body: payload }),
  getByClass: (classId, params = {}) => api(withQuery(`/assignments/class/${classId}`, params)),
  getById: (id) => api(`/assignments/${id}`),
  update: (id, payload) => api(`/assignments/${id}`, { method: "PUT", body: payload }),
  remove: (id) => api(`/assignments/${id}`, { method: "DELETE" }),
};
