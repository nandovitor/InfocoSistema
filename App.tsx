import React, { useContext } from 'react';
import LoginPage from './components/auth/LoginPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import { AuthContext } from './contexts/AuthContext';
import Spinner from './components/ui/Spinner';

const App: React.FC = () => {
  const authContext = useContext(AuthContext);

  // If context is not yet available, or it's in the initial loading state
  if (!authContext || authContext.loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Spinner size="lg" />
        </div>
    );
  }

  const { user } = authContext;

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {user ? <DashboardLayout /> : <LoginPage />}
    </div>
  );
};

export default App;