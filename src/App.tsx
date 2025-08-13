import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import ProtectedApp from './components/ProtectedApp';
import { Loader2, Building } from 'lucide-react';
import './index.css';

// Main App Wrapper Component
const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg">Loading...</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Initializing your real estate portfolio...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if no user or no profile
  if (!user || !profile) {
    return <Auth />;
  }

  // Show protected app if authenticated
  return <ProtectedApp />;
};

// Main App Component
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}