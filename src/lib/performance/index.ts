/**
 * 📊 PERFORMANCE MODULE
 * Centralized exports for performance monitoring utilities
 */

import { performanceMonitor } from './performanceMonitor';
import { renderTracker } from './renderTracker';
import { memoryMonitor } from './memoryMonitor';

export { performanceMonitor, PerformanceMonitor } from './performanceMonitor';
export { renderTracker, useRenderTracker, withRenderTracking } from './renderTracker';
export { memoryMonitor, MemoryMonitor } from './memoryMonitor';

/**
 * Função helper para gerar relatório completo de performance
 */
export function getFullPerformanceReport(): string {
  let report = '\n';
  report += '═'.repeat(60) + '\n';
  report += '🚀 FULL PERFORMANCE REPORT\n';
  report += '═'.repeat(60) + '\n\n';

  report += performanceMonitor.getReport();
  report += '\n';
  report += renderTracker.getReport();
  report += '\n';
  report += memoryMonitor.getReport();
  report += '\n';
  report += '═'.repeat(60) + '\n';

  return report;
}

/**
 * Função helper para limpar todos os monitors
 */
export function clearAllMonitors(): void {
  performanceMonitor.clear();
  renderTracker.clear();
  memoryMonitor.clear();
  console.log('[Performance] Todos os monitors foram limpos');
}

/**
 * Função helper para habilitar/desabilitar todos os monitors
 */
export function setAllMonitorsEnabled(enabled: boolean): void {
  performanceMonitor.setEnabled(enabled);
  renderTracker.setEnabled(enabled);
  memoryMonitor.setEnabled(enabled);
  console.log(`[Performance] Monitors ${enabled ? 'habilitados' : 'desabilitados'}`);
}
