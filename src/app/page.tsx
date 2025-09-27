'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UploadedImage {
  file: File;
  preview: string;
  base64: string;
}

export default function Home() {
  const [userImage, setUserImage] = useState<UploadedImage | null>(null);
  const [articleImages, setArticleImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('home');
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(sectionId);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data:image/...;base64, prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUserImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const preview = URL.createObjectURL(file);
        const base64 = await fileToBase64(file);
        setUserImage({ file, preview, base64 });
        setError(null);
      } catch (err) {
        setError('Failed to process user image');
        console.error('User image processing error:', err);
      }
    }
  };

  const handleArticleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const preview = URL.createObjectURL(file);
        const base64 = await fileToBase64(file);
        
        // Only keep one image
        setArticleImages([{ file, preview, base64 }]);
        setError(null);
      } catch (err) {
        setError('Failed to process article image');
        console.error('Article image processing error:', err);
      }
    }
  };

  const loadingMessages = [
    "🎨 AI is working its magic...",
    "✨ Creating your perfect look...",
    "👗 Fitting the outfit just right...",
    "🌟 Almost there, looking amazing...",
    "💫 Final touches being added...",
    "🔥 This is going to look incredible...",
    "⚡ Processing your style transformation..."
  ];

  // Cycle through loading messages
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'trynow'];
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation states
  const [mergeAnimation, setMergeAnimation] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'merging' | 'processing'>('idle');

  const handleTryOn = async () => {
    if (!userImage || articleImages.length === 0) {
      setError('Please upload both a user image and a clothing item.');
      return;
    }

    // Start merge animation
    setGenerationPhase('merging');
    setMergeAnimation(true);
    setError(null);
    setResult(null);
    
    // Wait for merge animation to complete
    setTimeout(async () => {
      // Switch to processing phase
      setGenerationPhase('processing');
      setMergeAnimation(false);
      setIsLoading(true);
      
      try {
        // Images are already in base64 format, so we can send them directly
        const response = await fetch('/api/try-on', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userImage: userImage.base64,
            articleImages: articleImages.map(img => img.base64)
          })
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        
        if (data.success && data.base64) {
          setResult(data.base64);
        } else {
          throw new Error(data.message || 'Failed to generate try-on result');
        }
        
        // Optional: Log success info
        if (data.message) {
          console.log('Try-on success:', data.message);
        }
      } catch (error) {
        console.error('Try-on failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setGenerationPhase('idle');
      }
    }, 3000); // 3 seconds for the merge animation
      
    // Note: Catch and finally blocks are now inside the setTimeout callback
  };

  return (
    <>
      {/* Merge Animation - Shows when images are being merged */}
      {mergeAnimation && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 z-50 flex items-center justify-center overflow-hidden">
          <div className="relative w-full max-w-4xl">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
              <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl animate-blob" style={{animationDelay: '2000ms'}}></div>
              <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl animate-blob" style={{animationDelay: '4000ms'}}></div>
            </div>

            {/* Merge Animation */}
            <div className="flex justify-center items-center gap-0 sm:gap-16 relative z-10">
              {/* User Image with Animation */}
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 transform transition-all duration-1000 animate-float-left">
                {userImage && (
                  <img 
                    src={userImage.preview}
                    alt="Your photo"
                    className="w-full h-full object-cover rounded-2xl shadow-2xl shadow-purple-500/30 border-2 border-white/20"
                  />
                )}
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 animate-pulse z-20">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Merging Animation */}
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center z-10 animate-spin-slow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>

              {/* Clothing Image with Animation */}
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 transform transition-all duration-1000 animate-float-right">
                {articleImages.length > 0 && (
                  <img 
                    src={articleImages[0].preview}
                    alt="Clothing item"
                    className="w-full h-full object-cover rounded-2xl shadow-2xl shadow-pink-500/30 border-2 border-white/20"
                  />
                )}
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 animate-pulse z-20">
                  <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Text Animation */}
            <div className="mt-16 text-center">
              <h3 className="text-white text-3xl font-bold mb-4 animate-pulse">Creating Your Look</h3>
              <p className="text-blue-200 text-lg">Merging styles with AI magic...</p>
            </div>

            {/* Particle Effects - Decorative */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-2 h-2 bg-white rounded-full animate-float-up" 
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    opacity: Math.random() * 0.7
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processing Loading State - After merge animation */}
      {isLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 z-50 flex items-center justify-center">
          <div className="text-center space-y-8">
            {/* Animated Logo */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto flex items-center justify-center animate-pulse">
                <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto animate-ping opacity-75"></div>
            </div>

            {/* Loading Message */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Applying AI Magic
              </h2>
              <p className="text-lg text-gray-600 animate-pulse">
                {loadingMessages[currentLoadingMessage]}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="w-64 h-3 bg-gray-200 rounded-full mx-auto overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse-fast"></div>
            </div>
            
            {/* Generation Steps */}
            <div className="flex justify-center items-center gap-2 mt-8">
              <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span className="text-sm text-gray-600">Analyzing</span>
              <span className="w-8 h-1 bg-gray-300 rounded-full"></span>
              <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span className="text-sm text-gray-600">Generating</span>
              <span className="w-8 h-1 bg-gray-300 rounded-full"></span>
              <span className="w-8 h-8 rounded-full bg-purple-400 text-white flex items-center justify-center text-sm font-bold animate-pulse">
                3
              </span>
              <span className="text-sm text-gray-600 animate-pulse">Perfecting</span>
            </div>

            {/* Fun Facts */}
            <div className="max-w-md mx-auto text-sm text-gray-500 space-y-2">
              <p>💡 Did you know? Our AI processes over 1000 style combinations per second!</p>
              <p>🎯 Each virtual try-on is tailored to your unique body shape and style.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      {/* Navbar */}
      <nav className="fixed top-3 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/30 backdrop-blur-xl rounded-full px-6 py-3 shadow-xl border border-white/40 ring-1 ring-black/5">
          <div className="flex space-x-6 items-center">
            <button
              onClick={() => scrollToSection('home')}
              className={`px-4 py-2 rounded-full transition-all duration-300 text-sm ${
                activeSection === 'home'
                  ? 'bg-purple-600 text-white shadow-lg font-bold'
                  : 'text-gray-700 hover:text-purple-600 hover:bg-white/60 font-medium'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('trynow')}
              className={`px-4 py-2 rounded-full transition-all duration-300 text-sm ${
                activeSection === 'trynow'
                  ? 'bg-purple-600 text-white shadow-lg font-bold'
                  : 'text-gray-700 hover:text-purple-600 hover:bg-white/60 font-medium'
              }`}
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
              href="#"
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

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden pt-20">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{animationDelay: '2000ms'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{animationDelay: '4000ms'}}></div>
        </div>

        <div className="text-center max-w-6xl mx-auto relative z-10">
          <div className="mb-8">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              AI-Powered Virtual Try-On
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 leading-tight">
            Virtual Try-On,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Made Easy
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the future of online shopping. Try clothes, shoes, and accessories virtually before buying. 
            Our AI technology makes fashion decisions confident and fun.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Add to Chrome
            </button>
            <button 
              onClick={() => scrollToSection('trynow')}
              className="border-2 border-gray-300 hover:border-purple-500 text-gray-700 hover:text-purple-600 px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 flex items-center gap-2 hover:bg-white/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Try Demo
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Instant Results</h3>
              <p className="text-gray-600">See how clothes look on you in seconds with our advanced AI technology.</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Perfect Fit</h3>
              <p className="text-gray-600">Advanced algorithms ensure realistic and accurate virtual try-on experiences.</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Privacy First</h3>
              <p className="text-gray-600">Your photos are processed securely and never stored on our servers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Try Now Section */}
      <section id="trynow" className="min-h-screen py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Try Your Perfect Look
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your photo and a clothing item to see how they look together. 
              Our AI-powered virtual try-on makes shopping more confident and fun.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* User Image Upload - Modern Design */}
            <div className="relative bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 group hover:shadow-purple-200/50">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
              
              {/* Header Section */}
              <div className="relative z-10 p-6 border-b border-gray-100 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 transform rotate-6 group-hover:rotate-0 transition-all duration-500">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent group-hover:from-purple-800 group-hover:to-blue-800 transition-all duration-500">Your Photo</h3>
                  <p className="text-gray-500">Upload a clear photo of yourself</p>
                </div>
              </div>
              
              <div className="p-6">
                {userImage ? (
                  <div className="relative h-80 w-full overflow-hidden transition-all duration-500 transform group-hover:scale-[1.01]">
                    {/* Image Container with Glowing Effect on Hover */}
                    <div className="w-full h-full rounded-2xl overflow-hidden relative group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all duration-500">
                      <img 
                        src={userImage.preview} 
                        alt="Your photo" 
                        className="w-full h-full object-cover object-center bg-gray-50"
                      />
                      
                      {/* Subtle Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Ready</span>
                      </div>
                    </div>
                    
                    {/* Controls Overlay - Appears on Hover */}
                    <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-full bg-gradient-to-t from-black/70 to-transparent p-6 pt-24">
                        <div className="flex items-center gap-3 justify-between">
                          <button
                            onClick={() => setUserImage(null)}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                            title="Remove photo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                          
                          <button
                            onClick={() => document.getElementById('user-photo-upload')?.click()}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Change
                          </button>
                          
                          <input
                            id="user-photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleUserImageUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Try On Button - Floating at bottom with animation */}
                    <div className="absolute -bottom-1 left-0 right-0 p-4 transition-all duration-500 transform translate-y-0 group-hover:translate-y-1">
                      <button
                        onClick={handleTryOn}
                        disabled={!articleImages.length || isLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-4 px-6 rounded-xl font-medium disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transform hover:scale-[1.02] disabled:transform-none transition-all duration-300 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Try On Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <label className="block cursor-pointer">
                      <div className="h-80 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-8 flex flex-col items-center justify-center relative overflow-hidden group-hover:shadow-lg group-hover:shadow-purple-500/10 transition-all duration-500">
                        {/* Animated Background Elements */}
                        <div className="absolute top-1/4 -left-12 w-40 h-40 bg-purple-200 rounded-full opacity-20 mix-blend-multiply filter blur-2xl animate-blob"></div>
                        <div className="absolute bottom-1/3 -right-12 w-40 h-40 bg-blue-200 rounded-full opacity-20 mix-blend-multiply filter blur-2xl animate-blob" style={{animationDelay: '2000ms'}}></div>
                        
                        <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-105 text-center">
                          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full flex items-center justify-center group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-all duration-500">
                            <svg className="w-12 h-12 text-purple-500 group-hover:text-purple-600 transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-xl font-semibold text-gray-700 mb-2 group-hover:text-purple-700 transition-colors duration-500">Select Your Photo</p>
                          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Upload a clear, well-lit photo of yourself in a neutral pose</p>
                          
                          <button className="bg-white py-3 px-6 rounded-xl shadow-md hover:shadow-lg border border-purple-100 hover:border-purple-200 text-purple-600 font-medium text-sm transition-all duration-300 flex items-center justify-center mx-auto">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Browse Files
                          </button>
                          
                          <p className="text-xs text-gray-400 mt-4">PNG, JPG formats, up to 10MB</p>
                          <p className="text-xs text-purple-400 mt-1">For best results, use a full-body photo</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUserImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Clothing Item Upload - Modern Design */}
            <div className="relative bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 group hover:shadow-pink-200/50">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 group-hover:from-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500"></div>
              
              {/* Header Section */}
              <div className="relative z-10 p-6 border-b border-gray-100 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 transform rotate-6 group-hover:rotate-0 transition-all duration-500">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-700 to-purple-700 bg-clip-text text-transparent group-hover:from-pink-800 group-hover:to-purple-800 transition-all duration-500">Clothing Item</h3>
                  <p className="text-gray-500">Add a clothing item you want to try on</p>
                </div>
              </div>
              
              <div className="p-6">
                {articleImages.length > 0 ? (
                  <div className="relative h-80 w-full overflow-hidden transition-all duration-500 transform group-hover:scale-[1.01]">
                    {/* Image Container with Glowing Effect on Hover */}
                    <div className="w-full h-full rounded-2xl overflow-hidden relative group-hover:shadow-lg group-hover:shadow-pink-500/20 transition-all duration-500">
                      <img 
                        src={articleImages[0].preview} 
                        alt="Clothing item" 
                        className="w-full h-full object-cover object-center bg-gray-50"
                      />
                      
                      {/* Subtle Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Ready</span>
                      </div>
                    </div>
                    
                    {/* Controls Overlay - Appears on Hover */}
                    <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-full bg-gradient-to-t from-black/70 to-transparent p-6 pt-24">
                        <div className="flex items-center gap-3 justify-between">
                          <button
                            onClick={() => setArticleImages([])}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                            title="Remove item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                          
                          <button
                            onClick={() => document.getElementById('clothing-upload')?.click()}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Change
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Change Item Button - Floating at bottom with animation */}
                    <div className="absolute -bottom-1 left-0 right-0 p-4 transition-all duration-500 transform translate-y-0 group-hover:translate-y-1">
                      <button
                        onClick={() => document.getElementById('clothing-upload')?.click()}
                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-medium shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/30 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Change Item
                      </button>
                      <input
                        id="clothing-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleArticleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <label className="block cursor-pointer">
                      <div className="h-80 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 p-8 flex flex-col items-center justify-center relative overflow-hidden group-hover:shadow-lg group-hover:shadow-pink-500/10 transition-all duration-500">
                        {/* Animated Background Elements */}
                        <div className="absolute top-1/4 -left-12 w-40 h-40 bg-pink-200 rounded-full opacity-20 mix-blend-multiply filter blur-2xl animate-blob animation-delay-4000"></div>
                        <div className="absolute bottom-1/3 -right-12 w-40 h-40 bg-purple-200 rounded-full opacity-20 mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000"></div>
                        
                        <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-105 text-center">
                          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full flex items-center justify-center group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-500">
                            <svg className="w-12 h-12 text-pink-500 group-hover:text-pink-600 transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <p className="text-xl font-semibold text-gray-700 mb-2 group-hover:text-pink-700 transition-colors duration-500">Select Clothing Item</p>
                          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Upload an image of the clothing item you want to try on</p>
                          
                          <button className="bg-white py-3 px-6 rounded-xl shadow-md hover:shadow-lg border border-pink-100 hover:border-pink-200 text-pink-600 font-medium text-sm transition-all duration-300 flex items-center justify-center mx-auto">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Browse Files
                          </button>
                          
                          <p className="text-xs text-gray-400 mt-4">PNG, JPG formats, up to 10MB</p>
                          <p className="text-xs text-pink-400 mt-1">For best results, use a clear image on white background</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleArticleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 text-center mt-16">
              <h3 className="text-3xl font-bold text-gray-800 mb-6">Your Try-On Result</h3>
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Result Image with Max Height */}
                <div className="relative">
                  <div className="h-96 overflow-hidden rounded-2xl shadow-xl">
                    <img
                      src={`data:image/png;base64,${result}`}
                      alt="Try-on result"
                      className="w-full h-full object-contain bg-gray-50"
                    />
                  </div>
                  <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Info and Actions Panel */}
                <div className="flex flex-col justify-center items-center md:items-start space-y-6 text-left">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Perfect Match!</h4>
                    <p className="text-gray-600">Your virtual try-on has been successfully generated. How does it look?</p>
                  </div>
                  
                  <div className="space-y-3 w-full">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `data:image/png;base64,${result}`;
                        link.download = `tryon-result-${Date.now()}.png`;
                        link.click();
                      }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-300 font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Image
                    </button>
                    
                    <button
                      onClick={() => {setResult(null); setError(null);}}
                      className="w-full px-6 py-3 border-2 border-gray-300 hover:border-purple-500 text-gray-700 hover:text-purple-600 rounded-xl transition-all duration-300 font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Try Another Combination
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 w-full">
                    <p className="text-sm text-gray-500">Share your virtual try-on look</p>
                    <div className="flex gap-3 mt-3">
                      <button className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center text-blue-600 transition-all duration-300">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </button>
                      <button className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center text-blue-400 transition-all duration-300">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.1 10.1 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </button>
                      <button className="w-10 h-10 bg-pink-100 hover:bg-pink-200 rounded-full flex items-center justify-center text-pink-600 transition-all duration-300">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
                          <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-red-200 text-center mt-16">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-500 text-white rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-red-800 mb-4">Oops! Something went wrong</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => {setError(null); setResult(null);}}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-300 font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-white/40 backdrop-blur-xl border-t border-white/30 py-16 px-4 mt-20">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-transparent to-blue-50/20 pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <h3 className="text-3xl font-bold mb-4 text-gray-900">FitCheckr</h3>
              <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
                Virtual try-on technology that makes online shopping confident and fun. 
                Experience the future of fashion with our AI-powered platform.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://iteshxt.me/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-100 hover:bg-purple-200 rounded-xl flex items-center justify-center text-purple-600 transition-all duration-300 hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </a>
                <a 
                  href="mailto:iteshxt@gmail.com"
                  className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-xl flex items-center justify-center text-blue-600 transition-all duration-300 hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
                <a 
                  href="/docs"
                  className="w-10 h-10 bg-green-100 hover:bg-green-200 rounded-xl flex items-center justify-center text-green-600 transition-all duration-300 hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-6 text-lg">Contact</h4>
              <div className="space-y-4">
                <a 
                  href="mailto:iteshxt@gmail.com"
                  className="flex items-center gap-3 text-gray-600 hover:text-purple-600 transition-colors duration-300 group"
                >
                  <div className="w-8 h-8 bg-gray-100 group-hover:bg-purple-100 rounded-lg flex items-center justify-center transition-colors duration-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Mail</span>
                </a>
                <a 
                  href="/docs"
                  className="flex items-center gap-3 text-gray-600 hover:text-purple-600 transition-colors duration-300 group"
                >
                  <div className="w-8 h-8 bg-gray-100 group-hover:bg-purple-100 rounded-lg flex items-center justify-center transition-colors duration-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">API Docs</span>
                </a>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-6 text-lg">Features</h4>
              <ul className="space-y-3">
                <li className="text-gray-600 text-sm">AI Virtual Try-On</li>
                <li className="text-gray-600 text-sm">Instant Results</li>
                <li className="text-gray-600 text-sm">Privacy Protected</li>
                <li className="text-gray-600 text-sm">Chrome Extension</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/30 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">© 2025 FitCheckr. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Made with</span>
              <span className="text-red-500 text-lg animate-pulse">❤️</span>
              <span className="text-gray-500 text-sm">by</span>
              <a 
                href="https://iteshxt.me/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 font-semibold text-sm hover:text-purple-700 transition-colors duration-300"
              >
                !tesh
              </a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}