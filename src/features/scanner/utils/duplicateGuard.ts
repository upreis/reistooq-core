// =============================================================================
// DUPLICATE GUARD - Anti-duplicação com TTL
// =============================================================================

interface ScanRecord {
  code: string;
  timestamp: number;
  count: number;
}

class DuplicateGuard {
  private scans: Map<string, ScanRecord> = new Map();
  private readonly TTL_MS = 3000; // 3 seconds

  /**
   * Verifica se um código já foi escaneado recentemente
   */
  isDuplicate(code: string): boolean {
    const now = Date.now();
    const existing = this.scans.get(code);

    if (!existing) {
      // Primeiro scan deste código
      this.scans.set(code, {
        code,
        timestamp: now,
        count: 1
      });
      return false;
    }

    // Verifica se está dentro do TTL
    if (now - existing.timestamp < this.TTL_MS) {
      existing.count++;
      console.log(`🔄 [DuplicateGuard] Duplicate scan ignored: ${code} (count: ${existing.count})`);
      return true;
    }

    // TTL expirado, permite novo scan
    this.scans.set(code, {
      code,
      timestamp: now,
      count: 1
    });
    return false;
  }

  /**
   * Força a limpeza de um código específico
   */
  clearCode(code: string): void {
    this.scans.delete(code);
  }

  /**
   * Limpa códigos expirados
   */
  cleanup(): void {
    const now = Date.now();
    for (const [code, record] of this.scans.entries()) {
      if (now - record.timestamp > this.TTL_MS) {
        this.scans.delete(code);
      }
    }
  }

  /**
   * Limpa todos os registros
   */
  clear(): void {
    this.scans.clear();
  }

  /**
   * Estatísticas do guard
   */
  getStats() {
    return {
      activeScans: this.scans.size,
      scans: Array.from(this.scans.values())
    };
  }
}

export const duplicateGuard = new DuplicateGuard();

// Auto-cleanup a cada 5 segundos
setInterval(() => {
  duplicateGuard.cleanup();
}, 5000);