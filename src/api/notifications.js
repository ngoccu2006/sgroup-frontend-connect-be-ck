import { api, withQuery } from "./client";

export const notificationApi = {
  getMine: (params = { page: 1, limit: 20 }) => api(withQuery("/notifications", params)),
  markAsRead: (id) => api(`/notifications/${id}/read`, { method: "PATCH" }),
};
