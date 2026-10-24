import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { getUser } from "../api/client";
import { classApi } from "../api/classes";
import { lessonApi } from "../api/lessons";
import { assignmentApi } from "../api/assignments";
import { analyticsApi } from "../api/analytics";
import { CheckCircle, FileText, Book, ArrowLeft, Plus, Download, X } from "lucide-react";

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

  if (loading) return <div style={styles.centerText}>⏳ Đang tải nội dung lớp học...</div>;
  if (error) return <div style={styles.errorText}>❌ {error}</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Link to="/classes" style={styles.backBtn}><ArrowLeft size={16} /> Quay lại danh sách lớp</Link>

        {isMentorOrAdmin && (
          <button onClick={handleExportExcel} style={styles.excelBtn}>
            <Download size={16} /> Xuất Bảng Điểm Excel
          </button>
        )}
      </div>

      {/* Tiến độ học tập */}
      {progress && (
        <div style={styles.progressCard}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: "bold" }}>🎯 Tiến độ học tập của bạn</span>
            <span style={{ color: "#3b82f6", fontWeight: "bold" }}>{progress.progress || 0}%</span>
          </div>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${progress.progress || 0}%` }} />
          </div>
          <small style={{ color: "#a1a1aa", marginTop: 8, display: "block" }}>
            Đã hoàn thành {progress.completedLessons || 0}/{progress.totalLessons || 0} bài học
          </small>
        </div>
      )}

      <div style={styles.sectionGrid}>
        {/* Cột 1: Danh sách Bài học */}
        <div style={styles.sectionBox}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}><Book color="#3b82f6" size={20} /> Danh sách Bài học</h3>
            {isMentorOrAdmin && (
              <button onClick={() => setShowLessonModal(true)} style={styles.addBtn}>
                <Plus size={14} /> Bài học
              </button>
            )}
          </div>

          {lessons.length === 0 ? (
            <p style={{ color: "#a1a1aa", fontSize: 14 }}>Lớp học này chưa có bài học nào.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {lessons.map((l) => (
                <div key={l.id} style={styles.itemCard}>
                  <div>
                    <h4 style={{ margin: "0 0 6px 0", color: "#fff" }}>{l.title}</h4>
                    <p style={{ margin: 0, color: "#a1a1aa", fontSize: 14 }}>{l.content}</p>
                  </div>
                  <button onClick={() => handleComplete(l.id)} style={styles.completeBtn}>
                    <CheckCircle size={16} /> Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột 2: Danh sách Bài tập */}
        <div style={styles.sectionBox}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}><FileText color="#eab308" size={20} /> Bài tập về nhà</h3>
            {isMentorOrAdmin && (
              <button onClick={() => setShowAssignmentModal(true)} style={{ ...styles.addBtn, backgroundColor: "#eab308", color: "#000" }}>
                <Plus size={14} /> Bài tập
              </button>
            )}
          </div>

          {assignments.length === 0 ? (
            <p style={{ color: "#a1a1aa", fontSize: 14 }}>Lớp học này chưa có bài tập nào.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {assignments.map((a) => (
                <div key={a.id} style={styles.itemCard}>
                  <div>
                    <h4 style={{ margin: "0 0 6px 0", color: "#fff" }}>{a.title}</h4>
                    <small style={{ color: "#f87171" }}>
                      Hạn nộp: {a.deadline ? new Date(a.deadline).toLocaleString("vi-VN") : "Không có hạn"}
                    </small>
                  </div>
                  <Link to={`/assignments/${a.id}`} style={styles.detailBtn}>
                    Chi tiết & Nộp bài
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Tạo Bài Học */}
      {showLessonModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>➕ Thêm Bài Học Mới</h3>
              <button onClick={() => setShowLessonModal(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateLesson}>
              <div style={styles.field}>
                <label style={styles.label}>Tiêu đề bài học:</label>
                <input
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="Ví dụ: Bài 1 - Khái niệm RESTful API"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Nội dung bài học:</label>
                <textarea
                  required
                  rows={4}
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="Nội dung chi tiết..."
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Thứ tự (Order):</label>
                <input
                  type="number"
                  value={lessonForm.order}
                  onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })}
                  style={styles.input}
                />
              </div>
              <button disabled={submitting} type="submit" style={styles.saveBtn}>
                {submitting ? "Đang lưu..." : "Tạo bài học"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo Bài Tập */}
      {showAssignmentModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>➕ Thêm Bài Tập Mới</h3>
              <button onClick={() => setShowAssignmentModal(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateAssignment}>
              <div style={styles.field}>
                <label style={styles.label}>Tiêu đề bài tập:</label>
                <input
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="Ví dụ: Bài tập Nộp bài qua Link Github"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Mô tả bài tập:</label>
                <textarea
                  rows={3}
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Yêu cầu đề bài..."
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Hạn nộp (Deadline):</label>
                <input
                  type="datetime-local"
                  value={assignmentForm.deadline}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Điểm tối đa:</label>
                <input
                  type="number"
                  value={assignmentForm.maximum_score}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, maximum_score: e.target.value })}
                  style={styles.input}
                />
              </div>
              <button disabled={submitting} type="submit" style={{ ...styles.saveBtn, backgroundColor: "#eab308", color: "#000" }}>
                {submitting ? "Đang lưu..." : "Tạo bài tập"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, color: "#a1a1aa", textDecoration: "none", fontSize: 14 },
  excelBtn: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 },
  progressCard: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20, marginBottom: 28 },
  progressBarBg: { height: 8, backgroundColor: "#27272a", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#3b82f6", transition: "width 0.3s" },
  sectionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  sectionBox: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 18, color: "#fff" },
  addBtn: { display: "inline-flex", alignItems: "center", gap: 4, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 },
  itemCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, backgroundColor: "#27272a", borderRadius: 8 },
  completeBtn: { display: "flex", alignItems: "center", gap: 6, backgroundColor: "#10b981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "bold" },
  detailBtn: { backgroundColor: "#3b82f6", color: "#fff", textDecoration: "none", padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: "bold" },
  centerText: { textAlign: "center", padding: 40, color: "#a1a1aa" },
  errorText: { color: "#f87171", padding: 20, backgroundColor: "#451a1a", borderRadius: 8 },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, width: "100%", maxWidth: 480, color: "#fff" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  closeBtn: { background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  label: { fontSize: 13, color: "#d4d4d8", fontWeight: "500" },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid #3f3f46", backgroundColor: "#27272a", color: "#fff", fontSize: 14, outline: "none" },
  saveBtn: { width: "100%", padding: 10, marginTop: 8, backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" },
};