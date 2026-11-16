import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classApi } from "../api/classes";
import { userApi } from "../api/users";
import { getUser, parseSort, fetchAll, EMPTY_PAGINATION } from "../api/client";
import Pagination, { SortSelect } from "../components/Pagination";
import ClassFormModal from "../components/ClassFormModal";
import { Calendar, ArrowRight, Plus, School, Search, FolderOpen, TriangleAlert, ArrowUpDown,
  UserCheck, UserX, Pencil, Trash2,
} from "lucide-react";

const SORT_OPTIONS = [
  { value: "created_at:DESC", label: "Mới tạo gần đây" },
  { value: "created_at:ASC", label: "Cũ nhất" },
  { value: "name:ASC", label: "Tên A → Z" },
  { value: "name:DESC", label: "Tên Z → A" },
  { value: "updated_at:DESC", label: "Mới cập nhật" },
];

export default function ClassList() {
  const user = getUser();
  const isMentorOrAdmin = ["MENTOR", "ADMIN"].includes(user?.role);
  const isAdmin = user?.role === "ADMIN";

  const [classes, setClasses] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [query, setQuery] = useState({ page: 1, limit: 9, sort: "created_at:DESC" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal: undefined = đóng, null = tạo mới, object = sửa lớp đó
  const [editingClass, setEditingClass] = useState(undefined);
  const [deletingId, setDeletingId] = useState(null);

  // Mentor chỉ sửa/xoá được lớp mình phụ trách; Admin sửa/xoá mọi lớp
  const canManage = (c) => isAdmin || (user?.role === "MENTOR" && c.mentor_id === user?.id);

  // Danh sách mentor (chỉ Admin gọi được GET /users) để phân công + hiển thị tên trên thẻ lớp
  const [mentors, setMentors] = useState([]);
  useEffect(() => {
    if (!isAdmin) return;
    fetchAll((p) => userApi.getAll({ ...p, role: "MENTOR", sortBy: "full_name", sortOrder: "ASC" }))
      .then((users) => setMentors(users.filter((u) => u.role === "MENTOR")))
      .catch(() => setMentors([]));
  }, [isAdmin]);
  const mentorName = (id) => {
    if (!id) return null;
    if (id === user?.id) return "Bạn";
    const m = mentors.find((u) => u.id === id);
    return m ? m.full_name || m.email : isAdmin ? "Mentor không xác định" : "Đã phân công";
  };

  // Tìm kiếm phía server (?q=), debounce 400ms
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery((q) => (q.q === search.trim() ? q : { ...q, q: search.trim(), page: 1 }));
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadClasses = useCallback(() => {
    return classApi.getAll({ page: query.page, limit: query.limit, q: query.q, ...parseSort(query.sort) })
      .then(({ data, pagination: pg }) => {
        setClasses(data || []);
        setPagination(pg || { ...EMPTY_PAGINATION, totalItems: (data || []).length, totalPages: 1 });
      })
      .catch((e) => setError(e.message || "Lỗi tải danh sách lớp học"))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleSaved = (saved) => {
    const isEdit = Boolean(editingClass?.id);
    setEditingClass(undefined);
    alert(isEdit ? `Đã cập nhật lớp "${className(saved)}"!` : "Tạo lớp học mới thành công!");
    loadClasses();
  };

  const handleDelete = async (c) => {
    const ok = window.confirm(
      `Xoá lớp "${className(c)}"?\n\nToàn bộ dữ liệu của lớp (bài học, bài tập, lịch học, học viên...) có thể bị xoá theo. Thao tác này không thể hoàn tác.`
    );
    if (!ok) return;
    setDeletingId(c.id);
    try {
      await classApi.remove(c.id);
      // Xoá phần tử cuối cùng của trang -> lùi về trang trước
      if (classes.length === 1 && query.page > 1) setQuery((q) => ({ ...q, page: q.page - 1 }));
      else await loadClasses();
    } catch (err) {
      alert(err.message || "Xoá lớp học thất bại (lớp có thể còn dữ liệu liên quan)");
    } finally {
      setDeletingId(null);
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

  const visibleClasses = classes;

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
              <span style={styles.countBadge}>{pagination.totalItems} lớp</span>
            </div>
            <p style={styles.subtitle}>Chọn một lớp để xem bài học, bài tập và tiến độ</p>
          </div>
        </div>

        {isMentorOrAdmin && (
          <button onClick={() => setEditingClass(null)} className="cl-btn-primary" style={styles.createBtn}>
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
            placeholder="Tìm lớp theo tên hoặc mô tả..."
            className="cl-input"
            style={{ ...styles.input, height: 38, paddingLeft: 36, backgroundColor: "#18181b" }}
          />
        </div>
        <SortSelect
          value={query.sort}
          onChange={(sort) => setQuery((q) => ({ ...q, sort, page: 1 }))}
          options={SORT_OPTIONS}
          icon={<ArrowUpDown size={14} />}
        />
        <span style={styles.metaCount}>
          <span style={styles.dot} /> Trang {pagination.page}/{Math.max(1, pagination.totalPages)} · {visibleClasses.length} lớp học
        </span>
      </div>

      {visibleClasses.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}><FolderOpen size={22} /></div>
          <div style={{ fontWeight: 500, color: "#e4e4e7" }}>
            {!query.q ? "Bạn chưa tham gia hoặc chưa có lớp học nào." : `Không tìm thấy lớp học nào khớp "${query.q}".`}
          </div>
          {query.q && <div style={{ fontSize: 12 }}>Thử tìm với từ khóa khác.</div>}
        </div>
      ) : (
        <div style={styles.grid}>
          {visibleClasses.map((c) => {
            const name = className(c);
            const hue = hashHue(name);
            return (
              <div key={c.id} className="cl-card" style={styles.card}>
              {canManage(c) && (
                <div className="cl-actions" style={styles.cardActions}>
                  <button type="button" onClick={() => setEditingClass(c)} className="cl-action" style={styles.actionBtn} title="Sửa lớp học">
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    disabled={deletingId === c.id}
                    className="cl-action cl-action-danger"
                    style={styles.actionBtn}
                    title="Xoá lớp học"
                  >
                    {deletingId === c.id ? <div className="cl-spinner cl-spinner-sm" /> : <Trash2 size={14} />}
                  </button>
                </div>
              )}
              <Link to={`/classes/${c.id}`} state={{ cls: c }} style={styles.cardLink}>
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
                  {isMentorOrAdmin && (
                    c.mentor_id ? (
                      <span style={{ ...styles.mentorChip, ...(c.mentor_id === user?.id ? styles.mentorChipMine : {}) }}>
                        <UserCheck size={12} /> Mentor: {mentorName(c.mentor_id)}
                      </span>
                    ) : (
                      <span style={{ ...styles.mentorChip, ...styles.mentorChipNone }}>
                        <UserX size={12} /> Chưa phân công mentor
                      </span>
                    )
                  )}
                </div>
                <div style={styles.cardFooter}>
                  <span style={styles.dateInfo}>
                    <Calendar size={14} />
                    {c.start_date
                      ? <>{fmtDate(c.start_date)}{c.end_date ? ` – ${fmtDate(c.end_date)}` : ""}</>
                      : <>Tạo ngày: {c.created_at ? fmtDate(c.created_at) : "N/A"}</>}
                  </span>
                  <span className="cl-detail" style={styles.detailLink}>
                    Xem chi tiết <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
        onLimitChange={(limit) => setQuery((q) => ({ ...q, limit, page: 1 }))}
        limitOptions={[6, 9, 12, 24]}
        itemLabel="lớp học"
      />

      {/* Modal Tạo / Sửa Lớp Học */}
      {editingClass !== undefined && (
        <ClassFormModal
          initial={editingClass}
          mentors={isAdmin ? mentors : undefined}
          onSaved={handleSaved}
          onClose={() => setEditingClass(undefined)}
        />
      )}
    </div>
  );
}

const fmtDate = (d) => new Date(d).toLocaleDateString("vi-VN");

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
  .cl-actions { opacity: 0; transition: opacity .15s; }
  .cl-card:hover .cl-actions, .cl-actions:focus-within { opacity: 1; }
  @media (hover: none) { .cl-actions { opacity: 1; } }
  .cl-action { transition: background-color .15s, color .15s; }
  .cl-action:hover:not(:disabled) { color: #f4f4f5 !important; background-color: #27272a !important; }
  .cl-action-danger:hover:not(:disabled) { color: #fb7185 !important; background-color: rgba(244,63,94,0.12) !important; }
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
  mentorChip: { alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "#c4b5fd", backgroundColor: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" },
  mentorChipMine: { color: "#6ee7b7", backgroundColor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.3)" },
  mentorChipNone: { color: "#fbbf24", backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" },
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
  card: { position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12 },
  cardLink: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", color: "inherit", textDecoration: "none" },
  cardActions: { position: "absolute", top: 14, right: 12, zIndex: 2, display: "flex", gap: 4, padding: 3, borderRadius: 10, backgroundColor: "rgba(24,24,27,0.9)", border: "1px solid #27272a" },
  actionBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, border: "none", borderRadius: 7, backgroundColor: "transparent", color: "#a1a1aa", cursor: "pointer" },
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


  input: { width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid #27272a", backgroundColor: "#0e0e11", color: "#f4f4f5", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" },
};
