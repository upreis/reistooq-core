export class SkuUtils {
  /**
   * Extrai o SKU pai de um SKU filho
   * Ex: "CMD-29-VERD-1" -> "CMD-29"
   */
  static extractParentSku(sku: string): string {
    const parts = sku.split('-');
    if (parts.length >= 3) {
      return parts.slice(0, 2).join('-');
    }
    return sku;
  }

  /**
   * Verifica se um SKU é um SKU filho (tem mais de 2 partes)
   */
  static isChildSku(sku: string): boolean {
    return sku.split('-').length > 2;
  }

  /**
   * Gera sugestão de SKU filho baseado no pai e variação
   */
  static generateChildSku(parentSku: string, variation: string): string {
    const cleanVariation = variation
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8);
    
    return `${parentSku}-${cleanVariation}`;
  }

  /**
   * Valida formato de SKU
   */
  static validateSku(sku: string): { valid: boolean; message?: string } {
    if (!sku || sku.trim().length === 0) {
      return { valid: false, message: "SKU não pode estar vazio" };
    }

    if (sku.length < 3) {
      return { valid: false, message: "SKU deve ter pelo menos 3 caracteres" };
    }

    if (!/^[A-Z0-9-]+$/.test(sku)) {
      return { valid: false, message: "SKU deve conter apenas letras maiúsculas, números e hífens" };
    }

    return { valid: true };
  }

  /**
   * Extrai informações de variação do SKU
   */
  static parseSkuVariation(sku: string): {
    parentSku: string;
    variations: string[];
    isChild: boolean;
  } {
    const parts = sku.split('-');
    
    if (parts.length <= 2) {
      return {
        parentSku: sku,
        variations: [],
        isChild: false
      };
    }

    return {
      parentSku: parts.slice(0, 2).join('-'),
      variations: parts.slice(2),
      isChild: true
    };
  }
}
