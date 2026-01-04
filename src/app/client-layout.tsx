'use client';

import { Component, ReactNode, ErrorInfo, useEffect } from 'react';

// Performance Monitor Component
function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('LCP:', lastEntry.startTime);
        }
      });

      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        console.warn('Performance Observer not supported');
      }

      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        interface LayoutShift extends PerformanceEntry {
          value: number;
          hadRecentInput: boolean;
        }
        for (const entry of list.getEntries()) {
          const layoutShift = entry as LayoutShift;
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('CLS:', clsValue);
        }
      });

      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch {
        console.warn('Layout shift observer not supported');
      }

      return () => {
        observer.disconnect();
        clsObserver.disconnect();
      };
    }
  }, []);

  return null;
}

// Error Boundary Component with boutique theme
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream relative overflow-hidden flex flex-col">
          {/* Background Decorations */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 curtain-pattern opacity-30"></div>
            <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-champagne/20 blur-3xl animate-float"></div>
            <div className="absolute bottom-40 right-20 w-48 h-48 rounded-full bg-blush/15 blur-3xl animate-float"></div>
            <div className="absolute top-[12%] right-[35%] text-gold/50 text-lg animate-sparkle">✦</div>
            <div className="absolute bottom-[25%] left-[18%] text-champagne/50 text-xl animate-sparkle">✦</div>
          </div>

          {/* Main Content */}
          <main className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-md relative z-10">
              {/* Icon */}
              <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-champagne to-blush/50 flex items-center justify-center shadow-boutique-lg border border-gold/20">
                <svg className="w-12 h-12 text-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h1 className="font-display text-3xl font-bold mb-4 text-charcoal">
                Oops! Something went wrong
              </h1>
              <p className="text-charcoal/60 mb-8 leading-relaxed">
                We encountered an unexpected error in your fitting room. Let&apos;s refresh and try again.
              </p>

              <button
                className="btn-boutique px-8 py-4 bg-gradient-to-r from-burgundy to-deep-plum text-white rounded-xl font-bold hover:shadow-boutique-lg transition-all flex items-center justify-center gap-2 mx-auto"
                onClick={() => window.location.reload()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Page
              </button>
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

    return this.props.children;
  }
}

// Client Layout Component
export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PerformanceMonitor />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </>
  );
}
