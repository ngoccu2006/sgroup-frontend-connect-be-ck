import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUser } from "../api/client";
import { assignmentApi } from "../api/assignments";
import { submissionApi } from "../api/submissions";
import {
  ArrowLeft, FileCheck, Upload, ExternalLink, Trophy, Clock, Info, CloudUpload, FileArchive,
  X, CheckCircle2, Download, FileText, BadgeCheck, RefreshCw, Send, Inbox, Hourglass, Link2,
} from "lucide-react";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function AssignmentDetail() {
  const { id } = useParams();
  const user = getUser();
  const canGrade = ["MENTOR", "ADMIN"].includes(user?.role);

  const [assignment, setAssignment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [content, setContent] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // UI state (vùng kéo thả file)
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Không gọi setLoading(true) đồng bộ ở đây nữa vì state mặc định đã là true
    Promise.all([
      assignmentApi.getById(id).then(({ data }) => setAssignment(data)),
      submissionApi.getMine(id)
        .then(({ data }) => {
          setMySubmission(data);
          if (data) {
            setContent(data.content || "");
            setRepositoryUrl(data.repository_url || "");
          }
        })
        .catch(() => {}), // Chưa nộp bài thì BE trả 404, bỏ qua
    ])
      .catch((e) => alert(e.message || "Lỗi tải dữ liệu bài tập"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file && file.size > MAX_SIZE) return alert("Dung lượng file tối đa là 10MB!");

    setSubmitting(true);
    try {
      const { data } = await submissionApi.submit({
        assignment_id: id,
        content,
        repository_url: repositoryUrl,
        file,
      });
      setMySubmission(data);
      alert("Nộp bài thành công!");
    } catch (e) {
      alert(e.message || "Nộp bài thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <style>{css}</style>
        <div className="ad-spinner" />
        Đang tải thông tin bài tập...
      </div>
    );
  }
  if (!assignment) {
    return (
      <div style={styles.center}>
        <Inbox size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
        <div>Không tìm thấy bài tập.</div>
      </div>
    );
  }

  const deadline = assignment.deadline ? new Date(assignment.deadline) : null;
  const isOverdue = deadline && new Date() > deadline;
  const isGraded = mySubmission && mySubmission.score !== null && mySubmission.score !== undefined;
  const submittedLate = mySubmission && deadline && new Date(mySubmission.submitted_at) > deadline;
  const scorePercent = isGraded && assignment.maximum_score
    ? Math.min(100, Math.round((mySubmission.score / assignment.maximum_score) * 100))
    : 0;

  const status = isGraded
    ? { text: "Đã chấm điểm", color: "#60a5fa" }
    : mySubmission
      ? { text: "Đã nộp bài", color: "#34d399" }
      : { text: "Chưa nộp", color: "#a1a1aa" };

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <Link to={`/classes/${assignment.class_id}`} className="ad-back" style={styles.backBtn}>
        <ArrowLeft size={16} className="ad-back-icon" /> Quay lại lớp học
      </Link>

      {/* Header bài tập */}
      <section style={styles.card}>
        <div style={styles.headerRow}>
          <div style={{ minWidth: 0 }}>
            <span style={styles.kicker}>Bài tập</span>
            <h2 style={styles.title}>{assignment.title}</h2>
          </div>
          {canGrade && (
            <Link to={`/assignments/${id}/grade`} className="ad-btn-grade" style={styles.gradeBtn}>
              <FileCheck size={16} /> Chấm bài nộp
            </Link>
          )}
        </div>
        {assignment.description && <p style={styles.description}>{assignment.description}</p>}

        <div style={styles.divider} />

        <div style={styles.chips}>
          <div style={styles.chip}>
            <Trophy size={15} color="#fbbf24" />
            Điểm tối đa: <strong style={{ color: "#f4f4f5" }}>{assignment.maximum_score}</strong>
          </div>
          <div style={{ ...styles.chip, ...(deadline ? styles.chipDanger : {}) }}>
            <Clock size={15} />
            Hạn nộp: {deadline ? deadline.toLocaleString("vi-VN") : "Không giới hạn"}
            {isOverdue && <strong style={{ marginLeft: 4 }}>· Đã quá hạn</strong>}
          </div>
          <div style={{ ...styles.chip, color: status.color, backgroundColor: `${status.color}1a`, borderColor: `${status.color}4d` }}>
            <span style={{ ...styles.statusDot, backgroundColor: status.color }} />
            {status.text}
          </div>
        </div>
      </section>

      <div className="ad-grid">
        {/* Cột trái: Form nộp bài */}
        <form onSubmit={handleSubmit} style={{ ...styles.card, marginBottom: 0 }}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>
              {mySubmission ? <RefreshCw size={18} color="#60a5fa" /> : <Send size={18} color="#60a5fa" />}
              {mySubmission ? "Nộp lại bài làm (ghi đè)" : "Nộp bài làm"}
            </div>
          </div>

          {mySubmission && (
            <div style={styles.noteWarn}>
              <Info size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ color: "#fcd34d" }}>Lưu ý:</strong> Nộp lại sẽ ghi đè bài làm trước đó. Giảng viên sẽ chấm phiên bản nộp gần nhất.
              </div>
            </div>
          )}
          {isOverdue && (
            <div style={styles.noteDanger}>
              <Hourglass size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>Bài tập đã quá hạn nộp — hệ thống có thể từ chối bài nộp mới.</div>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Ghi chú / Nội dung</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập ghi chú hoặc câu trả lời..."
              rows={4}
              className="ad-input"
              style={{ ...styles.input, ...styles.textarea }}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Link Repository (GitHub/GitLab)</label>
            <div style={{ position: "relative" }}>
              <Link2 size={16} style={styles.inputIcon} />
              <input
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/username/project"
                className="ad-input"
                style={{ ...styles.input, paddingLeft: 38 }}
              />
            </div>
            <span style={styles.hint}>Đảm bảo repository ở trạng thái Public hoặc đã cấp quyền cho giảng viên.</span>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tệp đính kèm</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="ad-dropzone"
              style={{ ...styles.dropzone, ...(dragOver ? styles.dropzoneActive : {}) }}
            >
              <div className="ad-drop-icon" style={styles.dropIcon}>
                <CloudUpload size={20} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#e4e4e7" }}>Kéo thả hoặc bấm để chọn file</div>
              <div style={styles.hint}>PDF, ZIP, DOCX, PNG, JPG — dung lượng tối đa 10MB</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.zip,.docx,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files[0] || null)}
                style={{ display: "none" }}
              />
            </div>

            {file && (
              <div style={styles.fileChip}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={styles.fileIcon}><FileArchive size={16} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.fileName}>{file.name}</div>
                    <div style={{ fontSize: 11, color: file.size > MAX_SIZE ? "#f87171" : "#a1a1aa" }}>
                      {formatSize(file.size)}{file.size > MAX_SIZE && " · Vượt quá 10MB"}
                    </div>
                  </div>
                </div>
                <button type="button" onClick={clearFile} className="ad-btn-ghost" style={styles.iconBtn} title="Bỏ chọn file">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="ad-btn-primary" style={{ ...styles.submitBtn, ...(submitting ? styles.submitBtnDisabled : {}) }}>
            {submitting ? <div className="ad-spinner ad-spinner-sm" /> : <Upload size={16} />}
            {submitting ? "Đang gửi bài..." : "Gửi bài nộp"}
          </button>
        </form>

        {/* Cột phải: Bài đã nộp + kết quả */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {mySubmission ? (
            <section style={{ ...styles.card, marginBottom: 0 }}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <CheckCircle2 size={18} color="#34d399" /> Bài làm đã nộp
                </div>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Thời gian nộp</span>
                <span style={styles.infoValue}>{new Date(mySubmission.submitted_at).toLocaleString("vi-VN")}</span>
              </div>

              {mySubmission.repository_url && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Link Repo</span>
                  <a href={mySubmission.repository_url} target="_blank" rel="noreferrer" className="ad-link" style={styles.link}>
                    <span style={styles.truncate}>{mySubmission.repository_url.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink size={12} style={{ flexShrink: 0 }} />
                  </a>
                </div>
              )}

              {mySubmission.file_url && (
                <div style={{ ...styles.infoRow, flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                  <span style={styles.infoLabel}>File đính kèm</span>
                  <div style={styles.fileChipSmall}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <FileText size={16} color="#a1a1aa" style={{ flexShrink: 0 }} />
                      <span style={{ ...styles.fileName, fontSize: 12 }}>{fileNameFromUrl(mySubmission.file_url)}</span>
                    </div>
                    <a href={mySubmission.file_url} target="_blank" rel="noreferrer" className="ad-btn-ghost" style={styles.downloadBtn}>
                      <Download size={14} /> Tải về / Xem
                    </a>
                  </div>
                </div>
              )}

              {deadline && (
                <div style={{ ...styles.infoRow, borderBottom: "none", paddingBottom: 0 }}>
                  <span style={styles.infoLabel}>Trạng thái</span>
                  <span style={{ ...styles.pill, ...(submittedLate ? styles.pillDanger : styles.pillSuccess) }}>
                    {submittedLate ? "Nộp trễ hạn" : "Nộp đúng hạn"}
                  </span>
                </div>
              )}
            </section>
          ) : (
            <section style={{ ...styles.card, ...styles.emptyCard }}>
              <Inbox size={28} style={{ opacity: 0.5 }} />
              <div style={{ fontWeight: 500, color: "#e4e4e7" }}>Bạn chưa nộp bài</div>
              <div style={{ fontSize: 12 }}>Điền form bên cạnh và bấm "Gửi bài nộp".</div>
            </section>
          )}

          {mySubmission && (
            <section style={{ ...styles.card, marginBottom: 0 }}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <BadgeCheck size={18} color="#fbbf24" /> Kết quả chấm điểm
                </div>
                <span style={styles.tag}>{isGraded ? "Đã công bố" : "Đang chờ"}</span>
              </div>

              {isGraded ? (
                <>
                  <div style={styles.scoreBox}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={styles.scoreValue}>{mySubmission.score}</span>
                      <span style={{ color: "#a1a1aa", fontSize: 14 }}>/ {assignment.maximum_score}</span>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressBar, width: `${scorePercent}%` }} />
                    </div>
                    <div style={styles.hint}>{scorePercent}% điểm tối đa</div>
                  </div>
                  <div style={styles.feedback}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7", marginBottom: 6 }}>Nhận xét của giảng viên</div>
                    <div style={styles.quote}>{mySubmission.feedback || "Không có nhận xét"}</div>
                  </div>
                </>
              ) : (
                <div style={styles.pending}>
                  <Hourglass size={16} /> Chưa được chấm điểm
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

const formatSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const fileNameFromUrl = (url) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop()) || "File đính kèm";
  } catch {
    return "File đính kèm";
  }
};

// Hover / focus / responsive không làm được bằng inline style
const css = `
  .ad-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 24px; align-items: start; }
  @media (max-width: 900px) { .ad-grid { grid-template-columns: 1fr; } }
  .ad-back:hover { color: #f4f4f5 !important; }
  .ad-back:hover .ad-back-icon { transform: translateX(-2px); }
  .ad-back-icon { transition: transform .15s; }
  .ad-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 1px rgba(59,130,246,0.5); }
  .ad-input::placeholder { color: #71717a; }
  .ad-dropzone { transition: border-color .2s, background-color .2s; }
  .ad-dropzone:hover { border-color: rgba(59,130,246,0.5) !important; }
  .ad-dropzone:hover .ad-drop-icon { color: #60a5fa; background-color: rgba(59,130,246,0.1); }
  .ad-drop-icon { transition: color .2s, background-color .2s; }
  .ad-btn-primary { transition: background-color .15s, transform .1s; }
  .ad-btn-primary:hover:not(:disabled) { background-color: #3b82f6 !important; }
  .ad-btn-primary:active:not(:disabled) { transform: scale(0.99); }
  .ad-btn-grade:hover { background-color: rgba(245,158,11,0.2) !important; }
  .ad-btn-ghost:hover { color: #f4f4f5 !important; background-color: #27272a !important; }
  .ad-link:hover { color: #93c5fd !important; text-decoration: underline; }
  .ad-spinner { width: 28px; height: 28px; margin: 0 auto 12px; border: 3px solid #27272a; border-top-color: #3b82f6; border-radius: 50%; animation: ad-spin .8s linear infinite; }
  .ad-spinner-sm { width: 14px; height: 14px; margin: 0; border-width: 2px; border-color: rgba(255,255,255,0.3); border-top-color: #fff; }
  @keyframes ad-spin { to { transform: rotate(360deg); } }
`;

const styles = {
  page: { fontFamily: "Inter, system-ui, sans-serif" },
  center: { textAlign: "center", padding: 60, color: "#a1a1aa", fontSize: 14 },
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, color: "#a1a1aa", textDecoration: "none", marginBottom: 20, fontSize: 13, transition: "color .15s" },

  card: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 24 },
  headerRow: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  kicker: { display: "inline-block", marginBottom: 8, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#60a5fa", backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" },
  title: { margin: 0, color: "#f4f4f5", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" },
  description: { margin: "12px 0 0", color: "#a1a1aa", fontSize: 14, lineHeight: 1.65, maxWidth: 880, whiteSpace: "pre-wrap" },
  gradeBtn: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)", padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 500, fontSize: 13, transition: "background-color .15s" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  chips: { display: "flex", flexWrap: "wrap", gap: 12 },
  chip: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, color: "#d4d4d8", backgroundColor: "#202024", border: "1px solid #27272a" },
  chipDanger: { color: "#fb7185", backgroundColor: "rgba(244,63,94,0.1)", borderColor: "rgba(244,63,94,0.2)" },
  statusDot: { width: 8, height: 8, borderRadius: "50%" },

  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, marginBottom: 20, borderBottom: "1px solid #27272a" },
  cardTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, color: "#f4f4f5" },
  tag: { fontSize: 11, color: "#a1a1aa", backgroundColor: "#202024", border: "1px solid #27272a", padding: "2px 8px", borderRadius: 4 },
  noteWarn: { display: "flex", gap: 12, padding: 14, marginBottom: 20, borderRadius: 8, fontSize: 12, lineHeight: 1.6, color: "rgba(253,230,138,0.9)", backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" },
  noteDanger: { display: "flex", gap: 12, padding: 14, marginBottom: 20, borderRadius: 8, fontSize: 12, lineHeight: 1.6, color: "#fda4af", backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" },

  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 500, color: "#d4d4d8" },
  hint: { fontSize: 11, color: "#a1a1aa", marginTop: 2 },
  input: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#f4f4f5", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" },
  textarea: { minHeight: 110, resize: "vertical", lineHeight: 1.6 },
  inputIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#71717a", pointerEvents: "none" },

  dropzone: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 24, textAlign: "center", cursor: "pointer", borderRadius: 12, border: "2px dashed #27272a", backgroundColor: "rgba(9,9,11,0.5)" },
  dropzoneActive: { borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.06)" },
  dropIcon: { width: 40, height: 40, marginBottom: 6, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#a1a1aa", backgroundColor: "#202024", border: "1px solid #27272a" },
  fileChip: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 10, padding: 12, borderRadius: 8, backgroundColor: "#09090b", border: "1px solid #27272a" },
  fileChipSmall: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: 10, borderRadius: 8, backgroundColor: "#09090b", border: "1px solid #27272a" },
  fileIcon: { width: 32, height: 32, flexShrink: 0, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" },
  fileName: { fontSize: 13, fontWeight: 500, color: "#e4e4e7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  iconBtn: { display: "flex", padding: 6, border: "none", borderRadius: 6, backgroundColor: "transparent", color: "#a1a1aa", cursor: "pointer" },

  submitBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, boxShadow: "0 8px 20px rgba(37,99,235,0.2)" },
  submitBtnDisabled: { opacity: 0.7, cursor: "not-allowed" },

  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #202024", fontSize: 12 },
  infoLabel: { color: "#a1a1aa", flexShrink: 0 },
  infoValue: { color: "#e4e4e7", fontWeight: 500 },
  link: { display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0, maxWidth: 240, color: "#60a5fa", textDecoration: "none" },
  truncate: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  downloadBtn: { display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, padding: "4px 8px", borderRadius: 6, fontSize: 12, color: "#60a5fa", textDecoration: "none" },
  pill: { display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, border: "1px solid" },
  pillSuccess: { color: "#34d399", backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.3)" },
  pillDanger: { color: "#fb7185", backgroundColor: "rgba(244,63,94,0.1)", borderColor: "rgba(244,63,94,0.3)" },
  emptyCard: { marginBottom: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 40, textAlign: "center", color: "#a1a1aa", fontSize: 13, borderStyle: "dashed" },

  scoreBox: { padding: 16, marginBottom: 16, borderRadius: 12, backgroundColor: "#09090b", border: "1px solid #27272a" },
  scoreValue: { fontSize: 36, fontWeight: 700, letterSpacing: "-0.025em", color: "#f4f4f5" },
  progressTrack: { height: 8, marginTop: 10, borderRadius: 999, overflow: "hidden", backgroundColor: "#202024" },
  progressBar: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #3b82f6, #34d399)", transition: "width .4s" },
  feedback: { padding: 14, borderRadius: 8, backgroundColor: "rgba(32,32,36,0.6)", border: "1px solid #27272a" },
  quote: { paddingLeft: 12, borderLeft: "2px solid rgba(59,130,246,0.5)", fontSize: 13, lineHeight: 1.6, color: "#d4d4d8", fontStyle: "italic", whiteSpace: "pre-wrap" },
  pending: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, borderRadius: 8, fontSize: 13, color: "#a1a1aa", backgroundColor: "#09090b", border: "1px dashed #27272a" },
};
