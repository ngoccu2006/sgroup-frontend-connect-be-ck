import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Login from "./pages/Login";
import Forbidden from "./pages/Forbidden";
import ClassList from "./pages/ClassList";
import ClassDetail from "./pages/ClassDetail";
import AssignmentDetail from "./pages/AssignmentDetail";
import GradeSubmissions from "./pages/GradeSubmissions";
import AdminUsers from "./pages/AdminUsers";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />

        {/* Cần đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/classes" replace />} />
            <Route path="/classes" element={<ClassList />} />
            <Route path="/classes/:classId" element={<ClassDetail />} />
            
            <Route path="/assignments/:id" element={<AssignmentDetail />} />

            {/* Chỉ MENTOR / ADMIN */}
            <Route element={<ProtectedRoute roles={["MENTOR", "ADMIN"]} />}>
              <Route path="/assignments/:id/grade" element={<GradeSubmissions />} />
            </Route>

            <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Route>
        </Route>

        {/* Router bẫy URL không tồn tại -> Nhảy về / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}