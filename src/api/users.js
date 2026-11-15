import { api } from "./client";

export const userApi = {
  getAll: (params = {}) => {
    const queryParts = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });
    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return api(`/users${queryString}`);
  },
  getById: (id) => api(`/users/${id}`),
  create: (payload) => api("/users", { method: "POST", body: payload }),
  update: (id, payload) => api(`/users/${id}`, { method: "PUT", body: payload }),
  remove: (id) => api(`/users/${id}`, { method: "DELETE" }),
  assignToClass: (class_id, member_id) => api("/class-members/add", { method: "POST", body: { class_id, member_id } }),
};
