import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import ProtectedApp from './components/ProtectedApp';
import { Loader2 } from 'lucide-react';

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
      <p className="text-gray-600">Setting up your real estate portfolio</p>
    </div>
  </div>
);

// App content that uses auth context
const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();

  // DEBUG: Log what we're getting from auth context
  console.log('🔍 AUTH DEBUG:', {
    loading: loading,
    hasUser: !!user,
    userEmail: user?.email || 'No user',
    hasProfile: !!profile,
    profileName: profile?.name || 'No profile',
    profileRole: profile?.role || 'No role',
    agencyId: profile?.agency_id || 'No agency',
    shouldShowAuth: !user || !profile,
    timestamp: new Date().toLocaleTimeString()
  });

  // Show loading screen while checking authentication
  if (loading) {
    console.log('📱 SHOWING: Loading screen');
    return <LoadingScreen />;
  }

  // Show auth screen if not logged in or no profile
  if (!user || !profile) {
    console.log('🔐 SHOWING: Auth screen (no user or no profile)');
    return <Auth />;
  }

  // Show main app if authenticated
  console.log('🏠 SHOWING: Protected app');
  return <ProtectedApp />;
};

// Main App component wrapped with AuthProvider
export default function App() {
  console.log('🚀 APP STARTING...');
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}