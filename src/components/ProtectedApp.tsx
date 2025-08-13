import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Filter, Home, Search, MapPin, DollarSign, Bed, Bath, Square, User, Phone, MessageSquare, Building, Edit3, Trash2, Loader2, X, LogOut, Users, Settings } from 'lucide-react';
import { Property, PropertyService } from '../lib/propertyService';
import { useAuth } from '../contexts/AuthContext';

// Frontend types (camelCase for UI)
interface PropertyUI {
  id: number;
  address: string;
  price: number;
  listingType: 'For Sale' | 'For Rent';
  type: 'House' | 'Condo' | 'Apartment' | 'Townhouse' | 'Commercial';
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  status: 'Available' | 'Pending' | 'Sold' | 'Off Market';
  agent: string;
  ownerName: string;
  ownerPhone: string;
  comments: string;
  dateAdded: string;
}

interface Filters {
  searchTerm: string;
  minPrice: string;
  maxPrice: string;
  listingType: string;
  type: string;
  minBedrooms: string;
  status: string;
}

interface FormData {
  address: string;
  price: string;
  listingType: 'For Sale' | 'For Rent';
  type: 'House' | 'Condo' | 'Apartment' | 'Townhouse' | 'Commercial';
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  status: 'Available' | 'Pending' | 'Sold' | 'Off Market';
  agent: string;
  ownerName: string;
  ownerPhone: string;
  comments: string;
}

// Component interfaces
interface TabNavigationProps {
  activeTab: number;
  setActiveTab: (index: number) => void;
  tabs: Array<{ name: string; icon: React.ComponentType<any> }>;
  resultCount: number;
}

interface PropertyFormProps {
  onAddProperty: (property: FormData) => Promise<boolean>;
  loading: boolean;
}

interface SearchFiltersProps {
  filters: Filters;
  onFilterChange: (name: string, value: string) => void;
  onClearFilters: () => void;
  resultCount: number;
  loading: boolean;
  searchResults: PropertyUI[];
  onPropertyClick: (property: PropertyUI) => void;
}

interface PropertyCardProps {
  property: PropertyUI;
  onDelete: (id: number) => void;
  onPropertyClick: (property: PropertyUI) => void;
  loading: boolean;
}

interface PropertyListProps {
  properties: PropertyUI[];
  onDelete: (id: number) => void;
  onPropertyClick: (property: PropertyUI) => void;
  loading: boolean;
}

interface PropertyModalProps {
  property: PropertyUI | null;
  isOpen: boolean;
  onClose: () => void;
}

// Utility functions to convert between database and UI formats
const convertToUI = (dbProperty: Property): PropertyUI => ({
  id: dbProperty.id,
  address: dbProperty.address,
  price: dbProperty.price,
  listingType: dbProperty.listing_type,
  type: dbProperty.property_type,
  bedrooms: dbProperty.bedrooms,
  bathrooms: dbProperty.bathrooms,
  sqft: dbProperty.sqft,
  status: dbProperty.status,
  agent: dbProperty.agent || '',
  ownerName: dbProperty.owner_name || '',
  ownerPhone: dbProperty.owner_phone || '',
  comments: dbProperty.comments || '',
  dateAdded: new Date(dbProperty.created_at).toLocaleDateString()
});

const convertToDB = (uiProperty: FormData, agencyId: string) => ({
  address: uiProperty.address,
  price: parseInt(uiProperty.price),
  listing_type: uiProperty.listingType,
  property_type: uiProperty.type,
  bedrooms: parseInt(uiProperty.bedrooms) || 0,
  bathrooms: parseInt(uiProperty.bathrooms) || 0,
  sqft: parseInt(uiProperty.sqft) || 0,
  status: uiProperty.status,
  agent: uiProperty.agent || null,
  owner_name: uiProperty.ownerName || null,
  owner_phone: uiProperty.ownerPhone || null,
  comments: uiProperty.comments || null,
  agency_id: agencyId // Critical: Include agency_id for multi-tenancy
});

// Validation functions
const validatePositiveNumber = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

