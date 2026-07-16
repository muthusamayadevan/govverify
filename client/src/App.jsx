import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardCitizen from './pages/DashboardCitizen';
import DashboardOfficer from './pages/DashboardOfficer';
import OfficerReviewDetail from './pages/OfficerReviewDetail';
import ApplyApplication from './pages/ApplyApplication';
import MyApplications from './pages/MyApplications';
import VerifyCertificate from './pages/VerifyCertificate';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard/citizen"
          element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <DashboardCitizen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apply"
          element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <ApplyApplication />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/officer"
          element={
            <ProtectedRoute allowedRoles={["officer", "admin"]}>
              <DashboardOfficer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/review/:id"
          element={
            <ProtectedRoute allowedRoles={["officer", "admin"]}>
              <OfficerReviewDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/verify/:referenceId?" element={<VerifyCertificate />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
