import { api, withQuery } from "./client";

// params: { page, limit, sortBy: order|created_at|title, sortOrder }
export const lessonApi = {
  create: (payload) => api("/lessons", { method: "POST", body: payload }),
  getByClass: (classId, params) => api(withQuery(`/lessons/class/${classId}`, params)),
  complete: (lessonId) => api(`/lessons/${lessonId}/complete`, { method: "POST" }),
};
