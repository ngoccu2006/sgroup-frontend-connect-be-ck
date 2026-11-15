import { api, withQuery } from "./client";

// Lịch học của lớp. payload: { title?, lesson_id?, session_date: YYYY-MM-DD, start_time: HH:MM, end_time: HH:MM, location?, note? }
export const scheduleApi = {
  // params: { page, limit, sortBy: session_date|start_time|created_at, sortOrder }
  getByClass: (classId, params) => api(withQuery(`/schedules/class/${classId}`, params)),
  create: (classId, payload) => api(`/schedules/class/${classId}`, { method: "POST", body: payload }),
  update: (id, payload) => api(`/schedules/${id}`, { method: "PATCH", body: payload }),
  remove: (id) => api(`/schedules/${id}`, { method: "DELETE" }),
};
