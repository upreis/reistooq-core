// =============================================================================
// ERROR HANDLER UTILITIES - Soluções para problemas de runtime
// =============================================================================

// 1. Circuit Breaker Pattern para prevenir falhas em cascata
export class CircuitBreaker {
  private failures = 0;
  private threshold = 3;
  private timeout = 30000;
  private nextAttempt = Date.now();

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.failures >= this.threshold) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
      // Reset after timeout
      this.failures = 0;
    }

    try {
      const result = await fn();
      this.failures = 0; // Reset on success
      return result;
    } catch (error) {
      this.failures++;
      this.nextAttempt = Date.now() + this.timeout;
      console.error(`Circuit breaker failure ${this.failures}/${this.threshold}:`, error);
      throw error;
    }
  }

  get isOpen(): boolean {
    return this.failures >= this.threshold && Date.now() < this.nextAttempt;
  }

  reset(): void {
    this.failures = 0;
    this.nextAttempt = Date.now();
  }
}

// 2. Asset Verification Utility
export const verifyAsset = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    console.warn(`Asset verification failed for ${url}:`, error);
    return false;
  }
};

// 3. Web Worker Communication with Timeout
export const workerRequest = <T>(
  worker: Worker, 
  data: any, 
  timeout = 5000
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Worker request timeout - message port closed'));
    }, timeout);

    const messageHandler = (event: MessageEvent) => {
      clearTimeout(timeoutId);
      worker.removeEventListener('message', messageHandler);
      
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.result);
      }
    };

    const errorHandler = (error: ErrorEvent) => {
      clearTimeout(timeoutId);
      worker.removeEventListener('message', messageHandler);
      worker.removeEventListener('error', errorHandler);
      reject(new Error(`Worker error: ${error.message}`));
    };

    worker.addEventListener('message', messageHandler);
    worker.addEventListener('error', errorHandler);

    try {
      worker.postMessage(data);
    } catch (error) {
      clearTimeout(timeoutId);
      worker.removeEventListener('message', messageHandler);
      worker.removeEventListener('error', errorHandler);
      reject(error);
    }
  });
};

// 4. API Request Validator
export const validateApiRequest = (data: any, requiredFields: string[]): boolean => {
  if (!data || typeof data !== 'object') {
    console.error('API request validation failed: data is not an object');
    return false;
  }

  for (const field of requiredFields) {
    if (!(field in data) || data[field] === null || data[field] === undefined) {
      console.error(`API request validation failed: missing required field '${field}'`);
      return false;
    }
  }

  return true;
};

// 5. Retry Mechanism with Exponential Backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        console.error(`All ${maxRetries + 1} attempts failed:`, lastError);
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

// 6. Resource Preloader
export const preloadCriticalAssets = async (assets: string[]): Promise<void> => {
  console.log('🔄 Preloading critical assets...');
  
  const promises = assets.map(async (asset) => {
    try {
      const exists = await verifyAsset(asset);
      if (!exists) {
        console.warn(`⚠️ Critical asset not found: ${asset}`);
      }
      return exists;
    } catch (error) {
      console.error(`❌ Failed to verify asset ${asset}:`, error);
      return false;
    }
  });

  const results = await Promise.allSettled(promises);
  const failed = results.filter(r => r.status === 'rejected' || !r.value);
  
  if (failed.length > 0) {
    console.warn(`⚠️ ${failed.length}/${assets.length} critical assets failed to load`);
  } else {
    console.log('✅ All critical assets verified');
  }
};

// 7. Error Context Tracker
export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Array<{
    timestamp: number;
    error: Error;
    context: string;
    userAgent: string;
    url: string;
  }> = [];

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  track(error: Error, context = 'unknown'): void {
    this.errors.push({
      timestamp: Date.now(),
      error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }

    console.error(`[ErrorTracker:${context}]`, error);
  }

  getRecentErrors(minutes = 5): typeof this.errors {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.errors.filter(e => e.timestamp > cutoff);
  }

  clear(): void {
    this.errors = [];
  }
}

// 8. Global Error Handler Setup
export const setupGlobalErrorHandling = (): void => {
  const tracker = ErrorTracker.getInstance();

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    tracker.track(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      'unhandledrejection'
    );
    
    // Prevent console error
    event.preventDefault();
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    tracker.track(
      new Error(`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`),
      'window.error'
    );
  });

  console.log('🛡️ Global error handling configured');
};
