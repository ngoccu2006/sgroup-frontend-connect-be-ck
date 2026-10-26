import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classApi } from "../api/classes";
import { getUser } from "../api/client";
import { Calendar, ArrowRight, Plus, X, School, Search, BookmarkPlus, Check, FolderOpen, TriangleAlert } from "lucide-react";

export default function ClassList() {
  const user = getUser();
  const isMentorOrAdmin = ["MENTOR", "ADMIN"].includes(user?.role);

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  // UI state (lọc phía client)
  const [search, setSearch] = useState("");

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
      setForm({ name: "", description: "" });
      loadClasses(); // Reload lại danh sách
    } catch (err) {
      alert(err.message || "Tạo lớp học thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerText}>
        <style>{css}</style>
        <div className="cl-spinner" />
        Đang tải danh sách lớp học...
      </div>
    );
  }
  if (error) {
    return (
      <div style={styles.errorText}>
        <TriangleAlert size={18} style={{ flexShrink: 0 }} /> {error}
      </div>
    );
  }

  const keyword = search.trim().toLowerCase();
  const visibleClasses = classes.filter((c) =>
    !keyword || className(c).toLowerCase().includes(keyword) || (c.description || "").toLowerCase().includes(keyword)
  );

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Header trang */}
      <div style={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={styles.headerIcon}><School size={24} /></div>
          <div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <h2 style={styles.title}>Lớp học của bạn</h2>
              <span style={styles.countBadge}>{classes.length} lớp</span>
            </div>
            <p style={styles.subtitle}>Chọn một lớp để xem bài học, bài tập và tiến độ</p>
          </div>
        </div>

        {isMentorOrAdmin && (
          <button onClick={() => setShowModal(true)} className="cl-btn-primary" style={styles.createBtn}>
            <Plus size={16} /> Tạo Lớp Học Mới
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrap}>
          <Search size={16} style={styles.searchIcon} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm lớp học theo tên..."
            className="cl-input"
            style={{ ...styles.input, height: 38, paddingLeft: 36, backgroundColor: "#18181b" }}
          />
        </div>
        <span style={styles.metaCount}>
          <span style={styles.dot} /> Hiển thị {visibleClasses.length} lớp học
        </span>
      </div>

      {visibleClasses.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}><FolderOpen size={22} /></div>
          <div style={{ fontWeight: 500, color: "#e4e4e7" }}>
            {classes.length === 0 ? "Bạn chưa tham gia hoặc chưa có lớp học nào." : "Không tìm thấy lớp học phù hợp."}
          </div>
          {classes.length > 0 && <div style={{ fontSize: 12 }}>Thử tìm với từ khóa khác.</div>}
        </div>
      ) : (
        <div style={styles.grid}>
          {visibleClasses.map((c) => {
            const name = className(c);
            const hue = hashHue(name);
            return (
              <Link key={c.id} to={`/classes/${c.id}`} className="cl-card" style={styles.card}>
                <div style={{ ...styles.banner, background: `linear-gradient(90deg, hsl(${hue} 80% 55%), hsl(${(hue + 40) % 360} 75% 55%))` }} />
                <div style={styles.cardBody}>
                  <div
                    style={{
                      ...styles.initials,
                      color: `hsl(${hue} 85% 70%)`,
                      backgroundColor: `hsl(${hue} 80% 55% / 0.12)`,
                      borderColor: `hsl(${hue} 80% 55% / 0.35)`,
                    }}
                  >
                    {getInitials(name)}
                  </div>
                  <h3 className="cl-card-title cl-clamp-2" style={styles.cardTitle}>{name}</h3>
                  <p className="cl-clamp-3" style={styles.cardDesc}>{c.description || "Chưa có mô tả cho lớp học này."}</p>
                </div>
                <div style={styles.cardFooter}>
                  <span style={styles.dateInfo}>
                    <Calendar size={14} /> Bắt đầu: {c.created_at ? new Date(c.created_at).toLocaleDateString("vi-VN") : "N/A"}
                  </span>
                  <span className="cl-detail" style={styles.detailLink}>
                    Xem chi tiết <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Lớp Học */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className="cl-modal" style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={styles.modalIcon}><BookmarkPlus size={20} /></div>
                <div>
                  <h3 style={styles.modalTitle}>Tạo Lớp Học Mới</h3>
                  <p style={styles.modalSubtitle}>Tạo lớp học mới và thiết lập lộ trình giảng dạy</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="cl-btn-ghost" style={styles.closeBtn} title="Đóng">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div style={styles.modalBody}>
                <div style={styles.field}>
                  <label style={styles.label}>Tên Lớp Học <span style={styles.req}>*</span></label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ví dụ: Lập trình ReactJS Thực Chiến"
                    className="cl-input"
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.field, marginBottom: 0 }}>
                  <label style={styles.label}>Mô Tả Lớp Học</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả ngắn gọn về khóa học/lớp học..."
                    className="cl-input"
                    style={{ ...styles.input, ...styles.textarea }}
                  />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className="cl-btn-ghost" style={styles.cancelBtn}>Hủy</button>
                <button disabled={submitting} type="submit" className="cl-btn-primary" style={styles.saveBtn}>
                  {submitting ? <div className="cl-spinner cl-spinner-sm" /> : <Check size={16} />}
                  {submitting ? "Đang tạo..." : "Tạo Lớp Học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// API (bảng classes) trả `name`, form cũ dùng `title` -> hiển thị cả hai
const className = (c) => c.title || c.name || "Lớp học chưa đặt tên";

const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w[0]))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "LH";

// Màu banner ổn định theo tên lớp
const hashHue = (str) => {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
};

// Hover / focus / animation không làm được bằng inline style
const css = `
  .cl-card { transition: transform .2s, border-color .2s, box-shadow .2s; }
  .cl-card:hover { transform: translateY(-2px); border-color: #3f3f46 !important; box-shadow: 0 16px 32px rgba(0,0,0,0.4); }
  .cl-card-title { transition: color .15s; }
  .cl-card:hover .cl-card-title { color: #60a5fa; }
  .cl-detail { transition: transform .15s; }
  .cl-card:hover .cl-detail { transform: translateX(2px); }
  .cl-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cl-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .cl-btn-primary { transition: background-color .15s, transform .1s; }
  .cl-btn-primary:hover:not(:disabled) { background-color: #3b82f6 !important; }
  .cl-btn-primary:active:not(:disabled) { transform: scale(0.98); }
  .cl-btn-ghost:hover { color: #f4f4f5 !important; background-color: #27272a !important; }
  .cl-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 1px #3b82f6; }
  .cl-input::placeholder { color: #71717a; }
  .cl-modal { animation: cl-pop .18s ease-out; }
  @keyframes cl-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  .cl-spinner { width: 28px; height: 28px; margin: 0 auto 12px; border: 3px solid #27272a; border-top-color: #3b82f6; border-radius: 50%; animation: cl-spin .8s linear infinite; }
  .cl-spinner-sm { width: 14px; height: 14px; margin: 0; border-width: 2px; border-color: rgba(255,255,255,0.3); border-top-color: #fff; }
  @keyframes cl-spin { to { transform: rotate(360deg); } }
`;

const styles = {
  page: { fontFamily: "Inter, system-ui, sans-serif" },
  centerText: { textAlign: "center", padding: 60, color: "#a1a1aa", fontSize: 14 },
  errorText: { display: "flex", alignItems: "center", gap: 10, color: "#fda4af", padding: 16, backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 12, fontSize: 14 },

  pageHeader: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, paddingBottom: 24, borderBottom: "1px solid #27272a" },
  headerIcon: { width: 48, height: 48, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", background: "linear-gradient(135deg, rgba(59,130,246,0.3), #27272a)", border: "1px solid rgba(59,130,246,0.3)", boxShadow: "0 8px 20px rgba(59,130,246,0.1)" },
  title: { margin: 0, color: "#f4f4f5", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" },
  countBadge: { padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500, color: "#34d399", backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" },
  subtitle: { margin: "4px 0 0", color: "#a1a1aa", fontSize: 13 },
  createBtn: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13, boxShadow: "0 8px 20px rgba(37,99,235,0.25)" },

  toolbar: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, margin: "24px 0" },
  searchWrap: { position: "relative", flex: "1 1 260px", maxWidth: 340 },
  searchIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#71717a", pointerEvents: "none" },
  metaCount: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#a1a1aa" },
  dot: { width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3b82f6" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 },
  card: { display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", textDecoration: "none", backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12 },
  banner: { height: 6, width: "100%" },
  cardBody: { padding: 20, flex: 1 },
  initials: { width: 38, height: 38, marginBottom: 14, borderRadius: 10, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: "#f4f4f5", letterSpacing: "-0.01em" },
  cardDesc: { margin: "8px 0 0", color: "#a1a1aa", fontSize: 13, lineHeight: 1.6 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "14px 20px", borderTop: "1px solid #27272a", backgroundColor: "rgba(14,14,17,0.6)" },
  dateInfo: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#a1a1aa" },
  detailLink: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: "#60a5fa" },

  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "48px 16px", textAlign: "center", color: "#a1a1aa", fontSize: 13, borderRadius: 12, border: "2px dashed rgba(63,63,70,0.6)", backgroundColor: "rgba(24,24,27,0.3)" },
  emptyIcon: { width: 48, height: 48, marginBottom: 4, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#71717a", backgroundColor: "#1f1f22", border: "1px solid #27272a" },

  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16, zIndex: 1000 },
  modalContent: { width: "100%", maxWidth: 500, backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 16, color: "#f4f4f5", overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.7)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #27272a", backgroundColor: "#1b1b1e" },
  modalIcon: { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", backgroundColor: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" },
  modalTitle: { margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" },
  modalSubtitle: { margin: "2px 0 0", fontSize: 12, color: "#a1a1aa" },
  closeBtn: { display: "flex", padding: 6, border: "none", borderRadius: 8, backgroundColor: "transparent", color: "#a1a1aa", cursor: "pointer" },
  modalBody: { padding: 24 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 12, padding: "14px 24px", borderTop: "1px solid #27272a", backgroundColor: "#141416" },

  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 500, color: "#f4f4f5" },
  req: { color: "#f43f5e" },
  input: { width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid #27272a", backgroundColor: "#0e0e11", color: "#f4f4f5", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" },
  textarea: { resize: "vertical", lineHeight: 1.6, minHeight: 96 },
  saveBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 8px 20px rgba(37,99,235,0.25)" },
  cancelBtn: { padding: "9px 16px", backgroundColor: "transparent", color: "#a1a1aa", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer" },
};
