// Test component to verify auth is working
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const TestAuth: React.FC = () => {
  const { user, profile, agency, loading, signUp, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Test User');
  const [agencyName, setAgencyName] = useState('Test Agency');
  const [error, setError] = useState<string>('');

  const handleSignUp = async () => {
    setError('');
    const { error } = await signUp(email, password, name, agencyName);
    if (error) {
      setError(error.message);
    }
  };

  const handleSignIn = async () => {
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Auth Test</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {user ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 rounded">
            <h3 className="font-semibold">✅ User Authenticated</h3>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
          </div>
          
          {profile && (
            <div className="p-4 bg-blue-100 rounded">
              <h3 className="font-semibold">✅ Profile Loaded</h3>
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Role:</strong> {profile.role}</p>
              <p><strong>Agency ID:</strong> {profile.agency_id}</p>
            </div>
          )}
          
          {agency && (
            <div className="p-4 bg-purple-100 rounded">
              <h3 className="font-semibold">✅ Agency Loaded</h3>
              <p><strong>Name:</strong> {agency.name}</p>
              <p><strong>ID:</strong> {agency.id}</p>
            </div>
          )}
          
          <button
            onClick={signOut}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Agency Name</label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleSignUp}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign Up
            </button>
            <button
              onClick={handleSignIn}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
};