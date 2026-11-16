import { useEffect, useState } from "react";
import { classApi } from "../api/classes";
import { userApi } from "../api/users";
import { getUser, fetchAll } from "../api/client";
import { BookmarkPlus, PencilLine, X, Check, UserCheck, ChevronDown, AlertTriangle } from "lucide-react";

/**
 * Modal tạo / sửa lớp học
 *  - initial: null => tạo mới; object class => sửa (PUT /classes/:id, phải gửi đủ mọi field)
 *  - mentors: danh sách mentor (Admin); nếu không truyền, modal tự tải khi user là Admin
 *  - onSaved(savedClass), onClose()
 */
export default function ClassFormModal({ initial, mentors: mentorsProp, onSaved, onClose }) {
  const user = getUser();
  const isAdmin = user?.role === "ADMIN";
  const isEdit = Boolean(initial?.id);

  const [form, setForm] = useState(() => ({
    name: initial?.name || "",
    description: initial?.description || "",
    mentor_id: initial?.mentor_id || "",
    start_date: toInputDate(initial?.start_date),
    end_date: toInputDate(initial?.end_date),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [mentorsLoaded, setMentorsLoaded] = useState([]);
  useEffect(() => {
    if (!isAdmin || mentorsProp) return;
    fetchAll((p) => userApi.getAll({ ...p, role: "MENTOR", sortBy: "full_name", sortOrder: "ASC" }))
      .then(setMentorsLoaded)
      .catch(() => setMentorsLoaded([]));
  }, [isAdmin, mentorsProp]);
  const mentors = mentorsProp || mentorsLoaded;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Tên lớp học không được để trống.");
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      return setError("Ngày kết thúc phải sau ngày bắt đầu.");
    }
    // Admin chọn mentor; Mentor: tạo mới -> chính mình, sửa -> giữ nguyên mentor hiện tại
    const mentorId = isAdmin ? form.mentor_id : isEdit ? initial.mentor_id : user?.id;
    if (!mentorId) return setError("Vui lòng chọn mentor phụ trách lớp.");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      mentor_id: mentorId,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };

    setSaving(true);
    setError("");
    try {
      const { data } = isEdit ? await classApi.update(initial.id, payload) : await classApi.create(payload);
      onSaved?.(data || { ...initial, ...payload });
    } catch (err) {
      setError(err.message || (isEdit ? "Cập nhật lớp học thất bại" : "Tạo lớp học thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const currentMentorMissing = isAdmin && form.mentor_id && !mentors.some((m) => m.id === form.mentor_id);

  return (
    <div style={styles.overlay} onClick={() => !saving && onClose()}>
      <style>{css}</style>
      <div className="cf-modal" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={styles.headerIcon}>{isEdit ? <PencilLine size={20} /> : <BookmarkPlus size={20} />}</div>
            <div>
              <h3 style={styles.title}>{isEdit ? "Chỉnh sửa lớp học" : "Tạo Lớp Học Mới"}</h3>
              <p style={styles.subtitle}>
                {isEdit ? "Cập nhật thông tin, thời gian và mentor phụ trách" : "Tạo lớp học mới và phân công mentor phụ trách"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="cf-ghost" style={styles.closeBtn} title="Đóng"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.body}>
            {error && (
              <div style={styles.error}><AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}</div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Tên Lớp Học <span style={styles.req}>*</span></label>
              <input
                required
                value={form.name}
                onChange={set("name")}
                placeholder="Ví dụ: Lập trình ReactJS Thực Chiến"
                className="cf-input"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Mentor phụ trách {isAdmin && <span style={styles.req}>*</span>}</label>
              {isAdmin ? (
                <>
                  <div style={{ position: "relative" }}>
                    <UserCheck size={16} style={styles.icon} />
                    <select
                      required
                      value={form.mentor_id}
                      onChange={set("mentor_id")}
                      className="cf-input"
                      style={{ ...styles.input, paddingLeft: 36, paddingRight: 36, appearance: "none", colorScheme: "dark", cursor: "pointer" }}
                    >
                      <option value="">— Chọn mentor —</option>
                      {currentMentorMissing && <option value={form.mentor_id}>Mentor hiện tại (không còn role MENTOR)</option>}
                      {mentors.map((m) => (
                        <option key={m.id} value={m.id}>{m.full_name || m.email} ({m.email})</option>
                      ))}
                    </select>
                    <ChevronDown size={16} style={{ ...styles.icon, left: "auto", right: 12 }} />
                  </div>
                  <span style={styles.hint}>
                    {mentors.length === 0
                      ? "Chưa có tài khoản MENTOR nào — hãy tạo ở trang Quản lý người dùng."
                      : "Chỉ mentor được phân công (và Admin) mới quản lý được lớp này."}
                  </span>
                </>
              ) : (
                <div style={styles.selfMentor}>
                  <UserCheck size={16} />
                  {isEdit ? "Bạn là mentor phụ trách lớp này (chỉ Admin mới đổi được mentor)" : `Bạn (${user?.full_name || user?.email}) sẽ là mentor phụ trách lớp này`}
                </div>
              )}
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.field, flex: "1 1 160px" }}>
                <label style={styles.label}>Ngày bắt đầu</label>
                <input type="date" value={form.start_date} onChange={set("start_date")} className="cf-input" style={{ ...styles.input, colorScheme: "dark" }} />
              </div>
              <div style={{ ...styles.field, flex: "1 1 160px" }}>
                <label style={styles.label}>Ngày kết thúc</label>
                <input type="date" min={form.start_date || undefined} value={form.end_date} onChange={set("end_date")} className="cf-input" style={{ ...styles.input, colorScheme: "dark" }} />
              </div>
            </div>

            <div style={{ ...styles.field, marginBottom: 0 }}>
              <label style={styles.label}>Mô Tả Lớp Học</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={set("description")}
                placeholder="Mô tả ngắn gọn về khóa học/lớp học..."
                className="cf-input"
                style={{ ...styles.input, resize: "vertical", lineHeight: 1.6, minHeight: 96 }}
              />
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} className="cf-ghost" style={styles.cancelBtn}>Hủy</button>
            <button disabled={saving} type="submit" className="cf-primary" style={styles.saveBtn}>
              {saving ? <div className="cf-spinner" /> : <Check size={16} />}
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo Lớp Học"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// DATE của Postgres về FE dạng ISO (có thể lệch múi giờ) -> lấy ngày theo giờ địa phương cho <input type="date">
function toInputDate(v) {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (isNaN(d)) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const css = `
  .cf-modal { animation: cf-pop .18s ease-out; }
  @keyframes cf-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  .cf-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 1px #3b82f6; }
  .cf-input::placeholder { color: #71717a; }
  .cf-ghost:hover { color: #f4f4f5 !important; background-color: #27272a !important; }
  .cf-primary { transition: background-color .15s, transform .1s; }
  .cf-primary:hover:not(:disabled) { background-color: #3b82f6 !important; }
  .cf-primary:active:not(:disabled) { transform: scale(0.98); }
  .cf-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: cf-spin .8s linear infinite; }
  @keyframes cf-spin { to { transform: rotate(360deg); } }
`;

const styles = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16, zIndex: 1000, fontFamily: "Inter, system-ui, sans-serif" },
  modal: { width: "100%", maxWidth: 540, maxHeight: "92vh", overflowY: "auto", backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 16, color: "#f4f4f5", boxShadow: "0 25px 50px rgba(0,0,0,0.7)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #27272a", backgroundColor: "#1b1b1e" },
  headerIcon: { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" },
  title: { margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" },
  subtitle: { margin: "2px 0 0", fontSize: 12, color: "#a1a1aa" },
  closeBtn: { display: "flex", padding: 6, border: "none", borderRadius: 8, backgroundColor: "transparent", color: "#a1a1aa", cursor: "pointer" },
  body: { padding: 24 },
  footer: { display: "flex", justifyContent: "flex-end", gap: 12, padding: "14px 24px", borderTop: "1px solid #27272a", backgroundColor: "#141416" },
  error: { display: "flex", alignItems: "center", gap: 8, padding: 12, marginBottom: 16, borderRadius: 10, fontSize: 13, color: "#fda4af", backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)" },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  row: { display: "flex", flexWrap: "wrap", gap: 12 },
  label: { fontSize: 12, fontWeight: 600, color: "#f4f4f5" },
  req: { color: "#f43f5e" },
  hint: { fontSize: 11, color: "#71717a" },
  icon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#71717a", pointerEvents: "none" },
  input: { width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#f4f4f5", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" },
  selfMentor: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, fontSize: 13, color: "#6ee7b7", backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" },
  cancelBtn: { padding: "9px 16px", backgroundColor: "transparent", color: "#a1a1aa", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  saveBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 8px 20px rgba(37,99,235,0.3)" },
};
