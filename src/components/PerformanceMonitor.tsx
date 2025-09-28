'use client';

import { useEffect } from 'react';

interface PerformanceEntry {
  startTime: number;
}

interface LayoutShiftEntry {
  value: number;
  hadRecentInput: boolean;
}

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Monitor LCP (Largest Contentful Paint)
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('LCP:', lastEntry.startTime);
        }
        
        // You can send this data to analytics
        // analytics.track('lcp', lastEntry.startTime);
      });

      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        // Fallback for browsers that don't support this API
        console.warn('Performance Observer not supported');
      }

      // Monitor CLS (Cumulative Layout Shift)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          const layoutShift = entry as unknown as LayoutShiftEntry;
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