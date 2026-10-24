import { useEffect, useState } from "react";
import { userApi } from "../api/users";
import { classApi } from "../api/classes";
import { Plus, Trash2, UserPlus, Shield } from "lucide-react";

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

  if (loading) return <div style={styles.center}>⏳ Đang tải danh sách người dùng...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#fff", margin: 0 }}>👥 Quản lý Người dùng</h2>
        <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
          <Plus size={16} /> Thêm Người Dùng
        </button>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Họ và Tên</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Vai trò (Role)</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={styles.tr}>
                <td style={styles.td}>
                  <strong style={{ color: "#fff" }}>{u.name}</strong>
                </td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>
                  <span style={getRoleBadgeStyle(u.role)}>
                    <Shield size={12} /> {u.role}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {u.role === "MEMBER" && (
                      <button
                        onClick={() => { setSelectedUser(u); setShowAssignModal(true); }}
                        style={styles.assignBtn}
                      >
                        <UserPlus size={14} /> Thêm vào Lớp
                      </button>
                    )}
                    <button onClick={() => handleDeleteUser(u.id)} style={styles.deleteBtn}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Tạo Người Dùng */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>➕ Thêm Người Dùng Mới</h3>
            <form onSubmit={handleCreateUser}>
              <div style={styles.field}>
                <label style={styles.label}>Họ và Tên:</label>
                <input
                  required
                  value={createUserForm.name}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email:</label>
                <input
                  type="email"
                  required
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                  placeholder="email@example.com"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Mật khẩu:</label>
                <input
                  type="password"
                  required
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Vai trò:</label>
                <select
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                  style={styles.input}
                >
                  <option value="MEMBER">MEMBER (Học viên)</option>
                  <option value="MENTOR">MENTOR (Giảng viên)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" style={styles.saveBtn}>Lưu</button>
                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Học Viên Vào Lớp */}
      {showAssignModal && selectedUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>➕ Thêm "{selectedUser.name}" Vào Lớp Học</h3>
            <form onSubmit={handleAssignToClass}>
              <div style={styles.field}>
                <label style={styles.label}>Chọn Lớp Học:</label>
                <select
                  required
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  style={styles.input}
                >
                  <option value="">-- Chọn lớp học --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" style={styles.saveBtn}>Xác nhận</button>
                <button type="button" onClick={() => setShowAssignModal(false)} style={styles.cancelBtn}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const getRoleBadgeStyle = (role) => {
  const base = { display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: "bold" };
  if (role === "ADMIN") return { ...base, backgroundColor: "#7c3aed", color: "#fff" };
  if (role === "MENTOR") return { ...base, backgroundColor: "#eab308", color: "#000" };
  return { ...base, backgroundColor: "#27272a", color: "#a1a1aa" };
};

const styles = {
  createBtn: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 14 },
  tableWrapper: { overflowX: "auto", backgroundColor: "#18181b", borderRadius: 12, border: "1px solid #27272a" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 },
  thRow: { borderBottom: "1px solid #27272a", backgroundColor: "#27272a" },
  th: { padding: "14px 16px", color: "#d4d4d8", fontWeight: "bold" },
  tr: { borderBottom: "1px solid #27272a" },
  td: { padding: "14px 16px", color: "#d4d4d8" },
  assignBtn: { display: "inline-flex", alignItems: "center", gap: 4, backgroundColor: "#10b981", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" },
  deleteBtn: { display: "inline-flex", alignItems: "center", backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" },
  center: { textAlign: "center", padding: 40, color: "#a1a1aa" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, width: "100%", maxWidth: 400, color: "#fff" },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 },
  label: { fontSize: 13, color: "#d4d4d8" },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid #3f3f46", backgroundColor: "#27272a", color: "#fff", fontSize: 14, outline: "none" },
  saveBtn: { flex: 1, padding: 10, backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" },
  cancelBtn: { flex: 1, padding: 10, backgroundColor: "#3f3f46", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
};