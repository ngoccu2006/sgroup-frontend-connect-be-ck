import { api, withQuery } from "./client";

// params: { page, limit, sortBy, sortOrder }
export const classApi = {
  getAll: (params) => api(withQuery("/classes", params)),
  create: (payload) => api("/classes", { method: "POST", body: payload }),
  getProgress: (classId) => api(`/classes/${classId}/progress`),
};

export const classMemberApi = {
  add: (class_id, member_id) => api("/class-members/add", { method: "POST", body: { class_id, member_id } }),
  getByClass: (classId) => api(`/class-members/${classId}/members`),
};
