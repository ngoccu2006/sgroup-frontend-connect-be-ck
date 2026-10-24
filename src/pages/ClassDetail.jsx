import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { classApi } from "../api/classes";
import { lessonApi } from "../api/lessons";
import { assignmentApi } from "../api/assignments";
import { CheckCircle, FileText, Book, ArrowLeft } from "lucide-react";

export default function ClassDetail() {
  const { classId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Đưa loadProgress vào useCallback để không bị cảnh báo missing dependency
  const loadProgress = useCallback(() => {
    return classApi.getProgress(classId)
      .then(({ data }) => setProgress(data))
      .catch(() => {});
  }, [classId]);

  useEffect(() => {
    // Không cần gọi setLoading(true) đồng bộ ở đây nữa vì mặc định state loading đã = true
    Promise.all([
      lessonApi.getByClass(classId).then(({ data }) => setLessons(data || [])),
      assignmentApi.getByClass(classId).then(({ data }) => setAssignments(data || [])),
      loadProgress(),
    ])
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [classId, loadProgress]);

  const handleComplete = async (lessonId) => {
    try {
      await lessonApi.complete(lessonId);
      await loadProgress();
      alert("Đã hoàn thành bài học!");
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div style={styles.centerText}>⏳ Đang tải nội dung lớp học...</div>;
  if (error) return <div style={styles.errorText}>❌ Lỗi: {error}</div>;

  return (
    <div>
      <Link to="/classes" style={styles.backBtn}><ArrowLeft size={16} /> Quay lại danh sách lớp</Link>

      {/* Tiến độ học tập */}
      {progress && (
        <div style={styles.progressCard}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: "bold" }}>🎯 Tiến độ học tập của bạn</span>
            <span style={{ color: "#3b82f6", fontWeight: "bold" }}>{progress.progress}%</span>
          </div>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${progress.progress}%` }} />
          </div>
          <small style={{ color: "#a1a1aa", marginTop: 8, display: "block" }}>
            Đã hoàn thành {progress.completedLessons}/{progress.totalLessons} bài học
          </small>
        </div>
      )}

      <div style={styles.sectionGrid}>
        {/* Cột 1: Danh sách Bài học */}
        <div style={styles.sectionBox}>
          <h3 style={styles.sectionTitle}><Book color="#3b82f6" size={20} /> Danh sách Bài học</h3>
          {lessons.length === 0 ? (
            <p style={{ color: "#a1a1aa" }}>Chưa có bài học nào.</p>
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
          <h3 style={styles.sectionTitle}><FileText color="#eab308" size={20} /> Bài tập về nhà</h3>
          {assignments.length === 0 ? (
            <p style={{ color: "#a1a1aa" }}>Chưa có bài tập nào.</p>
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
    </div>
  );
}

const styles = {
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, color: "#a1a1aa", textDecoration: "none", marginBottom: 20, fontSize: 14 },
  progressCard: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20, marginBottom: 28 },
  progressBarBg: { height: 8, backgroundColor: "#27272a", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#3b82f6", transition: "width 0.3s" },
  sectionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  sectionBox: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20 },
  sectionTitle: { display: "flex", alignItems: "center", gap: 8, marginTop: 0, marginBottom: 16, fontSize: 18, color: "#fff" },
  itemCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, backgroundColor: "#27272a", borderRadius: 8 },
  completeBtn: { display: "flex", alignItems: "center", gap: 6, backgroundColor: "#10b981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "bold" },
  detailBtn: { backgroundColor: "#3b82f6", color: "#fff", textDecoration: "none", padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: "bold" },
  centerText: { textAlign: "center", padding: 40, color: "#a1a1aa" },
  errorText: { color: "#f87171", padding: 20, backgroundColor: "#451a1a", borderRadius: 8 },
};