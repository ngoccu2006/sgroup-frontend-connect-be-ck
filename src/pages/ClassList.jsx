import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classApi } from "../api/classes";
import { getUser } from "../api/client";
import { BookOpen, Calendar, ArrowRight, Plus, X } from "lucide-react";

export default function ClassList() {
  const user = getUser();
  const isMentorOrAdmin = ["MENTOR", "ADMIN"].includes(user?.role);

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadClasses = () => {
    classApi.getAll()
      .then(({ data }) => setClasses(data || []))
      .catch((e) => setError(e.message || "Lỗi tải danh sách lớp học"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await classApi.create(form);
      alert("Tạo lớp học mới thành công!");
      setShowModal(false);
      setForm({ title: "", description: "" });
      loadClasses(); // Reload lại danh sách
    } catch (err) {
      alert(err.message || "Tạo lớp học thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={styles.centerText}>⏳ Đang tải danh sách lớp học...</div>;
  if (error) return <div style={styles.errorText}>❌ {error}</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          📚 Lớp học của bạn
        </h2>

        {isMentorOrAdmin && (
          <button onClick={() => setShowModal(true)} style={styles.createBtn}>
            <Plus size={16} /> Tạo Lớp Học Mới
          </button>
        )}
      </div>

      {classes.length === 0 ? (
        <div style={styles.emptyText}>Bạn chưa tham gia hoặc chưa có lớp học nào.</div>
      ) : (
        <div style={styles.grid}>
          {classes.map((c) => (
            <div key={c.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <BookOpen color="#3b82f6" size={24} />
                <h3 style={styles.cardTitle}>{c.title}</h3>
              </div>
              <p style={styles.cardDesc}>{c.description || "Chưa có mô tả cho lớp học này."}</p>
              
              <div style={styles.cardFooter}>
                <span style={styles.dateInfo}>
                  <Calendar size={14} /> Bắt đầu: {c.created_at ? new Date(c.created_at).toLocaleDateString("vi-VN") : "N/A"}
                </span>
                <Link to={`/classes/${c.id}`} style={styles.detailBtn}>
                  Xem chi tiết <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tạo Lớp Học */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>➕ Tạo Lớp Học Mới</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div style={styles.field}>
                <label style={styles.label}>Tên Lớp Học:</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ví dụ: Lập trình ReactJS Thực Chiến"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Mô Tả Lớp Học:</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả ngắn gọn về khóa học/lớp học..."
                  style={styles.input}
                />
              </div>
              <button disabled={submitting} type="submit" style={styles.saveBtn}>
                {submitting ? "Đang tạo..." : "Tạo Lớp Học"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  createBtn: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 },
  card: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" },
  cardHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  cardTitle: { margin: 0, fontSize: 18, color: "#fff" },
  cardDesc: { color: "#a1a1aa", fontSize: 14, marginBottom: 20, lineHeight: 1.5 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #27272a", paddingTop: 14 },
  dateInfo: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#71717a" },
  detailBtn: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#2563eb", color: "#fff", padding: "8px 14px", borderRadius: 6, textDecoration: "none", fontSize: 13, fontWeight: "bold" },
  centerText: { textAlign: "center", padding: 40, color: "#a1a1aa" },
  emptyText: { textAlign: "center", padding: 40, color: "#a1a1aa", backgroundColor: "#18181b", borderRadius: 12, border: "1px solid #27272a" },
  errorText: { color: "#f87171", padding: 20, backgroundColor: "#451a1a", borderRadius: 8 },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, width: "100%", maxWidth: 460, color: "#fff" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  closeBtn: { background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  label: { fontSize: 13, color: "#d4d4d8", fontWeight: "500" },
  input: { padding: "10px 12px", borderRadius: 6, border: "1px solid #3f3f46", backgroundColor: "#27272a", color: "#fff", fontSize: 14, outline: "none" },
  saveBtn: { width: "100%", padding: 12, marginTop: 8, backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 15 },
};