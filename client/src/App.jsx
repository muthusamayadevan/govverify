import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardCitizen from './pages/DashboardCitizen';
import DashboardOfficer from './pages/DashboardOfficer';
import OfficerDashboard from './pages/OfficerDashboard';
import OfficerReviewDetail from './pages/OfficerReviewDetail';
import ApplyApplication from './pages/ApplyApplication';
import MyApplications from './pages/MyApplications';
import ApplicationDetail from './pages/ApplicationDetail';
import FileTax from './pages/FileTax';
import MyTaxFilings from './pages/MyTaxFilings';
import MyDocuments from './pages/MyDocuments';
import VerifyCertificate from './pages/VerifyCertificate';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
          path="/applications/:id"
          element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <ApplicationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-tax"
          element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <FileTax />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-tax-filings"
          element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <MyTaxFilings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-documents"
          element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <MyDocuments />
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
          path="/officer/analytics"
          element={
            <ProtectedRoute allowedRoles={["officer", "admin"]}>
              <OfficerDashboard />
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
