// src/App.tsx
import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import ProtectedApp from './components/ProtectedApp';
import { Loader2, Building } from 'lucide-react';
import './index.css';

// URL parameter parser
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    invitation: params.get('invitation'),
    mode: params.get('mode')
  };
};

// Main App Wrapper Component
const AppContent: React.FC = () => {
  const { user, profile, loading, initialized } = useAuth();
  const [urlParams] = useState(getUrlParams());

  // Clear URL parameters after extracting them (for security)
  useEffect(() => {
    if (urlParams.invitation && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [urlParams.invitation]);

  // Show loading spinner while checking auth state
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg">
              {!initialized ? 'Initializing...' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show auth screen if no user or no profile
  if (!user || !profile) {
    // Determine auth mode based on URL parameters
    const authMode = urlParams.invitation ? 'invitation' : 'signin';
    
    return (
      <Auth 
        mode={authMode}
        invitationToken={urlParams.invitation || undefined}
      />
    );
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