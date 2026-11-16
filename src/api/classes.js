import { api, withQuery } from "./client";

// params: { page, limit, sortBy, sortOrder, q, fromDate, toDate } (cho phép truyền số trang trực tiếp)
export const classApi = {
  getAll: (params = {}) => api(withQuery("/classes", typeof params === "number" ? { page: params } : params)),
  getById: (id) => api(`/classes/${id}`),
  create: (payload) => api("/classes", { method: "POST", body: payload }),
  // PUT ghi đè toàn bộ: phải gửi đủ name, description, start_date, end_date, mentor_id
  update: (id, payload) => api(`/classes/${id}`, { method: "PUT", body: payload }),
  remove: (id) => api(`/classes/${id}`, { method: "DELETE" }),
  getProgress: (classId) => api(`/classes/${classId}/progress`),
};

export const classMemberApi = {
  add: (class_id, member_id) => api("/class-members/add", { method: "POST", body: { class_id, member_id } }),
  getMembers: (classId, params = {}) => api(withQuery(`/class-members/${classId}/members`, params)),
};
