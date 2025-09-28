'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ChromeExtensionPage() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Note: totalSubscribers removed as it's not displayed in this component

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubscribed(true);
        setEmail('');
        console.log('Email subscribed successfully:', data.message);
      } else {
        setError(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      {/* Navbar */}
      <nav className="fixed top-2 sm:top-3 left-1/2 transform -translate-x-1/2 z-50 px-2 w-full max-w-fit">
        <div className="bg-white/30 backdrop-blur-xl rounded-full px-4 sm:px-6 py-3 sm:py-3 shadow-xl border border-purple-400 ring-1 ring-black/5">
          <div className="flex space-x-3 sm:space-x-4 md:space-x-6 items-center">
            <Link
              href="/"
              className="px-3 sm:px-4 py-2 sm:py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-200/60 rounded-full transition-all duration-300 font-medium text-sm whitespace-nowrap"
            >
              ← Back to Home
            </Link>
            <a
              href="https://iteshxt.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 sm:px-4 py-2 sm:py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-200/60 rounded-full transition-all duration-300 font-medium text-sm whitespace-nowrap"
            >
              About
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 px-4 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Chrome Extension Icon */}
          <div className="mb-8">
            <div className="w-32 h-32 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29L1.931 5.47zm2.25 12.58A11.943 11.943 0 0 0 12 24c6.624 0 12-5.376 12-12 0-2.09-.536-4.057-1.479-5.773H12c0 3.016-2.434 5.454-5.454 5.454a5.413 5.413 0 0 1-2.365-.523z"/>
              </svg>
            </div>
          </div>

          {/* Coming Soon Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Coming Soon
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            FitCheckr{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Chrome Extension
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience virtual try-on directly while browsing your favorite online stores. 
            Our Chrome extension will bring AI-powered fashion fitting right to your shopping experience.
          </p>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">One-Click Try-On</h3>
              <p className="text-gray-600">Try on clothes instantly while browsing any e-commerce site.</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Smart Integration</h3>
              <p className="text-gray-600">Seamlessly works with popular shopping websites and platforms.</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Save Favorites</h3>
              <p className="text-gray-600">Save your virtual try-on results and compare different outfits.</p>
            </div>
          </div>

          {/* Email Subscription */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-2xl mx-auto">
            {!isSubscribed ? (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Notified When It&apos;s Ready!</h2>
                <p className="text-gray-600 mb-6">
                  Be the first to know when our Chrome extension launches.
                </p>
                
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    disabled={isLoading}
                    className="flex-1 px-6 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-700 bg-white/80 backdrop-blur-sm disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Subscribing...
                      </>
                    ) : (
                      'Notify Me'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re All Set!</h3>
                <p className="text-gray-600">We&apos;ll notify you as soon as the Chrome extension is available.</p>
              </div>
            )}
          </div>

          
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-white/40 backdrop-blur-xl border-t border-white/30 py-8 sm:py-12 px-4 mt-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-transparent to-blue-50/20 pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 sm:gap-0">
            {/* Brand Section - Left */}
            <div className="flex-1 max-w-md">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">FitCheckr</h3>
              <p className="text-gray-600 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                Virtual try-on technology that makes online shopping confident and fun.
              </p>
              <p className="text-gray-500 text-xs sm:text-sm">© 2025 FitCheckr. All rights reserved.</p>
            </div>
            
            {/* Developer Section - Right */}
            <div className="sm:ml-16 w-full sm:w-auto">
              <h4 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">Developer</h4>
              <div className="flex flex-row sm:flex-col gap-4 sm:gap-3">
                <a 
                  href="https://iteshxt.me/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-purple-600 transition-colors duration-300 group flex-1 sm:flex-none"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 group-hover:bg-purple-100 rounded-lg flex items-center justify-center transition-colors duration-300 flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium">About</span>
                </a>
                <a 
                  href="mailto:iteshxt@gmail.com"
                  className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-purple-600 transition-colors duration-300 group flex-1 sm:flex-none"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 group-hover:bg-purple-100 rounded-lg flex items-center justify-center transition-colors duration-300 flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium">Mail</span>
                </a>
                <a 
                  href="https://twitter.com/iteshxt" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-purple-600 transition-colors duration-300 group flex-1 sm:flex-none"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 group-hover:bg-purple-100 rounded-lg flex items-center justify-center transition-colors duration-300 flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium">X</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}