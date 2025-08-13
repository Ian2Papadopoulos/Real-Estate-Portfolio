// src/lib/propertyService.ts
import { supabase, Property, PropertyInsert, PropertyUpdate, getCurrentUser } from './supabase'

export class PropertyService {
  // Get all properties for the current user's agency (or all if super admin)
  static async getAllProperties(): Promise<Property[]> {
    try {
      // The RLS policies will automatically filter by agency_id or allow super admin access
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

  // Get properties for a specific agency (super admin only)
  static async getAgencyProperties(agencyId: string): Promise<Property[]> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching agency properties:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('PropertyService.getAgencyProperties failed:', error)
      throw error
    }
  }

  // Get single property by ID
  static async getPropertyById(id: number): Promise<Property | null> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return data
    } catch (error) {
      console.error('PropertyService.getPropertyById failed:', error)
      throw error
    }
  }

  // Add a new property
  static async addProperty(property: PropertyInsert): Promise<Property> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Add audit fields
      const propertyWithAudit = {
        ...property,
        created_by: user.id,
        updated_by: user.id
      }

      const { data, error } = await supabase
        .from('properties')
        .insert([propertyWithAudit])
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
  static async updateProperty(id: number, updates: Partial<PropertyUpdate>): Promise<Property> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Add audit fields
      const updatesWithAudit = {
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('properties')
        .update(updatesWithAudit)
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

  // Search properties with filters (respects RLS automatically)
  static async searchProperties(filters: {
    searchTerm?: string
    minPrice?: number
    maxPrice?: number
    listingType?: string
    propertyType?: string
    minBedrooms?: number
    status?: string
    agencyId?: string // Only used by super admin
  }): Promise<Property[]> {
    try {
      let query = supabase.from('properties').select('*')

      // Agency filter (super admin only)
      if (filters.agencyId) {
        query = query.eq('agency_id', filters.agencyId)
      }

      // Apply search filters
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

  // Get property statistics
  static async getPropertyStats(agencyId?: string): Promise<{
    total: number
    available: number
    pending: number
    sold: number
    offMarket: number
    totalValue: number
    averagePrice: number
  }> {
    try {
      let query = supabase.from('properties').select('status, price')

      // Filter by agency if specified (super admin feature)
      if (agencyId) {
        query = query.eq('agency_id', agencyId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching property stats:', error)
        throw error
      }

      const properties = data || []
      const stats = {
        total: properties.length,
        available: properties.filter(p => p.status === 'Available').length,
        pending: properties.filter(p => p.status === 'Pending').length,
        sold: properties.filter(p => p.status === 'Sold').length,
        offMarket: properties.filter(p => p.status === 'Off Market').length,
        totalValue: properties.reduce((sum, p) => sum + (p.price || 0), 0),
        averagePrice: properties.length > 0 
          ? properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length 
          : 0
      }

      return stats
    } catch (error) {
      console.error('PropertyService.getPropertyStats failed:', error)
      throw error
    }
  }

  // Bulk update properties (admin feature)
  static async bulkUpdateProperties(
    propertyIds: number[], 
    updates: Partial<PropertyUpdate>
  ): Promise<Property[]> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const updatesWithAudit = {
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('properties')
        .update(updatesWithAudit)
        .in('id', propertyIds)
        .select()

      if (error) {
        console.error('Error bulk updating properties:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('PropertyService.bulkUpdateProperties failed:', error)
      throw error
    }
  }

  // Get recent activity (admin feature)
  static async getRecentActivity(limit = 10, agencyId?: string): Promise<Array<{
    id: number
    address: string
    action: string
    user_name: string
    created_at: string
  }>> {
    try {
      let query = supabase
        .from('properties')
        .select(`
          id,
          address,
          created_at,
          updated_at,
          created_by,
          updated_by,
          user_profiles!properties_created_by_fkey(name),
          user_profiles!properties_updated_by_fkey(name)
        `)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (agencyId) {
        query = query.eq('agency_id', agencyId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching recent activity:', error)
        throw error
      }

      // Transform data into activity format
      const activities: Array<{
        id: number
        address: string
        action: string
        user_name: string
        created_at: string
      }> = []

      data?.forEach(property => {
        // Add creation activity
        if (property.user_profiles) {
          activities.push({
            id: property.id,
            address: property.address,
            action: 'created',
            user_name: property.user_profiles.name || 'Unknown',
            created_at: property.created_at
          })
        }

        // Add update activity if different from creation
        if (property.updated_at !== property.created_at && property.user_profiles) {
          activities.push({
            id: property.id,
            address: property.address,
            action: 'updated',
            user_name: property.user_profiles.name || 'Unknown',
            created_at: property.updated_at
          })
        }
      })

      // Sort by most recent and limit
      return activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)

    } catch (error) {
      console.error('PropertyService.getRecentActivity failed:', error)
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

  // Export properties to CSV (admin feature)
  static async exportProperties(agencyId?: string): Promise<string> {
    try {
      const properties = agencyId 
        ? await this.getAgencyProperties(agencyId)
        : await this.getAllProperties()

      // Create CSV headers
      const headers = [
        'ID', 'Address', 'Price', 'Listing Type', 'Property Type',
        'Bedrooms', 'Bathrooms', 'Sq Ft', 'Status', 'Agent',
        'Owner Name', 'Owner Phone', 'Comments', 'Created At'
      ]

      // Create CSV rows
      const rows = properties.map(property => [
        property.id,
        `"${property.address}"`,
        property.price,
        property.listing_type,
        property.property_type,
        property.bedrooms,
        property.bathrooms,
        property.sqft,
        property.status,
        `"${property.agent || ''}"`,
        `"${property.owner_name || ''}"`,
        `"${property.owner_phone || ''}"`,
        `"${property.comments || ''}"`,
        new Date(property.created_at).toLocaleDateString()
      ])

      // Combine headers and rows
      const csv = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n')

      return csv
    } catch (error) {
      console.error('PropertyService.exportProperties failed:', error)
      throw error
    }
  }
}