'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building, MapPin, DollarSign, Calendar, Zap, TrendingUp } from 'lucide-react';

interface Property {
  id: string;
  county_id: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  property_type?: string;
  zoning_code?: string;
  building_area?: number;
  lot_area?: number;
  year_built?: number;
  assessed_value?: number;
  market_value?: number;
  sale_price?: number;
  sale_date?: string;
  latitude?: number;
  longitude?: number;
  data_source: string;
  last_updated: string;
  quality_score?: number;
  is_verified: boolean;
  outlier_flags?: string[];
}

interface SearchResults {
  properties: Property[];
  count: number;
}

interface ComparableProperty {
  property: Property;
  similarity_score: number;
  distance_miles?: number;
  similarity_factors: {
    location: number;
    size: number;
    age: number;
    zoning: number;
    value: number;
  };
  confidence_score: number;
}

interface ComparableResults {
  target_property: Property;
  comparables: ComparableProperty[];
  count: number;
}

export default function PropertyList() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showComparables, setShowComparables] = useState(false);
  const queryClient = useQueryClient();

  // Get search results from query cache
  const searchResults = queryClient.getQueryData<SearchResults>(['properties', 'search']);

  // Find comparables mutation
  const comparablesMutation = useMutation({
    mutationFn: async (property: Property) => {
      const response = await fetch('http://localhost:8000/api/properties/comparables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(property),
      });
      if (!response.ok) {
        throw new Error('Failed to find comparables');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['comparables', selectedProperty?.id], data);
      setShowComparables(true);
    },
  });

  // Get comparables results
  const comparablesData = queryClient.getQueryData<ComparableResults>(['comparables', selectedProperty?.id]);

  const handleFindComparables = (property: Property) => {
    setSelectedProperty(property);
    comparablesMutation.mutate(property);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // We don't need loading state since we're getting cached data

  if (!searchResults?.properties || searchResults.properties.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your search criteria to find properties.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Found {searchResults.count} properties
        </p>
        {showComparables && (
          <button
            onClick={() => setShowComparables(false)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Search Results
          </button>
        )}
      </div>

      {/* Property List or Comparables */}
      {!showComparables ? (
        <div className="grid gap-4">
          {searchResults.properties.map((property) => (
            <div
              key={property.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {property.address}
                    </h3>
                    {property.quality_score && (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getQualityColor(property.quality_score)}`}>
                        {Math.round(property.quality_score * 100)}% Quality
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {property.city}, {property.state} {property.zip_code}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{formatNumber(property.building_area)} sq ft</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Value:</span>
                      <span className="font-medium">{formatCurrency(property.assessed_value)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Built:</span>
                      <span className="font-medium">{property.year_built || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Zoning:</span>
                      <span className="font-medium">{property.zoning_code || 'N/A'}</span>
                    </div>
                  </div>

                  {property.outlier_flags && property.outlier_flags.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {property.outlier_flags.map((flag, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800"
                          >
                            {flag.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => handleFindComparables(property)}
                    disabled={comparablesMutation.isPending}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {comparablesMutation.isPending ? 'Finding...' : 'Find Comparables'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        comparablesData && (
          <div className="space-y-6">
            {/* Target Property */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Target Property</h3>
              <div className="text-sm text-blue-800">
                <p className="font-medium">{comparablesData.target_property.address}</p>
                <p>{comparablesData.target_property.city}, {comparablesData.target_property.state}</p>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <span>Size: {formatNumber(comparablesData.target_property.building_area)} sq ft</span>
                  <span>Value: {formatCurrency(comparablesData.target_property.assessed_value)}</span>
                  <span>Built: {comparablesData.target_property.year_built || 'N/A'}</span>
                  <span>Zoning: {comparablesData.target_property.zoning_code || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Comparable Properties */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Comparable Properties ({comparablesData.count})
              </h3>
              
              <div className="space-y-4">
                {comparablesData.comparables.map((comparable, index) => (
                  <div
                    key={comparable.property.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900">{comparable.property.address}</h4>
                          <p className="text-sm text-gray-600">
                            {comparable.property.city}, {comparable.property.state}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSimilarityColor(comparable.similarity_score)}`}>
                          {Math.round(comparable.similarity_score * 100)}% Match
                        </span>
                        <span className="text-xs text-gray-500">
                          {comparable.distance_miles ? `${comparable.distance_miles} mi` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <span>Size: {formatNumber(comparable.property.building_area)} sq ft</span>
                      <span>Value: {formatCurrency(comparable.property.assessed_value)}</span>
                      <span>Built: {comparable.property.year_built || 'N/A'}</span>
                      <span>Zoning: {comparable.property.zoning_code || 'N/A'}</span>
                    </div>

                    {/* Similarity Breakdown */}
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-600 mb-2">Similarity Factors:</p>
                      <div className="grid grid-cols-5 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-gray-600">Location</div>
                          <div className="font-medium">{Math.round(comparable.similarity_factors.location * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">Size</div>
                          <div className="font-medium">{Math.round(comparable.similarity_factors.size * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">Age</div>
                          <div className="font-medium">{Math.round(comparable.similarity_factors.age * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">Zoning</div>
                          <div className="font-medium">{Math.round(comparable.similarity_factors.zoning * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">Value</div>
                          <div className="font-medium">{Math.round(comparable.similarity_factors.value * 100)}%</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Confidence: {Math.round(comparable.confidence_score * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {comparablesMutation.isError && (
        <div className="text-red-600 text-sm">
          Error: {comparablesMutation.error?.message || 'Failed to find comparables'}
        </div>
      )}
    </div>
  );
} 