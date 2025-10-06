import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UploadStudy } from './pages/UploadStudy';
import { ViewStudy } from './pages/ViewStudy';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute allowedRoles={['technician', 'diagnostic_centre', 'admin']}>
                <UploadStudy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/studies/:studyId"
            element={
              <ProtectedRoute>
                <ViewStudy />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
