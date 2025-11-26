/**
 * 🗄️ UNIFIED STORAGE - FASE 1.2
 * Sistema centralizado de storage com validação, TTL, versionamento e migrações
 */

import { ErrorHandler } from '../errors';
import { StorageValidator } from './StorageValidator';
import {
  StorageType,
  StorageOptions,
  StorageItem,
  StorageMetadata,
  StorageStats,
  StorageMigration,
  StorageConfig,
  StorageKey
} from './types';

export class UnifiedStorage {
  private config: Required<StorageConfig>;
  private migrations: Map<string, StorageMigration[]> = new Map();

  constructor(config?: StorageConfig) {
    this.config = {
      defaultTTL: config?.defaultTTL || 0, // 0 = sem expiração
      defaultVersion: config?.defaultVersion || 1,
      defaultNamespace: config?.defaultNamespace || 'app',
      enableCompression: config?.enableCompression || false,
      enableValidation: config?.enableValidation || true,
      maxSize: config?.maxSize || 5 * 1024 * 1024 // 5MB
    };
  }

  /**
   * Salva item no storage com metadata
   */
  set<T>(
    key: StorageKey,
    data: T,
    options?: StorageOptions
  ): { success: boolean; error?: string } {
    try {
      const opts = this.mergeOptions(options);
      const fullKey = this.getFullKey(key, opts.namespace);

      // Validar dados serializáveis
      if (this.config.enableValidation && !StorageValidator.isSerializable(data)) {
        throw new Error('Dados não serializáveis');
      }

      // Criar metadata
      const metadata: StorageMetadata = {
        version: opts.version || this.config.defaultVersion,
        createdAt: Date.now(),
        expiresAt: opts.ttl ? Date.now() + opts.ttl : undefined,
        compressed: opts.compress
      };

      // Criar item
      const item: StorageItem<T> = {
        data,
        metadata
      };

      // Serializar
      let serialized = JSON.stringify(item);

      // Comprimir se necessário
      if (opts.compress && this.config.enableCompression) {
        serialized = this.compress(serialized);
        item.metadata.compressed = true;
      }

      // Validar tamanho
      if (!StorageValidator.validateSize(serialized, this.config.maxSize)) {
        throw new Error(`Item excede tamanho máximo de ${this.config.maxSize} bytes`);
      }

      // Salvar
      const storage = this.getStorage(opts.type);
      storage.setItem(fullKey, serialized);

      return { success: true };
    } catch (error) {
      const errorDetails = ErrorHandler.capture(error, {
        component: 'UnifiedStorage',
        action: 'set',
        metadata: { key }
      });

      return { success: false, error: errorDetails.userMessage };
    }
  }

  /**
   * Recupera item do storage com validação
   */
  get<T>(
    key: StorageKey,
    options?: StorageOptions
  ): { data: T | null; error?: string; expired?: boolean } {
    try {
      const opts = this.mergeOptions(options);
      const fullKey = this.getFullKey(key, opts.namespace);
      const storage = this.getStorage(opts.type);

      const serialized = storage.getItem(fullKey);
      if (!serialized) {
        return { data: null };
      }

      // Descomprimir se necessário
      let parsed: StorageItem<T>;
      try {
        const decompressed = this.decompress(serialized);
        parsed = JSON.parse(decompressed);
      } catch {
        // Tentar parse direto se descompressão falhar
        parsed = JSON.parse(serialized);
      }

      // Validar estrutura
      if (this.config.enableValidation && !StorageValidator.isValidStorageItem(parsed)) {
        throw new Error('Item corrompido no storage');
      }

      // Verificar expiração
      if (StorageValidator.isExpired(parsed)) {
        this.remove(key, options);
        return { data: null, expired: true };
      }

      // Verificar versão e migrar se necessário
      const expectedVersion = opts.version || this.config.defaultVersion;
      if (parsed.metadata.version !== expectedVersion) {
        const migrated = this.migrateData(key, parsed, expectedVersion);
        if (migrated) {
          return { data: migrated as T };
        }
      }

      return { data: parsed.data };
    } catch (error) {
      const errorDetails = ErrorHandler.capture(error, {
        component: 'UnifiedStorage',
        action: 'get',
        metadata: { key }
      });

      return { data: null, error: errorDetails.userMessage };
    }
  }

  /**
   * Remove item do storage
   */
  remove(key: StorageKey, options?: StorageOptions): boolean {
    try {
      const opts = this.mergeOptions(options);
      const fullKey = this.getFullKey(key, opts.namespace);
      const storage = this.getStorage(opts.type);

      storage.removeItem(fullKey);
      return true;
    } catch (error) {
      ErrorHandler.capture(error, {
        component: 'UnifiedStorage',
        action: 'remove',
        metadata: { key }
      });
      return false;
    }
  }

