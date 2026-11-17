import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { submissionApi } from "../api/submissions";
import { assignmentApi } from "../api/assignments";
import { SubmissionHistoryModal } from "../components/SubmissionHistory";
import {
  ArrowLeft, ExternalLink, Save, ClipboardCheck, Inbox, CircleCheck, Clock, Search, Code2, FileArchive,
  TrendingUp, Check, ChevronLeft, ChevronRight, ArrowUpDown, X, RotateCcw, History,
} from "lucide-react";

export default function GradeSubmissions() {
  const { id } = useParams(); // assignmentId
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination, filtering, sorting, search
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("submitted_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [savingId, setSavingId] = useState(null);

  // Thông tin bài tập (tên, điểm tối đa) + submission đang xem lịch sử nộp
  const [assignment, setAssignment] = useState(null);
  const [historyOf, setHistoryOf] = useState(null);
  useEffect(() => {
    assignmentApi.getById(id).then(({ data }) => setAssignment(data)).catch(() => {});
  }, [id]);

  // Debounce search
  const debounceRef = useRef(null);

  // Overall counts for stats
  const [counts, setCounts] = useState({ total: 0, graded: 0, pending: 0 });

  const loadStats = () => {
    Promise.all([
      submissionApi.getByAssignment(id, { limit: 1 }).then(r => r.pagination?.total || 0).catch(() => 0),
      submissionApi.getByAssignment(id, { status: "GRADED", limit: 1 }).then(r => r.pagination?.total || 0).catch(() => 0),
      submissionApi.getByAssignment(id, { status: "PENDING", limit: 1 }).then(r => r.pagination?.total || 0).catch(() => 0),
    ]).then(([tot, graded, pending]) => {
      setCounts({ total: tot, graded, pending });
    });
  };

  const loadSubmissions = () => {
    setLoading(true);
    submissionApi.getByAssignment(id, {
      page,
      limit,
      q: search,
      status: filter !== "ALL" ? filter : "",
      sortBy,
      order: sortOrder,
    })
      .then((res) => {
        const items = res.data || res.items || [];
        setSubmissions(items);
        setTotal(res.pagination?.total ?? items.length);
        setTotalPages(res.pagination?.totalPages ?? 1);
      })
      .catch((e) => alert(e.message || "Lỗi tải danh sách bài nộp"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, [id]);

  useEffect(() => {
    loadSubmissions();
  }, [id, page, limit, search, filter, sortBy, sortOrder]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value.trim());
      setPage(1);
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearch("");
    setPage(1);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleSortChange = (e) => {
    const [newSortBy, newOrder] = e.target.value.split(":");
    setSortBy(newSortBy);
    setSortOrder(newOrder);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSearch("");
    setFilter("ALL");
    setSortBy("submitted_at");
    setSortOrder("DESC");
    setPage(1);
  };

  const handleGrade = async (submissionId, form) => {
    const score = Number(form.score.value);
    const feedback = form.feedback.value;
    try {
      const { data } = await submissionApi.grade(submissionId, score, feedback);
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, ...data } : s)));
      loadStats();
      alert("Đã cập nhật điểm và thông báo tới học viên!");
    } catch (e) {
      alert(e.message || "Lỗi khi chấm điểm");
    }
  };

  const onGradeSubmit = async (e, submissionId) => {
    e.preventDefault();
    setSavingId(submissionId);
    await handleGrade(submissionId, e.target);
    setSavingId(null);
  };

  const isGraded = (s) => s.score !== null && s.score !== undefined;
  const gradedPercent = counts.total ? Math.round((counts.graded / counts.total) * 100) : 0;
  const hasActiveFilters = Boolean(search || filter !== "ALL" || sortBy !== "submitted_at" || sortOrder !== "DESC");

  const tabs = [
    { key: "ALL", label: "Tất cả", count: counts.total },
    { key: "PENDING", label: "Chờ chấm", count: counts.pending },
    { key: "GRADED", label: "Đã chấm", count: counts.graded },
  ];

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <Link to={`/assignments/${id}`} className="gs-back" style={styles.backBtn}>
        <ArrowLeft size={16} className="gs-back-icon" /> Quay lại bài tập
      </Link>

      {/* Header trang */}
      <div style={styles.pageHeader}>
        <div style={styles.headerIcon}><ClipboardCheck size={26} /></div>
        <div>
          <h2 style={styles.title}>Quản lý & Chấm điểm bài nộp</h2>
          <p style={styles.subtitle}>
            {assignment ? <><strong style={{ color: "#1e293b" }}>{assignment.title}</strong> · Điểm tối đa {assignment.maximum_score} · </> : null}
            Chấm điểm và gửi nhận xét — học viên sẽ nhận thông báo ngay.
          </p>
        </div>
      </div>

      {/* Thống kê */}
      <div style={styles.statGrid}>
        <StatCard label="Tổng bài nộp" value={counts.total} hint="bài làm đã gửi" icon={<Inbox size={18} />} color="#64748b" />
        <StatCard label="Đã chấm" value={counts.graded} hint="đã công bố điểm" icon={<CircleCheck size={18} />} color="#059669" />
        <StatCard label="Chờ chấm" value={counts.pending} hint="cần xem xét" icon={<Clock size={18} />} color="#d97706" />
      </div>

      <div style={styles.progressCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <TrendingUp size={18} color="#059669" />
          <strong style={{ color: "#0f172a", fontWeight: 600 }}>Tiến độ chấm:</strong>
          <span style={{ color: "#64748b" }}>{counts.graded}/{counts.total} học viên</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 240px", maxWidth: 420 }}>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${gradedPercent}%` }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>{gradedPercent}%</span>
        </div>
      </div>

      {/* Toolbar: Tìm kiếm, Lọc trạng thái, Sắp xếp */}
      <div style={styles.toolbar}>
        <div style={styles.tabs}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleFilterChange(t.key)}
              className="gs-tab"
              style={{ ...styles.tab, ...(filter === t.key ? styles.tabActive : {}) }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
          {/* Search with Debounce & Clear */}
          <div style={styles.searchWrap}>
            <Search size={16} style={styles.searchIcon} />
            <input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo tên hoặc email học viên..."
              className="gs-input"
              style={{ ...styles.input, height: 38, paddingLeft: 36, paddingRight: searchTerm ? 32 : 12, backgroundColor: "#ffffff" }}
            />
            {searchTerm && (
              <button type="button" onClick={handleClearSearch} style={styles.clearBtn} title="Xóa tìm kiếm">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sắp xếp */}
          <div style={{ position: "relative" }}>
            <ArrowUpDown size={14} style={styles.selectIcon} />
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={handleSortChange}
              className="gs-input"
              style={{ ...styles.input, height: 38, paddingLeft: 32, paddingRight: 16, backgroundColor: "#ffffff", cursor: "pointer", appearance: "none" }}
            >
              <option value="submitted_at:DESC">Mới nộp nhất</option>
              <option value="submitted_at:ASC">Nộp sớm nhất</option>
              <option value="score:DESC">Điểm: Cao → Thấp</option>
              <option value="score:ASC">Điểm: Thấp → Cao</option>
            </select>
          </div>

          {/* Limit selector */}
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="gs-input"
            style={{ ...styles.input, height: 38, width: 80, padding: "0 10px", backgroundColor: "#ffffff", cursor: "pointer", appearance: "none" }}
          >
            <option value={5}>5 / trang</option>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
          </select>

          {hasActiveFilters && (
            <button onClick={handleResetFilters} className="gs-btn-ghost" style={styles.resetBtn}>
              <RotateCcw size={13} /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Danh sách bài nộp */}
      {loading ? (
        <div style={styles.center}>
          <div className="gs-spinner" />
          Đang tải danh sách bài nộp...
        </div>
      ) : submissions.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}><Inbox size={22} /></div>
          <div style={{ fontWeight: 500, color: "#1e293b" }}>
            {hasActiveFilters ? "Không có bài nộp nào phù hợp bộ lọc." : "Chưa có học viên nào nộp bài."}
          </div>
          {hasActiveFilters && (
            <button onClick={handleResetFilters} style={{ ...styles.resetBtn, marginTop: 12 }}>
              <RotateCcw size={13} /> Xóa bộ lọc và xem tất cả
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {submissions.map((s) => {
            const graded = isGraded(s);
            const accent = graded ? "#059669" : "#d97706";
            return (
              <article key={s.id} className={`gs-card ${graded ? "gs-card-graded" : "gs-card-pending"}`} style={styles.card}>
                {/* Trái: học viên */}
                <div className="gs-col" style={styles.col}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ ...styles.avatar, color: accent, backgroundColor: `${accent}1f`, borderColor: `${accent}4d` }}>
                      {getInitials(s.member_name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.studentName}>{s.member_name || "Học viên"}</div>
                      <div style={styles.email}>{s.member_email}</div>
                      <div style={styles.time}>
                        <Clock size={14} /> {new Date(s.submitted_at).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <span style={{ ...styles.statusPill, color: accent, backgroundColor: `${accent}1f`, borderColor: `${accent}4d` }}>
                      {graded ? <Check size={13} /> : <span className="gs-pulse" style={{ ...styles.statusDot, backgroundColor: accent }} />}
                      {graded ? `Đã chấm: ${s.score}` : (s.version || 1) > 1 ? "Nộp lại · chờ chấm" : "Chờ chấm"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHistoryOf(s)}
                      className="gs-history"
                      style={{ ...styles.versionBtn, ...((s.version || 1) > 1 ? styles.versionBtnActive : {}) }}
                      title="Xem lịch sử các lần nộp"
                    >
                      <History size={12} /> v{s.version || 1}{(s.version || 1) > 1 ? ` · ${(s.version || 1) - 1} bản cũ` : ""}
                    </button>
                  </div>
                </div>

                {/* Giữa: nội dung bài nộp */}
                <div className="gs-col" style={styles.col}>
                  <div>
                    <span style={styles.sectionLabel}>Ghi chú của học viên</span>
                    <div style={{ ...styles.note, ...(s.content ? {} : styles.noteEmpty) }}>
                      {s.content || "Không có ghi chú"}
                    </div>
                  </div>
                  {(s.repository_url || s.file_url) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {s.repository_url && (
                        <a href={s.repository_url} target="_blank" rel="noreferrer" className="gs-chip" style={{ ...styles.linkChip, color: "#2563eb" }}>
                          <Code2 size={14} /> Repository <ExternalLink size={12} />
                        </a>
                      )}
                      {s.file_url && (
                        <a href={s.file_url} target="_blank" rel="noreferrer" className="gs-chip gs-chip-green" style={styles.linkChip}>
                          <FileArchive size={14} color="#059669" /> Xem File <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Phải: form chấm điểm */}
                <form onSubmit={(e) => onGradeSubmit(e, s.id)} style={styles.gradeForm}>
                  <span style={styles.sectionLabel}>Điểm số & Nhận xét</span>
                  <input
                    name="score"
                    type="number"
                    step="0.1"
                    defaultValue={s.score ?? ""}
                    min={0}
                    max={assignment?.maximum_score}
                    placeholder="Điểm"
                    required
                    className="gs-input"
                    style={{ ...styles.input, ...styles.scoreInput }}
                  />
                  <textarea
                    name="feedback"
                    rows={2}
                    defaultValue={s.feedback ?? ""}
                    placeholder="Nhận xét..."
                    className="gs-input"
                    style={{ ...styles.input, resize: "vertical", lineHeight: 1.5 }}
                  />
                  <button type="submit" disabled={savingId === s.id} className="gs-btn-save" style={styles.saveBtn}>
                    {savingId === s.id ? <div className="gs-spinner gs-spinner-sm" /> : <Save size={14} />}
                    {savingId === s.id ? "Đang lưu..." : graded ? "Cập nhật" : "Lưu"}
                  </button>
                </form>
              </article>
            );
          })}

          {/* Pagination Footer */}
          <div style={styles.paginationFooter}>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Hiển thị <strong style={{ color: "#0f172a" }}>{submissions.length}</strong> /{" "}
              <strong style={{ color: "#0f172a" }}>{total}</strong> bài nộp
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="gs-btn-page"
                style={{ ...styles.pageBtn, ...(page <= 1 ? styles.pageBtnDisabled : {}) }}
              >
                <ChevronLeft size={16} /> Trước
              </button>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Trang <span style={{ color: "#0f172a", fontWeight: 700 }}>{page}</span> / {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="gs-btn-page"
                style={{ ...styles.pageBtn, ...(page >= totalPages ? styles.pageBtnDisabled : {}) }}
              >
                Sau <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <SubmissionHistoryModal
        submission={historyOf}
        maxScore={assignment?.maximum_score}
        onClose={() => setHistoryOf(null)}
      />
    </div>
  );
}

function StatCard({ label, value, hint, icon, color }) {
  return (
    <div className="gs-stat" style={styles.statCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color }}>{label}</span>
        <div style={{ ...styles.statIcon, color, backgroundColor: `${color}1a`, borderColor: `${color}40` }}>{icon}</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.025em", color: color === "#64748b" ? "#0f172a" : color }}>{value}</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{hint}</span>
      </div>
    </div>
  );
}

const getInitials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

const css = `
  .gs-card { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; transition: border-color .2s; }
  .gs-card .gs-col { padding-right: 20px; border-right: 1px solid #e2e8f0; }
  @media (max-width: 960px) {
    .gs-card { grid-template-columns: 1fr; }
    .gs-card .gs-col { padding-right: 0; padding-bottom: 16px; border-right: none; border-bottom: 1px solid #e2e8f0; }
  }
  .gs-card-pending:hover { border-color: rgba(245,158,11,0.5) !important; }
  .gs-card-graded:hover { border-color: rgba(16,185,129,0.5) !important; }
  .gs-stat { transition: border-color .15s; }
  .gs-stat:hover { border-color: #cbd5e1 !important; }
  .gs-back:hover { color: #0f172a !important; }
  .gs-back-icon { transition: transform .15s; }
  .gs-back:hover .gs-back-icon { transform: translateX(-2px); }
  .gs-history { transition: border-color .15s, color .15s; }
  .gs-history:hover { border-color: rgba(139,92,246,0.6) !important; color: #5b21b6 !important; }
  .gs-tab:hover { color: #0f172a !important; }
  .gs-chip { transition: border-color .15s; }
  .gs-chip:hover { border-color: rgba(59,130,246,0.5) !important; }
  .gs-chip-green:hover { border-color: rgba(16,185,129,0.5) !important; }
  .gs-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 1px #3b82f6; }
  .gs-input::placeholder { color: #94a3b8; }
  .gs-btn-save { transition: background-color .15s, transform .1s; }
  .gs-btn-save:hover:not(:disabled) { background-color: #059669 !important; }
  .gs-btn-save:active:not(:disabled) { transform: scale(0.98); }
  .gs-btn-page { transition: background-color .15s, color .15s, border-color .15s; }
  .gs-btn-page:hover:not(:disabled) { background-color: #e2e8f0 !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
  .gs-pulse { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); animation: gs-pulse 2s infinite cubic-bezier(0.66,0,0,1); }
  @keyframes gs-pulse { to { box-shadow: 0 0 0 6px rgba(245,158,11,0); } }
  .gs-spinner { width: 28px; height: 28px; margin: 0 auto 12px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: gs-spin .8s linear infinite; }
  .gs-spinner-sm { width: 14px; height: 14px; margin: 0; border-width: 2px; border-color: currentColor; border-right-color: transparent; }
  @keyframes gs-spin { to { transform: rotate(360deg); } }
`;

const styles = {
  page: { fontFamily: "Inter, system-ui, sans-serif" },
  center: { textAlign: "center", padding: 60, color: "#64748b", fontSize: 14 },
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", textDecoration: "none", marginBottom: 20, fontSize: 13, transition: "color .15s" },

  pageHeader: { display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 24, borderBottom: "1px solid #e2e8f0" },
  headerIcon: { width: 48, height: 48, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" },
  title: { margin: 0, color: "#0f172a", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" },
  subtitle: { margin: "4px 0 0", color: "#64748b", fontSize: 13 },

  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 24 },
  statCard: { padding: 20, borderRadius: 12, backgroundColor: "#ffffff", border: "1px solid #e2e8f0" },
  statIcon: { width: 36, height: 36, borderRadius: 8, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  progressCard: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: "#ffffff", border: "1px solid #e2e8f0" },
  progressTrack: { flex: 1, height: 8, borderRadius: 999, overflow: "hidden", backgroundColor: "#e2e8f0" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#10b981", transition: "width .5s" },

  toolbar: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "32px 0 20px" },
  searchWrap: { position: "relative", flex: "1 1 240px", maxWidth: 300 },
  searchIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" },
  selectIcon: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" },
  clearBtn: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 },
  resetBtn: { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: 12, color: "#64748b", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", cursor: "pointer" },
  tabs: { display: "flex", gap: 2, padding: 2, borderRadius: 10, backgroundColor: "#ffffff", border: "1px solid #e2e8f0" },
  tab: { padding: "6px 12px", borderRadius: 8, border: "1px solid transparent", backgroundColor: "transparent", color: "#64748b", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" },
  tabActive: { backgroundColor: "#e2e8f0", borderColor: "#cbd5e1", color: "#0f172a" },

  card: { padding: 20, borderRadius: 12, backgroundColor: "#ffffff", border: "1px solid #e2e8f0" },
  col: { display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14, minWidth: 0 },
  avatar: { width: 40, height: 40, flexShrink: 0, borderRadius: "50%", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 },
  studentName: { fontSize: 15, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  email: { marginTop: 2, fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  time: { display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, color: "#94a3b8" },
  statusPill: { alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, border: "1px solid", fontSize: 11, fontWeight: 600 },
  versionBtn: { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999, border: "1px solid #cbd5e1", backgroundColor: "transparent", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  versionBtnActive: { color: "#6d28d9", backgroundColor: "rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.35)" },
  statusDot: { width: 6, height: 6, borderRadius: "50%" },
  sectionLabel: { display: "block", marginBottom: 8, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" },
  note: { padding: 12, borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: "#334155", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  noteEmpty: { color: "#94a3b8", fontStyle: "italic" },
  linkChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, fontSize: 12, color: "#1e293b", textDecoration: "none", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" },

  gradeForm: { display: "flex", flexDirection: "column", gap: 10, minWidth: 0 },
  input: { width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#0f172a", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" },
  scoreInput: { width: 120, height: 40, textAlign: "center", fontSize: 16, fontWeight: 600 },
  saveBtn: { alignSelf: "flex-end", display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 },

  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "48px 16px", textAlign: "center", color: "#64748b", fontSize: 13, borderRadius: 12, border: "1px dashed #e2e8f0", backgroundColor: "rgba(248,250,252,0.4)" },
  emptyIcon: { width: 48, height: 48, marginBottom: 4, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", backgroundColor: "#e2e8f0" },

  paginationFooter: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "16px 20px", marginTop: 8, borderRadius: 12, backgroundColor: "#ffffff", border: "1px solid #e2e8f0" },
  pageBtn: { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#0f172a", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  pageBtnDisabled: { opacity: 0.35, cursor: "not-allowed" },
};
