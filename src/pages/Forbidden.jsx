import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function Forbidden() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}><ShieldAlert size={28} /></div>
        <div style={styles.code}>403</div>
        <h2 style={styles.title}>Bạn không có quyền truy cập trang này</h2>
        <p style={styles.text}>Trang này chỉ dành cho Mentor hoặc Quản trị viên. Nếu bạn nghĩ đây là nhầm lẫn, hãy liên hệ quản trị viên.</p>
        <Link to="/" style={styles.btn}><ArrowLeft size={16} /> Về trang chủ</Link>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "#f4f7fc", fontFamily: "Inter, system-ui, sans-serif" },
  card: { maxWidth: 440, width: "100%", textAlign: "center", padding: 32, borderRadius: 16, backgroundColor: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 12px 32px rgba(15,23,42,0.08)" },
  icon: { width: 56, height: 56, margin: "0 auto 12px", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" },
  code: { fontSize: 40, fontWeight: 800, color: "#2563eb", letterSpacing: "-0.03em" },
  title: { margin: "4px 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" },
  text: { margin: "0 0 20px", fontSize: 14, lineHeight: 1.6, color: "#64748b" },
  btn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, backgroundColor: "#2563eb", color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none" },
};
