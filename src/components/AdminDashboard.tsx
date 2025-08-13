// src/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Building, Users, UserPlus, Settings, Shield, Mail, 
  Phone, Calendar, CheckCircle, XCircle, Clock, Trash2, 
  Edit, RefreshCw, Download, AlertTriangle, Plus, Search,
  MoreVertical, Eye, Ban, Activity, BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AgencyService, AgencyWithStats, AgencyInvitation } from '../lib/agencyService';
import { PropertyService } from '../lib/propertyService';
import { PermissionService, RoleLabels, RoleDescriptions, Role } from '../lib/permissionService';
import { UserProfile, Agency } from '../lib/supabase';

interface AdminDashboardProps {
  onClose: () => void;
}

interface DashboardStats {
  totalAgencies: number;
  totalUsers: number;
  totalProperties: number;
  activeInvitations: number;
}

interface UserWithAgency extends UserProfile {
  agencies?: { name: string };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { profile, hasPermission, canAccessAgency } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<DashboardStats>({
    totalAgencies: 0,
    totalUsers: 0,
    totalProperties: 0,
    activeInvitations: 0
  });
  const [agencies, setAgencies] = useState<AgencyWithStats[]>([]);
  const [users, setUsers] = useState<UserWithAgency[]>([]);
  const [invitations, setInvitations] = useState<AgencyInvitation[]>([]);

  // Form states
  const [showCreateAgency, setShowCreateAgency] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<string>('');

  const isSuperAdmin = profile?.role === 'super_admin';
  const isAgencyAdmin = profile?.role === 'agency_admin';

  const tabs = [
    { name: 'Overview', icon: BarChart3, visible: true },
    { name: 'Agencies', icon: Building, visible: isSuperAdmin },
    { name: 'Users', icon: Users, visible: true },
    { name: 'Invitations', icon: UserPlus, visible: isAgencyAdmin || isSuperAdmin },
    { name: 'Settings', icon: Settings, visible: isAgencyAdmin || isSuperAdmin }
  ].filter(tab => tab.visible);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isSuperAdmin) {
        await loadSuperAdminData();
      } else if (isAgencyAdmin) {
        await loadAgencyAdminData();
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadSuperAdminData = async () => {
    // Load all agencies with stats
    const agenciesData = await AgencyService.getAllAgencies();
    setAgencies(agenciesData);

    // Calculate stats
    const totalUsers = agenciesData.reduce((sum, agency) => sum + agency.user_count, 0);
    const totalProperties = agenciesData.reduce((sum, agency) => sum + agency.property_count, 0);
    const activeInvitations = agenciesData.reduce((sum, agency) => sum + agency.active_invitations, 0);

    setStats({
      totalAgencies: agenciesData.length,
      totalUsers,
      totalProperties,
      activeInvitations
    });

    // Load all users across agencies
    // Note: This would need a special endpoint for super admin
    // For now, we'll just show agency-level stats
  };

  const loadAgencyAdminData = async () => {
    if (!profile?.agency_id) return;

    // Load agency users
    const agencyUsers = await AgencyService.getAgencyUsers(profile.agency_id);
    setUsers(agencyUsers);

    // Load agency invitations
    const agencyInvitations = await AgencyService.getAgencyInvitations(profile.agency_id);
    setInvitations(agencyInvitations);

    // Load property stats
    const propertyStats = await PropertyService.getPropertyStats();

    setStats({
      totalAgencies: 1,
      totalUsers: agencyUsers.length,
      totalProperties: propertyStats.total,
      activeInvitations: agencyInvitations.filter(inv => 
        !inv.used_at && new Date(inv.expires_at) > new Date()
      ).length
    });
  };

  // Component renders
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSuperAdmin && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Agencies</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAgencies}</p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
            <Building className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invitations</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeInvitations}</p>
            </div>
            <UserPlus className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Activity tracking coming soon</p>
        </div>
      </div>
    </div>
  );

  const AgenciesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Agencies</h3>
        <button
          onClick={() => setShowCreateAgency(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Agency
        </button>
      </div>

      <div className="grid gap-4">
        {agencies.map(agency => (
          <div key={agency.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">{agency.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    agency.status === 'active' ? 'bg-green-100 text-green-800' :
                    agency.status === 'suspended' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {agency.status}
                  </span>
                </div>
                
                {agency.address && (
                  <p className="text-gray-600 mb-2">{agency.address}</p>
                )}
                
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>{agency.user_count} users</span>
                  <span>{agency.property_count} properties</span>
                  <span>Created {new Date(agency.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Ban className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Users</h3>
        {hasPermission('canInviteUsers') && (
          <button
            onClick={() => setShowInviteUser(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agency
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'agency_admin' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'agent' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {RoleLabels[user.role as Role]}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.agencies?.name || 'No Agency'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login_at 
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const InvitationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Invitations</h3>
        <button
          onClick={() => setShowInviteUser(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Send Invitation
        </button>
      </div>

      <div className="grid gap-4">
        {invitations.map(invitation => {
          const isExpired = new Date(invitation.expires_at) < new Date();
          const isUsed = !!invitation.used_at;
          
          return (
            <div key={invitation.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{invitation.email}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isUsed ? 'bg-green-100 text-green-800' :
                      isExpired ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isUsed ? 'Used' : isExpired ? 'Expired' : 'Pending'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>Role: {RoleLabels[invitation.role as Role]}</span>
                    <span>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                    <span>Created: {new Date(invitation.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isUsed && !isExpired && (
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
                <p className="text-gray-600">
                  {isSuperAdmin ? 'System Administration' : 'Agency Management'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === index
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 0 && <OverviewTab />}
          {activeTab === 1 && isSuperAdmin && <AgenciesTab />}
          {activeTab === (isSuperAdmin ? 2 : 1) && <UsersTab />}
          {activeTab === (isSuperAdmin ? 3 : 2) && <InvitationsTab />}
        </div>
      </div>
    </div>
  );
};