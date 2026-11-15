import { api } from "./client";

export const lessonApi = {
  create: (payload) => api("/lessons", { method: "POST", body: payload }),
  getByClass: (classId, params = {}) => {
    const queryParts = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });
    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return api(`/lessons/class/${classId}${queryString}`);
  },
  complete: (lessonId) => api(`/lessons/${lessonId}/complete`, { method: "POST" }),
};
