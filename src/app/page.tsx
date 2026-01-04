'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { loadingMessages } from '@/lib/constants';

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
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const [processingStage, setProcessingStage] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [userDragActive, setUserDragActive] = useState(false);
  const [articleDragActive, setArticleDragActive] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const userDropRef = useRef<HTMLDivElement>(null);
  const articleDropRef = useRef<HTMLDivElement>(null);
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const articleFileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
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
        setError(err instanceof Error ? err.message : 'Failed to process image');
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
        setError(err instanceof Error ? err.message : 'Failed to process image');
      }
    }
  };

  const handleDrag = (e: React.DragEvent, type: 'user' | 'article') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (type === 'user') setUserDragActive(true);
      else setArticleDragActive(true);
    } else if (e.type === "dragleave") {
      const rect = e.currentTarget.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom) {
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
    
    if (e.dataTransfer.files?.[0]) {
      try {
        const processedImage = await processImageFile(e.dataTransfer.files[0]);
        if (type === 'user') setUserImage(processedImage);
        else setArticleImages([processedImage]);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process image');
      }
    }
  };

  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return;

      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            try {
              const processedImage = await processImageFile(file);
              if (!userImage) {
                setUserImage(processedImage);
              } else if (!articleImages.length) {
                setArticleImages([processedImage]);
              }
              setError(null);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to process pasted image');
            }
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [processImageFile, userImage, articleImages.length]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleTryOn = async () => {
    if (!userImage || !articleImages.length) {
      setError('Please upload both images first');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProcessingStage('processing');
    setCurrentLoadingMessage(0);
    
    try {
      const response = await fetch('/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userImage: userImage.base64,
          articleImages: articleImages.map(img => img.base64)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.base64) {
        setResult(data.base64);
        setProcessingStage('complete');
      } else {
        throw new Error(data.message || 'Try-on failed');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
      setProcessingStage('idle');
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setEmailSubmitted(true);
      setTimeout(() => setShowEmailPopup(false), 2000);
    } catch {
      // Silently fail
    }
  };

  const resetTryOn = () => {
    setResult(null);
    setUserImage(null);
    setArticleImages([]);
    setProcessingStage('idle');
    setError(null);
  };

  const isReady = userImage && articleImages.length > 0;

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Subtle curtain pattern */}
        <div className="absolute inset-0 curtain-pattern opacity-30"></div>
        
        {/* Soft glow orbs */}
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-champagne/20 blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-48 h-48 rounded-full bg-blush/15 blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-56 h-56 rounded-full bg-gold/8 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-44 h-44 rounded-full bg-champagne/15 blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-20 right-10 w-36 h-36 rounded-full bg-blush/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/3 left-[5%] w-32 h-32 rounded-full bg-gold/10 blur-3xl animate-float" style={{ animationDelay: '2.5s' }}></div>
        
        {/* T-Shirt shapes */}
        <svg className="absolute top-[35%] left-[5%] w-10 h-10 text-gold animate-float opacity-50" style={{ animationDelay: '0.8s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 4l-3 3 3 2v11h12V9l3-2-3-3-3 2h-6l-3-2z" />
        </svg>
        <svg className="absolute top-[60%] right-[15%] w-8 h-8 text-champagne animate-float opacity-50" style={{ animationDelay: '1.3s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 4l-3 3 3 2v11h12V9l3-2-3-3-3 2h-6l-3-2z" />
        </svg>
        <svg className="absolute bottom-[45%] right-[25%] w-11 h-11 text-gold animate-float opacity-50" style={{ animationDelay: '2.5s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 4l-3 3 3 2v11h12V9l3-2-3-3-3 2h-6l-3-2z" />
        </svg>
        
        {/* Dress shapes */}
        <svg className="absolute top-[25%] right-[5%] w-10 h-10 text-blush animate-float opacity-50" style={{ animationDelay: '0.3s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2h8l-1 6 3 2-2 12H8L6 10l3-2-1-6z" />
        </svg>
        <svg className="absolute bottom-[20%] left-[20%] w-9 h-9 text-champagne animate-float opacity-50" style={{ animationDelay: '1.8s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2h8l-1 6 3 2-2 12H8L6 10l3-2-1-6z" />
        </svg>
        <svg className="absolute top-[70%] left-[35%] w-8 h-8 text-gold animate-float opacity-50" style={{ animationDelay: '2.2s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2h8l-1 6 3 2-2 12H8L6 10l3-2-1-6z" />
        </svg>
        
        {/* Shopping bags */}
        <svg className="absolute top-[15%] left-[25%] w-8 h-8 text-gold animate-float opacity-50" style={{ animationDelay: '0.6s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 6h12l2 14H4L6 6z M9 6V4a3 3 0 016 0v2" />
        </svg>
        <svg className="absolute bottom-[35%] right-[12%] w-9 h-9 text-champagne animate-float opacity-50" style={{ animationDelay: '1.1s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 6h12l2 14H4L6 6z M9 6V4a3 3 0 016 0v2" />
        </svg>
        <svg className="absolute top-[50%] left-[8%] w-7 h-7 text-blush animate-float opacity-50" style={{ animationDelay: '2.8s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 6h12l2 14H4L6 6z M9 6V4a3 3 0 016 0v2" />
        </svg>
        
        {/* Heart shapes */}
        <svg className="absolute top-[40%] right-[30%] w-6 h-6 text-blush animate-float opacity-50" style={{ animationDelay: '0.4s' }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <svg className="absolute bottom-[55%] left-[30%] w-5 h-5 text-champagne animate-float opacity-50" style={{ animationDelay: '1.6s' }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <svg className="absolute top-[80%] right-[40%] w-6 h-6 text-gold animate-float opacity-50" style={{ animationDelay: '2.4s' }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        
        {/* Sparkle/star decorations */}
        <div className="absolute top-[12%] right-[35%] text-gold/50 text-lg animate-sparkle">✦</div>
        <div className="absolute top-[55%] left-[18%] text-champagne/50 text-base animate-sparkle" style={{ animationDelay: '0.7s' }}>✦</div>
        <div className="absolute bottom-[25%] right-[18%] text-gold/50 text-xl animate-sparkle" style={{ animationDelay: '1.4s' }}>✦</div>
        <div className="absolute top-[75%] left-[45%] text-blush/50 text-sm animate-sparkle" style={{ animationDelay: '2.1s' }}>✦</div>
        <div className="absolute top-[30%] left-[40%] text-gold/50 text-base animate-sparkle" style={{ animationDelay: '0.9s' }}>✧</div>
        <div className="absolute bottom-[40%] right-[35%] text-champagne/50 text-lg animate-sparkle" style={{ animationDelay: '1.9s' }}>✧</div>
        <div className="absolute top-[65%] right-[45%] text-gold/50 text-sm animate-sparkle" style={{ animationDelay: '2.6s' }}>✦</div>
        
        {/* Pants/trousers shape */}
        <svg className="absolute bottom-[15%] right-[8%] w-8 h-8 text-champagne animate-float opacity-50" style={{ animationDelay: '1.2s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2h12v8l-2 12h-3l-1-10-1 10H8L6 10V2z" />
        </svg>
        <svg className="absolute top-[85%] left-[12%] w-7 h-7 text-gold animate-float opacity-50" style={{ animationDelay: '2.3s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2h12v8l-2 12h-3l-1-10-1 10H8L6 10V2z" />
        </svg>
        
        {/* High heel shoe */}
        <svg className="absolute bottom-[60%] left-[3%] w-8 h-8 text-blush animate-float opacity-50" style={{ animationDelay: '0.2s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 18h4l2-6 8-2 6 2v4H2zM6 18v4" />
        </svg>
        <svg className="absolute top-[20%] right-[12%] w-7 h-7 text-champagne animate-float opacity-50" style={{ animationDelay: '1.7s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 18h4l2-6 8-2 6 2v4H2zM6 18v4" />
        </svg>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-boutique border-b border-gold/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10">
              {/* Hanger frame */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold to-gold-light shadow-lg"></div>
              <div className="absolute inset-[2px] rounded-[10px] bg-gradient-to-br from-soft-white via-mirror-silver to-soft-white flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-burgundy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 0a4 4 0 00-4 4h8a4 4 0 00-4-4zM8 8l-3 12h14l-3-12H8z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-display font-semibold text-xl text-charcoal">FitCheckr</span>
              <span className="hidden md:inline-block text-xs text-gold font-medium tracking-wider uppercase">Virtual Fitting Room</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="https://iteshxt.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block px-3 sm:px-4 py-2 text-sm text-charcoal/70 hover:text-burgundy transition-colors font-medium"
            >
              About
            </a>
            <button
              onClick={() => setShowEmailPopup(true)}
              className="btn-boutique px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-burgundy to-deep-plum text-white rounded-full font-semibold hover:shadow-boutique-lg transition-all duration-300 flex items-center gap-1.5 sm:gap-2"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29L1.931 5.47zm2.25 12.58A11.943 11.943 0 0 0 12 24c6.624 0 12-5.376 12-12 0-2.09-.536-4.057-1.479-5.773H12c0 3.016-2.434 5.454-5.454 5.454a5.413 5.413 0 0 1-2.365-.523z"/>
              </svg>
              <span className="hidden xs:inline">Get Extension</span>
              <span className="xs:hidden">Extension</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section - Split Layout */}
        {processingStage === 'idle' && !result && (
          <section className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row items-center justify-center max-w-6xl mx-auto">
            {/* Left Side - Hero Info */}
            <div className="flex-1 flex flex-col justify-center px-6 lg:px-8 py-10 lg:py-0 animate-slide-in-left">
              <div className="max-w-md lg:max-w-lg">

                {/* Main Headline */}
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal leading-tight mb-6">
                  Try Before You 
                  <span className="block text-gradient">Buy, Virtually</span>
                </h1>

                {/* Description */}
                <p className="text-lg text-charcoal/70 mb-8 leading-relaxed">
                  Step into our virtual dressing room. Mix and match any outfit on your photo — 
                  just like trying on clothes at your favorite boutique, but from anywhere.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-gold/10">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-champagne flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal text-sm">Instant Magic</p>
                      <p className="text-xs text-charcoal/60">AI styling in seconds</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-gold/10">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-champagne flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal text-sm">Mix & Match</p>
                      <p className="text-xs text-charcoal/60">Endless combinations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-gold/10">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-champagne flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal text-sm">100% Private</p>
                      <p className="text-xs text-charcoal/60">Photos never stored</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-gold/10">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-champagne flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal text-sm">Totally Free</p>
                      <p className="text-xs text-charcoal/60">No card needed</p>
                    </div>
                  </div>
                </div>

                {/* Scroll indicator for mobile */}
                <div className="lg:hidden flex items-center justify-center gap-2 text-charcoal/50 text-sm">
                  <span>Scroll to try it</span>
                  <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Side - Try Now Section (Fitting Room Style) */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 animate-slide-in-right">
              <div className="w-full max-w-lg">
                {/* Fitting Room Mirror Frame */}
                <div className="relative">
                  {/* Decorative curtain rods */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-[120%] h-1 rack-line"></div>
                  
                  {/* Main Mirror Card */}
                  <div className="relative bg-gradient-to-b from-soft-white via-white to-mirror-silver rounded-3xl p-1 shadow-boutique-lg">
                    {/* Gold border frame */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold via-gold-light to-gold opacity-40"></div>
                    
                    <div className="relative bg-white rounded-[22px] p-6 shadow-mirror">
                      {/* Mirror header with ornament */}
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-3">
                          <span className="text-gold">✦</span>
                          <h2 className="font-display text-xl font-semibold text-charcoal">Fitting Room</h2>
                          <span className="text-gold">✦</span>
                        </div>
                        <p className="text-sm text-charcoal/60 mt-1">Upload your photo & outfit to try on</p>
                      </div>

                      {/* Upload Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Your Photo - Like a mannequin placeholder */}
                        <div 
                          ref={userDropRef}
                          className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${
                            userDragActive 
                              ? 'border-gold bg-champagne/20' 
                              : userImage 
                                ? 'border-gold/50 bg-champagne/10' 
                                : 'border-charcoal/20 hover:border-gold hover:bg-champagne/10'
                          }`}
                          onDragEnter={(e) => handleDrag(e, 'user')}
                          onDragLeave={(e) => handleDrag(e, 'user')}
                          onDragOver={(e) => handleDrag(e, 'user')}
                          onDrop={(e) => handleDrop(e, 'user')}
                          onClick={() => !userImage && userFileInputRef.current?.click()}
                        >
                          {userImage ? (
                            <div className="aspect-[3/4] relative">
                              <Image
                                src={userImage.preview}
                                alt="Your photo"
                                fill
                                className="object-cover rounded-xl"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); setUserImage(null); }}
                                className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                              >
                                <svg className="w-3.5 h-3.5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <div className="absolute bottom-2 left-2 px-2 py-1 bg-burgundy text-white text-xs font-medium rounded-full flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                You
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-[3/4] flex flex-col items-center justify-center p-4">
                              {/* Mannequin icon */}
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-champagne to-blush/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                <svg className="w-8 h-8 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <p className="font-semibold text-charcoal mb-1">Your Photo</p>
                              <p className="text-xs text-charcoal/50 text-center">
                                Drop or <span className="text-gold font-medium">browse</span>
                              </p>
                            </div>
                          )}
                          <input ref={userFileInputRef} type="file" accept="image/*" onChange={handleUserImageUpload} className="hidden" />
                        </div>

                        {/* Clothing Item - Like a hanger display */}
                        <div 
                          ref={articleDropRef}
                          className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${
                            articleDragActive 
                              ? 'border-gold bg-champagne/20' 
                              : articleImages.length 
                                ? 'border-gold/50 bg-champagne/10' 
                                : 'border-charcoal/20 hover:border-gold hover:bg-champagne/10'
                          }`}
                          onDragEnter={(e) => handleDrag(e, 'article')}
                          onDragLeave={(e) => handleDrag(e, 'article')}
                          onDragOver={(e) => handleDrag(e, 'article')}
                          onDrop={(e) => handleDrop(e, 'article')}
                          onClick={() => !articleImages.length && articleFileInputRef.current?.click()}
                        >
                          {articleImages.length > 0 ? (
                            <div className="aspect-[3/4] relative">
                              <Image
                                src={articleImages[0].preview}
                                alt="Clothing item"
                                fill
                                className="object-cover rounded-xl"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); setArticleImages([]); }}
                                className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                              >
                                <svg className="w-3.5 h-3.5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <div className="absolute bottom-2 left-2 px-2 py-1 bg-gold text-charcoal text-xs font-medium rounded-full flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Outfit
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-[3/4] flex flex-col items-center justify-center p-4">
                              {/* Hanger icon */}
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-champagne to-gold/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                <svg className="w-8 h-8 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 0c-2.5 0-5 1.5-5 3h10c0-1.5-2.5-3-5-3zM7 7v10a2 2 0 002 2h6a2 2 0 002-2V7" />
                                </svg>
                              </div>
                              <p className="font-semibold text-charcoal mb-1">Clothing Item</p>
                              <p className="text-xs text-charcoal/50 text-center">
                                Drop or <span className="text-gold font-medium">browse</span>
                              </p>
                            </div>
                          )}
                          <input ref={articleFileInputRef} type="file" accept="image/*" onChange={handleArticleImageUpload} className="hidden" />
                        </div>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <div className="mb-4 p-3 bg-velvet-curtain/10 border border-velvet-curtain/30 rounded-xl text-velvet-curtain text-sm text-center">
                          {error}
                        </div>
                      )}

                      {/* Try On Button - Like a fitting room door handle */}
                      <button
                        onClick={handleTryOn}
                        disabled={!isReady || isLoading}
                        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                          isReady
                            ? 'btn-boutique bg-gradient-to-r from-burgundy to-deep-plum text-white hover:shadow-boutique-lg hover:-translate-y-0.5'
                            : 'bg-charcoal/10 text-charcoal/40 cursor-not-allowed'
                        }`}
                      >
                        {isReady ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            <span>Try It On</span>
                          </>
                        ) : (
                          <span>Upload both images to start</span>
                        )}
                      </button>

                      {/* Helper text */}
                      <p className="text-center text-xs text-charcoal/40 mt-4">
                        💡 Tip: Press <kbd className="px-1.5 py-0.5 bg-champagne rounded text-charcoal/60 font-mono text-[10px]">Ctrl+V</kbd> to paste images
                      </p>
                    </div>
                  </div>

                  {/* Decorative sparkles */}
                  <div className="absolute -top-2 -right-2 text-gold animate-sparkle">✦</div>
                  <div className="absolute -bottom-2 -left-2 text-gold animate-sparkle" style={{ animationDelay: '1s' }}>✦</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Processing State - Styling Room Transformation */}
        {processingStage === 'processing' && (
          <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
              {/* Spinning hanger/clothing rack animation */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-champagne"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-burgundy border-r-gold animate-spin"></div>
                
                {/* Inner content */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-champagne via-soft-white to-gold/30 flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 0c-2.5 0-5 1.5-5 3h10c0-1.5-2.5-3-5-3zM7 7v10a2 2 0 002 2h6a2 2 0 002-2V7" />
                  </svg>
                </div>
                
                {/* Orbiting sparkles */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 text-gold animate-sparkle">✦</div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-gold animate-sparkle" style={{ animationDelay: '0.5s' }}>✦</div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gold animate-sparkle" style={{ animationDelay: '1s' }}>✦</div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gold animate-sparkle" style={{ animationDelay: '1.5s' }}>✦</div>
              </div>

              <h2 className="font-display text-2xl font-bold text-charcoal mb-3">Styling Your Look...</h2>
              <p className="text-charcoal/60 animate-soft-pulse mb-8">{loadingMessages[currentLoadingMessage]}</p>
              
              <button
                onClick={() => {
                  abortController?.abort();
                  setProcessingStage('idle');
                  setIsLoading(false);
                }}
                className="px-6 py-2 text-sm text-charcoal/50 hover:text-burgundy transition-colors border border-charcoal/20 hover:border-burgundy rounded-full"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        {/* Result State - The Reveal */}
        {result && (
          <section className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                {/* Main Result - The Mirror Reveal */}
                <div className="flex-1 lg:flex-[2] w-full animate-fade-in flex justify-center">
                  <div className="relative inline-block">
                    {/* Mirror frame */}
                    <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-gold via-gold-light to-gold opacity-50"></div>
                    <div className="relative bg-white rounded-[22px] p-2 shadow-boutique-lg">
                      <img
                        src={`data:image/png;base64,${result}`}
                        alt="Try-on result"
                        className="max-h-[75vh] w-auto rounded-2xl"
                      />
                    </div>
                    {/* Decorative sparkles */}
                    <div className="absolute -top-4 -right-4 text-2xl text-gold animate-sparkle">✦</div>
                    <div className="absolute -bottom-4 -left-4 text-2xl text-gold animate-sparkle" style={{ animationDelay: '0.5s' }}>✦</div>
                  </div>
                </div>

                {/* Sidebar - Shopping Actions */}
                <div className="flex-1 lg:max-w-sm space-y-6 animate-slide-in-right">
                  {/* Success Header */}
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 mb-4">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-700">Look Ready!</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-charcoal mb-2">Looking Great!</h2>
                    <p className="text-sm text-charcoal/60">Your virtual fitting is complete. Download or share your new look.</p>
                  </div>

                  {/* Source Images Preview */}
                  <div className="bg-champagne/30 rounded-2xl p-4">
                    <p className="text-xs font-medium text-charcoal/60 mb-3 uppercase tracking-wider">Original Items</p>
                    <div className="grid grid-cols-2 gap-3">
                      {userImage && (
                        <div className="aspect-square relative rounded-xl overflow-hidden border-2 border-white shadow-md">
                          <Image src={userImage.preview} alt="You" fill className="object-cover" />
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-burgundy/90 text-white text-[10px] font-medium rounded">You</div>
                        </div>
                      )}
                      {articleImages[0] && (
                        <div className="aspect-square relative rounded-xl overflow-hidden border-2 border-white shadow-md">
                          <Image src={articleImages[0].preview} alt="Item" fill className="object-cover" />
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-gold/90 text-charcoal text-[10px] font-medium rounded">Outfit</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = 'fitcheckr-result.png';
                        link.href = `data:image/png;base64,${result}`;
                        link.click();
                      }}
                      className="btn-boutique w-full py-4 bg-gradient-to-r from-burgundy to-deep-plum text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-boutique-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Look
                    </button>
                    
                    <button
                      onClick={resetTryOn}
                      className="w-full py-3 border-2 border-gold/50 text-charcoal rounded-xl font-semibold hover:bg-champagne/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Try Another Outfit
                    </button>

                    {/* Share Options */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          const text = encodeURIComponent('Check out my virtual try-on! ✨ Try yours at https://fitcheckr.vercel.app');
                          window.open(`https://www.instagram.com/`, '_blank');
                        }}
                        className="py-2.5 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white rounded-lg text-sm font-medium transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span className="hidden sm:inline">Instagram</span>
                      </button>
                      <button
                        onClick={() => {
                          const text = encodeURIComponent('Check out my virtual try-on! ✨ Try yours at');
                          const url = encodeURIComponent('https://fitcheckr.vercel.app');
                          window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                        }}
                        className="py-2.5 bg-charcoal text-white rounded-lg text-sm font-medium transition-all hover:bg-charcoal/90 flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span className="hidden sm:inline">X</span>
                      </button>
                      <button
                        onClick={async () => {
                          // Convert base64 to blob for sharing
                          const base64Response = await fetch(`data:image/png;base64,${result}`);
                          const blob = await base64Response.blob();
                          const file = new File([blob], 'fitcheckr-look.png', { type: 'image/png' });
                          
                          if (navigator.share && navigator.canShare({ files: [file] })) {
                            try {
                              await navigator.share({
                                title: 'My FitCheckr Look',
                                text: 'Check out my virtual try-on! ✨ Try yours at https://fitcheckr.vercel.app',
                                files: [file]
                              });
                            } catch (err) {
                              // User cancelled or error
                              console.log('Share cancelled');
                            }
                          } else {
                            // Fallback: copy link
                            navigator.clipboard.writeText('https://fitcheckr.vercel.app');
                            alert('Link copied! Share your look on your favorite platform.');
                          }
                        }}
                        className="py-2.5 bg-champagne text-charcoal rounded-lg text-sm font-medium transition-all hover:bg-gold/30 flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span className="hidden sm:inline">Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer - Boutique Style */}
      <footer className="border-t border-gold/20 bg-gradient-to-b from-cream to-champagne/50 py-6 sm:py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-burgundy to-deep-plum flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 0a4 4 0 00-4 4h8a4 4 0 00-4-4zM8 8l-3 12h14l-3-12H8z" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-semibold text-charcoal text-sm sm:text-base">FitCheckr</span>
                <span className="text-xs text-charcoal/50">© 2025</span>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              <a href="https://iteshxt.me/" target="_blank" rel="noopener noreferrer" className="text-charcoal/60 hover:text-burgundy transition-colors font-medium">
                About
              </a>
              <a href="mailto:iteshxt@gmail.com" className="text-charcoal/60 hover:text-burgundy transition-colors font-medium">
                Contact
              </a>
            </div>

            {/* Tag line */}
            <div className="flex items-center gap-1 text-xs text-charcoal/50">
              <span>Made with</span>
              <span className="text-burgundy">♥</span>
              <span>by</span>
              <a href="https://iteshxt.me/" target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline font-medium">iteshxt</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Chrome Extension Email Popup - Boutique Modal */}
      {showEmailPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm" onClick={() => setShowEmailPopup(false)}>
          <div className="relative bg-cream rounded-3xl p-8 max-w-sm w-full shadow-boutique-lg border border-gold/30" onClick={e => e.stopPropagation()}>
            {/* Decorative elements */}
            <div className="absolute -top-3 -right-3 text-gold">✦</div>
            <div className="absolute -bottom-3 -left-3 text-gold">✦</div>
            
            {!emailSubmitted ? (
              <>
                <div className="w-16 h-16 bg-gradient-to-br from-burgundy to-deep-plum rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29L1.931 5.47zm2.25 12.58A11.943 11.943 0 0 0 12 24c6.624 0 12-5.376 12-12 0-2.09-.536-4.057-1.479-5.773H12c0 3.016-2.434 5.454-5.454 5.454a5.413 5.413 0 0 1-2.365-.523z"/>
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-charcoal text-center mb-2">Chrome Extension Coming Soon!</h3>
                <p className="text-sm text-charcoal/60 text-center mb-6">Try on clothes directly while shopping online. Be the first to know when we launch.</p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/30 focus:outline-none focus:border-gold bg-white text-charcoal placeholder:text-charcoal/40"
                  />
                  <button type="submit" className="btn-boutique w-full py-3 bg-gradient-to-r from-burgundy to-deep-plum text-white rounded-xl font-bold hover:shadow-boutique-lg transition-all">
                    Notify Me
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-display text-lg font-bold text-charcoal">You&apos;re on the list!</p>
                <p className="text-sm text-charcoal/60 mt-1">We&apos;ll notify you when it&apos;s ready.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
