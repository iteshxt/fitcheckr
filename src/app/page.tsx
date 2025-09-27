'use client';

import { useState, useEffect } from 'react';

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
  const [processingStage, setProcessingStage] = useState<'idle' | 'processing' | 'complete'>('idle');

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
        setArticleImages([{ file, preview, base64 }]);
        setError(null);
      } catch (err) {
        setError('Failed to process clothing item image');
        console.error('Clothing item image processing error:', err);
      }
    }
  };

    const loadingMessages = [
    'Merging your photo with the clothing item...',
    'Analyzing fabric texture and fit...',
    'Adjusting lighting and shadows for realism...',
    'AI is perfecting the virtual try-on...',
    'Finalizing your personalized look...',
    'Almost ready! Adding the finishing touches...'
  ];

  // Cycle through loading messages
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading, loadingMessages.length]);

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

  const handleTryOn = async () => {
    if (!userImage || !articleImages.length) {
      setError('Please upload both a user image and a clothing item');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProcessingStage('processing');
    setCurrentLoadingMessage(0);
    
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
        throw new Error(data.message || 'Virtual try-on failed');
      }
      
      if (data.message) {
        console.log('Try-on success:', data.message);
      }
      
    } catch (error) {
      console.error('Try-on failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setProcessingStage('idle');
    }
  };

  return (
    <>
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
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
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
              Upload your photo and clothing items to see how they look together.
              Our AI-powered virtual try-on makes shopping more confident and fun.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {processingStage === 'processing' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto flex items-center justify-center animate-pulse">
                    <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto animate-ping opacity-75"></div>
                </div>

                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  AI Magic in Progress
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  {loadingMessages[currentLoadingMessage]}
                </p>

                <div className="flex justify-center space-x-16 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Perfect Fit Analysis</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Style Enhancement</p>
                  </div>
                </div>

                <div className="max-w-md mx-auto text-sm text-gray-500 space-y-2">
                  <p>💡 Did you know? Our AI processes over 1000 style combinations per second!</p>
                  <p>🎯 Each virtual try-on is tailored to your unique body shape and style.</p>
                </div>
              </div>
            )}

            {result && (
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-xl border border-white/20 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50"></div>

                <div className="relative z-10">
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Perfect Fit!
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Your Try-On Result
                  </h2>
                  <p className="text-gray-600 mb-8">
                    See how the clothing looks on you!
                  </p>

                  <div className="relative inline-block mb-8">
                    <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl">
                      <img
                        src={`data:image/png;base64,${result}`}
                        alt="Try-on result"
                        className="w-full h-auto rounded-2xl"
                      />
                      <div className="absolute inset-0 ring-4 ring-green-400/20 rounded-2xl animate-pulse"></div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = 'fitcheckr-tryon-result.png';
                        link.href = `data:image/png;base64,${result}`;
                        link.click();
                      }}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download</span>
                    </button>

                    <button
                      onClick={() => {
                        setResult(null);
                        setUserImage(null);
                        setArticleImages([]);
                        setProcessingStage('idle');
                      }}
                      className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Try Another</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl p-8 shadow-xl border border-red-200/50 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-rose-100/30"></div>

                <div className="relative z-10">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  <h2 className="text-2xl font-bold text-red-800 mb-4">Oops! Something went wrong</h2>
                  <p className="text-red-600 mb-8 max-w-md mx-auto">{error}</p>

                  <button
                    onClick={() => {
                      setError(null);
                      setResult(null);
                    }}
                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {processingStage === 'idle' && !result && !error && (
              <div className="grid lg:grid-cols-2 gap-8 mb-12">
                {/* User Image Upload Card */}
                <div className={`group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 rounded-3xl shadow-xl border border-gray-200/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Photo</h3>
                      <p className="text-gray-600">Upload a clear, full-body photo</p>
                    </div>

                    {/* Upload Area */}
                    {userImage ? (
                      <div className="relative group/image">
                        <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-gray-50 shadow-inner flex items-center justify-center p-2">
                          <img
                            src={userImage.preview}
                            alt="Your photo"
                            className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-300 group-hover/image:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Success Badge */}
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg animate-fade-in flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Ready
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => setUserImage(null)}
                          className="absolute top-4 left-4 bg-red-500/90 hover:bg-red-600 text-white p-2.5 rounded-full transition-all duration-200 backdrop-blur-sm shadow-lg opacity-0 group-hover/image:opacity-100 transform scale-90 group-hover/image:scale-100"
                          title="Remove photo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* Image Info */}
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                          <p className="text-sm font-medium text-gray-800">{userImage.file.name}</p>
                          <p className="text-xs text-gray-500">{(userImage.file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className="relative border-2 border-dashed border-gray-300 rounded-2xl h-80 flex flex-col items-center justify-center text-center hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 transition-all duration-300 group-hover:border-purple-500">
                          {/* Upload Icon */}
                          <div className="relative mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto group-hover:from-purple-100 group-hover:to-blue-100 transition-colors duration-300">
                              <svg className="w-8 h-8 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                              </svg>
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                          </div>

                          {/* Upload Text */}
                          <div className="space-y-3">
                            <p className="text-lg font-semibold text-gray-700 group-hover:text-purple-700 transition-colors duration-300">
                              Drop your photo here
                            </p>
                            <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                              or <span className="text-purple-600 font-medium">browse files</span>
                            </p>
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-4">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                PNG, JPG
                              </span>
                              <span>Max 10MB</span>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUserImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Article Image Upload Card */}
                <div className={`group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 rounded-3xl shadow-xl border border-gray-200/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Clothing Item</h3>
                      <p className="text-gray-600">Add the item you want to try on</p>
                    </div>

                    {/* Upload Area */}
                    {articleImages.length > 0 ? (
                      <div className="relative group/image">
                        <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-gray-50 shadow-inner flex items-center justify-center p-2">
                          <img
                            src={articleImages[0].preview}
                            alt="Clothing item"
                            className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-300 group-hover/image:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Success Badge */}
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg animate-fade-in flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Ready
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => setArticleImages([])}
                          className="absolute top-4 left-4 bg-red-500/90 hover:bg-red-600 text-white p-2.5 rounded-full transition-all duration-200 backdrop-blur-sm shadow-lg opacity-0 group-hover/image:opacity-100 transform scale-90 group-hover/image:scale-100"
                          title="Remove item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* Image Info */}
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                          <p className="text-sm font-medium text-gray-800">{articleImages[0].file.name}</p>
                          <p className="text-xs text-gray-500">{(articleImages[0].file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className="relative border-2 border-dashed border-gray-300 rounded-2xl h-80 flex flex-col items-center justify-center text-center hover:border-pink-400 hover:bg-gradient-to-br hover:from-pink-50 hover:to-purple-50 transition-all duration-300 group-hover:border-pink-500">
                          {/* Upload Icon */}
                          <div className="relative mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto group-hover:from-pink-100 group-hover:to-purple-100 transition-colors duration-300">
                              <svg className="w-8 h-8 text-gray-400 group-hover:text-pink-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                          </div>

                          {/* Upload Text */}
                          <div className="space-y-3">
                            <p className="text-lg font-semibold text-gray-700 group-hover:text-pink-700 transition-colors duration-300">
                              Drop clothing item here
                            </p>
                            <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                              or <span className="text-pink-600 font-medium">browse files</span>
                            </p>
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-4">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                PNG, JPG
                              </span>
                              <span>Max 10MB</span>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleArticleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {processingStage === 'idle' && !result && !error && (
              <div className="text-center mb-16">
                <button
                  onClick={handleTryOn}
                  disabled={!userImage || !articleImages.length}
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-12 py-4 rounded-2xl text-xl font-bold disabled:cursor-not-allowed hover:shadow-2xl transform hover:scale-105 disabled:transform-none transition-all duration-500 shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                  <div className="relative flex items-center justify-center space-x-3">
                    <svg className="w-6 h-6 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Try On Now</span>
                  </div>
                </button>

                {(!userImage || !articleImages.length) && (
                  <p className="text-gray-500 mt-4 text-sm">
                    {!userImage && !articleImages.length && 'Upload both images to get started'}
                    {!userImage && articleImages.length > 0 && 'Upload your photo to continue'}
                    {userImage && !articleImages.length && 'Add a clothing item to try on'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-white/40 backdrop-blur-xl border-t border-white/30 py-16 px-4 mt-20">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-transparent to-blue-50/20 pointer-events-none"></div>        <div className="max-w-6xl mx-auto relative z-10">
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