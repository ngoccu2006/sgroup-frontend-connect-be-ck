import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { getToken } from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Đã login thì chuyển thẳng vào trang chủ
  if (getToken()) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/classes", { replace: true });
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra email/mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>🎓 LMS System Login</h2>
        
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.field}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gmail.com"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label>Mật khẩu:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={styles.input}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#09090b",
    color: "#f4f4f5",
    fontFamily: "sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "32px",
    borderRadius: "12px",
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  },
  title: {
    textAlign: "center",
    marginBottom: "24px",
    fontSize: "24px",
    color: "#3b82f6",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "6px",
    border: "1px solid #3f3f46",
    backgroundColor: "#27272a",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
  },
  error: {
    padding: "10px",
    borderRadius: "6px",
    backgroundColor: "#451a1a",
    color: "#f87171",
    fontSize: "14px",
    marginBottom: "16px",
    border: "1px solid #7f1d1d",
  },
};