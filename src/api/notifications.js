import { api } from "./client";

export const notificationApi = {
  getMine: (params = {}) => {
    const queryParts = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });
    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return api(`/notifications${queryString}`);
  },
  markAsRead: (id) => api(`/notifications/${id}/read`, { method: "PATCH" }),
};
