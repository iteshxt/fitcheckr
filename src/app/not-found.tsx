'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden flex flex-col">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 curtain-pattern opacity-30"></div>
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-champagne/20 blur-3xl animate-float"></div>
        <div className="absolute bottom-40 right-20 w-48 h-48 rounded-full bg-blush/15 blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[12%] right-[35%] text-gold/50 text-lg animate-sparkle">✦</div>
        <div className="absolute bottom-[25%] left-[18%] text-champagne/50 text-xl animate-sparkle" style={{ animationDelay: '1.4s' }}>✦</div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-boutique border-b border-gold/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold to-gold-light shadow-lg"></div>
              <div className="absolute inset-[2px] rounded-[10px] bg-gradient-to-br from-soft-white via-mirror-silver to-soft-white flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-burgundy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 0a4 4 0 00-4 4h8a4 4 0 00-4-4zM8 8l-3 12h14l-3-12H8z" />
                </svg>
              </div>
            </div>
            <span className="font-display font-semibold text-xl text-charcoal">FitCheckr</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pt-16">
        <div className="text-center max-w-md">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-champagne to-blush/50 flex items-center justify-center shadow-boutique-lg border border-gold/20">
            <svg className="w-12 h-12 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="font-display text-7xl font-bold mb-4 text-gradient">
            404
          </h1>
          
          <h2 className="font-display text-2xl font-semibold text-charcoal mb-3">
            Page not found
          </h2>
          <p className="text-charcoal/60 mb-8 leading-relaxed">
            Oops! This outfit doesn&apos;t exist in our fitting room. Let&apos;s get you back to trying on some fabulous looks.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/')}
              className="btn-boutique px-8 py-4 bg-gradient-to-r from-burgundy to-deep-plum text-white rounded-xl font-bold hover:shadow-boutique-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go Home
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 border-2 border-gold/50 text-charcoal rounded-xl font-semibold hover:bg-champagne/30 transition-colors"
            >
              Try Virtual Fitting
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gold/20 bg-gradient-to-b from-cream to-champagne/50 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-charcoal/50">
            <span>Made with</span>
            <span className="text-burgundy">♥</span>
            <span>by</span>
            <a href="https://iteshxt.me/" target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline font-medium">iteshxt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
