import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BASE_URL, getToken } from "../api/client";
import { notificationApi } from "../api/notifications";

export default function useNotifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // 1. Lấy lịch sử thông báo
    notificationApi.getMine()
      .then(({ data }) => setItems(data || []))
      .catch(console.error);

    // 2. Nghe thông báo Real-time qua Socket.io
    const token = getToken();
    if (!token) return;

    const socket = io(BASE_URL, { auth: { token } });

    socket.on("new_notification", (n) => {
      setItems((prev) => [n, ...prev]);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    return () => socket.disconnect();
  }, []);

  const markAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const unread = items.filter((n) => !n.is_read).length;

  return { items, unread, markAsRead };
}