import { useEffect, useState, useRef, useTransition } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { classApi } from "../api/classes";
import { userApi } from "../api/users";
import { getUser, fetchAll } from "../api/client";
import ClassFormModal from "../components/ClassFormModal";
import {
  Calendar, ArrowRight, Plus, X, School, Search, FolderOpen,
  TriangleAlert, ChevronLeft, ChevronRight, ArrowUpDown, Filter, RotateCcw,
  UserCheck, UserX, Pencil, Trash2,
} from "lucide-react";

export default function ClassList() {
  const user = getUser();
  const isMentorOrAdmin = ["MENTOR", "ADMIN"].includes(user?.role);
  const isAdmin = user?.role === "ADMIN";

  // Đồng bộ trạng thái trên URL
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc params từ URL (với giá trị mặc định)
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(urlPage) || urlPage < 1 ? 1 : urlPage;

  const urlLimit = parseInt(searchParams.get("limit") || "9", 10);
  const limit = isNaN(urlLimit) || urlLimit < 1 ? 9 : urlLimit;

  const q = searchParams.get("q") || "";
  const sortBy = searchParams.get("sortBy") || "created_at";
  const order = (searchParams.get("order") || "desc").toLowerCase();
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";

  // Local state cho search input để xử lý debounce 300ms mượt mà
  const [searchTerm, setSearchTerm] = useState(q);
  const debounceTimerRef = useRef(null);

  // Dữ liệu API
  const [classes, setClasses] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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

  // Cập nhật URL params
  const updateParams = (newParams) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    setSearchParams(next);
  };

  // Đồng bộ search input khi URL q thay đổi từ bên ngoài (e.g. back/forward navigation)
  useEffect(() => {
    setSearchTerm(q);
  }, [q]);

  // Debounce search 300ms
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      updateParams({ q: value.trim() || "", page: 1 });
    }, 300);
  };

  // Nút xóa nhanh ô tìm kiếm
  const handleClearSearch = () => {
    setSearchTerm("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    updateParams({ q: "", page: 1 });
  };

  // Thay đổi Sort
  const handleSortChange = (e) => {
    const val = e.target.value;
    const [newSortBy, newOrder] = val.split(":");
    updateParams({ sortBy: newSortBy, order: newOrder, page: 1 });
  };

  // Thay đổi Limit (số dòng mỗi trang)
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    updateParams({ limit: newLimit, page: 1 });
  };

  // Thay đổi khoảng ngày
  const handleFromDateChange = (e) => {
    updateParams({ fromDate: e.target.value, page: 1 });
  };

  const handleToDateChange = (e) => {
    updateParams({ toDate: e.target.value, page: 1 });
  };

  // Reset tất cả bộ lọc
  const handleResetFilters = () => {
    setSearchTerm("");
    setSearchParams(new URLSearchParams({ page: "1", limit: String(limit) }));
  };

  // Tải dữ liệu từ Server (server-side filtering, sorting, pagination)
  const loadClasses = () => {
    setLoading(true);
    setError("");
    classApi.getAll({
      page,
      limit,
      q,
      sortBy,
      order,
      fromDate,
      toDate,
    })
      .then((res) => {
        const items = res.items || res.data || [];
        const tot = res.total ?? res.pagination?.totalItems ?? items.length;
        const totPages = res.totalPages ?? res.pagination?.totalPages ?? 1;

        setClasses(items);
        setTotal(tot);
        setTotalPages(totPages);
      })
      .catch((e) => setError(e.message || "Lỗi tải danh sách lớp học"))
      .finally(() => setLoading(false));
  };

  // Tải lại dữ liệu mỗi khi params trên URL thay đổi
  useEffect(() => {
    loadClasses();
  }, [page, limit, q, sortBy, order, fromDate, toDate]);

  const handleSaved = (saved) => {
    const isEdit = Boolean(editingClass?.id);
    setEditingClass(undefined);
    alert(isEdit ? `Đã cập nhật lớp "${className(saved)}"!` : "Tạo lớp học mới thành công!");
    if (!isEdit && page !== 1) updateParams({ page: 1 });
    else loadClasses();
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
      if (classes.length === 1 && page > 1) updateParams({ page: page - 1 });
      else loadClasses();
    } catch (err) {
      alert(err.message || "Xoá lớp học thất bại (lớp có thể còn dữ liệu liên quan)");
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveFilters = Boolean(q || fromDate || toDate || sortBy !== "created_at" || order !== "desc");

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Header trang */}
      <div style={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={styles.headerIcon}><School size={24} /></div>
          <div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <h2 style={styles.title}>{isAdmin ? "Tất cả lớp học" : "Lớp học"}</h2>
              <span style={styles.countBadge}>{total} lớp</span>
            </div>
            <p style={styles.subtitle}>
              {isAdmin
                ? "Quản lý toàn bộ lớp học, phân công mentor và theo dõi hoạt động"
                : isMentorOrAdmin
                  ? "Tạo lớp, quản lý bài giảng, bài tập và chấm điểm học viên"
                  : "Chọn một lớp để học bài, nộp bài tập và xem tiến độ của bạn"}
            </p>
          </div>
        </div>

        {isMentorOrAdmin && (
          <button onClick={() => setEditingClass(null)} className="cl-btn-primary" style={styles.createBtn}>
            <Plus size={16} /> Tạo Lớp Học Mới
          </button>
        )}
      </div>

      {/* Toolbar: Tìm kiếm, Bộ lọc khoảng ngày, Sắp xếp, Phân trang */}
      <div style={styles.controlPanel}>
        <div style={styles.toolbarRow}>
          {/* Ô Tìm kiếm với Debounce 300ms và nút Clear X */}
          <div style={styles.searchWrap}>
            <Search size={16} style={styles.searchIcon} />
            <input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo tên hoặc mô tả lớp..."
              className="cl-input"
              style={{ ...styles.input, height: 38, paddingLeft: 36, paddingRight: searchTerm ? 34 : 12, backgroundColor: "#ffffff" }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={styles.clearSearchBtn}
                title="Xóa tìm kiếm"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Sắp xếp (Sorting Whitelist) */}
          <div style={styles.sortWrap}>
            <ArrowUpDown size={15} style={styles.selectIcon} />
            <select
              value={`${sortBy}:${order}`}
              onChange={handleSortChange}
              className="cl-input cl-select"
              style={{ ...styles.input, height: 38, paddingLeft: 34, paddingRight: 28, backgroundColor: "#ffffff", cursor: "pointer" }}
            >
              <option value="created_at:desc">Mới nhất (Ngày tạo giảm dần)</option>
              <option value="created_at:asc">Cũ nhất (Ngày tạo tăng dần)</option>
              <option value="name:asc">Tên lớp: A → Z</option>
              <option value="name:desc">Tên lớp: Z → A</option>
              <option value="start_date:asc">Ngày bắt đầu sớm nhất</option>
              <option value="start_date:desc">Ngày bắt đầu muộn nhất</option>
            </select>
          </div>

          {/* Chọn số dòng/lớp mỗi trang (Limit) */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>Hiển thị:</span>
            <select
              value={limit}
              onChange={handleLimitChange}
              className="cl-input cl-select"
              style={{ ...styles.input, height: 38, width: 80, padding: "0 10px", backgroundColor: "#ffffff", cursor: "pointer" }}
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={18}>18</option>
            </select>
          </div>
        </div>

        {/* Hàng lọc khoảng ngày (Filtering) */}
        <div style={styles.filterRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13 }}>
              <Filter size={15} style={{ color: "#2563eb" }} />
              <span>Khoảng ngày bắt đầu:</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <input
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                title="Từ ngày"
                className="cl-input"
                style={{ ...styles.input, height: 34, width: 140, backgroundColor: "#ffffff", colorScheme: "light" }}
              />
              <span style={{ color: "#94a3b8", fontSize: 13 }}>đến</span>
              <input
                type="date"
                value={toDate}
                onChange={handleToDateChange}
                title="Đến ngày"
                className="cl-input"
                style={{ ...styles.input, height: 34, width: 140, backgroundColor: "#ffffff", colorScheme: "light" }}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="cl-btn-ghost"
                style={styles.resetBtn}
                title="Đặt lại tất cả bộ lọc"
              >
                <RotateCcw size={13} /> Xóa bộ lọc
              </button>
            )}
          </div>

          <span style={styles.metaCount}>
            <span style={styles.dot} /> Hiển thị {classes.length} / {total} lớp học
          </span>
        </div>
      </div>

      {/* Trạng thái Lỗi */}
      {error && (
        <div style={styles.errorText}>
          <TriangleAlert size={18} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Trạng thái Loading */}
      {loading ? (
        <div style={styles.centerText}>
          <div className="cl-spinner" />
          Đang tải dữ liệu lớp học...
        </div>
      ) : classes.length === 0 ? (
        /* Trạng thái Rỗng */
        <div style={styles.empty}>
          <div style={styles.emptyIcon}><FolderOpen size={24} /></div>
          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 15 }}>
            Không tìm thấy kết quả phù hợp
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {hasActiveFilters
              ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh khoảng ngày lọc."
              : "Hiện tại chưa có lớp học nào trong hệ thống."}
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="cl-btn-primary"
              style={{ ...styles.createBtn, marginTop: 12, padding: "8px 16px" }}
            >
              <RotateCcw size={14} /> Xóa bộ lọc và xem tất cả
            </button>
          )}
        </div>
      ) : (
        /* Danh sách Grid Lớp học */
        <>
          <div style={styles.grid}>
            {classes.map((c) => {
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
                        color: `hsl(${hue} 70% 38%)`,
                        backgroundColor: `hsl(${hue} 80% 55% / 0.10)`,
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

          {/* Pagination UI: Trước / Sau, số trang hiện tại, chọn trang */}
          <div style={styles.paginationWrap}>
            <button
              onClick={() => updateParams({ page: Math.max(1, page - 1) })}
              disabled={page <= 1}
              className="cl-btn-page"
              style={{ ...styles.pageBtn, ...(page <= 1 ? styles.pageBtnDisabled : {}) }}
              title="Trang trước"
            >
              <ChevronLeft size={16} /> Trước
            </button>

            <span style={styles.pageInfo}>
              Trang <span style={{ color: "#0f172a", fontWeight: 700 }}>{page}</span> / {Math.max(1, totalPages)}
              <span style={{ color: "#94a3b8", marginLeft: 8 }}>({total} kết quả)</span>
            </span>

            <button
              onClick={() => updateParams({ page: Math.min(totalPages, page + 1) })}
              disabled={page >= totalPages}
              className="cl-btn-page"
              style={{ ...styles.pageBtn, ...(page >= totalPages ? styles.pageBtnDisabled : {}) }}
              title="Trang sau"
            >
              Sau <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

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

const className = (c) => c.title || c.name || "Lớp học chưa đặt tên";

const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w[0]))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "LH";

const hashHue = (str) => {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
};

const css = `
  .cl-card { transition: transform .2s, border-color .2s, box-shadow .2s; }
  .cl-card:hover { transform: translateY(-2px); border-color: #bfdbfe !important; box-shadow: 0 16px 32px rgba(37,99,235,0.10); }
  .cl-card-title { transition: color .15s; }
  .cl-actions { opacity: 0; transition: opacity .15s; }
  .cl-card:hover .cl-actions, .cl-actions:focus-within { opacity: 1; }
  @media (hover: none) { .cl-actions { opacity: 1; } }
  .cl-action { transition: background-color .15s, color .15s; }
  .cl-action:hover:not(:disabled) { color: #0f172a !important; background-color: #e2e8f0 !important; }
  .cl-action-danger:hover:not(:disabled) { color: #e11d48 !important; background-color: rgba(244,63,94,0.12) !important; }
  .cl-card:hover .cl-card-title { color: #2563eb; }
  .cl-detail { transition: transform .15s; }
  .cl-card:hover .cl-detail { transform: translateX(2px); }
  .cl-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cl-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .cl-btn-primary { transition: background-color .15s, transform .1s; }
  .cl-btn-primary:hover:not(:disabled) { background-color: #1d4ed8 !important; }
  .cl-btn-primary:active:not(:disabled) { transform: scale(0.98); }
  .cl-btn-ghost:hover { color: #0f172a !important; background-color: #e2e8f0 !important; }
  .cl-btn-page { transition: background-color .15s, color .15s, border-color .15s; }
  .cl-btn-page:hover:not(:disabled) { background-color: #e2e8f0 !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
  .cl-btn-page:active:not(:disabled) { transform: scale(0.97); }
  .cl-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 1px #3b82f6; }
  .cl-input::placeholder { color: #94a3b8; }
  .cl-select { appearance: none; }
  .cl-modal { animation: cl-pop .18s ease-out; }
  @keyframes cl-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  .cl-spinner { width: 28px; height: 28px; margin: 0 auto 12px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: cl-spin .8s linear infinite; }
  .cl-spinner-sm { width: 14px; height: 14px; margin: 0; border-width: 2px; border-color: currentColor; border-right-color: transparent; }
  @keyframes cl-spin { to { rotate: 360deg; } }
`;

const styles = {
  page: { fontFamily: "Inter, system-ui, sans-serif" },
  centerText: { textAlign: "center", padding: 60, color: "#64748b", fontSize: 14 },
  errorText: { display: "flex", alignItems: "center", gap: 10, color: "#be123c", padding: 14, marginBottom: 20, backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 12, fontSize: 13 },

  pageHeader: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, paddingBottom: 24, borderBottom: "1px solid #e2e8f0" },
  headerIcon: { width: 48, height: 48, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "linear-gradient(135deg, #2563eb, #0ea5e9)", boxShadow: "0 8px 20px rgba(37,99,235,0.25)" },
  title: { margin: 0, color: "#0f172a", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" },
  countBadge: { padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "#1d4ed8", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" },
  subtitle: { margin: "4px 0 0", color: "#64748b", fontSize: 13 },
  createBtn: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13, boxShadow: "0 8px 20px rgba(37,99,235,0.25)" },

  controlPanel: { display: "flex", flexDirection: "column", gap: 14, margin: "24px 0", padding: 16, borderRadius: 14, backgroundColor: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.04)" },
  toolbarRow: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 },
  searchWrap: { position: "relative", flex: "1 1 280px", maxWidth: 420 },
  searchIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" },
  clearSearchBtn: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", padding: 4, borderRadius: 4 },
  sortWrap: { position: "relative", flex: "1 1 220px", maxWidth: 300 },
  selectIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" },
  filterRow: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: 12, borderTop: "1px solid #eef2f7" },
  resetBtn: { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: 12, color: "#64748b", border: "1px solid #e2e8f0", backgroundColor: "transparent", cursor: "pointer" },
  metaCount: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" },
  dot: { width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3b82f6" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 },
  card: { position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 1px 3px rgba(15,23,42,0.05)" },
  cardLink: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", color: "inherit", textDecoration: "none" },
  cardActions: { position: "absolute", top: 14, right: 12, zIndex: 2, display: "flex", gap: 4, padding: 3, borderRadius: 10, backgroundColor: "rgba(248,250,252,0.9)", border: "1px solid #e2e8f0" },
  actionBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, border: "none", borderRadius: 7, backgroundColor: "transparent", color: "#64748b", cursor: "pointer" },
  mentorChip: { display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "#6d28d9", backgroundColor: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" },
  mentorChipMine: { color: "#047857", backgroundColor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.3)" },
  mentorChipNone: { color: "#d97706", backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" },
  banner: { height: 6, width: "100%" },
  cardBody: { padding: 20, flex: 1 },
  initials: { width: 38, height: 38, marginBottom: 14, borderRadius: 10, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: "#0f172a", letterSpacing: "-0.01em" },
  cardDesc: { margin: "8px 0 0", color: "#64748b", fontSize: 13, lineHeight: 1.6 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "14px 20px", borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" },
  dateInfo: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" },
  detailLink: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: "#2563eb" },

  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "48px 16px", textAlign: "center", color: "#64748b", fontSize: 13, borderRadius: 12, border: "2px dashed #cbd5e1", backgroundColor: "rgba(248,250,252,0.3)" },
  emptyIcon: { width: 52, height: 52, marginBottom: 4, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" },

  paginationWrap: { display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 32, paddingTop: 24, borderTop: "1px solid #e2e8f0" },
  pageBtn: { display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  pageBtnDisabled: { opacity: 0.35, cursor: "not-allowed" },
  pageInfo: { fontSize: 13, color: "#64748b" },


  input: { width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" },
};
