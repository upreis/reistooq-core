/**
 * 💾 MEMORY MONITOR
 * Utility to monitor memory usage and detect potential leaks
 */

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private intervalId: number | null = null;
  private enabled: boolean = !import.meta.env.PROD;

  /**
   * Verifica se browser suporta memory API
   */
  private isSupported(): boolean {
    return 'memory' in performance && typeof (performance as any).memory === 'object';
  }

  /**
   * Captura snapshot atual de memória
   */
  takeSnapshot(): MemorySnapshot | null {
    if (!this.enabled || !this.isSupported()) return null;

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };

    this.snapshots.push(snapshot);

    // Limitar a 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Inicia monitoramento contínuo
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (!this.enabled || !this.isSupported()) {
      console.warn('[MemoryMonitor] Memory API não suportada ou monitor desabilitado');
      return;
    }

    if (this.intervalId !== null) {
      console.warn('[MemoryMonitor] Monitoramento já está ativo');
      return;
    }

    this.intervalId = window.setInterval(() => {
      const snapshot = this.takeSnapshot();
      
      if (snapshot) {
        const usedMB = snapshot.usedJSHeapSize / 1024 / 1024;
        const limitMB = snapshot.jsHeapSizeLimit / 1024 / 1024;
        const percentUsed = (snapshot.usedJSHeapSize / snapshot.jsHeapSizeLimit) * 100;

        // Avisar se uso de memória alto
        if (percentUsed > 80) {
          console.warn(
            `[MemoryMonitor] Uso de memória alto: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB (${percentUsed.toFixed(1)}%)`
          );
        }
      }
    }, intervalMs);

    console.log(`[MemoryMonitor] Monitoramento iniciado (intervalo: ${intervalMs}ms)`);
  }

  /**
   * Para monitoramento contínuo
   */
  stopMonitoring(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[MemoryMonitor] Monitoramento parado');
    }
  }

  /**
   * Detecta possível memory leak comparando snapshots
   */
  detectLeak(thresholdMB: number = 10): boolean {
    if (this.snapshots.length < 5) return false;

    const recent = this.snapshots.slice(-5);
    const first = recent[0];
    const last = recent[recent.length - 1];

    const growthMB = (last.usedJSHeapSize - first.usedJSHeapSize) / 1024 / 1024;

    if (growthMB > thresholdMB) {
      console.warn(
        `[MemoryMonitor] Possível memory leak detectado: ` +
        `crescimento de ${growthMB.toFixed(2)}MB nos últimos ${recent.length} snapshots`
      );
      return true;
    }

    return false;
  }

  /**
   * Gera relatório de uso de memória
   */
  getReport(): string {
    if (this.snapshots.length === 0) {
      return '💾 Memory Report: Nenhum snapshot capturado';
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    const firstMB = first.usedJSHeapSize / 1024 / 1024;
    const lastMB = last.usedJSHeapSize / 1024 / 1024;
    const limitMB = last.jsHeapSizeLimit / 1024 / 1024;
    const growthMB = lastMB - firstMB;
    const percentUsed = (last.usedJSHeapSize / last.jsHeapSizeLimit) * 100;

    let report = '💾 Memory Report\n';
    report += '='.repeat(50) + '\n\n';
    report += `Snapshots: ${this.snapshots.length}\n`;
    report += `Inicial: ${firstMB.toFixed(2)}MB\n`;
    report += `Atual: ${lastMB.toFixed(2)}MB\n`;
    report += `Limite: ${limitMB.toFixed(2)}MB\n`;
    report += `Crescimento: ${growthMB.toFixed(2)}MB\n`;
    report += `Uso: ${percentUsed.toFixed(1)}%\n`;

    return report;
  }

  /**
   * Obtém todos os snapshots
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Limpa snapshots
   */
  clear(): void {
    this.snapshots = [];
  }

  /**
   * Habilita/desabilita monitor
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMonitoring();
    }
  }
}

// Exportar instância singleton
export const memoryMonitor = new MemoryMonitor();

export { MemoryMonitor };
