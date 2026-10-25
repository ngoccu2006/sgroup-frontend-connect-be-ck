import { useEffect, useState } from "react";
import { userApi } from "../api/users";
import { classApi } from "../api/classes";
import {
  Plus, Trash2, UserPlus, Shield, BadgeCheck, User, Users, GraduationCap, Search, X,
  Mail, KeyRound, Eye, EyeOff, ChevronDown, Check, IdCard, School,
} from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [createUserForm, setCreateUserForm] = useState({ name: "", email: "", password: "", role: "MEMBER" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState("");

  // UI state (chỉ lọc/hiển thị phía client)
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showPassword, setShowPassword] = useState(false);

  const loadData = () => {
    Promise.all([
      userApi.getAll().then(({ data }) => setUsers(data || [])),
      classApi.getAll().then(({ data }) => setClasses(data || [])),
    ])
      .catch((e) => alert(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userApi.create(createUserForm);
      alert("Tạo người dùng thành công!");
      setShowCreateModal(false);
      setCreateUserForm({ name: "", email: "", password: "", role: "MEMBER" });
      loadData();
    } catch (err) {
      alert(err.message || "Tạo thất bại");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    try {
      await userApi.remove(id);
      alert("Đã xóa người dùng!");
      loadData();
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  const handleAssignToClass = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedClassId) return alert("Vui lòng chọn lớp học!");
    try {
      await userApi.assignToClass(selectedClassId, [selectedUser.id]);
      alert(`Đã thêm ${selectedUser.name} vào lớp!`);
      setShowAssignModal(false);
    } catch (err) {
      alert(err.message || "Thêm vào lớp thất bại");
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <style>{css}</style>
        <div className="au-spinner" />
        Đang tải danh sách người dùng...
      </div>
    );
  }

  const counts = {
    ALL: users.length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    MENTOR: users.filter((u) => u.role === "MENTOR").length,
    MEMBER: users.filter((u) => u.role === "MEMBER").length,
  };

  const keyword = search.trim().toLowerCase();
  const visibleUsers = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (!keyword) return true;
    return displayName(u).toLowerCase().includes(keyword) || (u.email || "").toLowerCase().includes(keyword);
  });

  const statCards = [
    { label: "Tổng người dùng", value: counts.ALL, icon: Users, color: "#60a5fa" },
    { label: "Quản trị viên (Admin)", value: counts.ADMIN, icon: Shield, color: ROLE_THEME.ADMIN.color },
    { label: "Giảng viên (Mentor)", value: counts.MENTOR, icon: BadgeCheck, color: ROLE_THEME.MENTOR.color },
    { label: "Học viên (Member)", value: counts.MEMBER, icon: GraduationCap, color: "#34d399" },
  ];

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Header trang */}
      <div style={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={styles.headerIcon}>
            <Users size={22} />
          </div>
          <div>
            <h2 style={styles.title}>
              Quản lý Người dùng
              <span style={styles.titleTag}>Hệ thống</span>
            </h2>
            <p style={styles.subtitle}>Quản lý tài khoản, phân quyền và thêm học viên vào lớp học.</p>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="au-btn-primary" style={styles.createBtn}>
          <Plus size={16} /> Thêm Người Dùng
        </button>
      </div>

      {/* Thẻ thống kê */}
      <div style={styles.statGrid}>
        {statCards.map((s) => {
          const Icon = s.icon;
          const percent = counts.ALL ? Math.round((s.value / counts.ALL) * 100) : 0;
          return (
            <div key={s.label} className="au-card" style={styles.statCard}>
              <div style={styles.statTop}>
                <span style={styles.statLabel}>{s.label}</span>
                <div style={{ ...styles.statIcon, color: s.color, backgroundColor: `${s.color}1a`, borderColor: `${s.color}33` }}>
                  <Icon size={16} />
                </div>
              </div>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressBar, width: `${percent}%`, backgroundColor: s.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar: lọc vai trò + tìm kiếm */}
      <div style={styles.toolbar}>
        <div style={styles.tabs}>
          {["ALL", "ADMIN", "MENTOR", "MEMBER"].map((r) => {
            const active = roleFilter === r;
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className="au-tab"
                style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
              >
                {r !== "ALL" && <span style={{ ...styles.dot, backgroundColor: ROLE_THEME[r].color }} />}
                {r === "ALL" ? "Tất cả" : r} ({counts[r]})
              </button>
            );
          })}
        </div>
        <div style={styles.searchWrap}>
          <Search size={16} style={styles.searchIcon} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="au-input"
            style={{ ...styles.input, ...styles.searchInput }}
          />
        </div>
      </div>

      {/* Bảng người dùng */}
      <div style={styles.tableWrapper}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={{ ...styles.th, paddingLeft: 24 }}>Họ và Tên</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Vai trò</th>
                <th style={styles.th}>Ngày tham gia</th>
                <th style={{ ...styles.th, paddingRight: 24, textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => {
                const theme = ROLE_THEME[u.role] || ROLE_THEME.MEMBER;
                const RoleIcon = theme.icon;
                return (
                  <tr key={u.id} className="au-row" style={styles.tr}>
                    <td style={{ ...styles.td, paddingLeft: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ ...styles.avatar, color: theme.color, backgroundColor: theme.bg, borderColor: theme.border }}>
                          {getInitials(displayName(u))}
                        </div>
                        <span className="au-name" style={styles.name}>{displayName(u)}</span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, color: "#a1a1aa" }}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, color: theme.color, backgroundColor: theme.bg, borderColor: theme.border }}>
                        <RoleIcon size={12} /> {u.role}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: "#a1a1aa" }}>{formatDate(u.created_at)}</td>
                    <td style={{ ...styles.td, paddingRight: 24 }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                        {u.role === "MEMBER" && (
                          <button
                            onClick={() => { setSelectedUser(u); setShowAssignModal(true); }}
                            className="au-btn-assign"
                            style={styles.assignBtn}
                          >
                            <UserPlus size={14} /> Thêm vào Lớp
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="au-btn-delete"
                          style={styles.deleteBtn}
                          title="Xóa người dùng"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={5} style={styles.empty}>
                    <Users size={28} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <div>Không tìm thấy người dùng nào</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={styles.tableFooter}>
          Hiển thị <strong style={{ color: "#f4f4f5" }}>{visibleUsers.length}</strong> trong số{" "}
          <strong style={{ color: "#f4f4f5" }}>{users.length}</strong> người dùng
        </div>
      </div>

      {/* Modal Tạo Người Dùng */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className="au-modal" style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <ModalHeader
              icon={<UserPlus size={18} />}
              title="Thêm Người Dùng Mới"
              subtitle="Tạo tài khoản và phân quyền truy cập hệ thống"
              onClose={() => setShowCreateModal(false)}
            />
            <form onSubmit={handleCreateUser} style={styles.modalBody}>
              <Field label="Họ và Tên" icon={IdCard}>
                <input
                  required
                  value={createUserForm.name}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="au-input"
                  style={{ ...styles.input, ...styles.inputWithIcon }}
                />
              </Field>
              <Field label="Email" icon={Mail}>
                <input
                  type="email"
                  required
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="au-input"
                  style={{ ...styles.input, ...styles.inputWithIcon }}
                />
              </Field>
              <Field label="Mật khẩu" icon={KeyRound}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="au-input"
                  style={{ ...styles.input, ...styles.inputWithIcon, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>
              <Field label="Vai trò hệ thống" icon={Shield}>
                <select
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                  className="au-input"
                  style={{ ...styles.input, ...styles.inputWithIcon, ...styles.select }}
                >
                  <option value="MEMBER">MEMBER (Học viên)</option>
                  <option value="MENTOR">MENTOR (Giảng viên)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                </select>
                <ChevronDown size={16} style={styles.selectArrow} />
              </Field>
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="au-btn-secondary" style={styles.cancelBtn}>Hủy</button>
                <button type="submit" className="au-btn-primary" style={styles.saveBtn}>
                  <Check size={16} /> Lưu người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Học Viên Vào Lớp */}
      {showAssignModal && selectedUser && (
        <div style={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div className="au-modal" style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <ModalHeader
              icon={<School size={18} />}
              title="Thêm vào Lớp Học"
              subtitle={`Học viên: ${displayName(selectedUser)}`}
              onClose={() => setShowAssignModal(false)}
            />
            <form onSubmit={handleAssignToClass} style={styles.modalBody}>
              <div style={styles.userPreview}>
                <div style={{ ...styles.avatar, ...ROLE_AVATAR_MEMBER }}>{getInitials(displayName(selectedUser))}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={styles.name}>{displayName(selectedUser)}</div>
                  <div style={{ fontSize: 12, color: "#a1a1aa" }}>{selectedUser.email}</div>
                </div>
              </div>
              <Field label="Chọn Lớp Học" icon={School}>
                <select
                  required
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="au-input"
                  style={{ ...styles.input, ...styles.inputWithIcon, ...styles.select }}
                >
                  <option value="">-- Chọn lớp học --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.title || c.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} style={styles.selectArrow} />
              </Field>
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="au-btn-secondary" style={styles.cancelBtn}>Hủy</button>
                <button type="submit" className="au-btn-primary" style={styles.saveBtn}>
                  <Check size={16} /> Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalHeader({ icon, title, subtitle, onClose }) {
  return (
    <div style={styles.modalHeader}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={styles.modalIcon}>{icon}</div>
        <div>
          <h3 style={styles.modalTitle}>{title}</h3>
          <p style={styles.modalSubtitle}>{subtitle}</p>
        </div>
      </div>
      <button type="button" onClick={onClose} className="au-btn-ghost" style={styles.closeBtn} title="Đóng">
        <X size={18} />
      </button>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} <span style={{ color: "#f87171" }}>*</span>
      </label>
      <div style={{ position: "relative" }}>
        <Icon size={16} style={styles.fieldIcon} />
        {children}
      </div>
    </div>
  );
}

// API hiện trả về `full_name`, form cũ dùng `name` -> hiển thị cả hai
const displayName = (u) => u?.full_name || u?.name || "—";

const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");

const ROLE_THEME = {
  ADMIN: { color: "#a78bfa", bg: "rgba(124,58,237,0.15)", border: "rgba(167,139,250,0.3)", icon: Shield },
  MENTOR: { color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(251,191,36,0.3)", icon: BadgeCheck },
  MEMBER: { color: "#a1a1aa", bg: "#27272a", border: "#3f3f46", icon: User },
};

const ROLE_AVATAR_MEMBER = { color: ROLE_THEME.MEMBER.color, backgroundColor: ROLE_THEME.MEMBER.bg, borderColor: ROLE_THEME.MEMBER.border };

// Hover / focus / animation không làm được bằng inline style
const css = `
  .au-card { transition: border-color .15s, transform .15s; }
  .au-card:hover { border-color: #3f3f46 !important; transform: translateY(-1px); }
  .au-row { transition: background-color .1s; }
  .au-row:hover { background-color: rgba(39,39,42,0.5); }
  .au-row:hover .au-name { color: #60a5fa; }
  .au-tab:hover { color: #f4f4f5 !important; }
  .au-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 1px #3b82f6; }
  .au-input::placeholder { color: #71717a; }
  .au-btn-primary { transition: background-color .15s, transform .1s; }
  .au-btn-primary:hover { background-color: #3b82f6 !important; }
  .au-btn-primary:active, .au-btn-assign:active { transform: scale(0.97); }
  .au-btn-secondary:hover { background-color: #3f3f46 !important; }
  .au-btn-assign:hover { background-color: rgba(16,185,129,0.22) !important; }
  .au-btn-delete:hover { color: #f87171 !important; background-color: rgba(239,68,68,0.12) !important; }
  .au-btn-ghost:hover { color: #f4f4f5 !important; background-color: #27272a !important; }
  .au-modal { animation: au-pop .18s ease-out; }
  @keyframes au-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  .au-spinner { width: 28px; height: 28px; margin: 0 auto 12px; border: 3px solid #27272a; border-top-color: #3b82f6; border-radius: 50%; animation: au-spin .8s linear infinite; }
  @keyframes au-spin { to { transform: rotate(360deg); } }
`;

const styles = {
  page: { fontFamily: "Inter, system-ui, sans-serif" },
  center: { textAlign: "center", padding: 60, color: "#a1a1aa", fontSize: 14 },

  pageHeader: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, paddingBottom: 24, borderBottom: "1px solid #27272a" },
  headerIcon: { display: "flex", padding: 10, borderRadius: 12, backgroundColor: "#27272a", border: "1px solid #3f3f46", color: "#60a5fa" },
  title: { display: "flex", alignItems: "center", gap: 8, margin: 0, color: "#f4f4f5", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" },
  titleTag: { fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, backgroundColor: "#27272a", color: "#a1a1aa", border: "1px solid #3f3f46" },
  subtitle: { margin: "4px 0 0", color: "#a1a1aa", fontSize: 13 },
  createBtn: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, boxShadow: "0 8px 20px rgba(37,99,235,0.25)" },

  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 24 },
  statCard: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20 },
  statTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontSize: 13, fontWeight: 500, color: "#a1a1aa" },
  statIcon: { width: 32, height: 32, borderRadius: 8, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  statValue: { marginTop: 12, fontSize: 30, fontWeight: 600, color: "#f4f4f5", letterSpacing: "-0.025em" },
  progressTrack: { marginTop: 12, height: 4, borderRadius: 999, backgroundColor: "#27272a", overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 999, transition: "width .3s" },

  toolbar: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 32 },
  tabs: { display: "flex", gap: 4, padding: 4, backgroundColor: "#0f0f12", border: "1px solid #27272a", borderRadius: 12, overflowX: "auto" },
  tab: { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid transparent", backgroundColor: "transparent", color: "#a1a1aa", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" },
  tabActive: { backgroundColor: "#27272a", borderColor: "#3f3f46", color: "#60a5fa" },
  dot: { width: 8, height: 8, borderRadius: "50%" },
  searchWrap: { position: "relative", flex: "1 1 260px", maxWidth: 320 },
  searchIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#71717a", pointerEvents: "none" },
  searchInput: { height: 38, paddingLeft: 36, backgroundColor: "#0f0f12" },

  tableWrapper: { marginTop: 16, backgroundColor: "#18181b", borderRadius: 12, border: "1px solid #27272a", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 },
  thRow: { borderBottom: "1px solid #27272a", backgroundColor: "#141417" },
  th: { padding: "13px 16px", color: "#71717a", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #232326" },
  td: { padding: "14px 16px", color: "#d4d4d8", whiteSpace: "nowrap" },
  avatar: { width: 32, height: 32, flexShrink: 0, borderRadius: "50%", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 },
  name: { color: "#f4f4f5", fontWeight: 500, transition: "color .15s" },
  badge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, border: "1px solid", fontSize: 11, fontWeight: 600, letterSpacing: "0.02em" },
  assignBtn: { display: "inline-flex", alignItems: "center", gap: 5, backgroundColor: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500 },
  deleteBtn: { display: "inline-flex", alignItems: "center", backgroundColor: "transparent", color: "#71717a", border: "none", padding: 6, borderRadius: 8, cursor: "pointer" },
  empty: { padding: 48, textAlign: "center", color: "#71717a" },
  tableFooter: { padding: "12px 24px", borderTop: "1px solid #27272a", backgroundColor: "#141417", color: "#a1a1aa", fontSize: 12 },

  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(9,9,11,0.8)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16, zIndex: 1000 },
  modalContent: { backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: 16, width: "100%", maxWidth: 480, color: "#f4f4f5", overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.6)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #27272a", backgroundColor: "#141417" },
  modalIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(96,165,250,0.3)" },
  modalTitle: { margin: 0, fontSize: 15, fontWeight: 600 },
  modalSubtitle: { margin: "2px 0 0", fontSize: 12, color: "#a1a1aa" },
  closeBtn: { display: "flex", padding: 6, border: "none", borderRadius: 8, backgroundColor: "transparent", color: "#71717a", cursor: "pointer" },
  modalBody: { padding: 24 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #27272a" },
  userPreview: { display: "flex", alignItems: "center", gap: 12, padding: 12, marginBottom: 16, borderRadius: 10, backgroundColor: "#0f0f12", border: "1px solid #27272a" },

  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 500, color: "#f4f4f5" },
  fieldIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#71717a", pointerEvents: "none" },
  input: { width: "100%", boxSizing: "border-box", height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #3f3f46", backgroundColor: "#27272a", color: "#f4f4f5", fontSize: 13, outline: "none", transition: "border-color .15s, box-shadow .15s" },
  inputWithIcon: { paddingLeft: 36 },
  select: { appearance: "none", paddingRight: 36, cursor: "pointer" },
  selectArrow: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#71717a", pointerEvents: "none" },
  eyeBtn: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", padding: 4, border: "none", backgroundColor: "transparent", color: "#71717a", cursor: "pointer" },

  saveBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 8px 20px rgba(37,99,235,0.2)" },
  cancelBtn: { padding: "9px 16px", backgroundColor: "#27272a", color: "#f4f4f5", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" },
};
