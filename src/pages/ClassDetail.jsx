import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { getUser } from "../api/client";
import { classApi } from "../api/classes";
import { lessonApi } from "../api/lessons";
import { assignmentApi } from "../api/assignments";
import { analyticsApi } from "../api/analytics";
import {
  CheckCircle, FileText, ArrowLeft, Plus, Download, X, Target, BookOpen, ClipboardList, Clock,
  AlarmClockOff, Infinity as InfinityIcon, ArrowRight, Check, ListOrdered, Trophy, CalendarClock,
  AlertTriangle, FilePlus2, BookPlus,
} from "lucide-react";

export default function ClassDetail() {
  const { classId } = useParams();
  const user = getUser();
  const isMentorOrAdmin = ["MENTOR", "ADMIN"].includes(user?.role);

  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // States cho Modals
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: "", content: "", order: 1 });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", description: "", deadline: "", maximum_score: 10 });
  const [submitting, setSubmitting] = useState(false);

  // UI state (trạng thái đang xử lý của nút)
  const [completingId, setCompletingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // 1. Hàm loadProgress
  const loadProgress = useCallback(() => {
    return classApi.getProgress(classId)
      .then(({ data }) => setProgress(data))
      .catch(() => {});
  }, [classId]);

  // 2. Hàm loadData - BỎ các lệnh setState đồng bộ ở đầu hàm
  const loadData = useCallback(() => {
    Promise.all([
      lessonApi.getByClass(classId).then(({ data }) => setLessons(data || [])).catch(() => setLessons([])),
      assignmentApi.getByClass(classId).then(({ data }) => setAssignments(data || [])).catch(() => setAssignments([])),
      loadProgress(),
    ])
      .catch((e) => setError(e.message || "Lỗi tải dữ liệu lớp học"))
      .finally(() => setLoading(false));
  }, [classId, loadProgress]);

  // 3. Gọi trong useEffect
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleComplete = async (lessonId) => {
    try {
      await lessonApi.complete(lessonId);
      await loadProgress();
      alert("Đã hoàn thành bài học!");
    } catch (e) {
      alert(e.message || "Lỗi khi đánh dấu hoàn thành");
    }
  };

  // Xử lý tạo Bài học mới
  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await lessonApi.create({ ...lessonForm, class_id: classId, order: Number(lessonForm.order) });
      alert("Tạo bài học thành công!");
      setShowLessonModal(false);
      setLessonForm({ title: "", content: "", order: lessons.length + 1 });
      loadData();
    } catch (err) {
      alert(err.message || "Không thể tạo bài học");
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý tạo Bài tập mới
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await assignmentApi.create({
        ...assignmentForm,
        class_id: classId,
        maximum_score: Number(assignmentForm.maximum_score),
      });
      alert("Tạo bài tập thành công! Thông báo đã được gửi tới học viên.");
      setShowAssignmentModal(false);
      setAssignmentForm({ title: "", description: "", deadline: "", maximum_score: 10 });
      loadData();
    } catch (err) {
      alert(err.message || "Không thể tạo bài tập");
    } finally {
      setSubmitting(false);
    }
  };

  // Xuất Excel
  const handleExportExcel = async () => {
    try {
      await analyticsApi.exportExcel(classId);
    } catch (err) {
      alert(err.message || "Không thể xuất file Excel");
    }
  };

  const onCompleteClick = async (lessonId) => {
    setCompletingId(lessonId);
    await handleComplete(lessonId);
    setCompletingId(null);
  };

  const onExportClick = async () => {
    setExporting(true);
    await handleExportExcel();
    setExporting(false);
  };

  if (loading) {
    return (
      <div style={styles.centerText}>
        <style>{css}</style>
        <div className="cd-spinner" />
        Đang tải nội dung lớp học...
      </div>
    );
  }
  if (error) {
    return (
      <div style={styles.errorText}>
        <AlertTriangle size={18} style={{ flexShrink: 0 }} /> {error}
      </div>
    );
  }

  const percent = Math.min(100, progress?.progress || 0);

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Hàng trên: quay lại + xuất Excel */}
      <div style={styles.topRow}>
        <Link to="/classes" className="cd-back" style={styles.backBtn}>
          <ArrowLeft size={16} className="cd-back-icon" /> Quay lại danh sách lớp
        </Link>

        {isMentorOrAdmin && (
          <button onClick={onExportClick} disabled={exporting} className="cd-btn-excel" style={styles.excelBtn}>
            {exporting ? <div className="cd-spinner cd-spinner-sm" /> : <Download size={16} />}
            {exporting ? "Đang xuất..." : "Xuất Bảng Điểm Excel"}
          </button>
        )}
      </div>

      {/* Tiến độ học tập */}
      {progress && (
        <section style={styles.heroCard}>
          <div style={{ ...styles.glow, top: -80, right: -80, backgroundColor: "rgba(37,99,235,0.12)" }} />
          <div style={{ ...styles.glow, bottom: -80, left: "33%", backgroundColor: "rgba(16,185,129,0.1)" }} />

          <div style={{ position: "relative" }}>
            <div style={styles.heroTop}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={styles.heroIcon}><Target size={24} /></div>
                <div>
                  <h2 style={styles.heroTitle}>Tiến độ học tập của bạn</h2>
                  <p style={styles.heroSubtitle}>
                    Đã hoàn thành{" "}
                    <strong style={{ color: "#34d399" }}>
                      {progress.completedLessons || 0}/{progress.totalLessons || 0} bài học
                    </strong>
                    {percent === 100 ? " • Xuất sắc, bạn đã học xong lớp này!" : " • Hãy tiếp tục duy trì nhịp độ học tập!"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={styles.heroPercent}>{percent}%</span>
                <span style={styles.heroPercentLabel}>hoàn tất</span>
              </div>
            </div>

            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${percent}%` }} />
            </div>

            <div style={styles.heroStats}>
              <StatPill color="#3b82f6" label="Bài học" value={`${lessons.length} bài`} />
              <StatPill color="#fbbf24" label="Bài tập" value={`${assignments.length} bài`} />
              <StatPill color="#34d399" label="Đã hoàn thành" value={`${progress.completedLessons || 0} bài`} valueColor="#34d399" />
            </div>
          </div>
        </section>
      )}

      <div className="cd-grid">
        {/* Cột 1: Danh sách Bài học */}
        <section style={styles.sectionBox}>
          <SectionHeader
            icon={<BookOpen size={18} />}
            color="#60a5fa"
            title="Danh sách Bài học"
            subtitle="Lộ trình bài giảng của lớp"
            count={lessons.length}
            action={isMentorOrAdmin && (
              <button onClick={() => setShowLessonModal(true)} className="cd-btn-primary" style={styles.addBtn}>
                <Plus size={14} /> Bài học
              </button>
            )}
          />

          {lessons.length === 0 ? (
            <EmptyState icon={<BookOpen size={20} />} text="Lớp học này chưa có bài học nào." />
          ) : (
            <div style={styles.list}>
              {lessons.map((l, i) => (
                <div key={l.id} className="cd-item" style={styles.itemCard}>
                  <div style={styles.orderCircle}>{l.order ?? i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="cd-item-title" style={styles.itemTitle}>{l.title}</h4>
                    {l.content && <p className="cd-clamp" style={styles.itemText}>{l.content}</p>}
                  </div>
                  <button
                    onClick={() => onCompleteClick(l.id)}
                    disabled={completingId === l.id}
                    className="cd-btn-complete"
                    style={styles.completeBtn}
                  >
                    {completingId === l.id ? <div className="cd-spinner cd-spinner-sm cd-spinner-green" /> : <CheckCircle size={15} />}
                    Hoàn thành
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cột 2: Danh sách Bài tập */}
        <section style={styles.sectionBox}>
          <SectionHeader
            icon={<ClipboardList size={18} />}
            color="#fbbf24"
            title="Bài tập về nhà"
            subtitle="Nộp bài & nhận phản hồi từ giảng viên"
            count={assignments.length}
            action={isMentorOrAdmin && (
              <button onClick={() => setShowAssignmentModal(true)} className="cd-btn-amber" style={{ ...styles.addBtn, ...styles.addBtnAmber }}>
                <Plus size={14} /> Bài tập
              </button>
            )}
          />

          {assignments.length === 0 ? (
            <EmptyState icon={<FileText size={20} />} text="Lớp học này chưa có bài tập nào." />
          ) : (
            <div style={styles.list}>
              {assignments.map((a) => {
                const dl = describeDeadline(a.deadline);
                return (
                  <div key={a.id} className={`cd-item ${dl.overdue ? "cd-item-overdue" : "cd-item-amber"}`} style={{ ...styles.itemCard, alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      <h4 className="cd-item-title" style={styles.itemTitle}>{a.title}</h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <span style={{ ...styles.chip, ...dl.style }}>
                          {dl.icon} {dl.text}
                        </span>
                        {a.maximum_score != null && (
                          <span style={{ ...styles.chip, ...styles.chipBlue }}>
                            <Trophy size={12} /> {a.maximum_score} điểm
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/assignments/${a.id}`}
                      className={dl.overdue ? "cd-btn-ghost" : "cd-btn-detail"}
                      style={{ ...styles.detailBtn, ...(dl.overdue ? styles.detailBtnMuted : {}) }}
                    >
                      Chi tiết & Nộp bài <ArrowRight size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal Tạo Bài Học */}
      {showLessonModal && (
        <Modal
          icon={<BookPlus size={20} />}
          color="#60a5fa"
          title="Thêm Bài Học Mới"
          subtitle="Tạo nội dung bài giảng và thứ tự trong lớp học"
          onClose={() => setShowLessonModal(false)}
        >
          <form onSubmit={handleCreateLesson}>
            <div style={styles.modalBody}>
              <div style={styles.field}>
                <label style={styles.label}>Tiêu đề bài học <span style={styles.req}>*</span></label>
                <input
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="Ví dụ: Bài 1 - Khái niệm RESTful API"
                  className="cd-input"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Nội dung bài học <span style={styles.req}>*</span></label>
                <textarea
                  required
                  rows={4}
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="Nội dung chi tiết..."
                  className="cd-input"
                  style={{ ...styles.input, ...styles.textarea }}
                />
              </div>
              <div style={{ ...styles.field, maxWidth: 220 }}>
                <label style={styles.label}>Thứ tự (Order)</label>
                <div style={{ position: "relative" }}>
                  <ListOrdered size={16} style={styles.inputIcon} />
                  <input
                    type="number"
                    value={lessonForm.order}
                    onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })}
                    className="cd-input"
                    style={{ ...styles.input, paddingLeft: 36 }}
                  />
                </div>
                <span style={styles.hint}>Vị trí hiển thị trong danh sách (không được trùng)</span>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setShowLessonModal(false)} className="cd-btn-ghost" style={styles.cancelBtn}>Hủy</button>
              <button disabled={submitting} type="submit" className="cd-btn-primary" style={styles.saveBtn}>
                {submitting ? <div className="cd-spinner cd-spinner-sm" /> : <Check size={16} />}
                {submitting ? "Đang lưu..." : "Tạo bài học"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Tạo Bài Tập */}
      {showAssignmentModal && (
        <Modal
          icon={<FilePlus2 size={20} />}
          color="#fbbf24"
          title="Thêm Bài Tập Mới"
          subtitle="Học viên trong lớp sẽ nhận được thông báo"
          onClose={() => setShowAssignmentModal(false)}
        >
          <form onSubmit={handleCreateAssignment}>
            <div style={styles.modalBody}>
              <div style={styles.field}>
                <label style={styles.label}>Tiêu đề bài tập <span style={styles.req}>*</span></label>
                <input
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="Ví dụ: Bài tập Nộp bài qua Link Github"
                  className="cd-input cd-input-amber"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Mô tả bài tập</label>
                <textarea
                  rows={3}
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Yêu cầu đề bài..."
                  className="cd-input cd-input-amber"
                  style={{ ...styles.input, ...styles.textarea }}
                />
              </div>
              <div style={styles.fieldRow}>
                <div style={{ ...styles.field, flex: "1 1 200px" }}>
                  <label style={styles.label}>Hạn nộp (Deadline)</label>
                  <div style={{ position: "relative" }}>
                    <CalendarClock size={16} style={styles.inputIcon} />
                    <input
                      type="datetime-local"
                      value={assignmentForm.deadline}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })}
                      className="cd-input cd-input-amber"
                      style={{ ...styles.input, paddingLeft: 36, colorScheme: "dark" }}
                    />
                  </div>
                </div>
                <div style={{ ...styles.field, flex: "1 1 120px" }}>
                  <label style={styles.label}>Điểm tối đa</label>
                  <div style={{ position: "relative" }}>
                    <Trophy size={16} style={styles.inputIcon} />
                    <input
                      type="number"
                      value={assignmentForm.maximum_score}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, maximum_score: e.target.value })}
                      className="cd-input cd-input-amber"
                      style={{ ...styles.input, paddingLeft: 36 }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setShowAssignmentModal(false)} className="cd-btn-ghost" style={styles.cancelBtn}>Hủy</button>
              <button disabled={submitting} type="submit" className="cd-btn-amber" style={{ ...styles.saveBtn, ...styles.saveBtnAmber }}>
                {submitting ? <div className="cd-spinner cd-spinner-sm cd-spinner-dark" /> : <Check size={16} />}
                {submitting ? "Đang lưu..." : "Tạo bài tập"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatPill({ color, label, value, valueColor = "#f4f4f5" }) {
  return (
    <div style={styles.statPill}>
      <span style={{ ...styles.dot, backgroundColor: color }} />
      <span style={{ color: "#a1a1aa" }}>{label}:</span>
      <strong style={{ color: valueColor }}>{value}</strong>
    </div>
  );
}

function SectionHeader({ icon, color, title, subtitle, count, action }) {
  return (
    <div style={styles.sectionHeader}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ ...styles.sectionIcon, color, backgroundColor: `${color}26`, borderColor: `${color}4d` }}>{icon}</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={styles.sectionTitle}>{title}</h3>
            <span style={{ ...styles.countBadge, color, backgroundColor: `${color}26`, borderColor: `${color}4d` }}>{count}</span>
          </div>
          <p style={styles.sectionSubtitle}>{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={styles.empty}>
      <div style={styles.emptyIcon}>{icon}</div>
      <p style={{ margin: 0, fontSize: 13, color: "#a1a1aa" }}>{text}</p>
    </div>
  );
}

