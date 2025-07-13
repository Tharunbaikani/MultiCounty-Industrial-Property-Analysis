'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, Building, DollarSign } from 'lucide-react';

interface SearchParams {
  counties: string[];
  property_type?: string;
  min_size?: number;
  max_size?: number;
  zoning_codes?: string[];
  city?: string;
  min_assessed_value?: number;
  max_assessed_value?: number;
}

export default function PropertySearch() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    counties: [],
    property_type: '',
    min_size: undefined,
    max_size: undefined,
    zoning_codes: [],
    city: '',
    min_assessed_value: undefined,
    max_assessed_value: undefined,
  });

  const queryClient = useQueryClient();

  const searchMutation = useMutation({
    mutationFn: async (params: SearchParams) => {
      const response = await fetch('http://localhost:8000/api/properties/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['properties', 'search'], data);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty values
    const filteredParams = Object.fromEntries(
      Object.entries(searchParams).filter(([_, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== '' && value !== undefined;
      })
    );
    
    searchMutation.mutate(filteredParams as SearchParams);
  };

  const handleCountyChange = (county: string, checked: boolean) => {
    setSearchParams(prev => ({
      ...prev,
      counties: checked 
        ? [...prev.counties, county]
        : prev.counties.filter(c => c !== county)
    }));
  };

  const handleZoningChange = (zoning: string, checked: boolean) => {
    setSearchParams(prev => ({
      ...prev,
      zoning_codes: checked 
        ? [...(prev.zoning_codes || []), zoning]
        : (prev.zoning_codes || []).filter(z => z !== zoning)
    }));
  };

  const counties = [
    { id: 'cook', name: 'Cook County, IL' },
    { id: 'dallas', name: 'Dallas County, TX' },
    { id: 'los_angeles', name: 'Los Angeles County, CA' },
  ];

  const zoningCodes = ['M1', 'M2', 'M3', 'I-1', 'I-2', 'I-3', 'INDUSTRIAL'];

  return (
    <form onSubmit={handleSearch} className="space-y-6">
      {/* Counties */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          Counties
        </label>
        <div className="space-y-2">
          {counties.map(county => (
            <label key={county.id} className="flex items-center">
              <input
                type="checkbox"
                checked={searchParams.counties.includes(county.id)}
                onChange={(e) => handleCountyChange(county.id, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">{county.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Building className="inline w-4 h-4 mr-1" />
          Property Type
        </label>
        <select
          value={searchParams.property_type}
          onChange={(e) => setSearchParams(prev => ({ ...prev, property_type: e.target.value }))}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Any</option>
          <option value="industrial">Industrial</option>
          <option value="warehouse">Warehouse</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="distribution">Distribution</option>
        </select>
      </div>

      {/* Building Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Building Size (sq ft)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={searchParams.min_size || ''}
            onChange={(e) => setSearchParams(prev => ({ 
              ...prev, 
              min_size: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Max"
            value={searchParams.max_size || ''}
            onChange={(e) => setSearchParams(prev => ({ 
              ...prev, 
              max_size: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Zoning Codes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zoning Codes
        </label>
        <div className="grid grid-cols-3 gap-2">
          {zoningCodes.map(zoning => (
            <label key={zoning} className="flex items-center">
              <input
                type="checkbox"
                checked={(searchParams.zoning_codes || []).includes(zoning)}
                onChange={(e) => handleZoningChange(zoning, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-1 text-xs text-gray-600">{zoning}</span>
            </label>
          ))}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          City
        </label>
        <input
          type="text"
          placeholder="Enter city name"
          value={searchParams.city}
          onChange={(e) => setSearchParams(prev => ({ ...prev, city: e.target.value }))}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Assessed Value */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <DollarSign className="inline w-4 h-4 mr-1" />
          Assessed Value
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={searchParams.min_assessed_value || ''}
            onChange={(e) => setSearchParams(prev => ({ 
              ...prev, 
              min_assessed_value: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Max"
            value={searchParams.max_assessed_value || ''}
            onChange={(e) => setSearchParams(prev => ({ 
              ...prev, 
              max_assessed_value: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Search Button */}
      <button
        type="submit"
        disabled={searchMutation.isPending || searchParams.counties.length === 0}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Search className="w-4 h-4 mr-2" />
        {searchMutation.isPending ? 'Searching...' : 'Search Properties'}
      </button>

      {searchMutation.isError && (
        <div className="text-red-600 text-sm">
          Error: {searchMutation.error?.message || 'Search failed'}
        </div>
      )}
    </form>
  );
} 