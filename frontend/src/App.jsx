import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PublicAssetPage from './pages/PublicAssetPage';
import ReportIssuePage from './pages/ReportIssuePage';
import AdminDashboard from './pages/AdminDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import IssueDetailsPage from './pages/IssueDetailsPage';

// Simple Route Protectors
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/public/asset/:code" element={<PublicAssetPage />} />
      <Route path="/public/asset/:code/report" element={<ReportIssuePage />} />

      {/* Admin Protected Routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Technician Protected Routes */}
      <Route 
        path="/technician/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['technician']}>
            <TechnicianDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/technician/issue/:issueNumber" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'technician']}>
            <IssueDetailsPage />
          </ProtectedRoute>
        } 
      />

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
