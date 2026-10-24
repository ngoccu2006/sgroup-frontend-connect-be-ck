import { api } from "./client";

export const lessonApi = {
  create : (payload) => api("/lessons", {method: "POST", body: payload}),
  getByClass: (classId) => api(`/lessons/class/${classId}`),
  complete: (lessonId) => api(`/lessons/${lessonId}/complete`, {method: "POST"}),
};
