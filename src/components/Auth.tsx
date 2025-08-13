// src/components/Auth.tsx
import React, { useState, useEffect } from 'react';
import { Building, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AgencyService } from '../lib/agencyService';

interface AuthProps {
  mode?: 'signin' | 'signup' | 'invitation';
  invitationToken?: string;
}

export const Auth: React.FC<AuthProps> = ({ mode: initialMode = 'signin', invitationToken }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'invitation' | 'super_admin'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const { signIn, signUp, signUpWithInvitation, createSuperAdmin, profile } = useAuth();

  // Load invitation details if token is provided
  useEffect(() => {
    if (invitationToken && mode === 'invitation') {
      loadInvitationDetails();
    }
  }, [invitationToken, mode]);

  const loadInvitationDetails = async () => {
    try {
      setLoading(true);
      const invitation = await AgencyService.getInvitationByToken(invitationToken!);
      
      if (!invitation) {
        setError('Invalid or expired invitation link');
        setMode('signin');
        return;
      }

      if (invitation.used_at) {
        setError('This invitation has already been used');
        setMode('signin');
        return;
      }

      if (new Date(invitation.expires_at) < new Date()) {
        setError('This invitation has expired');
        setMode('signin');
        return;
      }

      setInvitationDetails(invitation);
      setFormData(prev => ({ ...prev, email: invitation.email }));
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('Failed to load invitation details');
      setMode('signin');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (mode !== 'signin') {
      if (!formData.name.trim()) {
        setError('Name is required');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    if (mode === 'invitation' && invitationDetails) {
      if (formData.email !== invitationDetails.email) {
        setError('Email must match the invitation');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let result;

      switch (mode) {
        case 'signin':
          result = await signIn(formData.email, formData.password);
          break;
        
        case 'signup':
          result = await signUp(formData.email, formData.password, formData.name);
          break;
        
        case 'invitation':
          result = await signUpWithInvitation(
            formData.email, 
            formData.password, 
            formData.name, 
            invitationToken!
          );
          break;
        
        case 'super_admin':
          result = await createSuperAdmin(formData.email, formData.password, formData.name);
          if (!result.error) {
            setSuccess('Super administrator created successfully!');
            setFormData({ email: '', password: '', name: '', confirmPassword: '' });
          }
          break;
      }

      if (result?.error) {
        if (result.error.message?.includes('already registered')) {
          setError('An account with this email already exists');
        } else if (result.error.requiresEmailConfirmation) {
          setError('Email confirmation is enabled. Please disable it in your Supabase dashboard under Authentication > Providers > Email');
        } else {
          setError(result.error.message || 'An error occurred');
        }
      } else if (mode === 'signup') {
        setSuccess('Account created successfully! You can now sign in.');
      } else if (mode === 'invitation') {
        setSuccess('Account created successfully! Redirecting...');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: typeof mode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    setFormData({
      email: newMode === 'invitation' && invitationDetails ? invitationDetails.email : '',
      password: '',
      name: '',
      confirmPassword: ''
    });
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'invitation': return 'Accept Invitation';
      case 'super_admin': return 'Create Super Admin';
      default: return 'Welcome';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signin': return 'Sign in to your account';
      case 'signup': return 'Create your account to get started';
      case 'invitation': return invitationDetails ? 
        `Join ${invitationDetails.agencies?.name} as ${invitationDetails.role}` : 
        'Join the team';
      case 'super_admin': return 'Create a new super administrator';
      default: return '';
    }
  };

  const inputClass = "w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
            mode === 'super_admin' ? 'bg-red-600' : 'bg-blue-600'
          }`}>
            {mode === 'super_admin' ? (
              <Shield className="w-8 h-8 text-white" />
            ) : mode === 'invitation' ? (
              <UserPlus className="w-8 h-8 text-white" />
            ) : (
              <Building className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getTitle()}
          </h1>
          <p className="text-gray-600">
            {getSubtitle()}
          </p>
        </div>

        {/* Invitation Info */}
        {mode === 'invitation' && invitationDetails && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium">Invitation Details</p>
                <p className="text-blue-700 text-sm mt-1">
                  You've been invited to join <strong>{invitationDetails.agencies?.name}</strong> as a <strong>{invitationDetails.role}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name field (for signup modes) */}
          {mode !== 'signin' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="Your full name"
                disabled={loading}
                required
              />
            </div>
          )}

          {/* Email field */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="Email address"
              disabled={loading || (mode === 'invitation' && invitationDetails)}
              required
            />
          </div>

          {/* Password field */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`${inputClass} pr-12`}
              placeholder="Password"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Confirm Password field (for signup modes) */}
          {mode !== 'signin' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="Confirm password"
                disabled={loading}
                required
              />
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium ${
              mode === 'super_admin' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading 
              ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') 
              : (mode === 'signin' ? 'Sign In' : 
                 mode === 'invitation' ? 'Accept Invitation' :
                 mode === 'super_admin' ? 'Create Super Admin' : 'Create Account')
            }
          </button>
        </form>

        {/* Mode switching */}
        {mode !== 'invitation' && (
          <div className="mt-8 space-y-4">
            {/* Super Admin Creation (only for existing super admins) */}
            {profile?.role === 'super_admin' && mode !== 'super_admin' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode('super_admin')}
                  className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-2 mx-auto"
                  disabled={loading}
                >
                  <Shield className="w-4 h-4" />
                  Create Super Administrator
                </button>
              </div>
            )}
            
            {/* Regular mode switching */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                {mode === 'signin' ? "Don't have an account?" : 
                 mode === 'super_admin' ? "Back to regular signup?" : 
                 "Already have an account?"}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
                  disabled={loading}
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Demo note */}
        {mode === 'signin' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm text-center">
              <strong>Multi-Tenant System:</strong><br />
              • First user becomes super admin<br />
              • Each agency has isolated data<br />
              • Role-based permissions enforced
            </p>
          </div>
        )}
      </div>
    </div>
  );
};