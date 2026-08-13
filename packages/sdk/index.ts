interface DevPulseOptions {
  apiKey: string;
  endpoint?: string;
  environment?: string;
}

class DevPulseSDK {
  private apiKey: string | null = null;
  private endpoint = 'http://localhost:5000/api';
  private environment: string = 'production';

  init(options: DevPulseOptions) {
    this.apiKey = options.apiKey;
    if (options.endpoint) {
      this.endpoint = options.endpoint;
    }
    if (options.environment) {
      this.environment = options.environment;
    }
    console.log('[DevPulse] Initialized with API Key:', this.apiKey.substring(0, 8) + '...');
  }

  private async send(path: string, data: any): Promise<any> {
    if (!this.apiKey) {
      console.warn('[DevPulse] SDK not initialized. Call DevPulse.init() first.');
      return;
    }

    try {
      const response = await fetch(`${this.endpoint}${path}`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error(`[DevPulse] API error: ${result.message}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[DevPulse] Network error:', error);
      return null;
    }
  }

  async captureException(error: Error, metadata?: Record<string, any>) {
    if (!this.apiKey) {
      console.warn('[DevPulse] SDK not initialized. Call DevPulse.init() first.');
      return;
    }

    console.log('[DevPulse] Exception captured:', error.message);

    return this.send('/ingest/errors', {
      errorType: error.name,
      message: error.message,
      stackTrace: error.stack,
      source: 'frontend',
      environment: this.environment,
      metadata,
    });
  }

  async captureLog(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info', service: string = 'app', metadata?: Record<string, any>) {
    if (!this.apiKey) {
      console.warn('[DevPulse] SDK not initialized. Call DevPulse.init() first.');
      return;
    }

    console.log(`[DevPulse] ${level.toUpperCase()}:`, message);

    return this.send('/ingest/logs', {
      level,
      message,
      service,
      metadata,
    });
  }

  async captureMetric(endpoint: string, method: string, statusCode: number, responseTime: number) {
    if (!this.apiKey) {
      console.warn('[DevPulse] SDK not initialized. Call DevPulse.init() first.');
      return;
    }

    return this.send('/ingest/metrics', {
      endpoint,
      method,
      statusCode,
      responseTime,
    });
  }

  async capturePerformance(url: string, pageLoadTime: number, cls: number, lcp: number) {
    if (!this.apiKey) {
      console.warn('[DevPulse] SDK not initialized. Call DevPulse.init() first.');
      return;
    }

    return this.send('/ingest/performance', {
      url,
      pageLoadTime,
      cls,
      lcp,
    });
  }
}

const DevPulse = new DevPulseSDK();
export default DevPulse;
