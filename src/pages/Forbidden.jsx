import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div style={{ padding: 32, color: "#fff", backgroundColor: "#09090b", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h2 style={{ color: "#ef4444" }}>403 – Bạn không có quyền truy cập trang này</h2>
      <Link to="/" style={{ color: "#3b82f6" }}>Về trang chủ</Link>
    </div>
  );
}