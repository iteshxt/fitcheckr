'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleTryDemo = () => {
    router.push('/#trynow');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 flex items-center justify-center px-4 relative overflow-hidden pt-24">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Floating Navbar */}
        <nav className="fixed top-3 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/30 backdrop-blur-xl rounded-full px-6 py-3 shadow-xl border border-white/40 ring-1 ring-black/5">
            <div className="flex space-x-6 items-center">
              <button
                onClick={handleGoHome}
                className="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-white/60 rounded-full transition-all duration-300 font-medium text-sm"
              >
                Home
              </button>
              <button
                onClick={handleTryDemo}
                className="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-white/60 rounded-full transition-all duration-300 font-medium text-sm"
              >
                Try Now!
              </button>
              <a
                href="https://iteshxt.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-white/60 rounded-full transition-all duration-300 font-medium text-sm"
              >
                About
              </a>
              <a
                href="/chrome-extension"
                className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                title="Add to Chrome"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29L1.931 5.47zm2.25 12.58A11.943 11.943 0 0 0 12 24c6.624 0 12-5.376 12-12 0-2.09-.536-4.057-1.479-5.773H12c0 3.016-2.434 5.454-5.454 5.454a5.413 5.413 0 0 1-2.365-.523z"/>
                </svg>
              </a>
            </div>
          </div>
        </nav>

        {/* Clean 404 Design */}
        <div className="mb-12">
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 leading-none mb-6">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={handleGoHome}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back to Home
          </button>
          <button
            onClick={handleTryDemo}
            className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-purple-600 border-2 border-gray-200/50 hover:border-purple-300 px-8 py-3 rounded-xl font-medium transition-all duration-300"
          >
            Try Virtual Fashion
          </button>
        </div>

        {/* Bottom Links */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">Need help?</p>
          <div className="flex justify-center gap-6 text-sm">
            <button 
              onClick={handleGoHome}
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              Homepage
            </button>
            <button 
              onClick={handleTryDemo}
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              Virtual Try-On
            </button>
            <a 
              href="https://iteshxt.me/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}