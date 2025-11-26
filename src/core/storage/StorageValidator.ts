/**
 * 🛡️ STORAGE VALIDATOR - FASE 1.2
 * Validação de dados do storage com type safety
 */

import { StorageItem, StorageMetadata } from './types';

export class StorageValidator {
  /**
   * Valida se item do storage está bem formado
   */
  static isValidStorageItem(value: unknown): value is StorageItem {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const item = value as any;

    // Verificar estrutura básica
    if (!('data' in item) || !('metadata' in item)) {
      return false;
    }

    // Verificar metadata
    if (!this.isValidMetadata(item.metadata)) {
      return false;
    }

    return true;
  }

  /**
   * Valida metadata do item
   */
  static isValidMetadata(metadata: unknown): metadata is StorageMetadata {
    if (!metadata || typeof metadata !== 'object') {
      return false;
    }

    const meta = metadata as any;

    // Campos obrigatórios
    if (typeof meta.version !== 'number' || typeof meta.createdAt !== 'number') {
      return false;
    }

    // Campos opcionais
    if (meta.expiresAt !== undefined && typeof meta.expiresAt !== 'number') {
      return false;
    }

    if (meta.compressed !== undefined && typeof meta.compressed !== 'boolean') {
      return false;
    }

    return true;
  }

  /**
   * Verifica se item está expirado
   */
  static isExpired(item: StorageItem): boolean {
    if (!item.metadata.expiresAt) {
      return false;
    }

    return Date.now() > item.metadata.expiresAt;
  }

  /**
   * Verifica versão do item
   */
  static isVersionCompatible(item: StorageItem, expectedVersion: number): boolean {
    return item.metadata.version === expectedVersion;
  }

  /**
   * Valida tamanho do item (em bytes)
   */
  static validateSize(data: string, maxSize: number): boolean {
    const bytes = new Blob([data]).size;
    return bytes <= maxSize;
  }

  /**
   * Sanitiza key para evitar caracteres inválidos
   */
  static sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_.-]/g, '_');
  }

  /**
   * Valida que o dado pode ser serializado
   */
  static isSerializable(data: any): boolean {
    try {
      JSON.stringify(data);
      return true;
    } catch {
      return false;
    }
  }
}
