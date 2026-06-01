import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/auth/Login';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/dashboard/Dashboard';
import CategoryManagement from './pages/questions/CategoryManagement';
import QuestionEditor from './pages/questions/QuestionEditor';
import BulkUpload from './pages/questions/BulkUpload';
import ContentSyncHub from './pages/dashboard/ContentSyncHub';
import UserManagement from './pages/users/UserManagement';

// 🛡️ Vault Door 1: Must be logged in
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />; 
  return children; 
};

// 🔐 Vault Door 2: STRICTLY Admins Only
const AdminOnlyRoute = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userRole !== 'Admin') {
    alert("Access Denied: You do not have Master Admin privileges.");
    return <Navigate to="/dashboard" replace />; // Kick them back to dashboard
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Main App Layout */}
          <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/questions" element={<QuestionEditor />} />
            <Route path="/bulk-upload" element={<BulkUpload />} />
            <Route path="/sync" element={<ContentSyncHub />} />
            
            {/* ONLY ADMINS CAN ACCESS THIS ROUTE */}
            <Route path="/users" element={
              <AdminOnlyRoute>
                <UserManagement />
              </AdminOnlyRoute>
            } />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;