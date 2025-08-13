// src/components/InvitationManager.tsx
import React, { useState } from 'react';
import { UserPlus, Mail, Shield, X, Copy, Check } from 'lucide-react';
import { AgencyService } from '../lib/agencyService';
import { useAuth } from '../contexts/AuthContext';
import { RoleLabels, Role } from '../lib/permissionService';

interface InvitationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onInvitationSent?: () => void;
}

export const InvitationManager: React.FC<InvitationManagerProps> = ({
  isOpen,
  onClose,
  onInvitationSent
}) => {
  const { profile, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    role: 'agent' as Role
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.role) {
      setError('Email and role are required');
      return;
    }

    if (!profile?.agency_id && profile?.role !== 'super_admin') {
      setError('No agency found');
      return;
    }

    if (!hasPermission('canInviteUsers')) {
      setError('You do not have permission to invite users');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For super admin, they need to specify which agency (simplified for now)
      const agencyId = profile.agency_id || profile.id; // Fallback for demo

      const invitation = await AgencyService.createInvitation(
        agencyId,
        formData.email,
        formData.role as 'agency_admin' | 'agent' | 'viewer'
      );

      const url = `${window.location.origin}/signup?invitation=${invitation.token}`;
      setInvitationUrl(url);
      setSuccess(`Invitation sent to ${formData.email}`);
      
      // Reset form
      setFormData({ email: '', role: 'agent' });
      
      if (onInvitationSent) {
        onInvitationSent();
      }
    } catch (err: any) {
      console.error('Error creating invitation:', err);
      setError(err.message || 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!invitationUrl) return;
    
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const availableRoles = profile?.role === 'super_admin' 
    ? ['agency_admin', 'agent', 'viewer'] 
    : ['agent', 'viewer'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Invite User</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && !invitationUrl && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Invitation URL */}
        {invitationUrl && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-800 font-medium">Invitation Created!</span>
            </div>
            <p className="text-blue-800 text-sm mb-3">
              Share this link with {formData.email}:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={invitationUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-blue-300 rounded text-sm bg-white"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && (
              <p className="text-green-600 text-xs mt-1">Copied to clipboard!</p>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="user@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                required
                disabled={loading}
              >
                {availableRoles.map(role => (
                  <option key={role} value={role}>
                    {RoleLabels[role as Role]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role Description */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>{RoleLabels[formData.role as Role]}:</strong> {
                formData.role === 'agency_admin' ? 'Can manage users and all properties within the agency' :
                formData.role === 'agent' ? 'Can create and edit properties within the agency' :
                'Read-only access to agency properties and users'
              }
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.email || !formData.role}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Send Invitation'}
            </button>
          </div>
        </form>

        {/* Instructions */}
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-xs">
            <strong>Note:</strong> The invitation link will expire in 7 days. 
            Users must use the exact email address to accept the invitation.
          </p>
        </div>
      </div>
    </div>
  );
};