import { formatInTimeZone } from 'date-fns-tz';

export function formatMoney(n?: number | null): string {
  if (n == null || isNaN(n)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n);
}

export function formatDate(d?: string | Date | null, withTime: boolean = false): string {
  if (!d) return '-';
  
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '-';
  
  const timeZone = 'America/Sao_Paulo';
  
  if (withTime) {
    return formatInTimeZone(date, timeZone, 'dd/MM/yyyy HH:mm');
  }
  
  return formatInTimeZone(date, timeZone, 'dd/MM/yyyy');
}

export function formatTimestamp(d?: string | Date | null): string {
  if (!d) return '-';
  
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '-';
  
  const timeZone = 'America/Sao_Paulo';
  return formatInTimeZone(date, timeZone, 'dd/MM/yyyy HH:mm:ss');
}

export function formatTimeOnly(d?: string | Date | null): string {
  if (!d) return '-';
  
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '-';
  
  const timeZone = 'America/Sao_Paulo';
  return formatInTimeZone(date, timeZone, 'HH:mm:ss');
}

export function maskCpfCnpj(v?: string | null): string {
  if (!v) return '-';
  
  // Normalizar: remover espaços, pontos, traços, barras e outros caracteres especiais
  const cleanValue = v.toString().trim().replace(/\D/g, '');
  
  // Verificar se tem dados suficientes
  if (cleanValue.length < 11) return v; // Retorna original se muito curto
  
  if (cleanValue.length === 11) {
    // CPF: 000.000.000-00
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleanValue.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  // Se tem mais de 14 dígitos, pegar só os primeiros 14 (assumindo CNPJ)
  if (cleanValue.length > 14) {
    const cnpjDigits = cleanValue.substring(0, 14);
    return cnpjDigits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return v; // Retorna original se não conseguir formatar
}