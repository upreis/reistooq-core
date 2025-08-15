// =============================================================================
// SCANNER HISTORY HOOK - Histórico e analytics
// =============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { ScanHistory, ScanResult, ScannerAnalytics } from '../types/scanner.types';

export const useScannerHistory = () => {
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [analytics, setAnalytics] = useState<ScannerAnalytics>({
    daily_scans: 0,
    success_rate: 0,
    popular_products: [],
    performance_metrics: {
      average_scan_time: 0,
      cache_hit_rate: 0,
      error_rate: 0
    },
    usage_patterns: {
      peak_hours: [],
      device_types: {},
      location_data: []
    }
  });

  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const startTimeRef = useRef<Date>(new Date());

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('scanner-history');
      if (stored) {
        const parsed = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(parsed);
      }
    } catch (error) {
      console.warn('⚠️ [Scanner History] Failed to load from storage:', error);
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('scanner-history', JSON.stringify(history));
    } catch (error) {
      console.warn('⚠️ [Scanner History] Failed to save to storage:', error);
    }
  }, [history]);

  // Update analytics when history changes
  useEffect(() => {
    updateAnalytics();
  }, [history]);

  // Add scan to history
  const addScan = useCallback((result: ScanResult): void => {
    const historyItem: ScanHistory = {
      id: crypto.randomUUID(),
      codigo: result.code,
      produto: result.product,
      found: result.found,
      timestamp: result.timestamp,
      session_id: sessionIdRef.current,
      user_id: 'current-user', // This would come from auth context
      location: undefined // Would be populated if geolocation is enabled
    };

    setHistory(prev => [historyItem, ...prev].slice(0, 1000)); // Keep last 1000 scans
  }, []);

  // Update analytics
  const updateAnalytics = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Daily scans
    const todayScans = history.filter(item => 
      item.timestamp >= today
    ).length;

    // Success rate
    const totalScans = history.length;
    const successfulScans = history.filter(item => item.found).length;
    const successRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 0;

    // Popular products
    const productCounts = new Map<string, number>();
    const productDetails = new Map<string, any>();
    
    history.forEach(item => {
      if (item.produto) {
        const id = item.produto.id;
        productCounts.set(id, (productCounts.get(id) || 0) + 1);
        productDetails.set(id, item.produto);
      }
    });

    const popularProducts = Array.from(productCounts.entries())
      .map(([productId, count]) => ({
        product_id: productId,
        scan_count: count,
        last_scanned: history.find(h => h.produto?.id === productId)?.timestamp || new Date()
      }))
      .sort((a, b) => b.scan_count - a.scan_count)
      .slice(0, 10);

    // Performance metrics
    const sessionScans = history.filter(item => 
      item.session_id === sessionIdRef.current
    );
    
    const sessionDuration = (now.getTime() - startTimeRef.current.getTime()) / 1000;
    const averageScanTime = sessionScans.length > 0 ? sessionDuration / sessionScans.length : 0;

    // Usage patterns - peak hours
    const hourCounts = new Array(24).fill(0);
    history.forEach(item => {
      const hour = item.timestamp.getHours();
      hourCounts[hour]++;
    });
    
    const maxCount = Math.max(...hourCounts);
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count === maxCount)
      .map(({ hour }) => hour);

    setAnalytics({
      daily_scans: todayScans,
      success_rate: Math.round(successRate * 100) / 100,
      popular_products: popularProducts,
      performance_metrics: {
        average_scan_time: Math.round(averageScanTime * 100) / 100,
        cache_hit_rate: 0, // This would be calculated from cache service
        error_rate: Math.round((100 - successRate) * 100) / 100
      },
      usage_patterns: {
        peak_hours: peakHours,
        device_types: {
          mobile: history.length // Simplified - would detect actual device types
        },
        location_data: [] // Would be populated if geolocation is enabled
      }
    });
  }, [history]);

  // Get recent scans
  const getRecentScans = useCallback((limit: number = 10): ScanHistory[] => {
    return history.slice(0, limit);
  }, [history]);

  // Get scans by date range
  const getScansByDateRange = useCallback((
    startDate: Date, 
    endDate: Date
  ): ScanHistory[] => {
    return history.filter(item => 
      item.timestamp >= startDate && item.timestamp <= endDate
    );
  }, [history]);

  // Get successful scans only
  const getSuccessfulScans = useCallback((): ScanHistory[] => {
    return history.filter(item => item.found);
  }, [history]);

  // Search history
  const searchHistory = useCallback((query: string): ScanHistory[] => {
    const lowercaseQuery = query.toLowerCase();
    
    return history.filter(item => 
      item.codigo.toLowerCase().includes(lowercaseQuery) ||
      item.produto?.nome.toLowerCase().includes(lowercaseQuery) ||
      item.produto?.sku_interno.toLowerCase().includes(lowercaseQuery)
    );
  }, [history]);

  // Clear history
  const clearHistory = useCallback((): void => {
    setHistory([]);
    localStorage.removeItem('scanner-history');
  }, []);

  // Export history
  const exportHistory = useCallback(async (): Promise<Blob> => {
    const exportData = {
      history,
      analytics,
      exportedAt: new Date().toISOString(),
      sessionId: sessionIdRef.current
    };
    
    return new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
  }, [history, analytics]);

  // Get session stats
  const getSessionStats = useCallback(() => {
    const sessionScans = history.filter(item => 
      item.session_id === sessionIdRef.current
    );
    
    const sessionDuration = (new Date().getTime() - startTimeRef.current.getTime()) / 1000;
    const successfulScans = sessionScans.filter(item => item.found).length;
    const uniqueProducts = new Set(
      sessionScans
        .filter(item => item.produto)
        .map(item => item.produto!.id)
    ).size;

    return {
      scans_attempted: sessionScans.length,
      scans_successful: successfulScans,
      products_found: successfulScans,
      unique_products: uniqueProducts,
      session_duration: Math.round(sessionDuration),
      average_scan_time: sessionScans.length > 0 ? sessionDuration / sessionScans.length : 0,
      actions_taken: 0 // Would be tracked separately
    };
  }, [history]);

  return {
    // State
    history,
    analytics,
    
    // Actions
    addScan,
    getHistory: () => history,
    getAnalytics: () => analytics,
    getRecentScans,
    getScansByDateRange,
    getSuccessfulScans,
    searchHistory,
    clearHistory,
    exportHistory,
    getSessionStats
  };
};