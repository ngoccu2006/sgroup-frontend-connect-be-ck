import { api } from "./client";

export const userApi = {
  getAll: () => api("/users"),
  create: (payload) => api("/users", { method: "POST", body: payload }),
  update: (id, payload) => api(`/users/${id}`, { method: "PUT", body: payload }),
  remove: (id) => api(`/users/${id}`, { method: "DELETE" }),
  assignToClass: (class_id, member_id) => api("/class-members/add", { method: "POST", body: { class_id, member_id } }),
};