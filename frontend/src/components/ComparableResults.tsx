'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Building, MapPin, DollarSign, Calendar, Zap, TrendingUp, Award, Star, Target, BarChart3 } from 'lucide-react';

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

export default function ComparableResults() {
  const queryClient = useQueryClient();
  const [comparablesData, setComparablesData] = useState<ComparableResults | undefined>();
  
  // Subscribe to cache changes
  useEffect(() => {
    // Get initial data
    const initialData = queryClient.getQueryData<ComparableResults>(['comparables', 'user_input']);
    setComparablesData(initialData);
    
    // Subscribe to cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] === 'comparables' && event?.query?.queryKey?.[1] === 'user_input') {
        const newData = queryClient.getQueryData<ComparableResults>(['comparables', 'user_input']);
        setComparablesData(newData);
      }
    });
    
    return () => unsubscribe();
  }, [queryClient]);
  
  // Debug logging
  console.log('ComparableResults - Data from cache:', comparablesData);
  console.log('ComparableResults - Has data:', !!comparablesData);
  console.log('ComparableResults - Count:', comparablesData?.count);

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

  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
    if (score >= 0.6) return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
    return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    if (score >= 0.6) return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white';
    return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'; // Gold
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white'; // Silver
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'; // Bronze
    return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white';
  };

  // Confidence Ring Component
  const ConfidenceRing = ({ score, size = 60 }: { score: number; size?: number }) => {
    const circumference = 2 * Math.PI * 18; // radius of 18
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score * circumference);

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="confidence-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r="18"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r="18"
            stroke="url(#confidence-gradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {Math.round(score * 100)}%
          </span>
        </div>
      </div>
    );
  };

  if (!comparablesData) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="h-10 w-10 text-blue-500 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready for Analysis</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Enter your property details and click "Find Comparable Properties" to discover AI-powered matches across our database of 2,005 industrial properties.
        </p>
      </div>
    );
  }

  if (comparablesData.count === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Building className="h-10 w-10 text-orange-500 dark:text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Matches Found</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          No similar properties were found in our database. Try adjusting your property details or expanding your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Analysis Summary */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-2xl"></div>
        <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Summary</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered comparable discovery</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
              <div className="text-2xl font-bold gradient-text mb-1">{comparablesData.count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Properties Found</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
              <div className="text-2xl font-bold gradient-text mb-1">
                {Math.round(comparablesData.comparables[0]?.similarity_score * 100 || 0)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Best Match</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
              <div className="text-2xl font-bold gradient-text mb-1">
                {Math.round(
                  comparablesData.comparables
                    .map(c => c.confidence_score)
                    .reduce((a, b) => a + b, 0) / comparablesData.comparables.length * 100
                )}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Confidence</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Target Property:</strong> {comparablesData.target_property.address}, {comparablesData.target_property.city}
            </p>
          </div>
        </div>
      </div>

      {/* Comparable Properties List */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Star className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Top Comparable Properties
          </h3>
        </div>
        
        {comparablesData.comparables.map((comparable, index) => (
          <div
            key={comparable.property.id}
            className="group relative"
          >
            {/* Animated Border */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
            
            {/* Property Card */}
            <div className="relative property-card card-hover">
              {/* Header with Rank and Scores */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${getRankColor(index + 1)}`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{comparable.property.address}</h4>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{comparable.property.city}, {comparable.property.state} {comparable.property.zip_code}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <ConfidenceRing score={comparable.confidence_score} size={50} />
                  <div className="text-right">
                    <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getSimilarityColor(comparable.similarity_score)}`}>
                      {Math.round(comparable.similarity_score * 100)}% Match
                    </div>
                    {comparable.distance_miles && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {comparable.distance_miles} miles away
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Property Details Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 border border-white/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <Building className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Building Size</span>
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">{formatNumber(comparable.property.building_area)} sq ft</div>
                </div>
                
                <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 border border-white/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Assessed Value</span>
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(comparable.property.assessed_value)}</div>
                </div>
                
                <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 border border-white/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Year Built</span>
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">{comparable.property.year_built || 'N/A'}</div>
                </div>
                
                <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 border border-white/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Zoning</span>
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">{comparable.property.zoning_code || 'N/A'}</div>
                </div>
              </div>

              {/* Similarity Breakdown */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>AI Similarity Analysis</span>
                </h5>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(comparable.similarity_factors).map(([factor, score]) => (
                    <div key={factor} className="text-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${score * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white capitalize">{factor}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{Math.round(score * 100)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Indicators */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  {comparable.property.is_verified && (
                    <span className="badge success">
                      ✓ Verified Data
                    </span>
                  )}
                  {comparable.property.quality_score && (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Quality Score: {Math.round(comparable.property.quality_score * 100)}%
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Source: {comparable.property.data_source}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Market Insights */}
      {comparablesData.comparables.length > 0 && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-blue-600/10 to-purple-600/10 rounded-2xl"></div>
          <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Insights</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Comparative market analysis</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
                <div className="text-lg font-bold gradient-text mb-1">
                  {formatCurrency(
                    comparablesData.comparables
                      .map(c => c.property.assessed_value || 0)
                      .reduce((a, b) => a + b, 0) / comparablesData.comparables.length
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Value</div>
              </div>
              
              <div className="text-center p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
                <div className="text-lg font-bold gradient-text mb-1">
                  {formatNumber(
                    comparablesData.comparables
                      .map(c => c.property.building_area || 0)
                      .reduce((a, b) => a + b, 0) / comparablesData.comparables.length
                  )} sq ft
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Size</div>
              </div>
              
              <div className="text-center p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
                <div className="text-lg font-bold gradient-text mb-1">
                  $
                  {Math.round(
                    comparablesData.comparables
                      .filter(c => c.property.assessed_value && c.property.building_area)
                      .map(c => (c.property.assessed_value! / c.property.building_area!))
                      .reduce((a, b) => a + b, 0) / 
                    comparablesData.comparables.filter(c => c.property.assessed_value && c.property.building_area).length
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Price per sq ft</div>
              </div>
              
              <div className="text-center p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-white/20">
                <div className="text-lg font-bold gradient-text mb-1">
                  {Math.round(
                    comparablesData.comparables
                      .map(c => c.similarity_score)
                      .reduce((a, b) => a + b, 0) / comparablesData.comparables.length * 100
                  )}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Similarity</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 