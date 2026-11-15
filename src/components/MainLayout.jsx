import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Bell, LogOut, BookOpen, CheckCheck } from "lucide-react";
import { getUser, logout } from "../api/client";
import useNotifications from "../hooks/useNotifications";

export default function MainLayout() {
  const user = getUser();
  const { items, unread, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);

  const displayedItems = filterUnread ? items.filter((n) => !n.is_read) : items;

  return (
    <div style={styles.appContainer}>
      {/* Header chính */}
      <header style={styles.header}>
        <Link to="/classes" style={styles.logo}>
          <BookOpen size={24} color="#3b82f6" />
          <span>LMS Portal</span>
        </Link>

        <div style={styles.headerRight}>
          {/* Quả chuông thông báo */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setOpen(!open)} style={styles.iconBtn} aria-label="Thông báo">
              <Bell size={20} />
              {unread > 0 && <span style={styles.badge}>{unread}</span>}
            </button>

            {/* Menu Dropdown Thông báo */}
            {open && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownHeader}>
                  <span>Thông báo ({items.length})</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setFilterUnread(false)}
                      style={{
                        ...styles.filterBtn,
                        backgroundColor: !filterUnread ? "#2563eb" : "transparent",
                        color: !filterUnread ? "#fff" : "#a1a1aa",
                      }}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilterUnread(true)}
                      style={{
                        ...styles.filterBtn,
                        backgroundColor: filterUnread ? "#2563eb" : "transparent",
                        color: filterUnread ? "#fff" : "#a1a1aa",
                      }}
                    >
                      Chưa đọc {unread > 0 && `(${unread})`}
                    </button>
                  </div>
                </div>

                <div style={styles.dropdownBody}>
                  {displayedItems.length === 0 ? (
                    <div style={{ padding: 24, color: "#a1a1aa", textAlign: "center", fontSize: 13 }}>
                      {filterUnread ? "Không có thông báo chưa đọc" : "Không có thông báo nào"}
                    </div>
                  ) : (
                    displayedItems.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        style={{
                          ...styles.notificationItem,
                          backgroundColor: n.is_read ? "transparent" : "rgba(37, 99, 235, 0.08)",
                          borderLeft: n.is_read ? "3px solid transparent" : "3px solid #3b82f6",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <strong style={{ color: n.is_read ? "#d4d4d8" : "#60a5fa", fontSize: 13, display: "block" }}>
                            {n.title}
                          </strong>
                          {!n.is_read && <span style={styles.unreadDot} />}
                        </div>
                        <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>{n.message}</div>
                        {n.created_at && (
                          <div style={{ fontSize: 11, color: "#71717a", marginTop: 6 }}>
                            {new Date(n.created_at).toLocaleString("vi-VN")}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <span style={styles.userInfo}>
            {user?.full_name} <small style={styles.roleTag}>({user?.role})</small>
          </span>

          <button onClick={logout} style={styles.logoutBtn}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </header>

      {/* Nơi chứa nội dung các trang con */}
      <main style={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  appContainer: { minHeight: "100vh", backgroundColor: "#09090b", color: "#f4f4f5", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 32px", backgroundColor: "#18181b", borderBottom: "1px solid #27272a" },
  logo: { display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: "bold", color: "#fff", textDecoration: "none" },
  headerRight: { display: "flex", gap: 20, alignItems: "center" },
  iconBtn: { background: "none", border: "none", color: "#f4f4f5", cursor: "pointer", position: "relative", padding: 6 },
  badge: { position: "absolute", top: 2, right: 2, backgroundColor: "#ef4444", color: "#fff", fontSize: 10, fontWeight: "bold", borderRadius: "50%", padding: "2px 6px" },
  dropdown: { position: "absolute", top: 40, right: 0, width: 340, maxHeight: 420, overflowY: "auto", backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.6)", zIndex: 100 },
  dropdownHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #27272a", fontWeight: "bold", fontSize: 14 },
  filterBtn: { padding: "4px 8px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all .15s" },
  dropdownBody: { display: "flex", flexDirection: "column" },
  notificationItem: { padding: "12px 16px", borderBottom: "1px solid #27272a", cursor: "pointer", transition: "background-color 0.15s" },
  unreadDot: { width: 8, height: 8, borderRadius: "50%", backgroundColor: "#3b82f6", flexShrink: 0, marginTop: 4 },
  userInfo: { fontSize: 14, fontWeight: "bold" },
  roleTag: { color: "#a1a1aa", fontWeight: "normal" },
  logoutBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: "#27272a", color: "#ef4444", border: "1px solid #3f3f46", borderRadius: 6, cursor: "pointer", fontWeight: "bold" },
  mainContent: { padding: "32px", maxWidth: "1200px", margin: "0 auto" },
};
