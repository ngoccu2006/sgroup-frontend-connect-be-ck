import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Presentation,
  TrendingUp,
  ShieldCheck,
  CircleAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { authApi } from "../api/auth";
import { getToken } from "../api/client";
import "./Login.css";

const FEATURES = [
  { icon: Presentation, label: "Quản lý lớp học" },
  { icon: TrendingUp, label: "Theo dõi tiến độ" },
  { icon: ShieldCheck, label: "Bảo mật tài khoản" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="login-page">
      {/* Nửa trái: giới thiệu (ẩn trên màn hình nhỏ) */}
      <section className="login-hero">
        <div className="login-orb login-orb--1" />
        <div className="login-orb login-orb--2" />
        <div className="login-orb login-orb--3" />
        <div className="login-dots" />

        <div className="login-brand">
          <div className="login-brand__logo">
            <GraduationCap size={24} />
          </div>
          <span>LMS System</span>
        </div>

        <div className="login-hero__content">
          <h1>Học tập thông minh hơn mỗi ngày</h1>
          <p>Quản lý lớp học, bài giảng và học viên trên một nền tảng duy nhất.</p>

          <ul className="login-features">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="login-feature">
                <span className="login-feature__icon">
                  <Icon size={18} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Nửa phải: form đăng nhập */}
      <section className="login-panel">
        <div className="login-panel__inner">
          {/* Logo thu gọn, chỉ hiện trên mobile */}
          <div className="login-brand login-brand--mobile">
            <div className="login-brand__logo">
              <GraduationCap size={22} />
            </div>
            <span>LMS System</span>
          </div>

          <form onSubmit={handleSubmit} className="login-card">
            <div className="login-card__header">
              <h2>Đăng nhập</h2>
              <p>Chào mừng trở lại! Vui lòng nhập thông tin của bạn.</p>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <CircleAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="email">Email</label>
              <div className="login-input">
                <Mail size={18} className="login-input__icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Mật khẩu</label>
              <div className="login-input">
                <Lock size={18} className="login-input__icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-input__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? (
                <>
                  <LoaderCircle size={18} className="login-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <p className="login-footer">© {new Date().getFullYear()} LMS System</p>
        </div>
      </section>
    </div>
  );
}