const validatePositiveInteger = (value: string): boolean => {
  const num = parseInt(value);
  return !isNaN(num) && num >= 0 && Number.isInteger(parseFloat(value));
};

// App Header Component with User Menu
const AppHeader: React.FC = () => {
  const { user, profile, agency, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{agency?.name}</h1>
            <p className="text-gray-600 mt-1">Real Estate Portfolio Management</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{profile?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{profile?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Role: {profile?.role}</p>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={() => setShowDropdown(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    
                    {profile?.role === 'admin' && (
                      <button
                        onClick={() => setShowDropdown(false)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Manage Users
                      </button>
                    )}
                  </div>

                  <div className="border-t border-gray-200 py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Tab Navigation Component
const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab, tabs, resultCount }) => (
  <nav className="border-b border-gray-200 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex justify-center space-x-8">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`flex items-center gap-3 py-4 px-6 text-sm font-medium transition-all duration-200 relative ${
              activeTab === index
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className={`p-2 rounded-lg transition-all duration-200 ${
              activeTab === index 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              <tab.icon className="w-4 h-4" />
            </div>
            {tab.name}
            {index === 2 && resultCount > 0 && (
              <span className="ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full">
                {resultCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  </nav>
);

// Property Modal Component
const PropertyModal: React.FC<PropertyModalProps> = ({ property, isOpen, onClose }) => {
  if (!isOpen || !property) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Sold': return 'bg-blue-100 text-blue-800';
      case 'Off Market': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Property Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{property.address}</h3>
              <p className="text-3xl font-bold text-gray-900">{formatPrice(property.price)}</p>
              <p className="text-lg text-gray-600 mt-1">{property.listingType}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
              {property.status}
            </span>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                <Building className="w-5 h-5" />
                <span className="font-medium">Type</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{property.type}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                <Bed className="w-5 h-5" />
                <span className="font-medium">Bedrooms</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{property.bedrooms}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                <Bath className="w-5 h-5" />
                <span className="font-medium">Bathrooms</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{property.bathrooms}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                <Square className="w-5 h-5" />
                <span className="font-medium">Sq Ft</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {property.sqft ? property.sqft.toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          {(property.agent || property.ownerName || property.ownerPhone) && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </h4>
              <div className="space-y-2">
                {property.agent && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-medium min-w-[100px]">Agent:</span>
                    <span className="text-gray-900">{property.agent}</span>
                  </div>
                )}
                {property.ownerName && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-medium min-w-[100px]">Owner:</span>
                    <span className="text-gray-900">{property.ownerName}</span>
                  </div>
                )}
                {property.ownerPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-600 font-medium min-w-[100px]">Phone:</span>
                    <span className="text-gray-900">{property.ownerPhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          {property.comments && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments
              </h4>
              <p className="text-gray-700 leading-relaxed">{property.comments}</p>
            </div>
          )}

          {/* Date Added */}
          <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
            Added on {property.dateAdded}
          </div>
        </div>
      </div>
    </div>
  );
};

// Property Form Component
const PropertyForm: React.FC<PropertyFormProps> = ({ onAddProperty, loading }) => {
  const [formData, setFormData] = useState<FormData>({
    address: '',
    price: '',
    listingType: 'For Sale',
    type: 'House',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    status: 'Available',
    agent: '',
    ownerName: '',
    ownerPhone: '',
    comments: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (!validatePositiveNumber(formData.price)) {
      newErrors.price = 'Price must be a positive number';
    }

    if (formData.bedrooms && !validatePositiveInteger(formData.bedrooms)) {
      newErrors.bedrooms = 'Bedrooms must be a positive whole number';
    }

    if (formData.bathrooms && !validatePositiveNumber(formData.bathrooms)) {
      newErrors.bathrooms = 'Bathrooms must be a positive number';
    }

    if (formData.sqft && !validatePositiveInteger(formData.sqft)) {
      newErrors.sqft = 'Square feet must be a positive whole number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await onAddProperty(formData);
      if (success) {
        // Reset form
        setFormData({
          address: '',
          price: '',
          listingType: 'For Sale',
          type: 'House',
          bedrooms: '',
          bathrooms: '',
          sqft: '',
          status: 'Available',
          agent: '',
          ownerName: '',
          ownerPhone: '',
          comments: ''
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Error adding property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (fieldName: string) => 
    `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors ${
      errors[fieldName] ? 'border-red-300 bg-red-50' : 'border-gray-300'
    }`;
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="space-y-8">
      {/* Property Details */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-900 rounded-lg text-white">
            <Building className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Property Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={labelClass}>
              <MapPin className="w-4 h-4 inline mr-1" />
              Property Address *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className={inputClass('address')}
              placeholder="Enter property address"
              required
              disabled={loading}
            />
            {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className={labelClass}>
              <DollarSign className="w-4 h-4 inline mr-1" />
              Price *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className={inputClass('price')}
              placeholder="Enter price"
              min="1"
              step="1"
              required
              disabled={loading}
            />
            {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className={labelClass}>Listing Type</label>
            <select name="listingType" value={formData.listingType} onChange={handleInputChange} className={inputClass('listingType')} disabled={loading}>
              <option value="For Sale">For Sale</option>
              <option value="For Rent">For Rent</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Property Type</label>
            <select name="type" value={formData.type} onChange={handleInputChange} className={inputClass('type')} disabled={loading}>
              <option value="House">House</option>
              <option value="Condo">Condo</option>
              <option value="Apartment">Apartment</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className={inputClass('status')} disabled={loading}>
              <option value="Available">Available</option>
              <option value="Pending">Pending</option>
              <option value="Sold">Sold</option>
              <option value="Off Market">Off Market</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>
              <Bed className="w-4 h-4 inline mr-1" />
              Bedrooms
            </label>
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleInputChange}
              className={inputClass('bedrooms')}
              placeholder="Number of bedrooms"
              min="0"
              step="1"
              disabled={loading}
            />
            {errors.bedrooms && <p className="text-red-600 text-sm mt-1">{errors.bedrooms}</p>}
          </div>

          <div>
            <label className={labelClass}>
              <Bath className="w-4 h-4 inline mr-1" />
              Bathrooms
            </label>
            <input
              type="number"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleInputChange}
              className={inputClass('bathrooms')}
              placeholder="Number of bathrooms"
              min="0"
              step="0.5"
              disabled={loading}
            />
            {errors.bathrooms && <p className="text-red-600 text-sm mt-1">{errors.bathrooms}</p>}
          </div>

          <div>
            <label className={labelClass}>
              <Square className="w-4 h-4 inline mr-1" />
              Square Feet
            </label>
            <input
              type="number"
              name="sqft"
              value={formData.sqft}
              onChange={handleInputChange}
              className={inputClass('sqft')}
              placeholder="Total square footage"
              min="1"
              step="1"
              disabled={loading}
            />
            {errors.sqft && <p className="text-red-600 text-sm mt-1">{errors.sqft}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>
              <User className="w-4 h-4 inline mr-1" />
              Agent Name
            </label>
            <input
              type="text"
              name="agent"
              value={formData.agent}
              onChange={handleInputChange}
              className={inputClass('agent')}
              placeholder="Listing agent name"
              disabled={loading}
            />
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-900 rounded-lg text-white">
            <User className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>
              <User className="w-4 h-4 inline mr-1" />
              Owner Name
            </label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleInputChange}
              className={inputClass('ownerName')}
              placeholder="Property owner name"
              disabled={loading}
            />
          </div>

          <div>
            <label className={labelClass}>
              <Phone className="w-4 h-4 inline mr-1" />
              Owner Phone
            </label>
            <input
              type="tel"
              name="ownerPhone"
              value={formData.ownerPhone}
              onChange={handleInputChange}
              className={inputClass('ownerPhone')}
              placeholder="Owner phone number"
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Comments
            </label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              className={`${inputClass('comments')} h-24 resize-none`}
              placeholder="Additional notes or comments"
              disabled={loading}
            />
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.address || !formData.price || loading}
          className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Adding...' : 'Add Property'}
        </button>
      </div>
    </div>
  );
};

// Search Filters Component
const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onFilterChange, onClearFilters, resultCount, loading, searchResults, onPropertyClick }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFilterChange(e.target.name, e.target.value);
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  const hasActiveFilters = Object.values(filters).some(value => value !== '');
  const hasSearchResults = searchResults.length > 0 || filters.searchTerm.length > 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-900 rounded-lg text-white">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Search Properties</h3>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            className={`${inputClass} pl-12`}
            placeholder="Search by address, agent, or owner..."
            disabled={loading}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-lg text-white">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              disabled={loading}
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div>
            <label className={labelClass}>Min Price</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="Min price"
              min="0"
              disabled={loading}
            />
          </div>

          <div>
            <label className={labelClass}>Max Price</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="Max price"
              min="0"
              disabled={loading}
            />
          </div>

          <div>
            <label className={labelClass}>Listing Type</label>
            <select name="listingType" value={filters.listingType} onChange={handleInputChange} className={inputClass} disabled={loading}>
              <option value="">All Types</option>
              <option value="For Sale">For Sale</option>
              <option value="For Rent">For Rent</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Property Type</label>
            <select name="type" value={filters.type} onChange={handleInputChange} className={inputClass} disabled={loading}>
              <option value="">All Types</option>
              <option value="House">House</option>
              <option value="Condo">Condo</option>
              <option value="Apartment">Apartment</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Min Bedrooms</label>
            <select name="minBedrooms" value={filters.minBedrooms} onChange={handleInputChange} className={inputClass} disabled={loading}>
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select name="status" value={filters.status} onChange={handleInputChange} className={inputClass} disabled={loading}>
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Pending">Pending</option>
              <option value="Sold">Sold</option>
              <option value="Off Market">Off Market</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">
            {loading ? "Searching..." : resultCount === 0 
              ? "No properties found" 
              : `${resultCount} ${resultCount === 1 ? 'property' : 'properties'} found`
            }
          </span>
          <div className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-medium">
            {loading ? "..." : resultCount}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {hasSearchResults && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-lg text-white">
              <Home className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
          </div>
          <PropertyList 
            properties={searchResults} 
            onDelete={() => {}} // No delete in search results
            onPropertyClick={onPropertyClick}
            loading={loading} 
          />
        </div>
      )}
    </div>
  );
};

// Property Card Component
const PropertyCard: React.FC<PropertyCardProps> = ({ property, onDelete, onPropertyClick, loading }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Sold': return 'bg-blue-100 text-blue-800';
      case 'Off Market': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (isDeleting || loading) return;
    
    if (confirm('Are you sure you want to delete this property?')) {
      setIsDeleting(true);
      try {
        await onDelete(property.id);
      } catch (error) {
        console.error('Error deleting property:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    // TODO: Implement edit functionality
    console.log('Edit property:', property.id);
  };

  return (
    <div 
      onClick={() => onPropertyClick(property)}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.address}</h3>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(property.price)}</p>
          <p className="text-sm text-gray-600">{property.listingType}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
          {property.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building className="w-4 h-4" />
            {property.type}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Bed className="w-4 h-4" />
            {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Bath className="w-4 h-4" />
            {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Square className="w-4 h-4" />
            {property.sqft ? `${property.sqft.toLocaleString()} sq ft` : 'N/A'}
          </div>
        </div>
      </div>

      {(property.agent || property.ownerName) && (
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-1">
            {property.agent && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Agent: {property.agent}</span>
              </div>
            )}
            {property.ownerName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Owner: {property.ownerName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Added {property.dateAdded}</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleEdit}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" 
              disabled={loading}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting || loading}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex items-center"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Property List Component
const PropertyList: React.FC<PropertyListProps> = ({ properties, onDelete, onPropertyClick, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading properties...</span>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gray-50 rounded-lg p-12 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Home className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h3>
          <p className="text-gray-600">
            No properties match your current search criteria. Try adjusting your filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {properties.map(property => (
          <PropertyCard 
            key={property.id} 
            property={property} 
            onDelete={onDelete} 
            onPropertyClick={onPropertyClick}
            loading={loading} 
          />
        ))}
      </div>
    </div>
  );
};

// Main Protected App Component
export default function ProtectedApp() {
  const [activeTab, setActiveTab] = useState(0);
  const [properties, setProperties] = useState<PropertyUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyUI | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    minPrice: '',
    maxPrice: '',
    listingType: '',
    type: '',
    minBedrooms: '',
    status: ''
  });

  const { profile } = useAuth();

  const tabs = [
    { name: 'Add Property', icon: Plus },
    { name: 'Search & Filter', icon: Filter },
    { name: 'Portfolio', icon: Home }
  ];

  // Load properties on component mount
  useEffect(() => {
    if (profile?.agency_id) {
      loadProperties();
    }
  }, [profile]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const dbProperties = await PropertyService.getAllProperties();
      const uiProperties = dbProperties.map(convertToUI);
      setProperties(uiProperties);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  // Filter properties based on current filters
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearch = 
        property.address.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        property.agent.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        property.ownerName.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesMinPrice = !filters.minPrice || property.price >= parseInt(filters.minPrice);
      const matchesMaxPrice = !filters.maxPrice || property.price <= parseInt(filters.maxPrice);
      const matchesListingType = !filters.listingType || property.listingType === filters.listingType;
      const matchesType = !filters.type || property.type === filters.type;
      const matchesMinBedrooms = !filters.minBedrooms || property.bedrooms >= parseInt(filters.minBedrooms);
      const matchesStatus = !filters.status || property.status === filters.status;

      return matchesSearch && matchesMinPrice && matchesMaxPrice && 
             matchesListingType && matchesType && matchesMinBedrooms && matchesStatus;
    });
  }, [properties, filters]);

  const updateFilter = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      minPrice: '',
      maxPrice: '',
      listingType: '',
      type: '',
      minBedrooms: '',
      status: ''
    });
  };

  const addProperty = async (formData: FormData): Promise<boolean> => {
    if (!profile?.agency_id) {
      setError('No agency ID found. Please try logging out and back in.');
      return false;
    }

    try {
      const dbProperty = convertToDB(formData, profile.agency_id);
      const newProperty = await PropertyService.addProperty(dbProperty);
      const uiProperty = convertToUI(newProperty);
      setProperties(prev => [uiProperty, ...prev]);
      setActiveTab(2); // Switch to portfolio tab
      return true;
    } catch (err) {
      console.error('Error adding property:', err);
      setError('Failed to add property. Please try again.');
      return false;
    }
  };

  const deleteProperty = async (id: number) => {
    try {
      await PropertyService.deleteProperty(id);
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property. Please try again.');
    }
  };

  const handlePropertyClick = (property: PropertyUI) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center py-16">
          <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Home className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadProperties}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader />

      {/* Navigation */}
      <TabNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        tabs={tabs} 
        resultCount={filteredProperties.length}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div>
          {activeTab === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gray-900 rounded-lg text-white">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Add New Property</h2>
                  <p className="text-gray-600">Add a new property to your portfolio</p>
                </div>
              </div>
              <PropertyForm onAddProperty={addProperty} loading={loading} />
            </div>
          )}

          {activeTab === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gray-900 rounded-lg text-white">
                  <Filter className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Search & Filter Properties</h2>
                  <p className="text-gray-600">Find properties using advanced filters</p>
                </div>
              </div>
              <SearchFilters
                filters={filters}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
                resultCount={filteredProperties.length}
                loading={loading}
                searchResults={filteredProperties}
                onPropertyClick={handlePropertyClick}
              />
            </div>
          )}

          {activeTab === 2 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-900 rounded-lg text-white">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Property Portfolio</h2>
                    <p className="text-gray-600">Your complete investment overview</p>
                  </div>
                </div>
                <div className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium">
                  {loading ? "Loading..." : `${filteredProperties.length} ${filteredProperties.length === 1 ? 'Property' : 'Properties'}`}
                </div>
              </div>
              <PropertyList 
                properties={filteredProperties} 
                onDelete={deleteProperty} 
                onPropertyClick={handlePropertyClick}
                loading={loading} 
              />
            </div>
          )}
        </div>
      </main>

      {/* Property Details Modal */}
      <PropertyModal 
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}