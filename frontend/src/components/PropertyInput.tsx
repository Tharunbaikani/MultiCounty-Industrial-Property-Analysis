'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Zap, Square, Globe, Search, Sparkles } from 'lucide-react';

interface PropertyDetails {
  address: string;
  building_area: number;
  zoning_code: string;
  county: string;
}

export default function PropertyInput() {
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
    address: '',
    building_area: 0,
    zoning_code: '',
    county: '',
  });

  const queryClient = useQueryClient();

  const findComparablesMutation = useMutation({
    mutationFn: async (property: PropertyDetails) => {
      // Parse address to get city and state
      const addressParts = property.address.split(',');
      const city = addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : '';
      const state = addressParts.length > 2 ? addressParts[addressParts.length - 1].trim().split(' ')[0] : '';
      
      // Convert county to county_id
      const countyMapping: { [key: string]: string } = {
        'Cook County, IL': 'cook',
        'Dallas County, TX': 'dallas',
        'Los Angeles County, CA': 'los_angeles',
      };
      
      const county_id = countyMapping[property.county] || 'dallas';
      
      // Convert PropertyDetails to PropertyResponse format expected by the API
      const propertyForAPI = {
        id: `input_${Date.now()}`,
        county_id,
        address: property.address,
        city,
        state,
        property_type: 'industrial',
        zoning_code: property.zoning_code,
        building_area: property.building_area,
        data_source: 'user_input',
        last_updated: new Date().toISOString(),
        is_verified: false,
      };

      const response = await fetch('http://localhost:8000/api/properties/comparables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyForAPI),
      });
      
      if (!response.ok) {
        throw new Error('Failed to find comparables');
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('API Response:', data);
      console.log('Comparables count:', data?.count);
      console.log('Comparables data:', data?.comparables);
      queryClient.setQueryData(['comparables', 'user_input'], data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!propertyDetails.address || !propertyDetails.building_area || !propertyDetails.zoning_code || !propertyDetails.county) {
      alert('Please fill in all required fields');
      return;
    }

    findComparablesMutation.mutate(propertyDetails);
  };

  const handleInputChange = (field: keyof PropertyDetails, value: string | number) => {
    setPropertyDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const counties = [
    { value: 'Cook County, IL', label: 'Cook County, IL', color: 'text-blue-600' },
    { value: 'Dallas County, TX', label: 'Dallas County, TX', color: 'text-green-600' },
    { value: 'Los Angeles County, CA', label: 'Los Angeles County, CA', color: 'text-purple-600' },
  ];

  const zoningTypes = [
    { value: 'INDUSTRIAL', label: 'INDUSTRIAL', description: 'General Industrial Use' },
    { value: 'M-1', label: 'M-1 (Light Manufacturing)', description: 'Assembly, packaging, light production' },
    { value: 'M-2', label: 'M-2 (Manufacturing)', description: 'Standard manufacturing facilities' },
    { value: 'I-1', label: 'I-1 (Light Industrial)', description: 'Warehouses, distribution centers' },
    { value: 'I-2', label: 'I-2 (Heavy Industrial)', description: 'Large manufacturing, heavy processing' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        {/* Property Address */}
        <div className="fancy-input group">
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span>Property Address *</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="e.g., 725 METKER ST, IRVING, TX 75062"
              value={propertyDetails.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full pl-4 pr-12 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-blue-500 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 hover:shadow-md"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <MapPin className="w-3 h-3 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Building Area */}
        <div className="fancy-input group">
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Square className="w-4 h-4 text-white" />
            </div>
            <span>Building Size (sq ft) *</span>
          </label>
          <div className="relative">
            <input
              type="number"
              required
              placeholder="e.g., 24,980"
              value={propertyDetails.building_area || ''}
              onChange={(e) => handleInputChange('building_area', e.target.value ? parseInt(e.target.value) : 0)}
              className="w-full pl-4 pr-20 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-green-500 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 hover:shadow-md"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">sq ft</span>
            </div>
          </div>
        </div>

        {/* Zoning Code */}
        <div className="fancy-input group">
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span>Zoning Classification *</span>
          </label>
          <div className="relative">
            <select
              required
              value={propertyDetails.zoning_code}
              onChange={(e) => handleInputChange('zoning_code', e.target.value)}
              className="w-full pl-4 pr-12 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-purple-500 focus:ring-0 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md appearance-none"
            >
              <option value="">Select Zoning Type</option>
              {zoningTypes.map(zoning => (
                <option key={zoning.value} value={zoning.value}>
                  {zoning.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {propertyDetails.zoning_code && (
            <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {zoningTypes.find(z => z.value === propertyDetails.zoning_code)?.description}
              </p>
            </div>
          )}
        </div>

        {/* County Selection */}
        <div className="fancy-input group">
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span>Target County *</span>
          </label>
          <div className="grid grid-cols-1 gap-3">
            {counties.map(county => (
              <label
                key={county.value}
                className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                  propertyDetails.county === county.value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm hover:border-indigo-300'
                }`}
              >
                <input
                  type="radio"
                  name="county"
                  value={county.value}
                  checked={propertyDetails.county === county.value}
                  onChange={(e) => handleInputChange('county', e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3 w-full">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    propertyDetails.county === county.value
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300 dark:border-gray-500'
                  }`}>
                    {propertyDetails.county === county.value && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className={`font-medium ${county.color} dark:text-gray-200`}>
                    {county.label}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <button
          type="submit"
          disabled={findComparablesMutation.isPending}
          className="w-full gradient-button text-white font-semibold py-4 px-6 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl"
        >
          <span className="flex items-center justify-center space-x-3">
            {findComparablesMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Analyzing Properties...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Find Comparable Properties</span>
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </span>
        </button>
      </div>

      {/* Error Display */}
      {findComparablesMutation.error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold">Error finding comparables:</p>
          </div>
          <p className="text-sm mt-1 ml-7">{findComparablesMutation.error.message}</p>
        </div>
      )}

      {/* Success State */}
      {findComparablesMutation.isSuccess && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-xl backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="font-semibold">Analysis complete! Check the results panel.</p>
          </div>
        </div>
      )}
    </form>
  );
} 