import { useEffect, useState } from "react";
import { submissionApi } from "../api/submissions";
import {
  History, X, Code2, FileArchive, ExternalLink, Clock, BadgeCheck, Hourglass, Archive, MessageSquareQuote,
} from "lucide-react";

/**
 * Timeline các phiên bản bài nộp (GET /submissions/:id/history)
 *  - current: bản đang có hiệu lực (version mới nhất)
 *  - history: các bản cũ đã lưu trữ (mới nhất trước)
 * props: submissionId, maxScore, reloadKey (đổi giá trị để tải lại), onLoaded(result)
 */
export function SubmissionTimeline({ submissionId, maxScore, reloadKey = 0, onLoaded }) {
  const [state, setState] = useState({ loading: true, error: "", data: null, key: null });
  const key = `${submissionId}:${reloadKey}`;

  useEffect(() => {
    if (!submissionId) return;
    let cancelled = false;
    submissionApi.getHistory(submissionId)
      .then(({ data }) => {
        if (cancelled) return;
        setState({ loading: false, error: "", data, key });
        onLoaded?.(data);
      })
      .catch((e) => !cancelled && setState({ loading: false, error: e.message || "Không tải được lịch sử", data: null, key }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = state.loading || state.key !== key;

  if (loading) {
    return (
      <div style={styles.center}>
        <style>{css}</style>
        <div className="sh-spinner" /> Đang tải lịch sử nộp bài...
      </div>
    );
  }
  if (state.error) return <div style={styles.error}>{state.error}</div>;

  const { current, history = [] } = state.data || {};
  const versions = [
    ...(current ? [{ ...current, _current: true }] : []),
    ...history,
  ];

  if (versions.length === 0) return <div style={styles.center}>Chưa có dữ liệu nộp bài.</div>;

  return (
    <div style={styles.timeline}>
      <style>{css}</style>
      {versions.map((v, i) => (
        <VersionItem key={v._current ? "current" : v.id || v.version} v={v} maxScore={maxScore} last={i === versions.length - 1} />
      ))}
    </div>
  );
}

function VersionItem({ v, maxScore, last }) {
  const graded = v.score !== null && v.score !== undefined;
  const accent = v._current ? "#3b82f6" : "#52525b";

  return (
    <div style={styles.item}>
      {/* Trục timeline */}
      <div style={styles.rail}>
        <div style={{ ...styles.node, borderColor: accent, color: v._current ? "#fff" : "#a1a1aa", backgroundColor: v._current ? accent : "#18181b" }}>
          v{v.version ?? "?"}
        </div>
        {!last && <div style={styles.line} />}
      </div>

      <div style={{ ...styles.card, ...(v._current ? styles.cardCurrent : {}) }}>
        <div style={styles.cardTop}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 13, color: "#f4f4f5" }}>Lần nộp thứ {v.version ?? "?"}</strong>
            {v._current ? (
              <span style={{ ...styles.tag, ...styles.tagCurrent }}>Hiện tại</span>
            ) : (
              <span style={styles.tag}><Archive size={11} /> Đã lưu trữ</span>
            )}
          </div>
          <span style={{ ...styles.tag, ...(graded ? styles.tagGraded : styles.tagPending) }}>
            {graded ? <BadgeCheck size={12} /> : <Hourglass size={12} />}
            {graded ? `${fmtScore(v.score)}${maxScore != null ? ` / ${maxScore}` : ""} điểm` : v._current ? "Chờ chấm" : "Chưa chấm"}
          </span>
        </div>

        <div style={styles.meta}>
          <span><Clock size={12} /> Nộp: {fmtDate(v.submitted_at)}</span>
          {v.reviewed_at && <span><BadgeCheck size={12} /> Chấm: {fmtDate(v.reviewed_at)}</span>}
          {v.archived_at && <span><Archive size={12} /> Thay thế: {fmtDate(v.archived_at)}</span>}
        </div>

        {v.content && <div style={styles.content}>{v.content}</div>}

        {(v.repository_url || v.file_url) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {v.repository_url && (
              <a href={v.repository_url} target="_blank" rel="noreferrer" className="sh-chip" style={{ ...styles.chip, color: "#60a5fa" }}>
                <Code2 size={13} /> Repository <ExternalLink size={11} />
              </a>
            )}
            {v.file_url && (
              <a href={v.file_url} target="_blank" rel="noreferrer" className="sh-chip" style={styles.chip}>
                <FileArchive size={13} color="#34d399" /> File đính kèm <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}

        {v.feedback && (
          <div style={styles.feedback}>
            <MessageSquareQuote size={13} style={{ flexShrink: 0, marginTop: 2, color: "#71717a" }} />
            <span>{v.feedback}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Modal xem lịch sử nộp bài (dùng cho trang chấm bài của Mentor) */
export function SubmissionHistoryModal({ submission, maxScore, onClose }) {
  if (!submission) return null;
  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{css}</style>
      <div className="sh-modal" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={styles.modalIcon}><History size={20} /></div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Lịch sử nộp bài</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#a1a1aa" }}>
                {submission.member_name || "Học viên"}{submission.member_email ? ` · ${submission.member_email}` : ""}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="sh-ghost" style={styles.closeBtn} title="Đóng"><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>
          <SubmissionTimeline submissionId={submission.id} maxScore={maxScore} />
        </div>
      </div>
    </div>
  );
}

const fmtDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");
const fmtScore = (s) => (Number.isInteger(Number(s)) ? Number(s) : Number(s).toFixed(1));

const css = `
  .sh-spinner { width: 16px; height: 16px; border: 2px solid #27272a; border-top-color: #3b82f6; border-radius: 50%; animation: sh-spin .8s linear infinite; }
  @keyframes sh-spin { to { transform: rotate(360deg); } }
  .sh-chip { transition: border-color .15s; }
  .sh-chip:hover { border-color: rgba(59,130,246,0.5) !important; }
  .sh-ghost:hover { color: #f4f4f5 !important; background-color: #27272a !important; }
  .sh-modal { animation: sh-pop .18s ease-out; }
  @keyframes sh-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
`;

const styles = {
  center: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, color: "#a1a1aa", fontSize: 13 },
  error: { padding: 12, borderRadius: 8, fontSize: 13, color: "#fda4af", backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)" },
  timeline: { display: "flex", flexDirection: "column" },
  item: { display: "flex", gap: 14 },
  rail: { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 },
  node: { width: 34, height: 34, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 },
  line: { flex: 1, width: 2, minHeight: 16, backgroundColor: "#27272a", margin: "4px 0" },
  card: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10, padding: 14, marginBottom: 14, borderRadius: 10, backgroundColor: "#121215", border: "1px solid #27272a" },
  cardCurrent: { borderColor: "rgba(59,130,246,0.45)", backgroundColor: "rgba(59,130,246,0.06)" },
  cardTop: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 },
  tag: { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "#a1a1aa", backgroundColor: "#202024", border: "1px solid #27272a" },
  tagCurrent: { color: "#93c5fd", backgroundColor: "rgba(59,130,246,0.15)", borderColor: "rgba(59,130,246,0.35)" },
  tagGraded: { color: "#34d399", backgroundColor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.3)" },
  tagPending: { color: "#fbbf24", backgroundColor: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" },
  meta: { display: "flex", flexWrap: "wrap", gap: 14, fontSize: 11, color: "#71717a" },
  content: { padding: 10, borderRadius: 8, fontSize: 12, lineHeight: 1.6, color: "#d4d4d8", backgroundColor: "#09090b", border: "1px solid #27272a", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 160, overflowY: "auto" },
  chip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 8, fontSize: 12, color: "#e4e4e7", textDecoration: "none", backgroundColor: "#09090b", border: "1px solid #27272a" },
  feedback: { display: "flex", gap: 8, fontSize: 12, lineHeight: 1.6, color: "#d4d4d8", fontStyle: "italic", whiteSpace: "pre-wrap" },

  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16, zIndex: 1000 },
  modal: { width: "100%", maxWidth: 620, maxHeight: "88vh", display: "flex", flexDirection: "column", backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 16, color: "#f4f4f5", overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.7)", fontFamily: "Inter, system-ui, sans-serif" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "18px 24px", borderBottom: "1px solid #27272a", backgroundColor: "#1b1b1e" },
  modalIcon: { width: 40, height: 40, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa", backgroundColor: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" },
  closeBtn: { display: "flex", padding: 6, border: "none", borderRadius: 8, backgroundColor: "transparent", color: "#a1a1aa", cursor: "pointer" },
  modalBody: { padding: 24, overflowY: "auto" },
};
