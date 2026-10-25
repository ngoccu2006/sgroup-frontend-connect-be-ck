import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { submissionApi } from "../api/submissions";
import {
  ArrowLeft, ExternalLink, Save, ClipboardCheck, Inbox, CircleCheck, Clock, Search, Code2, FileArchive,
  TrendingUp, Check,
} from "lucide-react";

export default function GradeSubmissions() {
  const { id } = useParams(); // assignmentId
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state (lọc phía client + trạng thái nút lưu)
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    submissionApi.getByAssignment(id)
      .then(({ data }) => setSubmissions(data || []))
      .catch((e) => alert(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGrade = async (submissionId, form) => {
    const score = Number(form.score.value);
    const feedback = form.feedback.value;
    try {
      const { data } = await submissionApi.grade(submissionId, score, feedback);
      setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? { ...s, ...data } : s)));
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

  if (loading) {
    return (
      <div style={styles.center}>
        <style>{css}</style>
        <div className="gs-spinner" />
        Đang tải danh sách bài nộp...
      </div>
    );
  }

  const isGraded = (s) => s.score !== null && s.score !== undefined;
  const gradedCount = submissions.filter(isGraded).length;
  const pendingCount = submissions.length - gradedCount;
  const gradedPercent = submissions.length ? Math.round((gradedCount / submissions.length) * 100) : 0;

  const keyword = search.trim().toLowerCase();
  const visible = submissions.filter((s) => {
    if (filter === "PENDING" && isGraded(s)) return false;
    if (filter === "GRADED" && !isGraded(s)) return false;
    if (!keyword) return true;
    return (s.member_name || "").toLowerCase().includes(keyword) || (s.member_email || "").toLowerCase().includes(keyword);
  });

  const tabs = [
    { key: "ALL", label: "Tất cả", count: submissions.length },
    { key: "PENDING", label: "Chờ chấm", count: pendingCount },
    { key: "GRADED", label: "Đã chấm", count: gradedCount },
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
          <p style={styles.subtitle}>Chấm điểm và gửi nhận xét — học viên sẽ nhận thông báo ngay.</p>
        </div>
      </div>

      {/* Thống kê */}
      <div style={styles.statGrid}>
        <StatCard label="Tổng bài nộp" value={submissions.length} hint="bài làm đã gửi" icon={<Inbox size={18} />} color="#a1a1aa" />
        <StatCard label="Đã chấm" value={gradedCount} hint="đã công bố điểm" icon={<CircleCheck size={18} />} color="#34d399" />
        <StatCard label="Chờ chấm" value={pendingCount} hint="cần xem xét" icon={<Clock size={18} />} color="#fbbf24" />
      </div>
      <div style={styles.progressCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <TrendingUp size={18} color="#34d399" />
          <strong style={{ color: "#f4f4f5", fontWeight: 600 }}>Tiến độ chấm:</strong>
          <span style={{ color: "#a1a1aa" }}>{gradedCount}/{submissions.length} học viên</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 240px", maxWidth: 420 }}>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${gradedPercent}%` }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>{gradedPercent}%</span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrap}>
          <Search size={16} style={styles.searchIcon} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email học viên..."
            className="gs-input"
            style={{ ...styles.input, height: 38, paddingLeft: 36, backgroundColor: "#18181b" }}
          />
        </div>
        <div style={styles.tabs}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="gs-tab"
              style={{ ...styles.tab, ...(filter === t.key ? styles.tabActive : {}) }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách bài nộp */}
      {visible.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}><Inbox size={22} /></div>
          <div style={{ fontWeight: 500, color: "#e4e4e7" }}>
            {submissions.length === 0 ? "Chưa có học viên nào nộp bài." : "Không có bài nộp phù hợp bộ lọc."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {visible.map((s) => {
            const graded = isGraded(s);
            const accent = graded ? "#34d399" : "#fbbf24";
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
                  <span style={{ ...styles.statusPill, color: accent, backgroundColor: `${accent}1f`, borderColor: `${accent}4d` }}>
                    {graded ? <Check size={13} /> : <span className="gs-pulse" style={{ ...styles.statusDot, backgroundColor: accent }} />}
                    {graded ? `Đã chấm: ${s.score}` : "Chờ chấm"}
                  </span>
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
                        <a href={s.repository_url} target="_blank" rel="noreferrer" className="gs-chip" style={{ ...styles.linkChip, color: "#60a5fa" }}>
                          <Code2 size={14} /> Repository <ExternalLink size={12} />
                        </a>
                      )}
                      {s.file_url && (
                        <a href={s.file_url} target="_blank" rel="noreferrer" className="gs-chip gs-chip-green" style={styles.linkChip}>
                          <FileArchive size={14} color="#34d399" /> Xem File <ExternalLink size={12} />
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
        </div>
      )}
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
        <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.025em", color: color === "#a1a1aa" ? "#f4f4f5" : color }}>{value}</span>
        <span style={{ fontSize: 12, color: "#71717a" }}>{hint}</span>
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

// Hover / focus / responsive / animation không làm được bằng inline style
const css = `
  .gs-card { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; transition: border-color .2s; }
  .gs-card .gs-col { padding-right: 20px; border-right: 1px solid #27272a; }
  @media (max-width: 960px) {
    .gs-card { grid-template-columns: 1fr; }
    .gs-card .gs-col { padding-right: 0; padding-bottom: 16px; border-right: none; border-bottom: 1px solid #27272a; }
  }
  .gs-card-pending:hover { border-color: rgba(245,158,11,0.5) !important; }
  .gs-card-graded:hover { border-color: rgba(16,185,129,0.5) !important; }
  .gs-stat { transition: border-color .15s; }
  .gs-stat:hover { border-color: #3f3f46 !important; }
  .gs-back:hover { color: #f4f4f5 !important; }
  .gs-back-icon { transition: transform .15s; }
  .gs-back:hover .gs-back-icon { transform: translateX(-2px); }
  .gs-tab:hover { color: #f4f4f5 !important; }
  .gs-chip { transition: border-color .15s; }
  .gs-chip:hover { border-color: rgba(59,130,246,0.5) !important; }
  .gs-chip-green:hover { border-color: rgba(16,185,129,0.5) !important; }
  .gs-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 1px #3b82f6; }
  .gs-input::placeholder { color: #71717a; }
  .gs-btn-save { transition: background-color .15s, transform .1s; }
  .gs-btn-save:hover:not(:disabled) { background-color: #059669 !important; }
  .gs-btn-save:active:not(:disabled) { transform: scale(0.98); }
  .gs-pulse { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); animation: gs-pulse 2s infinite cubic-bezier(0.66,0,0,1); }
  @keyframes gs-pulse { to { box-shadow: 0 0 0 6px rgba(245,158,11,0); } }
  .gs-spinner { width: 28px; height: 28px; margin: 0 auto 12px; border: 3px solid #27272a; border-top-color: #3b82f6; border-radius: 50%; animation: gs-spin .8s linear infinite; }
  .gs-spinner-sm { width: 14px; height: 14px; margin: 0; border-width: 2px; border-color: rgba(255,255,255,0.3); border-top-color: #fff; }
  @keyframes gs-spin { to { transform: rotate(360deg); } }
`;

const styles = {
  page: { fontFamily: "Inter, system-ui, sans-serif" },
  center: { textAlign: "center", padding: 60, color: "#a1a1aa", fontSize: 14 },
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, color: "#a1a1aa", textDecoration: "none", marginBottom: 20, fontSize: 13, transition: "color .15s" },

  pageHeader: { display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 24, borderBottom: "1px solid #27272a" },
  headerIcon: { width: 48, height: 48, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" },
  title: { margin: 0, color: "#f4f4f5", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" },
  subtitle: { margin: "4px 0 0", color: "#a1a1aa", fontSize: 13 },

  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 24 },
  statCard: { padding: 20, borderRadius: 12, backgroundColor: "#18181b", border: "1px solid #27272a" },
  statIcon: { width: 36, height: 36, borderRadius: 8, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  progressCard: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: "#18181b", border: "1px solid #27272a" },
  progressTrack: { flex: 1, height: 8, borderRadius: 999, overflow: "hidden", backgroundColor: "#27272a" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#10b981", transition: "width .5s" },

  toolbar: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, margin: "32px 0 20px" },
  searchWrap: { position: "relative", flex: "1 1 260px", maxWidth: 320 },
  searchIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#71717a", pointerEvents: "none" },
  tabs: { display: "flex", gap: 2, padding: 2, borderRadius: 10, backgroundColor: "#18181b", border: "1px solid #27272a" },
  tab: { padding: "6px 12px", borderRadius: 8, border: "1px solid transparent", backgroundColor: "transparent", color: "#a1a1aa", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" },
  tabActive: { backgroundColor: "#27272a", borderColor: "#3f3f46", color: "#f4f4f5" },

  card: { padding: 20, borderRadius: 12, backgroundColor: "#18181b", border: "1px solid #27272a" },
  col: { display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14, minWidth: 0 },
  avatar: { width: 40, height: 40, flexShrink: 0, borderRadius: "50%", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 },
  studentName: { fontSize: 15, fontWeight: 600, color: "#f4f4f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  email: { marginTop: 2, fontSize: 12, color: "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  time: { display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, color: "#71717a" },
  statusPill: { alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, border: "1px solid", fontSize: 11, fontWeight: 600 },
  statusDot: { width: 6, height: 6, borderRadius: "50%" },
  sectionLabel: { display: "block", marginBottom: 8, fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "#71717a" },
  note: { padding: 12, borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: "#d4d4d8", backgroundColor: "#121215", border: "1px solid #27272a", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  noteEmpty: { color: "#71717a", fontStyle: "italic" },
  linkChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, fontSize: 12, color: "#e4e4e7", textDecoration: "none", backgroundColor: "#121215", border: "1px solid #27272a" },

  gradeForm: { display: "flex", flexDirection: "column", gap: 10, minWidth: 0 },
  input: { width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1px solid #27272a", backgroundColor: "#121215", color: "#f4f4f5", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" },
  scoreInput: { width: 120, height: 40, textAlign: "center", fontSize: 16, fontWeight: 600 },
  saveBtn: { alignSelf: "flex-end", display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 },

  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "48px 16px", textAlign: "center", color: "#a1a1aa", fontSize: 13, borderRadius: 12, border: "1px dashed #27272a", backgroundColor: "rgba(24,24,27,0.4)" },
  emptyIcon: { width: 48, height: 48, marginBottom: 4, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#71717a", backgroundColor: "#2a2a2d" },
};
