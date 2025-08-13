// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Please check your .env file.')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file.')
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Enhanced Database types based on the new schema
export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          website: string | null
          status: 'active' | 'suspended' | 'inactive'
          max_users: number
          subscription_tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          website?: string | null
          status?: 'active' | 'suspended' | 'inactive'
          max_users?: number
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          website?: string | null
          status?: 'active' | 'suspended' | 'inactive'
          max_users?: number
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          agency_id: string | null
          name: string
          role: 'super_admin' | 'agency_admin' | 'agent' | 'viewer'
          phone: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          agency_id?: string | null
          name: string
          role?: 'super_admin' | 'agency_admin' | 'agent' | 'viewer'
          phone?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string | null
          name?: string
          role?: 'super_admin' | 'agency_admin' | 'agent' | 'viewer'
          phone?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: number
          agency_id: string
          address: string
          price: number
          listing_type: 'For Sale' | 'For Rent'
          property_type: 'House' | 'Condo' | 'Apartment' | 'Townhouse' | 'Commercial'
          bedrooms: number
          bathrooms: number
          sqft: number
          status: 'Available' | 'Pending' | 'Sold' | 'Off Market'
          agent: string | null
          owner_name: string | null
          owner_phone: string | null
          comments: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          agency_id: string
          address: string
          price: number
          listing_type: 'For Sale' | 'For Rent'
          property_type: 'House' | 'Condo' | 'Apartment' | 'Townhouse' | 'Commercial'
          bedrooms?: number
          bathrooms?: number
          sqft?: number
          status: 'Available' | 'Pending' | 'Sold' | 'Off Market'
          agent?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          comments?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          agency_id?: string
          address?: string
          price?: number
          listing_type?: 'For Sale' | 'For Rent'
          property_type?: 'House' | 'Condo' | 'Apartment' | 'Townhouse' | 'Commercial'
          bedrooms?: number
          bathrooms?: number
          sqft?: number
          status?: 'Available' | 'Pending' | 'Sold' | 'Off Market'
          agent?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          comments?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      agency_invitations: {
        Row: {
          id: string
          agency_id: string
          email: string
          role: 'agency_admin' | 'agent' | 'viewer'
          invited_by: string | null
          token: string
          expires_at: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          email: string
          role?: 'agency_admin' | 'agent' | 'viewer'
          invited_by?: string | null
          token?: string
          expires_at?: string
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          email?: string
          role?: 'agency_admin' | 'agent' | 'viewer'
          invited_by?: string | null
          token?: string
          expires_at?: string
          used_at?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_user_agency_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_agency_admin: {
        Args: {
          target_agency_id?: string
        }
        Returns: boolean
      }
      create_agency_invitation: {
        Args: {
          p_agency_id: string
          p_email: string
          p_role?: string
        }
        Returns: string
      }
      accept_invitation: {
        Args: {
          p_token: string
        }
        Returns: boolean
      }
    }
  }
}

export type Agency = Database['public']['Tables']['agencies']['Row']
export type AgencyInsert = Database['public']['Tables']['agencies']['Insert']
export type AgencyUpdate = Database['public']['Tables']['agencies']['Update']

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type Property = Database['public']['Tables']['properties']['Row']
export type PropertyInsert = Database['public']['Tables']['properties']['Insert']
export type PropertyUpdate = Database['public']['Tables']['properties']['Update']

export type AgencyInvitation = Database['public']['Tables']['agency_invitations']['Row']
export type AgencyInvitationInsert = Database['public']['Tables']['agency_invitations']['Insert']
export type AgencyInvitationUpdate = Database['public']['Tables']['agency_invitations']['Update']

// Helper types
export type Role = UserProfile['role']

// Auth helper functions
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export const isSuperAdmin = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_super_admin')
    if (error) throw error
    return data || false
  } catch (error) {
    console.error('Error checking super admin status:', error)
    return false
  }
}

export const getUserAgencyId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_agency_id')
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting user agency ID:', error)
    return null
  }
}