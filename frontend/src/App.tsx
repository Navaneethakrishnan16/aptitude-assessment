import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Instructions from "./pages/Instructions";
import Test from "./pages/Test";
import Result from "./pages/Result";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQuestions from "./pages/AdminQuestions";
import AdminResults from "./pages/AdminResults";
import AdminSettings from "./pages/AdminSettings";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/instructions" element={<Instructions />} />
      <Route path="/test" element={<Test />} />
      <Route path="/result" element={<Result />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="questions" element={<AdminQuestions />} />
          <Route path="results" element={<AdminResults />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
