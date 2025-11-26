/**
 * 🗄️ STORAGE TYPES - FASE 1.2
 * Tipos TypeScript para sistema de storage unificado
 */

export enum StorageType {
  LOCAL = 'localStorage',
  SESSION = 'sessionStorage'
}

export interface StorageOptions {
  type?: StorageType;
  ttl?: number; // Time to live em milissegundos
  version?: number; // Versão do schema dos dados
  compress?: boolean; // Comprimir dados (para grandes objetos)
  namespace?: string; // Namespace para evitar colisões
}

export interface StorageMetadata {
  version: number;
  createdAt: number;
  expiresAt?: number;
  compressed?: boolean;
}

export interface StorageItem<T = any> {
  data: T;
  metadata: StorageMetadata;
}

export interface StorageStats {
  totalKeys: number;
  totalSize: number; // em bytes
  expiredKeys: number;
  validKeys: number;
}

export interface StorageMigration {
  fromVersion: number;
  toVersion: number;
  migrate: (oldData: any) => any;
}

export type StorageKey = string;

export interface StorageConfig {
  defaultTTL?: number;
  defaultVersion?: number;
  defaultNamespace?: string;
  enableCompression?: boolean;
  enableValidation?: boolean;
  maxSize?: number; // Tamanho máximo em bytes (5MB padrão)
}
