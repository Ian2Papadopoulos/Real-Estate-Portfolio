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

// Database types based on your ACTUAL SQL schema
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          agency_id: string
          name: string
          role: 'admin' | 'agent' | 'viewer'
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          agency_id: string
          name: string
          role?: 'admin' | 'agent' | 'viewer'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          name?: string
          role?: 'admin' | 'agent' | 'viewer'
          phone?: string | null
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
          created_at: string
          owner_name: string | null
          owner_phone: string | null
          comments: string | null
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
          created_at?: string
          owner_name?: string | null
          owner_phone?: string | null
          comments?: string | null
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
          created_at?: string
          owner_name?: string | null
          owner_phone?: string | null
          comments?: string | null
        }
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