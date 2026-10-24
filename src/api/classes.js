import {api} from "./client";

export const classApi = {
  getAll : () => api("/classes"),
  getById: (id) => api(`/classes/${id}`),
  create: (payload) => api("/classes", {method: "POST", body: payload}),
  getProgress: (classId) => api(`/classes/${classId}/progress`),
};

export const classMemberApi = {
  add: (class_id, member_id) => api("/class-members/add", {method: "POST", body: {class_id, member_id}}),
};