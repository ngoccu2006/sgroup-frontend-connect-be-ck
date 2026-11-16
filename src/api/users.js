import { api, withQuery } from "./client";

// params: { page, limit, sortBy: created_at|email|full_name|role|updated_at, sortOrder, q, role }
export const userApi = {
  getAll: (params = {}) => api(withQuery("/users", params)),
  getById: (id) => api(`/users/${id}`),
  create: (payload) => api("/users", { method: "POST", body: payload }),
  update: (id, payload) => api(`/users/${id}`, { method: "PUT", body: payload }),
  remove: (id) => api(`/users/${id}`, { method: "DELETE" }),
  assignToClass: (class_id, member_id) => api("/class-members/add", { method: "POST", body: { class_id, member_id } }),
};
