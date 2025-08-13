// src/lib/agencyService.ts
import { supabase, Agency, UserProfile } from './supabase';

export interface AgencyInsert {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  max_users?: number;
  subscription_tier?: string;
}

export interface AgencyUpdate {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  status?: 'active' | 'suspended' | 'inactive';
  max_users?: number;
  subscription_tier?: string;
}

export interface AgencyInvitation {
  id: string;
  agency_id: string;
  email: string;
  role: 'agency_admin' | 'agent' | 'viewer';
  invited_by: string | null;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface AgencyWithStats extends Agency {
  user_count: number;
  property_count: number;
  active_invitations: number;
}

export class AgencyService {
  /**
   * Get all agencies (super admin only)
   */
  static async getAllAgencies(): Promise<AgencyWithStats[]> {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select(`
          *,
          user_profiles(count),
          properties(count),
          agency_invitations!inner(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to include counts
      return (data || []).map(agency => ({
        ...agency,
        user_count: agency.user_profiles?.[0]?.count || 0,
        property_count: agency.properties?.[0]?.count || 0,
        active_invitations: agency.agency_invitations?.filter(
          (inv: any) => !inv.used_at && new Date(inv.expires_at) > new Date()
        ).length || 0
      }));
    } catch (error) {
      console.error('Error fetching agencies:', error);
      throw error;
    }
  }

  /**
   * Get agency by ID
   */
  static async getAgencyById(id: string): Promise<Agency | null> {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching agency:', error);
      throw error;
    }
  }

  /**
   * Create new agency (super admin only)
   */
  static async createAgency(agency: AgencyInsert): Promise<Agency> {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .insert([agency])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating agency:', error);
      throw error;
    }
  }

  /**
   * Update agency
   */
  static async updateAgency(id: string, updates: AgencyUpdate): Promise<Agency> {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating agency:', error);
      throw error;
    }
  }

  /**
   * Delete agency (super admin only)
   */
  static async deleteAgency(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting agency:', error);
      throw error;
    }
  }

  /**
   * Get agency users
   */
  static async getAgencyUsers(agencyId: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching agency users:', error);
      throw error;
    }
  }

  /**
   * Create agency invitation
   */
  static async createInvitation(
    agencyId: string,
    email: string,
    role: 'agency_admin' | 'agent' | 'viewer' = 'agent'
  ): Promise<AgencyInvitation> {
    try {
      // Use the database function to create invitation
      const { data, error } = await supabase.rpc('create_agency_invitation', {
        p_agency_id: agencyId,
        p_email: email,
        p_role: role
      });

      if (error) throw error;

      // Fetch the created invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('agency_invitations')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) throw fetchError;
      return invitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  /**
   * Get agency invitations
   */
  static async getAgencyInvitations(agencyId: string): Promise<AgencyInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('agency_invitations')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  }

  /**
   * Get invitation by token
   */
  static async getInvitationByToken(token: string): Promise<AgencyInvitation | null> {
    try {
      const { data, error } = await supabase
        .from('agency_invitations')
        .select(`
          *,
          agencies(name)
        `)
        .eq('token', token)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      throw error;
    }
  }

  /**
   * Accept invitation (creates user profile)
   */
  static async acceptInvitation(token: string): Promise<UserProfile> {
    try {
      // Use the database function to accept invitation
      const { data, error } = await supabase.rpc('accept_invitation', {
        p_token: token
      });

      if (error) throw error;

      // Fetch the created/updated user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profileError) throw profileError;
      return profile;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Cancel invitation
   */
  static async cancelInvitation(invitationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('agency_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error canceling invitation:', error);
      throw error;
    }
  }

  /**
   * Resend invitation (creates new token)
   */
  static async resendInvitation(invitationId: string): Promise<AgencyInvitation> {
    try {
      const { data, error } = await supabase
        .from('agency_invitations')
        .update({
          token: crypto.randomUUID(), // Generate new token
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  /**
   * Remove user from agency
   */
  static async removeUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(
    userId: string, 
    role: 'agency_admin' | 'agent' | 'viewer'
  ): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Check if email is already invited to agency
   */
  static async isEmailInvited(agencyId: string, email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('agency_invitations')
        .select('id')
        .eq('agency_id', agencyId)
        .eq('email', email)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (error) throw error;
      return (data || []).length > 0;
    } catch (error) {
      console.error('Error checking invitation:', error);
      return false;
    }
  }

  /**
   * Check if user with email already exists
   */
  static async emailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) throw error;
      
      return data.users.some(user => user.email === email);
    } catch (error) {
      // Fallback: check user_profiles table
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);
        
        // If we can't check auth.users, we can't verify email existence
        return false;
      } catch {
        return false;
      }
    }
  }
}