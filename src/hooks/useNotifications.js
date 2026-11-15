import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { BASE_URL, getToken } from "../api/client";
import { notificationApi } from "../api/notifications";

export default function useNotifications() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(() => {
    notificationApi.getMine({ limit: 50, sortBy: "created_at", order: "DESC" })
      .then(({ data }) => {
        const notifs = data || [];
        setItems(notifs);
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchNotifications();

    const token = getToken();
    if (!token) return;

    const socket = io(BASE_URL, { auth: { token } });

    socket.on("new_notification", (n) => {
      setItems((prev) => [n, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    return () => socket.disconnect();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return { items, unread: unreadCount, markAsRead, refresh: fetchNotifications };
}