function Modal({ icon, color, title, subtitle, onClose, children }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div className="cd-modal" style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ ...styles.modalIcon, color, backgroundColor: `${color}26`, borderColor: `${color}4d` }}>{icon}</div>
            <div>
              <h3 style={styles.modalTitle}>{title}</h3>
              <p style={styles.modalSubtitle}>{subtitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="cd-btn-ghost" style={styles.closeBtn} title="Đóng">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const DAY = 24 * 60 * 60 * 1000;

const describeDeadline = (deadline) => {
  if (!deadline) {
    return { text: "Không có hạn nộp", icon: <InfinityIcon size={12} />, style: { color: "#71717a" }, overdue: false };
  }
  const date = new Date(deadline);
  const diff = date - new Date();
  const formatted = date.toLocaleString("vi-VN");
  if (diff < 0) {
    return { text: `Đã quá hạn (${formatted})`, icon: <AlarmClockOff size={12} />, style: styles.chipDanger, overdue: true };
  }
  const days = Math.floor(diff / DAY);
  const remain = days >= 1 ? `còn ${days} ngày` : "hết hạn hôm nay";
  return {
    text: `Hạn nộp: ${formatted} (${remain})`,
    icon: <Clock size={12} />,
    style: days < 2 ? styles.chipWarn : {},
    overdue: false,
  };
};

// Hover / focus / responsive / animation không làm được bằng inline style
const css = `
  .cd-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; align-items: start; }
  @media (max-width: 900px) { .cd-grid { grid-template-columns: 1fr; } }
  .cd-back:hover { color: #f4f4f5 !important; }
  .cd-back-icon { transition: transform .15s; }
  .cd-back:hover .cd-back-icon { transform: translateX(-2px); }
  .cd-item { transition: background-color .15s, border-color .15s; }
  .cd-item:hover { background-color: #202024 !important; border-color: #3f3f46 !important; }
  .cd-item:hover .cd-item-title { color: #60a5fa; }
  .cd-item-amber:hover { border-color: rgba(245,158,11,0.4) !important; }
  .cd-item-amber:hover .cd-item-title { color: #fbbf24; }
  .cd-item-overdue:hover { border-color: rgba(244,63,94,0.4) !important; }
  .cd-item-overdue:hover .cd-item-title { color: #fb7185; }
  .cd-item-title { transition: color .15s; }
  .cd-clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cd-btn-primary, .cd-btn-amber, .cd-btn-excel, .cd-btn-complete, .cd-btn-detail { transition: background-color .15s, border-color .15s, color .15s, transform .1s; }
  .cd-btn-primary:hover:not(:disabled) { background-color: #3b82f6 !important; }
  .cd-btn-amber:hover:not(:disabled) { background-color: #fcd34d !important; }
  .cd-btn-excel:hover:not(:disabled) { background-color: rgba(16,185,129,0.2) !important; }
  .cd-btn-complete:hover:not(:disabled) { color: #34d399 !important; background-color: rgba(16,185,129,0.12) !important; border-color: rgba(16,185,129,0.4) !important; }
  .cd-btn-detail:hover { background-color: rgba(245,158,11,0.2) !important; color: #fde68a !important; }
  .cd-btn-ghost:hover { color: #f4f4f5 !important; background-color: #27272a !important; }
  .cd-btn-primary:active:not(:disabled), .cd-btn-amber:active:not(:disabled), .cd-btn-complete:active:not(:disabled) { transform: scale(0.97); }
  .cd-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 1px #3b82f6; }
  .cd-input-amber:focus { border-color: #f59e0b !important; box-shadow: 0 0 0 1px #f59e0b; }
  .cd-input::placeholder { color: #71717a; }
  .cd-modal { animation: cd-pop .18s ease-out; }
  @keyframes cd-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  .cd-spinner { width: 28px; height: 28px; margin: 0 auto 12px; border: 3px solid #27272a; border-top-color: #3b82f6; border-radius: 50%; animation: cd-spin .8s linear infinite; }
  .cd-spinner-sm { width: 14px; height: 14px; margin: 0; border-width: 2px; border-color: rgba(255,255,255,0.3); border-top-color: #fff; }
  .cd-spinner-green { border-color: rgba(52,211,153,0.3); border-top-color: #34d399; }
  .cd-spinner-dark { border-color: rgba(0,0,0,0.2); border-top-color: #000; }
  @keyframes cd-spin { to { transform: rotate(360deg); } }
`;

const styles = {
  page: { fontFamily: "Inter, system-ui, sans-serif", display: "flex", flexDirection: "column", gap: 24 },
  centerText: { textAlign: "center", padding: 60, color: "#a1a1aa", fontSize: 14 },
  errorText: { display: "flex", alignItems: "center", gap: 10, color: "#fda4af", padding: 16, backgroundColor: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 12, fontSize: 14 },

  topRow: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 },
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, color: "#a1a1aa", textDecoration: "none", fontSize: 13, fontWeight: 500, transition: "color .15s" },
  excelBtn: { display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 500, fontSize: 13 },

  heroCard: { position: "relative", overflow: "hidden", backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.35)" },
  glow: { position: "absolute", width: 260, height: 260, borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" },
  heroTop: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 20 },
  heroIcon: { width: 48, height: 48, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" },
  heroTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: "#f4f4f5", letterSpacing: "-0.02em" },
  heroSubtitle: { margin: "4px 0 0", fontSize: 13, color: "#a1a1aa" },
  heroPercent: { fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(90deg, #60a5fa, #5eead4, #34d399)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" },
  heroPercentLabel: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" },
  progressTrack: { marginTop: 20, height: 14, padding: 2, boxSizing: "border-box", borderRadius: 999, backgroundColor: "#27272a", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #2563eb, #06b6d4, #34d399)", transition: "width .7s ease-out" },
  heroStats: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(39,39,42,0.6)" },
  statPill: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, fontSize: 12, backgroundColor: "#202024", border: "1px solid #27272a" },
  dot: { width: 8, height: 8, borderRadius: "50%" },

  sectionBox: { display: "flex", flexDirection: "column", gap: 16, backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #27272a" },
  sectionIcon: { width: 32, height: 32, borderRadius: 8, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  sectionTitle: { margin: 0, fontSize: 15, fontWeight: 700, color: "#f4f4f5", letterSpacing: "-0.01em" },
  sectionSubtitle: { margin: "2px 0 0", fontSize: 11, color: "#a1a1aa" },
  countBadge: { padding: "1px 8px", borderRadius: 999, border: "1px solid", fontSize: 11, fontWeight: 600 },
  addBtn: { display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12, boxShadow: "0 4px 12px rgba(37,99,235,0.25)" },
  addBtnAmber: { backgroundColor: "#fbbf24", color: "#000", boxShadow: "0 4px 12px rgba(251,191,36,0.2)" },

  list: { display: "flex", flexDirection: "column", gap: 12 },
  itemCard: { display: "flex", alignItems: "flex-start", gap: 14, padding: 14, borderRadius: 12, backgroundColor: "rgba(32,32,36,0.6)", border: "1px solid #27272a" },
  orderCircle: { width: 32, height: 32, flexShrink: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#60a5fa", backgroundColor: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)" },
  itemTitle: { margin: 0, fontSize: 14, fontWeight: 600, color: "#f4f4f5" },
  itemText: { margin: "4px 0 0", fontSize: 12, lineHeight: 1.6, color: "#a1a1aa", whiteSpace: "pre-wrap" },
  completeBtn: { alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, backgroundColor: "transparent", color: "#a1a1aa", border: "1px solid #27272a", padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500 },
  chip: { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, fontSize: 11, color: "#a1a1aa", backgroundColor: "#27272a", border: "1px solid transparent" },
  chipDanger: { color: "#fb7185", backgroundColor: "rgba(244,63,94,0.15)", borderColor: "rgba(244,63,94,0.3)", fontWeight: 500 },
  chipWarn: { color: "#fbbf24", backgroundColor: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.3)" },
  chipBlue: { color: "#60a5fa", backgroundColor: "rgba(59,130,246,0.12)", borderColor: "rgba(59,130,246,0.3)" },
  detailBtn: { display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, textDecoration: "none", color: "#fbbf24", backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" },
  detailBtnMuted: { color: "#a1a1aa", backgroundColor: "#27272a", borderColor: "#3f3f46" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "28px 16px", textAlign: "center", borderRadius: 12, border: "1px dashed #27272a", backgroundColor: "rgba(24,24,27,0.5)" },
  emptyIcon: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#71717a", backgroundColor: "#202024" },

  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16, zIndex: 1000 },
  modalContent: { width: "100%", maxWidth: 520, backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 16, color: "#f4f4f5", overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.7)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #27272a", backgroundColor: "#1b1b1e" },
  modalIcon: { width: 40, height: 40, borderRadius: 12, border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center" },
  modalTitle: { margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" },
  modalSubtitle: { margin: "2px 0 0", fontSize: 12, color: "#a1a1aa" },
  closeBtn: { display: "flex", padding: 6, border: "none", borderRadius: 8, backgroundColor: "transparent", color: "#a1a1aa", cursor: "pointer" },
  modalBody: { padding: 24 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 12, padding: "14px 24px", borderTop: "1px solid #27272a", backgroundColor: "#141416" },

  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  fieldRow: { display: "flex", flexWrap: "wrap", gap: 16 },
  label: { fontSize: 12, fontWeight: 600, color: "#f4f4f5" },
  req: { color: "#f43f5e" },
  hint: { fontSize: 11, color: "#71717a" },
  input: { width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#f4f4f5", fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" },
  textarea: { resize: "vertical", lineHeight: 1.6, minHeight: 96 },
  inputIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#71717a", pointerEvents: "none" },
  saveBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: "0 8px 20px rgba(37,99,235,0.3)" },
  saveBtnAmber: { backgroundColor: "#fbbf24", color: "#000", boxShadow: "0 8px 20px rgba(251,191,36,0.2)" },
  cancelBtn: { padding: "9px 16px", backgroundColor: "transparent", color: "#a1a1aa", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer" },
};
