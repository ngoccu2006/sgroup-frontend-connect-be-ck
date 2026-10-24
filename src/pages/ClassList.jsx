import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classApi } from "../api/classes";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";

export default function ClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    classApi.getAll()
      .then(({ data }) => setClasses(data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.centerText}>⏳ Đang tải danh sách lớp học...</div>;
  if (error) return <div style={styles.errorText}>❌ Lỗi: {error}</div>;

  return (
    <div>
      <h2 style={styles.title}>📚 Lớp học của bạn</h2>
      
      {classes.length === 0 ? (
        <div style={styles.empty}>Chưa có lớp học nào được tạo.</div>
      ) : (
        <div style={styles.grid}>
          {classes.map((c) => (
            <div key={c.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <BookOpen color="#3b82f6" size={24} />
                <h3 style={styles.cardTitle}>{c.name}</h3>
              </div>
              <p style={styles.cardDesc}>{c.description || "Chưa có mô tả cho lớp học này."}</p>
              
              <div style={styles.cardMeta}>
                <Calendar size={14} color="#a1a1aa" />
                <span>Bắt đầu: {c.start_date ? new Date(c.start_date).toLocaleDateString("vi-VN") : "N/A"}</span>
              </div>

              <Link to={`/classes/${c.id}`} style={styles.viewBtn}>
                Xem chi tiết <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 24, marginBottom: 24, color: "#fff" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 },
  card: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" },
  cardHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  cardTitle: { fontSize: 18, color: "#fff", margin: 0 },
  cardDesc: { color: "#a1a1aa", fontSize: 14, marginBottom: 16, lineHeight: "1.5" },
  cardMeta: { display: "flex", alignItems: "center", gap: 6, color: "#a1a1aa", fontSize: 13, marginBottom: 20 },
  viewBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#2563eb", color: "#fff", padding: "10px 16px", borderRadius: 6, textDecoration: "none", fontWeight: "bold", fontSize: 14 },
  empty: { padding: 40, textAlign: "center", color: "#a1a1aa", backgroundColor: "#18181b", borderRadius: 12, border: "1px solid #27272a" },
  centerText: { textAlign: "center", padding: 40, color: "#a1a1aa" },
  errorText: { color: "#f87171", padding: 20, backgroundColor: "#451a1a", borderRadius: 8 },
};