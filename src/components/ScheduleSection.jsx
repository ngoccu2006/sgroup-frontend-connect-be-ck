import { useCallback, useEffect, useMemo, useState } from "react";
import { scheduleApi } from "../api/schedules";
import { lessonApi } from "../api/lessons";
import { EMPTY_PAGINATION, fetchAll } from "../api/client";
import Pagination from "./Pagination";
import {
  CalendarDays, CalendarPlus, CalendarCog, Plus, Pencil, Trash2, Clock, MapPin, BookOpen, StickyNote, X, Check,
  ArrowDownNarrowWide, ArrowUpNarrowWide, AlertTriangle, CalendarX2, Radio,
} from "lucide-react";

const EMPTY_FORM = { lesson_id: "", title: "", session_date: "", start_time: "", end_time: "", location: "", note: "" };

/**
 * Lịch học của lớp (API /schedules)
 * props: classId, canManage (MENTOR/ADMIN – BE sẽ chặn nếu mentor không phụ trách lớp), onChanged()
 */
export default function ScheduleSection({ classId, canManage }) {
  const [schedules, setSchedules] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [query, setQuery] = useState({ page: 1, limit: 5, sortOrder: "ASC" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lessons, setLessons] = useState([]);

  // Modal
  const [editing, setEditing] = useState(null); // null = đóng, {} = tạo mới, {...schedule} = sửa
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(() => {
    return scheduleApi.getByClass(classId, { page: query.page, limit: query.limit, sortBy: "session_date", sortOrder: query.sortOrder })
      .then(({ data, pagination: pg }) => {
        setSchedules(data || []);
        setPagination(pg || { ...EMPTY_PAGINATION, totalItems: (data || []).length, totalPages: 1 });
        setError("");
      })
      .catch((e) => setError(e.status === 403 ? "Bạn không thuộc lớp này nên không xem được lịch học." : e.message || "Không tải được lịch học"))
      .finally(() => setLoading(false));
  }, [classId, query]);

  useEffect(() => {
    load();
  }, [load]);

  // Danh sách bài học để gắn vào buổi học + hiển thị tên bài
  useEffect(() => {
    fetchAll((p) => lessonApi.getByClass(classId, { ...p, sortBy: "order", sortOrder: "ASC" }))
      .then(setLessons)
      .catch(() => setLessons([]));
  }, [classId]);

  const lessonMap = useMemo(() => Object.fromEntries(lessons.map((l) => [l.id, l])), [lessons]);

  // Gom các buổi theo ngày (giữ thứ tự server trả về)
  const groups = useMemo(() => {
    const out = [];
    for (const s of schedules) {
      const last = out[out.length - 1];
      if (last && last.date === s.session_date) last.items.push(s);
      else out.push({ date: s.session_date, items: [s] });
    }
    for (const g of out) g.items.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return out;
  }, [schedules]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditing({});
  };

  const openEdit = (s) => {
    setForm({
      lesson_id: s.lesson_id || "",
      title: s.title || "",
      session_date: s.session_date,
      start_time: hhmm(s.start_time),
      end_time: hhmm(s.end_time),
      location: s.location || "",
      note: s.note || "",
    });
    setFormError("");
    setEditing(s);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() && !form.lesson_id) return setFormError("Nhập tiêu đề hoặc chọn bài học.");
    if (form.end_time <= form.start_time) return setFormError("Giờ kết thúc phải sau giờ bắt đầu.");

    const payload = {
      lesson_id: form.lesson_id || null,
      // Để trống tiêu đề khi có bài học -> BE tự lấy tên bài học
      title: form.title.trim() || undefined,
      session_date: form.session_date,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location.trim() || null,
      note: form.note.trim() || null,
    };

    setSaving(true);
    setFormError("");
    try {
      if (editing?.id) {
        await scheduleApi.update(editing.id, payload);
      } else {
        await scheduleApi.create(classId, payload);
      }
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err.message || "Lưu lịch học thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Xoá buổi học "${s.title}" ngày ${fmtDateShort(s.session_date)}?`)) return;
    setDeletingId(s.id);
    try {
      await scheduleApi.remove(s.id);
      // Xoá phần tử cuối của trang -> lùi về trang trước
      if (schedules.length === 1 && query.page > 1) setQuery((q) => ({ ...q, page: q.page - 1 }));
      else await load();
    } catch (err) {
      alert(err.message || "Xoá lịch học thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSort = () => setQuery((q) => ({ ...q, page: 1, sortOrder: q.sortOrder === "ASC" ? "DESC" : "ASC" }));

  return (
    <section style={styles.box}>
      <style>{css}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.headerIcon}><CalendarDays size={18} /></div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={styles.title}>Lịch học</h3>
              <span style={styles.countBadge}>{pagination.totalItems}</span>
            </div>
            <p style={styles.subtitle}>Thời khoá biểu các buổi học của lớp</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" onClick={toggleSort} className="sc-ghost-btn" style={styles.ghostBtn} title="Đổi thứ tự sắp xếp">
            {query.sortOrder === "ASC" ? <ArrowDownNarrowWide size={14} /> : <ArrowUpNarrowWide size={14} />}
            {query.sortOrder === "ASC" ? "Sớm → muộn" : "Muộn → sớm"}
          </button>
          {canManage && (
            <button type="button" onClick={openCreate} className="sc-btn-primary" style={styles.addBtn}>
              <Plus size={14} /> Buổi học
            </button>
          )}
        </div>
      </div>

      {/* Nội dung */}
      {loading ? (
        <div style={styles.center}><div className="sc-spinner" /> Đang tải lịch học...</div>
      ) : error ? (
        <div style={styles.error}><AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}</div>
      ) : groups.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}><CalendarX2 size={20} /></div>
          <p style={{ margin: 0, fontSize: 13, color: "#a1a1aa" }}>Lớp học chưa có lịch học nào.</p>
          {canManage && (
            <button type="button" onClick={openCreate} className="sc-ghost-btn" style={{ ...styles.ghostBtn, marginTop: 4 }}>
              <CalendarPlus size={14} /> Tạo buổi học đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div style={styles.groups}>
          {groups.map((g) => {
            const d = parseDate(g.date);
            const isToday = sameDay(d, new Date());
            return (
              <div key={g.date} className="sc-group" style={styles.group}>
                {/* Ô ngày */}
                <div style={{ ...styles.dateTile, ...(isToday ? styles.dateTileToday : {}) }}>
                  <span style={styles.dateWeekday}>{WEEKDAYS[d.getDay()]}</span>
                  <span style={styles.dateDay}>{d.getDate()}</span>
                  <span style={styles.dateMonth}>Th{d.getMonth() + 1}/{d.getFullYear()}</span>
                </div>

                {/* Các buổi trong ngày */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {g.items.map((s) => {
                    const st = sessionStatus(s);
                    const lesson = s.lesson_id ? lessonMap[s.lesson_id] : null;
                    return (
                      <div key={s.id} className="sc-item" style={{ ...styles.item, ...(st.key === "past" ? styles.itemPast : {}), borderLeftColor: st.color }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={styles.itemTop}>
                            <span style={styles.time}>
                              <Clock size={13} /> {hhmm(s.start_time)} – {hhmm(s.end_time)}
                              <span style={styles.duration}>({fmtDuration(s.start_time, s.end_time)})</span>
                            </span>
                            <span style={{ ...styles.status, color: st.color, backgroundColor: `${st.color}1a`, borderColor: `${st.color}4d` }}>
                              {st.key === "live" ? <Radio size={11} className="sc-live" /> : <span style={{ ...styles.dot, backgroundColor: st.color }} />}
                              {st.label}
                            </span>
                          </div>
                          <h4 className="sc-item-title" style={styles.itemTitle}>{s.title}</h4>
                          <div style={styles.metaRow}>
                            {s.lesson_id && (
                              <span style={{ ...styles.meta, color: "#93c5fd" }}>
                                <BookOpen size={12} /> {lesson ? `Bài ${lesson.order ?? ""}: ${lesson.title}` : "Bài học đã gắn"}
                              </span>
                            )}
                            {s.location && (
                              <span style={styles.meta}>
                                <MapPin size={12} />
                                {/^https?:\/\//.test(s.location) ? (
                                  <a href={s.location} target="_blank" rel="noreferrer" className="sc-link" style={styles.link}>{s.location.replace(/^https?:\/\//, "")}</a>
                                ) : s.location}
                              </span>
                            )}
                          </div>
                          {s.note && (
                            <div style={styles.note}><StickyNote size={12} style={{ flexShrink: 0, marginTop: 2 }} /> {s.note}</div>
                          )}
                        </div>

                        {canManage && (
                          <div style={styles.actions}>
                            <button type="button" onClick={() => openEdit(s)} className="sc-icon-btn" style={styles.iconBtn} title="Sửa buổi học">
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s)}
                              disabled={deletingId === s.id}
                              className="sc-icon-btn sc-icon-danger"
                              style={styles.iconBtn}
                              title="Xoá buổi học"
                            >
                              {deletingId === s.id ? <div className="sc-spinner sc-spinner-sm" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!error && (
        <Pagination
          pagination={pagination}
          onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
          onLimitChange={(limit) => setQuery((q) => ({ ...q, limit, page: 1 }))}
          limitOptions={[5, 10, 20]}
          itemLabel="buổi học"
          compact
        />
      )}

      {/* Modal tạo / sửa */}
      {editing && (
        <div style={styles.overlay} onClick={() => !saving && setEditing(null)}>
          <div className="sc-modal" style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={styles.modalIcon}>{editing.id ? <CalendarCog size={20} /> : <CalendarPlus size={20} />}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editing.id ? "Sửa buổi học" : "Thêm buổi học"}</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#a1a1aa" }}>Hệ thống sẽ chặn nếu trùng giờ với buổi khác trong lớp</p>
                </div>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="sc-icon-btn" style={styles.iconBtn} title="Đóng"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave}>
              <div style={styles.modalBody}>
                {formError && (
                  <div style={{ ...styles.error, marginBottom: 16 }}><AlertTriangle size={16} style={{ flexShrink: 0 }} /> {formError}</div>
                )}

                <div style={styles.field}>
                  <label style={styles.label}>Gắn với bài học</label>
                  <div style={{ position: "relative" }}>
                    <BookOpen size={16} style={styles.inputIcon} />
                    <select
                      value={form.lesson_id}
                      onChange={(e) => setForm({ ...form, lesson_id: e.target.value })}
                      className="sc-input"
                      style={{ ...styles.input, paddingLeft: 36, colorScheme: "dark" }}
                    >
                      <option value="">— Không gắn bài học —</option>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>Bài {l.order}: {l.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Tiêu đề buổi học {!form.lesson_id && <span style={styles.req}>*</span>}
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={form.lesson_id ? "Để trống sẽ dùng tên bài học" : "Ví dụ: Buổi 3 - Thực hành REST API"}
                    className="sc-input"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldRow}>
                  <div style={{ ...styles.field, flex: "1 1 160px" }}>
                    <label style={styles.label}>Ngày học <span style={styles.req}>*</span></label>
                    <input
                      required
                      type="date"
                      value={form.session_date}
                      onChange={(e) => setForm({ ...form, session_date: e.target.value })}
                      className="sc-input"
                      style={{ ...styles.input, colorScheme: "dark" }}
                    />
                  </div>
                  <div style={{ ...styles.field, flex: "1 1 110px" }}>
                    <label style={styles.label}>Bắt đầu <span style={styles.req}>*</span></label>
                    <input
                      required
                      type="time"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      className="sc-input"
                      style={{ ...styles.input, colorScheme: "dark" }}
                    />
                  </div>
                  <div style={{ ...styles.field, flex: "1 1 110px" }}>
                    <label style={styles.label}>Kết thúc <span style={styles.req}>*</span></label>
                    <input
                      required
                      type="time"
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                      className="sc-input"
                      style={{ ...styles.input, colorScheme: "dark" }}
                    />
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Địa điểm / Link học online</label>
                  <div style={{ position: "relative" }}>
                    <MapPin size={16} style={styles.inputIcon} />
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Phòng 302 hoặc https://meet.google.com/..."
                      className="sc-input"
                      style={{ ...styles.input, paddingLeft: 36 }}
                    />
                  </div>
                </div>

                <div style={{ ...styles.field, marginBottom: 0 }}>
                  <label style={styles.label}>Ghi chú</label>
                  <textarea
                    rows={3}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Chuẩn bị trước, tài liệu mang theo..."
                    className="sc-input"
                    style={{ ...styles.input, resize: "vertical", lineHeight: 1.6 }}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setEditing(null)} className="sc-ghost-btn" style={{ ...styles.ghostBtn, border: "none" }}>Huỷ</button>
                <button type="submit" disabled={saving} className="sc-btn-primary" style={styles.saveBtn}>
                  {saving ? <div className="sc-spinner sc-spinner-sm sc-spinner-white" /> : <Check size={16} />}
                  {saving ? "Đang lưu..." : editing.id ? "Lưu thay đổi" : "Tạo buổi học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

// ===== Helpers ngày giờ =====
const WEEKDAYS = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

// "2026-11-15" -> Date theo giờ địa phương (tránh lệch múi giờ của new Date("YYYY-MM-DD"))
const parseDate = (s) => {
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};
const atTime = (dateStr, time) => {
  const d = parseDate(dateStr);
  const [h, m] = String(time).split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const hhmm = (t) => String(t || "").slice(0, 5);
const fmtDateShort = (s) => parseDate(s).toLocaleDateString("vi-VN");
const fmtDuration = (start, end) => {
  const [h1, m1] = hhmm(start).split(":").map(Number);
  const [h2, m2] = hhmm(end).split(":").map(Number);
  const mins = h2 * 60 + m2 - (h1 * 60 + m1);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h${m ? ` ${m}p` : ""}` : `${m} phút`;
};

function sessionStatus(s) {
  const now = new Date();
  const start = atTime(s.session_date, s.start_time);
  const end = atTime(s.session_date, s.end_time);
  if (now >= start && now <= end) return { key: "live", label: "Đang diễn ra", color: "#f43f5e" };
  if (now > end) return { key: "past", label: "Đã kết thúc", color: "#71717a" };
  if (sameDay(start, now)) return { key: "today", label: "Hôm nay", color: "#fbbf24" };
  const days = Math.ceil((parseDate(s.session_date) - parseDate(toISODate(now))) / 86400000);
  return { key: "upcoming", label: days === 1 ? "Ngày mai" : `Còn ${days} ngày`, color: "#34d399" };
}
const toISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const css = `
  .sc-item { transition: background-color .15s, border-color .15s; }
  .sc-item:hover { background-color: #202024 !important; }
  .sc-item:hover .sc-item-title { color: #c4b5fd; }
  .sc-item-title { transition: color .15s; }
  .sc-btn-primary { transition: background-color .15s, transform .1s; }
  .sc-btn-primary:hover:not(:disabled) { background-color: #8b5cf6 !important; }
  .sc-btn-primary:active:not(:disabled) { transform: scale(0.97); }
  .sc-ghost-btn:hover { color: #f4f4f5 !important; background-color: #27272a !important; }
  .sc-icon-btn:hover:not(:disabled) { color: #f4f4f5 !important; background-color: #27272a !important; }
  .sc-icon-danger:hover:not(:disabled) { color: #fb7185 !important; background-color: rgba(244,63,94,0.12) !important; }
  .sc-input:focus { border-color: #8b5cf6 !important; box-shadow: 0 0 0 1px #8b5cf6; }
  .sc-input::placeholder { color: #71717a; }
  .sc-link:hover { text-decoration: underline; }
  .sc-modal { animation: sc-pop .18s ease-out; }
  @keyframes sc-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  .sc-live { animation: sc-blink 1.2s ease-in-out infinite; }
  @keyframes sc-blink { 50% { opacity: .3; } }
  .sc-spinner { width: 16px; height: 16px; border: 2px solid #27272a; border-top-color: #8b5cf6; border-radius: 50%; animation: sc-spin .8s linear infinite; }
  .sc-spinner-sm { width: 13px; height: 13px; }
  .sc-spinner-white { border-color: rgba(255,255,255,0.3); border-top-color: #fff; }
  @keyframes sc-spin { to { transform: rotate(360deg); } }
  @media (max-width: 560px) { .sc-group { flex-direction: column; } }
`;

const VIOLET = "#a78bfa";
const styles = {
  box: { display: "flex", flexDirection: "column", gap: 16, backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", fontFamily: "Inter, system-ui, sans-serif" },
  header: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #27272a" },
  headerIcon: { width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: VIOLET, backgroundColor: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" },
  title: { margin: 0, fontSize: 15, fontWeight: 700, color: "#f4f4f5", letterSpacing: "-0.01em" },
  subtitle: { margin: "2px 0 0", fontSize: 11, color: "#a1a1aa" },
  countBadge: { padding: "1px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: VIOLET, backgroundColor: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" },
  addBtn: { display: "inline-flex", alignItems: "center", gap: 4, backgroundColor: "#7c3aed", color: "#fff", border: "none", padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12, boxShadow: "0 4px 12px rgba(124,58,237,0.3)" },
  ghostBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, border: "1px solid #27272a", backgroundColor: "transparent", color: "#a1a1aa", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },

  center: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, color: "#a1a1aa", fontSize: 13 },
  error: { display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, fontSize: 13, color: "#fda4af", backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "28px 16px", textAlign: "center", borderRadius: 12, border: "1px dashed #27272a", backgroundColor: "rgba(24,24,27,0.5)" },
  emptyIcon: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#71717a", backgroundColor: "#202024" },

  groups: { display: "flex", flexDirection: "column", gap: 16 },
  group: { display: "flex", gap: 14, alignItems: "flex-start" },
  dateTile: { width: 72, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px", borderRadius: 12, backgroundColor: "#202024", border: "1px solid #27272a" },
  dateTileToday: { backgroundColor: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.45)" },
  dateWeekday: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: VIOLET },
  dateDay: { fontSize: 24, fontWeight: 800, lineHeight: 1.2, color: "#f4f4f5" },
  dateMonth: { fontSize: 10, color: "#a1a1aa" },

  item: { display: "flex", gap: 12, padding: "12px 14px", borderRadius: 12, backgroundColor: "rgba(32,32,36,0.6)", border: "1px solid #27272a", borderLeft: "3px solid" },
  itemPast: { opacity: 0.6 },
  itemTop: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 },
  time: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#e4e4e7" },
  duration: { fontSize: 11, fontWeight: 400, color: "#71717a" },
  status: { display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, border: "1px solid", fontSize: 11, fontWeight: 600 },
  dot: { width: 6, height: 6, borderRadius: "50%" },
  itemTitle: { margin: "6px 0 0", fontSize: 14, fontWeight: 600, color: "#f4f4f5" },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6 },
  meta: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#a1a1aa", minWidth: 0 },
  link: { color: "#60a5fa", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 },
  note: { display: "flex", gap: 6, marginTop: 8, padding: "6px 10px", borderRadius: 8, fontSize: 12, lineHeight: 1.5, color: "#d4d4d8", backgroundColor: "#121215", border: "1px solid #27272a", whiteSpace: "pre-wrap" },
  actions: { display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 },
  iconBtn: { display: "flex", alignItems: "center", justifyContent: "center", padding: 6, border: "none", borderRadius: 8, backgroundColor: "transparent", color: "#a1a1aa", cursor: "pointer" },

  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16, zIndex: 1000 },
  modal: { width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 16, color: "#f4f4f5", boxShadow: "0 25px 50px rgba(0,0,0,0.7)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #27272a", backgroundColor: "#1b1b1e" },
  modalIcon: { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: VIOLET, backgroundColor: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" },
  modalBody: { padding: 24 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 12, padding: "14px 24px", borderTop: "1px solid #27272a", backgroundColor: "#141416" },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  fieldRow: { display: "flex", flexWrap: "wrap", gap: 12 },
  label: { fontSize: 12, fontWeight: 600, color: "#f4f4f5" },
  req: { color: "#f43f5e" },
  input: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#f4f4f5", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" },
  inputIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#71717a", pointerEvents: "none" },
  saveBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", backgroundColor: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 8px 20px rgba(124,58,237,0.3)" },
};
