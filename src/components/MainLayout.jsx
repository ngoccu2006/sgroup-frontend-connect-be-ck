import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Bell, LogOut, GraduationCap, School, Users } from "lucide-react";
import { getUser, logout } from "../api/client";
import useNotifications from "../hooks/useNotifications";

// Nhãn + màu cho từng role (chỉ dùng để hiển thị)
const ROLE_META = {
  MEMBER: { label: "Học viên", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  MENTOR: { label: "Mentor", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  ADMIN: { label: "Quản trị viên", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
};

// Menu điều hướng theo role: member chỉ thấy những gì họ dùng được
const NAV_ITEMS = [
  { to: "/classes", icon: School, label: { MEMBER: "Lớp học", MENTOR: "Lớp học", ADMIN: "Lớp học" }, roles: ["MEMBER", "MENTOR", "ADMIN"] },
  { to: "/admin/users", icon: Users, label: { ADMIN: "Quản lý người dùng" }, roles: ["ADMIN"] },
];

export default function MainLayout() {
  const user = getUser();
  const role = user?.role || "MEMBER";
  const roleMeta = ROLE_META[role] || ROLE_META.MEMBER;
  const { items, unread, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);

  const displayedItems = filterUnread ? items.filter((n) => !n.is_read) : items;
  const navItems = NAV_ITEMS.filter((n) => n.roles.includes(role));

  return (
    <div style={styles.appContainer}>
      <style>{css}</style>

      {/* Header chính */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link to="/classes" style={styles.logo}>
            <span style={styles.logoIcon}><GraduationCap size={20} /></span>
            <span>LMS Portal</span>
          </Link>

          <nav style={styles.nav}>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `ml-nav${isActive ? " ml-nav-active" : ""}`}
              >
                <Icon size={16} /> <span className="ml-nav-label">{label[role]}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div style={styles.headerRight}>
          {/* Quả chuông thông báo */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setOpen(!open)} className="ml-icon-btn" style={styles.iconBtn} aria-label="Thông báo">
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
                        backgroundColor: !filterUnread ? "#2563eb" : "#f1f5f9",
                        color: !filterUnread ? "#fff" : "#64748b",
                      }}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilterUnread(true)}
                      style={{
                        ...styles.filterBtn,
                        backgroundColor: filterUnread ? "#2563eb" : "#f1f5f9",
                        color: filterUnread ? "#fff" : "#64748b",
                      }}
                    >
                      Chưa đọc {unread > 0 && `(${unread})`}
                    </button>
                  </div>
                </div>

                <div style={styles.dropdownBody}>
                  {displayedItems.length === 0 ? (
                    <div style={{ padding: 24, color: "#64748b", textAlign: "center", fontSize: 13 }}>
                      {filterUnread ? "Không có thông báo chưa đọc" : "Không có thông báo nào"}
                    </div>
                  ) : (
                    displayedItems.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        className="ml-noti"
                        style={{
                          ...styles.notificationItem,
                          backgroundColor: n.is_read ? "transparent" : "#eff6ff",
                          borderLeft: n.is_read ? "3px solid transparent" : "3px solid #2563eb",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <strong style={{ color: n.is_read ? "#334155" : "#1d4ed8", fontSize: 13, display: "block" }}>
                            {n.title}
                          </strong>
                          {!n.is_read && <span style={styles.unreadDot} />}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{n.message}</div>
                        {n.created_at && (
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
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

          {/* Thông tin người dùng + role */}
          <div style={styles.userBox}>
            <span style={{ ...styles.avatar, color: roleMeta.color, backgroundColor: roleMeta.bg, borderColor: roleMeta.border }}>
              {initials(user?.full_name)}
            </span>
            <div className="ml-user-text" style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
              <span style={styles.userName}>{user?.full_name}</span>
              <span style={{ ...styles.roleTag, color: roleMeta.color }}>{roleMeta.label}</span>
            </div>
          </div>

          <button onClick={logout} className="ml-logout" style={styles.logoutBtn} title="Đăng xuất">
            <LogOut size={16} /> <span className="ml-nav-label">Đăng xuất</span>
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

const initials = (name) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const css = `
  .ml-nav { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 8px; font-size: 14px; font-weight: 500; color: #475569; text-decoration: none; transition: background-color .15s, color .15s; }
  .ml-nav:hover { background-color: #f1f5f9; color: #1e40af; }
  .ml-nav-active { background-color: #eff6ff; color: #1d4ed8; font-weight: 600; }
  .ml-icon-btn { transition: background-color .15s; }
  .ml-icon-btn:hover { background-color: #f1f5f9 !important; }
  .ml-noti:hover { background-color: #f8fafc !important; }
  .ml-logout { transition: background-color .15s, border-color .15s; }
  .ml-logout:hover { background-color: #fef2f2 !important; border-color: #fecaca !important; }
  @media (max-width: 720px) {
    .ml-nav-label, .ml-user-text { display: none !important; }
  }
`;

const styles = {
  appContainer: { minHeight: "100vh", backgroundColor: "#f4f7fc", color: "#0f172a", fontFamily: "Inter, system-ui, sans-serif", textAlign: "left" },
  header: { position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "10px 32px", backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.04)" },
  headerLeft: { display: "flex", alignItems: "center", gap: 28, minWidth: 0 },
  logo: { display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 700, color: "#0f172a", textDecoration: "none", letterSpacing: "-0.01em", flexShrink: 0 },
  logoIcon: { width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "linear-gradient(135deg, #2563eb, #0ea5e9)", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" },
  nav: { display: "flex", alignItems: "center", gap: 4 },
  headerRight: { display: "flex", gap: 14, alignItems: "center" },
  iconBtn: { background: "none", border: "none", color: "#334155", cursor: "pointer", position: "relative", padding: 8, borderRadius: 8, display: "flex" },
  badge: { position: "absolute", top: 2, right: 2, backgroundColor: "#ef4444", color: "#fff", fontSize: 10, fontWeight: "bold", borderRadius: 999, padding: "1px 5px", border: "2px solid #fff" },
  dropdown: { position: "absolute", top: 44, right: 0, width: 340, maxHeight: 420, overflowY: "auto", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 12px 32px rgba(15,23,42,0.12)", zIndex: 100 },
  dropdownHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold", fontSize: 14, color: "#0f172a" },
  filterBtn: { padding: "4px 8px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all .15s" },
  dropdownBody: { display: "flex", flexDirection: "column" },
  notificationItem: { padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background-color 0.15s" },
  unreadDot: { width: 8, height: 8, borderRadius: "50%", backgroundColor: "#2563eb", flexShrink: 0, marginTop: 4 },
  userBox: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: "50%", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: "#0f172a" },
  roleTag: { fontSize: 11, fontWeight: 600 },
  logoutBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", backgroundColor: "#ffffff", color: "#dc2626", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 },
  mainContent: { padding: "32px", maxWidth: "1200px", margin: "0 auto" },
};
