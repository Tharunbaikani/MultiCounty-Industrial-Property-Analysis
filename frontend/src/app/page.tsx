import PropertyInput from '@/components/PropertyInput';
import ComparableResults from '@/components/ComparableResults';

export default function Home() {
  return (
    <div className="px-4 sm:px-0">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-700 mb-6">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI-Powered Property Analysis</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
          <span className="gradient-text">Industrial Property</span>
          <br />
          <span className="text-gray-900 dark:text-white">Comparable Analysis</span>
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Discover the best comparable industrial properties with our AI-powered analysis across 
          <span className="font-semibold text-blue-600 dark:text-blue-400"> Cook County (IL)</span>, 
          <span className="font-semibold text-green-600 dark:text-green-400"> Dallas County (TX)</span>, and 
          <span className="font-semibold text-purple-600 dark:text-purple-400"> Los Angeles County (CA)</span>
        </p>

        {/* Stats Section */}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 shadow-lg">
            <div className="text-2xl font-bold gradient-text">2,005</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Properties</div>
          </div>
          <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 shadow-lg">
            <div className="text-2xl font-bold gradient-text">5</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Zoning Types</div>
          </div>
          <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 shadow-lg">
            <div className="text-2xl font-bold gradient-text">3</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Counties</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
        {/* Property Input Panel */}
        <div className="xl:col-span-1">
          <div className="group relative">
            {/* Animated Border */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            
            {/* Card Content */}
            <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 card-hover">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2a2 2 0 002-2V7a2 2 0 00-2-2H9m0 0V3m0 2v2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Property Details
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">Enter your property information</p>
                </div>
              </div>
              <PropertyInput />
            </div>
          </div>
        </div>

        {/* Comparable Results Panel */}
        <div className="xl:col-span-1">
          <div className="group relative">
            {/* Animated Border */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            
            {/* Card Content */}
            <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 card-hover">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Comparable Properties
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">AI-powered analysis results</p>
                </div>
              </div>
              <ComparableResults />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Analysis</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Intelligent zoning classification and similarity scoring</p>
        </div>

        <div className="text-center p-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real Market Data</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Authentic property data from professional sources</p>
        </div>

        <div className="text-center p-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Multi-County Coverage</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive analysis across major industrial markets</p>
        </div>
      </div>
    </div>
  );
}
