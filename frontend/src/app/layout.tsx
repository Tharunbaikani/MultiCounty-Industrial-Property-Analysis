import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Starboard AI - Industrial Property Analysis",
  description: "Multi-County Industrial Property Comparable Analysis System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 transition-all duration-500">
            {/* Modern Header with Gradient */}
            <header className="relative">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-90"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              
              {/* Header Content */}
              <nav className="relative backdrop-blur-sm border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center h-20">
                    {/* Logo Section */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="flex items-center space-x-3">
                          {/* Logo Icon */}
                          <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-xl backdrop-blur-sm border border-white/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          
                          {/* Brand Text */}
                          <div>
                            <h1 className="text-2xl font-bold text-white text-shadow">
                              Starboard AI
                            </h1>
                            <p className="text-sm text-blue-100 font-medium">
                              Industrial Property Intelligence
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Navigation */}
                      <div className="hidden md:ml-8 md:flex md:space-x-1">
                        <a 
                          href="/" 
                          className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:bg-white/30 hover:scale-105 border border-white/30"
                        >
                          Property Search
                        </a>
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-6">
                      {/* Status Badge */}
                      <div className="hidden sm:flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-white font-medium">2,005 Properties</span>
                      </div>
                      
                      {/* Theme Toggle */}
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 border border-white/30">
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>
                </div>
              </nav>

              {/* Decorative Elements */}
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl"></div>
              <div className="absolute top-0 right-1/3 w-24 h-24 bg-gradient-to-br from-purple-300/20 to-transparent rounded-full blur-lg"></div>
            </header>

            {/* Main Content */}
            <main className="relative max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
              {/* Background Decoration */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
