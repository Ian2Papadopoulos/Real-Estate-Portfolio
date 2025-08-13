// src/lib/permissionService.ts
import { UserProfile } from './supabase';

export type Role = 'super_admin' | 'agency_admin' | 'agent' | 'viewer';

export interface Permission {
  // Agency Management
  canCreateAgencies: boolean;
  canViewAllAgencies: boolean;
  canEditAgency: boolean;
  canDeleteAgencies: boolean;
  canSuspendAgencies: boolean;

  // User Management
  canInviteUsers: boolean;
  canViewAgencyUsers: boolean;
  canEditAgencyUsers: boolean;
  canDeleteAgencyUsers: boolean;
  canViewAllUsers: boolean;

  // Property Management
  canCreateProperties: boolean;
  canEditProperties: boolean;
  canDeleteProperties: boolean;
  canViewProperties: boolean;
  canViewAllProperties: boolean;

  // System Administration
  canAccessSystemSettings: boolean;
  canViewSystemLogs: boolean;
  canManageSubscriptions: boolean;
}

export class PermissionService {
  /**
   * Get user permissions based on their role
   */
  static getPermissions(profile: UserProfile | null): Permission {
    if (!profile) {
      return this.getGuestPermissions();
    }

    switch (profile.role) {
      case 'super_admin':
        return this.getSuperAdminPermissions();
      case 'agency_admin':
        return this.getAgencyAdminPermissions();
      case 'agent':
        return this.getAgentPermissions();
      case 'viewer':
        return this.getViewerPermissions();
      default:
        return this.getGuestPermissions();
    }
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(
    profile: UserProfile | null, 
    permission: keyof Permission
  ): boolean {
    const permissions = this.getPermissions(profile);
    return permissions[permission];
  }

  /**
   * Check if user can perform action on specific agency
   */
  static canAccessAgency(profile: UserProfile | null, agencyId: string): boolean {
    if (!profile) return false;
    
    // Super admin can access all agencies
    if (profile.role === 'super_admin') return true;
    
    // Users can only access their own agency
    return profile.agency_id === agencyId;
  }

  /**
   * Check if user can manage other users
   */
  static canManageUser(manager: UserProfile | null, target: UserProfile): boolean {
    if (!manager) return false;
    
    // Super admin can manage anyone
    if (manager.role === 'super_admin') return true;
    
    // Agency admin can manage users in their agency (except other agency admins)
    if (manager.role === 'agency_admin' && 
        manager.agency_id === target.agency_id &&
        target.role !== 'agency_admin') {
      return true;
    }
    
    // Users can only manage themselves
    return manager.id === target.id;
  }

  /**
   * Get role hierarchy level (higher number = more permissions)
   */
  static getRoleLevel(role: Role): number {
    const levels = {
      'viewer': 1,
      'agent': 2,
      'agency_admin': 3,
      'super_admin': 4
    };
    return levels[role] || 0;
  }

  /**
   * Check if role can assign another role
   */
  static canAssignRole(assignerRole: Role, targetRole: Role): boolean {
    const assignerLevel = this.getRoleLevel(assignerRole);
    const targetLevel = this.getRoleLevel(targetRole);
    
    // Super admin can assign any role except super_admin
    if (assignerRole === 'super_admin' && targetRole !== 'super_admin') {
      return true;
    }
    
    // Agency admin can assign roles below their level
    if (assignerRole === 'agency_admin' && targetLevel < this.getRoleLevel('agency_admin')) {
      return true;
    }
    
    return false;
  }

  // Permission presets
  private static getSuperAdminPermissions(): Permission {
    return {
      // Agency Management
      canCreateAgencies: true,
      canViewAllAgencies: true,
      canEditAgency: true,
      canDeleteAgencies: true,
      canSuspendAgencies: true,

      // User Management
      canInviteUsers: true,
      canViewAgencyUsers: true,
      canEditAgencyUsers: true,
      canDeleteAgencyUsers: true,
      canViewAllUsers: true,

      // Property Management
      canCreateProperties: true,
      canEditProperties: true,
      canDeleteProperties: true,
      canViewProperties: true,
      canViewAllProperties: true,

      // System Administration
      canAccessSystemSettings: true,
      canViewSystemLogs: true,
      canManageSubscriptions: true,
    };
  }

  private static getAgencyAdminPermissions(): Permission {
    return {
      // Agency Management
      canCreateAgencies: false,
      canViewAllAgencies: false,
      canEditAgency: true,
      canDeleteAgencies: false,
      canSuspendAgencies: false,

      // User Management
      canInviteUsers: true,
      canViewAgencyUsers: true,
      canEditAgencyUsers: true,
      canDeleteAgencyUsers: true,
      canViewAllUsers: false,

      // Property Management
      canCreateProperties: true,
      canEditProperties: true,
      canDeleteProperties: true,
      canViewProperties: true,
      canViewAllProperties: false,

      // System Administration
      canAccessSystemSettings: false,
      canViewSystemLogs: false,
      canManageSubscriptions: false,
    };
  }

  private static getAgentPermissions(): Permission {
    return {
      // Agency Management
      canCreateAgencies: false,
      canViewAllAgencies: false,
      canEditAgency: false,
      canDeleteAgencies: false,
      canSuspendAgencies: false,

      // User Management
      canInviteUsers: false,
      canViewAgencyUsers: true,
      canEditAgencyUsers: false,
      canDeleteAgencyUsers: false,
      canViewAllUsers: false,

      // Property Management
      canCreateProperties: true,
      canEditProperties: true,
      canDeleteProperties: false,
      canViewProperties: true,
      canViewAllProperties: false,

      // System Administration
      canAccessSystemSettings: false,
      canViewSystemLogs: false,
      canManageSubscriptions: false,
    };
  }

  private static getViewerPermissions(): Permission {
    return {
      // Agency Management
      canCreateAgencies: false,
      canViewAllAgencies: false,
      canEditAgency: false,
      canDeleteAgencies: false,
      canSuspendAgencies: false,

      // User Management
      canInviteUsers: false,
      canViewAgencyUsers: true,
      canEditAgencyUsers: false,
      canDeleteAgencyUsers: false,
      canViewAllUsers: false,

      // Property Management
      canCreateProperties: false,
      canEditProperties: false,
      canDeleteProperties: false,
      canViewProperties: true,
      canViewAllProperties: false,

      // System Administration
      canAccessSystemSettings: false,
      canViewSystemLogs: false,
      canManageSubscriptions: false,
    };
  }

  private static getGuestPermissions(): Permission {
    return {
      // Agency Management
      canCreateAgencies: false,
      canViewAllAgencies: false,
      canEditAgency: false,
      canDeleteAgencies: false,
      canSuspendAgencies: false,

      // User Management
      canInviteUsers: false,
      canViewAgencyUsers: false,
      canEditAgencyUsers: false,
      canDeleteAgencyUsers: false,
      canViewAllUsers: false,

      // Property Management
      canCreateProperties: false,
      canEditProperties: false,
      canDeleteProperties: false,
      canViewProperties: false,
      canViewAllProperties: false,

      // System Administration
      canAccessSystemSettings: false,
      canViewSystemLogs: false,
      canManageSubscriptions: false,
    };
  }
}

// Role display utilities
export const RoleLabels: Record<Role, string> = {
  super_admin: 'Super Administrator',
  agency_admin: 'Agency Administrator',
  agent: 'Agent',
  viewer: 'Viewer'
};

export const RoleDescriptions: Record<Role, string> = {
  super_admin: 'Full system access, can manage all agencies and users',
  agency_admin: 'Full agency access, can manage agency users and properties',
  agent: 'Can create and edit properties within their agency',
  viewer: 'Read-only access to agency properties and users'
};

// Permission guards for React components
export const usePermission = (profile: UserProfile | null, permission: keyof Permission): boolean => {
  return PermissionService.hasPermission(profile, permission);
};

export const useCanAccessAgency = (profile: UserProfile | null, agencyId: string): boolean => {
  return PermissionService.canAccessAgency(profile, agencyId);
};