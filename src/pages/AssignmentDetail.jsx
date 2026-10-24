import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUser } from "../api/client";
import { assignmentApi } from "../api/assignments";
import { submissionApi } from "../api/submissions";
import { ArrowLeft, FileCheck, Upload, ExternalLink } from "lucide-react";

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

  if (loading) return <div style={styles.center}>⏳ Đang tải thông tin bài tập...</div>;
  if (!assignment) return <div style={styles.center}>Không tìm thấy bài tập.</div>;

  return (
    <div>
      <Link to={`/classes/${assignment.class_id}`} style={styles.backBtn}>
        <ArrowLeft size={16} /> Quay lại lớp học
      </Link>

      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: "0 0 8px 0", color: "#fff" }}>{assignment.title}</h2>
            <p style={{ color: "#a1a1aa", margin: 0 }}>{assignment.description}</p>
          </div>
          {canGrade && (
            <Link to={`/assignments/${id}/grade`} style={styles.gradeBtn}>
              <FileCheck size={16} /> Chấm bài nộp
            </Link>
          )}
        </div>

        <hr style={styles.hr} />

        <div style={{ display: "flex", gap: 24, fontSize: 14, color: "#a1a1aa" }}>
          <span>💯 Điểm tối đa: <strong style={{ color: "#fff" }}>{assignment.maximum_score}</strong></span>
          <span>⏰ Hạn nộp: <strong style={{ color: "#f87171" }}>{assignment.deadline ? new Date(assignment.deadline).toLocaleString("vi-VN") : "Không giới hạn"}</strong></span>
        </div>
      </div>

      {/* Thông tin bài đã nộp */}
      {mySubmission && (
        <div style={styles.submittedBox}>
          <h4 style={{ margin: "0 0 12px 0", color: "#10b981" }}>✅ Bài làm đã nộp</h4>
          <p style={{ margin: "0 0 8px 0", fontSize: 14 }}>
            Thời gian: {new Date(mySubmission.submitted_at).toLocaleString("vi-VN")}
          </p>
          {mySubmission.repository_url && (
            <p style={{ margin: "0 0 8px 0", fontSize: 14 }}>
              Link Repo: <a href={mySubmission.repository_url} target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>{mySubmission.repository_url} <ExternalLink size={12} /></a>
            </p>
          )}
          {mySubmission.file_url && (
            <p style={{ margin: "0 0 8px 0", fontSize: 14 }}>
              File đính kèm: <a href={mySubmission.file_url} target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>Tải về / Xem file <ExternalLink size={12} /></a>
            </p>
          )}
          {mySubmission.score !== null && mySubmission.score !== undefined && (
            <div style={styles.scoreBox}>
              <strong>Điểm số: {mySubmission.score} / {assignment.maximum_score}</strong>
              <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#d4d4d8" }}>Nhận xét: {mySubmission.feedback || "Không có nhận xét"}</p>
            </div>
          )}
        </div>
      )}

      {/* Form Nộp bài */}
      <form onSubmit={handleSubmit} style={styles.card}>
        <h3 style={{ marginTop: 0, color: "#fff" }}>{mySubmission ? "🔄 Nộp lại bài làm (Ghi đè)" : "📤 Form Nộp Bài"}</h3>
        
        <div style={styles.field}>
          <label style={styles.label}>Ghi chú / Nội dung:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập ghi chú hoặc câu trả lời..."
            rows={4}
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Link Repository (GitHub/GitLab):</label>
          <input
            type="url"
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            placeholder="https://github.com/username/project"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>File đính kèm (PDF, ZIP, DOCX, PNG, JPG - Tối đa 10MB):</label>
          <input
            type="file"
            accept=".pdf,.zip,.docx,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files[0] || null)}
            style={{ color: "#a1a1aa" }}
          />
        </div>

        <button type="submit" disabled={submitting} style={styles.submitBtn}>
          <Upload size={16} /> {submitting ? "Đang gửi bài..." : "Gửi bài nộp"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, color: "#a1a1aa", textDecoration: "none", marginBottom: 20, fontSize: 14 },
  card: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 24 },
  hr: { borderColor: "#27272a", margin: "16px 0" },
  submittedBox: { backgroundColor: "#064e3b", border: "1px solid #047857", borderRadius: 12, padding: 20, marginBottom: 24, color: "#ecfdf5" },
  scoreBox: { marginTop: 12, padding: 12, backgroundColor: "#022c22", borderRadius: 6, border: "1px solid #059669" },
  gradeBtn: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#eab308", color: "#000", padding: "8px 16px", borderRadius: 6, textDecoration: "none", fontWeight: "bold", fontSize: 14 },
  field: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 },
  label: { fontSize: 14, color: "#d4d4d8", fontWeight: "500" },
  input: { padding: "10px 14px", borderRadius: 6, border: "1px solid #3f3f46", backgroundColor: "#27272a", color: "#fff", fontSize: 14, outline: "none" },
  submitBtn: { display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 15 },
  center: { textAlign: "center", padding: 40, color: "#a1a1aa" },
};