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
      properties: {
        Row: {
          id: number
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

export type Property = Database['public']['Tables']['properties']['Row']
export type PropertyInsert = Database['public']['Tables']['properties']['Insert']
export type PropertyUpdate = Database['public']['Tables']['properties']['Update']