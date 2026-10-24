import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { submissionApi } from "../api/submissions";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";

export default function GradeSubmissions() {
  const { id } = useParams(); // assignmentId
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={styles.center}>⏳ Đang tải danh sách bài nộp...</div>;

  return (
    <div>
      <Link to={`/assignments/${id}`} style={styles.backBtn}>
        <ArrowLeft size={16} /> Quay lại bài tập
      </Link>

      <h2 style={{ color: "#fff", marginBottom: 24 }}>📝 Quản lý & Chấm điểm bài nộp</h2>

      {submissions.length === 0 ? (
        <div style={styles.empty}>Chưa có học viên nào nộp bài.</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Học viên</th>
                <th style={styles.th}>Nội dung / File</th>
                <th style={styles.th}>Thời gian</th>
                <th style={styles.th}>Chấm điểm & Nhận xét</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong style={{ color: "#fff" }}>{s.member_name}</strong>
                    <div style={{ fontSize: 12, color: "#a1a1aa" }}>{s.member_email}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ marginBottom: 6 }}>{s.content || "Không có ghi chú"}</div>
                    {s.repository_url && (
                      <a href={s.repository_url} target="_blank" rel="noreferrer" style={styles.link}>
                        Repository <ExternalLink size={12} />
                      </a>
                    )}
                    {s.file_url && (
                      <a href={s.file_url} target="_blank" rel="noreferrer" style={{ ...styles.link, marginLeft: 12 }}>
                        Xem File <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                  <td style={styles.td}>
                    {new Date(s.submitted_at).toLocaleString("vi-VN")}
                  </td>
                  <td style={styles.td}>
                    <form onSubmit={(e) => { e.preventDefault(); handleGrade(s.id, e.target); }} style={styles.gradeForm}>
                      <input
                        name="score"
                        type="number"
                        step="0.1"
                        defaultValue={s.score ?? ""}
                        placeholder="Điểm"
                        required
                        style={{ ...styles.input, width: 70 }}
                      />
                      <input
                        name="feedback"
                        defaultValue={s.feedback ?? ""}
                        placeholder="Nhận xét..."
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <button type="submit" style={styles.saveBtn}>
                        <Save size={14} /> Lưu
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, color: "#a1a1aa", textDecoration: "none", marginBottom: 20, fontSize: 14 },
  empty: { padding: 40, textAlign: "center", color: "#a1a1aa", backgroundColor: "#18181b", borderRadius: 12, border: "1px solid #27272a" },
  tableWrapper: { overflowX: "auto", backgroundColor: "#18181b", borderRadius: 12, border: "1px solid #27272a" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 },
  thRow: { borderBottom: "1px solid #27272a", backgroundColor: "#27272a" },
  th: { padding: "14px 16px", color: "#d4d4d8", fontWeight: "bold" },
  tr: { borderBottom: "1px solid #27272a" },
  td: { padding: "14px 16px", color: "#d4d4d8" },
  link: { color: "#3b82f6", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13 },
  gradeForm: { display: "flex", gap: 8, alignItems: "center" },
  input: { padding: "8px 10px", borderRadius: 6, border: "1px solid #3f3f46", backgroundColor: "#27272a", color: "#fff", fontSize: 13, outline: "none" },
  saveBtn: { display: "inline-flex", alignItems: "center", gap: 4, backgroundColor: "#10b981", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 },
  center: { textAlign: "center", padding: 40, color: "#a1a1aa" },
};