  /**
   * Verifica se key existe
   */
  has(key: StorageKey, options?: StorageOptions): boolean {
    const opts = this.mergeOptions(options);
    const fullKey = this.getFullKey(key, opts.namespace);
    const storage = this.getStorage(opts.type);

    return storage.getItem(fullKey) !== null;
  }

  /**
   * Limpa storage de um namespace ou todos
   */
  clear(namespace?: string, type?: StorageType): number {
    try {
      const storage = this.getStorage(type);
      const ns = namespace || this.config.defaultNamespace;
      const prefix = `${ns}:`;

      let clearedCount = 0;

      // Coletar keys para limpar
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      // Remover keys
      keysToRemove.forEach(key => {
        storage.removeItem(key);
        clearedCount++;
      });

      return clearedCount;
    } catch (error) {
      ErrorHandler.capture(error, {
        component: 'UnifiedStorage',
        action: 'clear',
        metadata: { namespace }
      });
      return 0;
    }
  }

  /**
   * Remove itens expirados
   */
  cleanExpired(namespace?: string, type?: StorageType): number {
    try {
      const storage = this.getStorage(type);
      const ns = namespace || this.config.defaultNamespace;
      const prefix = `${ns}:`;

      let cleanedCount = 0;

      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key || !key.startsWith(prefix)) continue;

        try {
          const serialized = storage.getItem(key);
          if (!serialized) continue;

          const item = JSON.parse(serialized) as StorageItem;
          if (StorageValidator.isExpired(item)) {
            keysToRemove.push(key);
          }
        } catch {
          // Item corrompido, remover também
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        storage.removeItem(key);
        cleanedCount++;
      });

      return cleanedCount;
    } catch (error) {
      ErrorHandler.capture(error, {
        component: 'UnifiedStorage',
        action: 'cleanExpired'
      });
      return 0;
    }
  }

  /**
   * Estatísticas do storage
   */
  getStats(namespace?: string, type?: StorageType): StorageStats {
    const storage = this.getStorage(type);
    const ns = namespace || this.config.defaultNamespace;
    const prefix = `${ns}:`;

    let totalKeys = 0;
    let totalSize = 0;
    let expiredKeys = 0;
    let validKeys = 0;

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key || !key.startsWith(prefix)) continue;

      totalKeys++;
      const value = storage.getItem(key);
      if (value) {
        totalSize += new Blob([value]).size;

        try {
          const item = JSON.parse(value) as StorageItem;
          if (StorageValidator.isExpired(item)) {
            expiredKeys++;
          } else {
            validKeys++;
          }
        } catch {
          // Item corrompido
        }
      }
    }

    return { totalKeys, totalSize, expiredKeys, validKeys };
  }

  /**
   * Registra migração de versão
   */
  registerMigration(key: StorageKey, migration: StorageMigration): void {
    const migrations = this.migrations.get(key) || [];
    migrations.push(migration);
    migrations.sort((a, b) => a.fromVersion - b.fromVersion);
    this.migrations.set(key, migrations);
  }

  /**
   * Migra dados entre versões
   */
  private migrateData<T>(
    key: StorageKey,
    item: StorageItem,
    targetVersion: number
  ): T | null {
    const migrations = this.migrations.get(key);
    if (!migrations || migrations.length === 0) {
      return null;
    }

    let currentData = item.data;
    let currentVersion = item.metadata.version;

    // Aplicar migrações sequencialmente
    for (const migration of migrations) {
      if (migration.fromVersion === currentVersion && migration.toVersion <= targetVersion) {
        currentData = migration.migrate(currentData);
        currentVersion = migration.toVersion;
      }
    }

    // Salvar dados migrados
    if (currentVersion === targetVersion) {
      this.set(key, currentData, { version: targetVersion });
      return currentData;
    }

    return null;
  }

  /**
   * Helpers privados
   */
  private getStorage(type?: StorageType): Storage {
    const storageType = type || StorageType.LOCAL;
    return storageType === StorageType.LOCAL ? localStorage : sessionStorage;
  }

  private getFullKey(key: StorageKey, namespace?: string): string {
    const ns = namespace || this.config.defaultNamespace;
    const sanitized = StorageValidator.sanitizeKey(key);
    return `${ns}:${sanitized}`;
  }

  private mergeOptions(options?: StorageOptions): Required<StorageOptions> {
    return {
      type: options?.type || StorageType.LOCAL,
      ttl: options?.ttl || this.config.defaultTTL,
      version: options?.version || this.config.defaultVersion,
      compress: options?.compress || this.config.enableCompression,
      namespace: options?.namespace || this.config.defaultNamespace
    };
  }

  private compress(data: string): string {
    // Implementação simples - pode ser melhorada com LZ-string
    return btoa(data);
  }

  private decompress(data: string): string {
    try {
      return atob(data);
    } catch {
      return data; // Não estava comprimido
    }
  }
}

// Instância singleton
export const storage = new UnifiedStorage();
