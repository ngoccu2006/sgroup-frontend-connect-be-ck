import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Bell, LogOut, BookOpen } from "lucide-react";
import { getUser, logout } from "../api/client";
import useNotifications from "../hooks/useNotifications";

export default function MainLayout() {
  const user = getUser();
  const { items, unread, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

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
                <div style={styles.dropdownHeader}>Thông báo</div>
                <div style={styles.dropdownBody}>
                  {items.length === 0 && <div style={{ padding: 16, color: "#a1a1aa", textAlign: "center" }}>Không có thông báo</div>}
                  {items.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                      style={{
                        ...styles.notificationItem,
                        backgroundColor: n.is_read ? "transparent" : "#27272a",
                      }}
                    >
                      <strong style={{ color: "#3b82f6", display: "block", marginBottom: 4 }}>{n.title}</strong>
                      <div style={{ fontSize: 13, color: "#d4d4d8" }}>{n.message}</div>
                    </div>
                  ))}
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
  dropdown: { position: "absolute", top: 40, right: 0, width: 320, maxHeight: 400, overflowY: "auto", backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8, boxShadow: "0 10px 25px rgba(0,0,0,0.5)", zIndex: 100 },
  dropdownHeader: { padding: "12px 16px", borderBottom: "1px solid #27272a", fontWeight: "bold" },
  dropdownBody: { display: "flex", flexDirection: "column" },
  notificationItem: { padding: 12, borderBottom: "1px solid #27272a", cursor: "pointer", transition: "0.2s" },
  userInfo: { fontSize: 14, fontWeight: "bold" },
  roleTag: { color: "#a1a1aa", fontWeight: "normal" },
  logoutBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: "#27272a", color: "#ef4444", border: "1px solid #3f3f46", borderRadius: 6, cursor: "pointer", fontWeight: "bold" },
  mainContent: { padding: "32px", maxWidth: "1200px", margin: "0 auto" },
};