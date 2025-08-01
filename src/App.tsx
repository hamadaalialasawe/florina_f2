import React from 'react';
import { useAuth } from './hooks/useAuth';
import AuthProvider from './components/AuthProvider';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import ToastContainer from './components/ToastContainer';
import LoadingSpinner from './components/LoadingSpinner';
import { ensureAdminExists } from './lib/auth';

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();

  // التأكد من وجود المدير عند بدء التطبيق
  React.useEffect(() => {
    ensureAdminExists();
  }, []); // إضافة dependency array فارغ لتجنب التكرار

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginForm />;
  }

  if (profile.role === 'admin') {
    return <AdminDashboard />;
  }

  return <EmployeeDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;