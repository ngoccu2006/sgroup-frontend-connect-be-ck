import { api } from "./client";

export const assignmentApi = {
  create: (payload) => api("/assignments", { method: "POST", body: payload }),
  getByClass: (classId) => api(`/assignments/class/${classId}`),
  getById: (id) => api(`/assignments/${id}`),
  update: (id, payload) => api(`/assignments/${id}`, { method: "PUT", body: payload }),
  remove: (id) => api(`/assignments/${id}`, { method: "DELETE" }),
};