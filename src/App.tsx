// src/App.tsx - TEMPORARY VERSION FOR TESTING
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { TestAuth } from './components/TestAuth';
import './index.css';

export default function App() {
  console.log('🧪 Starting test version of the app...');
  
  return (
    <AuthProvider>
      <TestAuth />
    </AuthProvider>
  );
}