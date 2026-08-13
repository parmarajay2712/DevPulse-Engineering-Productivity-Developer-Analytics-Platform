class DevPulse {
  constructor(config) {
    this.projectId = config.projectId;
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://api.devpulse.com/api/ingest';
    
    this.init();
  }

  init() {
    if (!window) return;

    // Capture uncaught exceptions
    window.addEventListener('error', (event) => {
      this.sendError({
        type: 'uncaught_exception',
        message: event.message,
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.sendError({
        type: 'unhandled_rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      });
    });

    // Capture Performance Metrics (LCP, CLS, Load Time)
    this.capturePerformance();
  }

  capturePerformance() {
    let clsValue = 0;
    
    // Capture Cumulative Layout Shift (CLS)
    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Ignore if not supported
    }

    // Capture Largest Contentful Paint (LCP) and Page Load Time on window load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        let lcpValue = 0;
        try {
          const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
          if (lcpEntries.length > 0) {
            lcpValue = lcpEntries[lcpEntries.length - 1].startTime;
          }
        } catch {}

        this.sendPerformance({
          url: window.location.href,
          pageLoadTime: pageLoadTime > 0 ? pageLoadTime : 0,
          cls: clsValue,
          lcp: lcpValue,
        });
      }, 0);
    });
  }

  sendPerformance(metrics) {
    const payload = {
      projectId: this.projectId,
      ...metrics
    };

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(`${this.endpoint}/performance`, blob);
    } else {
      fetch(`${this.endpoint}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
        body: JSON.stringify(payload)
      }).catch(console.error);
    }
  }

  sendError(errorData) {
    const payload = {
      projectId: this.projectId,
      message: errorData.message,
      stackTrace: errorData.stack || 'No stack trace available',
      environment: 'production',
      source: 'browser',
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...errorData
      }
    };

    // Use sendBeacon if available for reliable delivery during page unload
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(`${this.endpoint}/errors`, blob);
    } else {
      fetch(`${this.endpoint}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      }).catch(console.error); // Silently fail if ingestion is down
    }
  }
}

// Attach to window for script tag usage
window.DevPulse = DevPulse;
