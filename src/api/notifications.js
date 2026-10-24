import { api } from "./client";

export const notificationApi = {
  getMine: () => api("/notifications"),
  markAsRead: (id) => api(`/notifications/${id}/read`, { method: "PATCH"}),
};