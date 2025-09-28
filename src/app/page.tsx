'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

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
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [userDragActive, setUserDragActive] = useState(false);
  const [articleDragActive, setArticleDragActive] = useState(false);
  const [userHovered, setUserHovered] = useState(false);
  const [articleHovered, setArticleHovered] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState<'user' | 'article' | null>(null);
  const [urlInputValue, setUrlInputValue] = useState('');
  const userDropRef = useRef<HTMLDivElement>(null);
  const articleDropRef = useRef<HTMLDivElement>(null);
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const articleFileInputRef = useRef<HTMLInputElement>(null);

  // Debug log for hover states (removes unused variable warnings)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Hover states:', { userHovered, articleHovered });
    }
  }, [userHovered, articleHovered]);

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

  const urlToFile = async (url: string): Promise<File> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to an image');
      }
      
      const filename = url.split('/').pop()?.split('?')[0] || 'image.jpg';
      return new File([blob], filename, { type: blob.type });
    } catch {
      throw new Error('Failed to load image from URL');
    }
  };

  const processImageFile = useCallback(async (file: File): Promise<UploadedImage> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }
    
    const preview = URL.createObjectURL(file);
    const base64 = await fileToBase64(file);
    return { file, preview, base64 };
  }, []);

  const handleUserImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const processedImage = await processImageFile(file);
        setUserImage(processedImage);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process user image');
        console.error('User image processing error:', err);
      }
    }
  };

  const handleArticleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const processedImage = await processImageFile(file);
        setArticleImages([processedImage]);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process clothing item image');
        console.error('Clothing item image processing error:', err);
      }
    }
  };

  const handleUrlSubmit = async (url: string, type: 'user' | 'article') => {
    if (!url.trim()) return;
    
    try {
      const file = await urlToFile(url);
      const processedImage = await processImageFile(file);
      
      if (type === 'user') {
        setUserImage(processedImage);
      } else {
        setArticleImages([processedImage]);
      }
      
      setError(null);
      setShowUrlInput(null);
      setUrlInputValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image from URL');
    }
  };

  // Drag and Drop functionality
  const handleDrag = (e: React.DragEvent, type: 'user' | 'article') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (type === 'user') setUserDragActive(true);
      else setArticleDragActive(true);
    } else if (e.type === "dragleave") {
      // Only set to false if we're leaving the drop zone entirely
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
        if (type === 'user') setUserDragActive(false);
        else setArticleDragActive(false);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, type: 'user' | 'article') => {
    e.preventDefault();
    e.stopPropagation();
    setUserDragActive(false);
    setArticleDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      try {
        const processedImage = await processImageFile(file);
        if (type === 'user') {
          setUserImage(processedImage);
        } else {
          setArticleImages([processedImage]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process dropped image');
      }
    }
  };

  // Clipboard paste functionality
  const triggerFileInput = (type: 'user' | 'article') => {
    if (type === 'user' && userFileInputRef.current) {
      userFileInputRef.current.click();
    } else if (type === 'article' && articleFileInputRef.current) {
      articleFileInputRef.current.click();
    }
  };

  // Add paste event listeners
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      // Don't interfere if user is typing in an input field
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.hasAttribute('contenteditable')
      )) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;
      
      // Look for image items in clipboard
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            try {
              const processedImage = await processImageFile(file);
              
              // Determine which upload area is focused or hovered
              const userDropArea = userDropRef.current;
              const articleDropArea = articleDropRef.current;
              
              // Check if either drop area has focus or is being hovered
              if (userDropArea && (
                userDropArea.contains(activeElement) || 
                userDropArea === activeElement ||
                userDropArea.matches(':focus-within') ||
                userDropArea.matches(':hover')
              )) {
                setUserImage(processedImage);
                setError(null);
              } else if (articleDropArea && (
                articleDropArea.contains(activeElement) || 
                articleDropArea === activeElement ||
                articleDropArea.matches(':focus-within') ||
                articleDropArea.matches(':hover')
              )) {
                setArticleImages([processedImage]);
                setError(null);
              } else {
                // Default to user image if no specific area is focused
                setUserImage(processedImage);
                setError(null);
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to process pasted image');
            }
          }
          break;
        }
      }
    };

    // Add both paste and keydown listeners
    document.addEventListener('paste', handleGlobalPaste);
    
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [processImageFile]); // Added processImageFile dependency

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

    // Create new AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);

    // Set up 30-second timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000);

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProcessingStage('processing');
    setCurrentLoadingMessage(0);
    
    // Start cycling through loading messages
    const messageInterval = setInterval(() => {
      setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);
    
    try {
      // Images are already in base64 format, so we can send them directly
      const response = await fetch('/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userImage: userImage.base64,
          articleImages: articleImages.map(img => img.base64)
        }),
        signal: controller.signal // Add abort signal
      });

      // Clear timeout and message interval on successful response
      clearTimeout(timeoutId);
      clearInterval(messageInterval);

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
      // Clear timeout and message interval on error
      clearTimeout(timeoutId);
      clearInterval(messageInterval);
      
      // Don't show error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled or timed out');
        setError('Request timed out after 30 seconds. Please try again with different images or check your internet connection.');
        return;
      }
      
      console.error('Try-on failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setProcessingStage('idle');
      setAbortController(null);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      {/* Navbar */}
      <nav className="fixed top-2 sm:top-3 left-1/2 transform -translate-x-1/2 z-50 px-2 w-full max-w-fit">
        <div className="bg-white/30 backdrop-blur-xl rounded-full px-4 sm:px-6 py-3 sm:py-3 shadow-xl border border-purple-400 ring-1 ring-black/5">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 md:space-x-6">
            <button
              onClick={() => scrollToSection('home')}
              aria-label="Navigate to home section"
              className={`px-3 sm:px-4 py-2 sm:py-2 rounded-full transition-all duration-300 text-sm sm:text-sm whitespace-nowrap ${
                activeSection === 'home'
                  ? 'bg-purple-600 text-white shadow-lg font-bold'
                  : 'text-gray-700 hover:text-purple-600 hover:bg-purple-200/60 font-medium'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('trynow')}
              aria-label="Navigate to try now section"
              className={`px-3 sm:px-4 py-2 sm:py-2 rounded-full transition-all duration-300 text-sm sm:text-sm whitespace-nowrap ${
                activeSection === 'trynow'
                  ? 'bg-purple-600 text-white shadow-lg font-bold'
                  : 'text-gray-700 hover:text-purple-600 hover:bg-purple-200/60 font-medium'
              }`}
            >
              Try Now!
            </button>
            <a
              href="https://iteshxt.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 sm:px-4 py-2 sm:py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-200/60 rounded-full transition-all duration-300 font-medium text-sm sm:text-sm whitespace-nowrap"
            >
              Contact
            </a>
            <a
              href="/chrome-extension"
              className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 flex-shrink-0"
              title="Add to Chrome"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29L1.931 5.47zm2.25 12.58A11.943 11.943 0 0 0 12 24c6.624 0 12-5.376 12-12 0-2.09-.536-4.057-1.479-5.773H12c0 3.016-2.434 5.454-5.454 5.454a5.413 5.413 0 0 1-2.365-.523z"/>
              </svg>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section id="home" className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden pt-24 sm:pt-20">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="text-center max-w-6xl mx-auto relative z-10">
          <div className="mb-6 sm:mb-8 mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-800 mb-4 sm:mb-6">
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
            Experience the future of online shopping with our free AI-powered virtual try-on technology. Upload your photo and instantly see how clothes, shoes, and accessories look on you. Make confident fashion decisions with realistic virtual fitting room experiences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a href="/chrome-extension" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Add to Chrome
            </a>
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
            {(processingStage === 'processing' || result) && (
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-xl border border-white/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-blue-50/30"></div>

                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                      {processingStage === 'processing' ? 'Processing your try-on' : 'Your Try-On Result'}
                    </h2>
                    <p className="text-gray-600">
                      {processingStage === 'processing' ? 'AI is working on your virtual try-on...' : 'See how the clothing looks on you!'}
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-7 gap-6">
                    {/* Left Column - Result Image or Loading (Takes 4/7 width on desktop, full width on mobile) */}
                    <div className="lg:col-span-4 order-2 lg:order-1">
                      {processingStage === 'processing' ? (
                        <div className="flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl p-8 sm:p-12 shadow-lg border border-white/40 min-h-[400px] sm:min-h-[600px]">
                          {/* Minimal Loading Spinner */}
                          <div className="relative mb-8">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 rounded-full animate-spin border-t-purple-600"></div>
                          </div>
                          
                          {/* Simple Text */}
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 text-center">
                            Creating your look
                          </h3>
                          <p className="text-gray-600 text-center text-sm sm:text-base">
                            {loadingMessages[currentLoadingMessage]}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/40 min-h-[400px] sm:min-h-[600px]">
                          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                            <Image
                              src={`data:image/png;base64,${result}`}
                              alt="Try-on result"
                              width={400}
                              height={500}
                              className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl shadow-lg"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                width: 'auto',
                                height: 'auto'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Mobile Action Buttons and Share Section - Show below image on mobile only */}
                      <div className="lg:hidden mt-4 space-y-4">
                        {/* Action Buttons - Show during processing and when result is ready */}
                        {(processingStage === 'processing' || result) && (
                          <div className="space-y-3">
                            <button
                              onClick={() => {
                                if (result) {
                                  const link = document.createElement('a');
                                  link.download = 'fitcheckr-tryon-result.png';
                                  link.href = `data:image/png;base64,${result}`;
                                  link.click();
                                }
                              }}
                              disabled={processingStage === 'processing'}
                              className={`w-full group relative overflow-hidden ${processingStage === 'processing' ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'} text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                              <div className="relative flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Result
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                if (processingStage === 'processing') {
                                  // Cancel the ongoing request properly
                                  if (abortController) {
                                    abortController.abort();
                                  }
                                  setIsLoading(false);
                                  setProcessingStage('idle');
                                  setResult(null);
                                  setError(null);
                                  setAbortController(null);
                                } else {
                                  setResult(null);
                                  setUserImage(null);
                                  setArticleImages([]);
                                  setProcessingStage('idle');
                                }
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-red-600 border-2 border-gray-200/50 hover:border-red-300 px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              {processingStage === 'processing' ? 'Cancel & Try Another' : 'Try Another Look'}
                            </button>
                          </div>
                        )}

                        {/* Share Section - Only show when result is ready */}
                        {result && processingStage !== 'processing' && (
                          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/40">
                            <div className="text-center">
                              <h3 className="text-base font-semibold text-gray-900 mb-3">
                                Share your look!
                              </h3>
                              
                              {/* Social Media Share Buttons - Circular Icons */}
                              <div className="flex justify-center gap-3">
                                {/* Twitter/X Share */}
                                <button
                                  onClick={() => {
                                    const text = encodeURIComponent('Check out my virtual try-on result with FitCheckr! ✨');
                                    const url = encodeURIComponent(window.location.href);
                                    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                                  }}
                                  className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                  </svg>
                                </button>

                                {/* Instagram Share */}
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText('Check out my virtual try-on result with FitCheckr! ✨ ' + window.location.href);
                                    alert('Link copied to clipboard! Share it on Instagram.');
                                  }}
                                  className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                  </svg>
                                </button>

                                {/* Facebook Share */}
                                <button
                                  onClick={() => {
                                    const url = encodeURIComponent(window.location.href);
                                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                                  }}
                                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Source Images & Actions (Takes 3/7 width on desktop, hidden on mobile) */}
                    <div className="hidden lg:block lg:col-span-3 order-1 lg:order-2 space-y-6">
                      {/* Source Images Section */}
                      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Source Images</h4>
                        
                        {/* Side-by-side images */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Your Photo */}
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-2">Your Photo</p>
                            {userImage && (
                              <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100">
                                <Image
                                  src={userImage.preview}
                                  alt="Your photo"
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 ring-1 ring-purple-200/30 rounded-lg"></div>
                              </div>
                            )}
                          </div>

                          {/* Clothing Item */}
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-2">Clothing</p>
                            {articleImages.length > 0 && (
                              <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100">
                                <Image
                                  src={articleImages[0].preview}
                                  alt="Clothing item"
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 ring-1 ring-pink-200/30 rounded-lg"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Show during processing and when result is ready */}
                      {processingStage !== 'idle' && (
                        <div className="space-y-4">
                          <button
                            onClick={() => {
                              if (result) {
                                const link = document.createElement('a');
                                link.download = 'fitcheckr-tryon-result.png';
                                link.href = `data:image/png;base64,${result}`;
                                link.click();
                              }
                            }}
                            disabled={processingStage === 'processing'}
                            className={`w-full group relative overflow-hidden ${processingStage === 'processing' ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'} text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                            <div className="relative flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download Result
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              if (processingStage === 'processing') {
                                // Cancel the ongoing request properly
                                if (abortController) {
                                  abortController.abort();
                                }
                                setIsLoading(false);
                                setProcessingStage('idle');
                                setResult(null);
                                setError(null);
                                setAbortController(null);
                              } else {
                                setResult(null);
                                setUserImage(null);
                                setArticleImages([]);
                                setProcessingStage('idle');
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-red-600 border-2 border-gray-200/50 hover:border-red-300 px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {processingStage === 'processing' ? 'Cancel & Try Another' : 'Try Another Look'}
                          </button>
                        </div>
                      )}

                      {/* Action Buttons - Only show when result is ready */}
                      {result && processingStage !== 'processing' && (
                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.download = 'fitcheckr-tryon-result.png';
                              link.href = `data:image/png;base64,${result}`;
                              link.click();
                            }}
                            className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                            <div className="relative flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download Result
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setResult(null);
                              setUserImage(null);
                              setArticleImages([]);
                              setProcessingStage('idle');
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-purple-600 border-2 border-gray-200/50 hover:border-purple-300 px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Try Another Look
                          </button>
                        </div>
                      )}

                      {/* Share Your Look Section - Only show when result is ready */}
                      {result && processingStage !== 'processing' && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              Share your look!
                            </h3>
                            
                            {/* Social Media Share Buttons - Circular Icons */}
                            <div className="flex justify-center gap-3">
                              {/* Twitter/X Share */}
                              <button
                                onClick={() => {
                                  const text = encodeURIComponent('Check out my virtual try-on result with FitCheckr! ✨');
                                  const url = encodeURIComponent(window.location.href);
                                  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                                }}
                                className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                              </button>

                              {/* Instagram Share */}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText('Check out my virtual try-on result with FitCheckr! ✨ ' + window.location.href);
                                  alert('Link copied to clipboard! Share it on Instagram.');
                                }}
                                className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                              </button>

                              {/* Facebook Share */}
                              <button
                                onClick={() => {
                                  const url = encodeURIComponent(window.location.href);
                                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                                }}
                                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 shadow-xl border border-orange-200/50 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-red-100/30"></div>

                <div className="relative z-10">
                  {/* Friendly Error Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {/* Animated dots */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-ping opacity-75"></div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    🤔 Hmm, we hit a snag!
                  </h2>
                  
                  <div className="max-w-md mx-auto mb-8">
                    <p className="text-gray-600 mb-4 text-lg">
                      Don&apos;t worry, this happens sometimes! Our AI is having a moment.
                    </p>
                    
                    {/* Friendly error suggestions */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 text-left">
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Let&apos;s try this:
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>Make sure your photo shows your full body clearly</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>Check that the clothing item is well-lit and visible</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>Wait a moment and try again - our servers might be busy</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button
                      onClick={() => {
                        setError(null);
                        setResult(null);
                      }}
                      className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                      <div className="relative flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Give it another shot
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setError(null);
                        setUserImage(null);
                        setArticleImages([]);
                        setProcessingStage('idle');
                      }}
                      className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-orange-600 border-2 border-gray-200/50 hover:border-orange-300 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Start fresh
                    </button>
                  </div>

                  {/* Technical details (collapsible for developers) */}
                  <details className="mt-6 max-w-md mx-auto">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                      Technical details (for nerds 🤓)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100/50 rounded-lg text-xs text-gray-500 font-mono text-left">
                      {error}
                    </div>
                  </details>
                </div>
              </div>
            )}

            {processingStage === 'idle' && !result && !error && (
              <div className="grid lg:grid-cols-2 gap-8 mb-12">
                {/* User Image Upload Card */}
                <div className={`group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 rounded-3xl shadow-xl border border-gray-200/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Ready Tag - positioned at widget top-right */}
                  {userImage && (
                    <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg border border-green-400/20 backdrop-blur-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Ready
                    </div>
                  )}

                  <div className="relative p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                          <Image
                            src={userImage.preview}
                            alt="Your photo"
                            width={400}
                            height={320}
                            className="max-w-full max-h-full object-contain rounded-xl"
                          />
                        </div>

                        {/* Remove Button - positioned at image top-right */}
                        <button
                          onClick={() => setUserImage(null)}
                          className="absolute top-3 right-3 bg-white/90 hover:bg-red-200/50 text-gray-600 hover:text-red-500 p-2 rounded-full transition-all duration-300 backdrop-blur-sm shadow-lg border border-gray-200/50 hover:border-red-200 opacity-0 group-hover/image:opacity-100 transform scale-90 group-hover/image:scale-100 hover:shadow-xl"
                          title="Remove photo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div 
                        ref={userDropRef}
                        className="relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded-2xl"
                        onDragEnter={(e) => handleDrag(e, 'user')}
                        onDragLeave={(e) => handleDrag(e, 'user')}
                        onDragOver={(e) => handleDrag(e, 'user')}
                        onDrop={(e) => handleDrop(e, 'user')}
                        onMouseEnter={() => setUserHovered(true)}
                        onMouseLeave={() => setUserHovered(false)}
                        tabIndex={0}
                        onFocus={() => {}}
                        onClick={() => triggerFileInput('user')}
                      >
                        <div className={`relative border-2 border-dashed rounded-2xl h-80 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:border-purple-500 ${
                          userDragActive 
                            ? 'border-purple-500 bg-gradient-to-br from-purple-100 to-blue-100' 
                            : 'border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50'
                        }`}>
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
                              {userDragActive ? 'Drop your photo here' : 'Drop your photo here'}
                            </p>
                            <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                              <span className="text-purple-600 font-medium">Click to browse files</span>
                              {' • '}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowUrlInput('user');
                                }}
                                className="text-purple-600 font-medium hover:text-purple-700"
                              >
                                paste URL
                              </button>
                            </p>
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-4">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                PNG, JPG
                              </span>
                              <span>Max 10MB</span>
                              <span>Focus + Ctrl+V to paste</span>
                            </div>
                          </div>
                        </div>
                        
                        <input
                          ref={userFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleUserImageUpload}
                          className="hidden"
                        />
                        
                        {/* URL Input Modal */}
                        {showUrlInput === 'user' && (
                          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                            <div className="w-full max-w-md p-6">
                              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Image from URL</h3>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={urlInputValue}
                                  onChange={(e) => setUrlInputValue(e.target.value)}
                                  placeholder="https://example.com/image.jpg or paste image with Ctrl+V"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  autoFocus
                                  onPaste={async (e) => {
                                    const items = e.clipboardData?.items;
                                    if (items) {
                                      for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf('image') !== -1) {
                                          e.preventDefault();
                                          const file = items[i].getAsFile();
                                          if (file) {
                                            try {
                                              const processedImage = await processImageFile(file);
                                              setUserImage(processedImage);
                                              setError(null);
                                              setShowUrlInput(null);
                                              setUrlInputValue('');
                                              return;
                                            } catch (err) {
                                              setError(err instanceof Error ? err.message : 'Failed to process pasted image');
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUrlSubmit(urlInputValue, 'user');
                                    } else if (e.key === 'Escape') {
                                      setShowUrlInput(null);
                                      setUrlInputValue('');
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleUrlSubmit(urlInputValue, 'user')}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => {
                                    setShowUrlInput(null);
                                    setUrlInputValue('');
                                  }}
                                  className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Article Image Upload Card */}
                <div className={`group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 rounded-3xl shadow-xl border border-gray-200/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Ready Tag - positioned at widget top-right */}
                  {articleImages.length > 0 && (
                    
                    <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg border border-green-400/20 backdrop-blur-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Ready
                    </div>
                  )}

                  <div className="relative p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
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
                          <Image
                            src={articleImages[0].preview}
                            alt="Clothing item"
                            width={400}
                            height={320}
                            className="max-w-full max-h-full object-contain rounded-xl"
                          />
                        </div>

                        {/* Remove Button - positioned at image top-right */}
                        <button
                          onClick={() => setArticleImages([])}
                          
                          className="absolute top-3 right-3 bg-white/90 hover:bg-red-200/50 text-gray-600 hover:text-red-500 p-2 rounded-full transition-all duration-300 backdrop-blur-sm shadow-lg border border-gray-200/50 hover:border-red-200 opacity-0 group-hover/image:opacity-100 transform scale-90 group-hover/image:scale-100 hover:shadow-xl"
                          title="Remove photo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div 
                        ref={articleDropRef}
                        className="relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 rounded-2xl"
                        onDragEnter={(e) => handleDrag(e, 'article')}
                        onDragLeave={(e) => handleDrag(e, 'article')}
                        onDragOver={(e) => handleDrag(e, 'article')}
                        onDrop={(e) => handleDrop(e, 'article')}
                        onMouseEnter={() => setArticleHovered(true)}
                        onMouseLeave={() => setArticleHovered(false)}
                        tabIndex={0}
                        onFocus={() => {}}
                        onClick={() => triggerFileInput('article')}
                      >
                        <div className={`relative border-2 border-dashed rounded-2xl h-80 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:border-pink-500 ${
                          articleDragActive 
                            ? 'border-pink-500 bg-gradient-to-br from-pink-100 to-purple-100' 
                            : 'border-gray-300 hover:border-pink-400 hover:bg-gradient-to-br hover:from-pink-50 hover:to-purple-50'
                        }`}>
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
                              {articleDragActive ? 'Drop clothing item here' : 'Drop clothing item here'}
                            </p>
                            <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                              <span className="text-pink-600 font-medium">Click to browse files</span>
                              {' • '}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowUrlInput('article');
                                }}
                                className="text-pink-600 font-medium hover:text-pink-700"
                              >
                                paste URL
                              </button>
                            </p>
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-4">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                PNG, JPG
                              </span>
                              <span>Max 10MB</span>
                              <span>Focus + Ctrl+V to paste</span>
                            </div>
                          </div>
                        </div>
                        
                        <input
                          ref={articleFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleArticleImageUpload}
                          className="hidden"
                        />
                        
                        {/* URL Input Modal */}
                        {showUrlInput === 'article' && (
                          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                            <div className="w-full max-w-md p-6">
                              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Image from URL</h3>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={urlInputValue}
                                  onChange={(e) => setUrlInputValue(e.target.value)}
                                  placeholder="https://example.com/clothing.jpg or paste image with Ctrl+V"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                  autoFocus
                                  onPaste={async (e) => {
                                    const items = e.clipboardData?.items;
                                    if (items) {
                                      for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf('image') !== -1) {
                                          e.preventDefault();
                                          const file = items[i].getAsFile();
                                          if (file) {
                                            try {
                                              const processedImage = await processImageFile(file);
                                              setArticleImages([processedImage]);
                                              setError(null);
                                              setShowUrlInput(null);
                                              setUrlInputValue('');
                                              return;
                                            } catch (err) {
                                              setError(err instanceof Error ? err.message : 'Failed to process pasted image');
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUrlSubmit(urlInputValue, 'article');
                                    } else if (e.key === 'Escape') {
                                      setShowUrlInput(null);
                                      setUrlInputValue('');
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleUrlSubmit(urlInputValue, 'article')}
                                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => {
                                    setShowUrlInput(null);
                                    setUrlInputValue('');
                                  }}
                                  className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
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
      </main>
      </div>
    </>
  );
}