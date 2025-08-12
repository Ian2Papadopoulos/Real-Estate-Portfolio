import { supabase, Property, PropertyInsert } from './supabase'

export class PropertyService {
  // Get all properties for the current user's agency
  static async getAllProperties(): Promise<Property[]> {
    try {
      // The RLS policies will automatically filter by agency_id
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching properties:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('PropertyService.getAllProperties failed:', error)
      throw error
    }
  }

  // Add a new property
  static async addProperty(property: PropertyInsert): Promise<Property> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([property])
        .select()
        .single()

      if (error) {
        console.error('Error adding property:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('PropertyService.addProperty failed:', error)
      throw error
    }
  }

  // Update a property
  static async updateProperty(id: number, updates: Partial<PropertyInsert>): Promise<Property> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating property:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('PropertyService.updateProperty failed:', error)
      throw error
    }
  }

  // Delete a property
  static async deleteProperty(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting property:', error)
        throw error
      }
    } catch (error) {
      console.error('PropertyService.deleteProperty failed:', error)
      throw error
    }
  }

  // Search properties with filters (agency filtering handled by RLS)
  static async searchProperties(filters: {
    searchTerm?: string
    minPrice?: number
    maxPrice?: number
    listingType?: string
    propertyType?: string
    minBedrooms?: number
    status?: string
  }): Promise<Property[]> {
    try {
      let query = supabase.from('properties').select('*')

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(`address.ilike.%${filters.searchTerm}%,agent.ilike.%${filters.searchTerm}%,owner_name.ilike.%${filters.searchTerm}%`)
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice)
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice)
      }

      if (filters.listingType) {
        query = query.eq('listing_type', filters.listingType)
      }

      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType)
      }

      if (filters.minBedrooms !== undefined) {
        query = query.gte('bedrooms', filters.minBedrooms)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      // Order by most recent
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error searching properties:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('PropertyService.searchProperties failed:', error)
      throw error
    }
  }

  // Test database connection
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('count')
        .limit(1)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}