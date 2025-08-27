// 🛡️ UTILITÁRIO PARA VERIFICAÇÃO DE PROTEÇÃO
import { PROTECTED_PAGES, PROTECTION_MARKER, isFileProtected } from '@/config/protection-config';

export class ProtectionChecker {
  static checkFileProtection(filePath: string, content: string): {
    isProtected: boolean;
    hasMarker: boolean;
    warning?: string;
  } {
    const isProtected = isFileProtected(filePath);
    const hasMarker = content.includes(PROTECTION_MARKER);
    
    if (isProtected && !hasMarker) {
      return {
        isProtected: true,
        hasMarker: false,
        warning: `⚠️ ARQUIVO PROTEGIDO SEM MARCADOR: ${filePath}`
      };
    }
    
    return {
      isProtected,
      hasMarker,
      ...(isProtected && hasMarker ? {} : { warning: undefined })
    };
  }
  
  static validateModification(
    filePath: string, 
    modificationType: string,
    userAuthorization: boolean = false
  ): {
    allowed: boolean;
    reason?: string;
  } {
    if (!isFileProtected(filePath)) {
      return { allowed: true };
    }
    
    if (userAuthorization) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: `🛡️ ARQUIVO PROTEGIDO: ${filePath} - Requer autorização explícita do usuário`
    };
  }
  
  static getProtectedFilesList(): string[] {
    const allFiles: string[] = [];
    
    Object.values(PROTECTED_PAGES).forEach(page => {
      allFiles.push(...page.files);
    });
    
    return allFiles;
  }
  
  static generateProtectionReport(): {
    totalProtectedFiles: number;
    protectedPages: number;
    summary: string;
  } {
    const allFiles = this.getProtectedFilesList();
    const pages = Object.keys(PROTECTED_PAGES).length;
    
    return {
      totalProtectedFiles: allFiles.length,
      protectedPages: pages,
      summary: `🛡️ Sistema de Proteção: ${pages} páginas e ${allFiles.length} arquivos protegidos`
    };
  }
}