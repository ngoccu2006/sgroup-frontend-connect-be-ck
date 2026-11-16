import { api, withQuery } from "./client";

// params: { page, limit, sortBy, order, q, isRead }
export const notificationApi = {
  getMine: (params = {}) => api(withQuery("/notifications", params)),
  markAsRead: (id) => api(`/notifications/${id}/read`, { method: "PATCH" }),
};
