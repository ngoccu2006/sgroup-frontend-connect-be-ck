import { api } from "./client";

export const assignmentApi = {
  create: (payload) => api("/assignments", { method: "POST", body: payload }),
  getByClass: (classId, params = {}) => {
    const queryParts = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });
    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return api(`/assignments/class/${classId}${queryString}`);
  },
  getById: (id) => api(`/assignments/${id}`),
  update: (id, payload) => api(`/assignments/${id}`, { method: "PUT", body: payload }),
  remove: (id) => api(`/assignments/${id}`, { method: "DELETE" }),
};
