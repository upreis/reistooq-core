// F6.1: Testes unitários para funções críticas
import { describe, it, expect, vi } from 'vitest';
import { mapApiStatusToLabel, getStatusBadgeVariant, statusMatchesFilter } from '@/utils/statusMapping';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';

describe('Status Mapping Utils', () => {
  describe('mapApiStatusToLabel', () => {
    it('should map known API statuses to labels', () => {
      expect(mapApiStatusToLabel('paid')).toBe('Pago');
      expect(mapApiStatusToLabel('shipped')).toBe('Enviado');
      expect(mapApiStatusToLabel('delivered')).toBe('Entregue');
      expect(mapApiStatusToLabel('cancelled')).toBe('Cancelado');
      expect(mapApiStatusToLabel('pending')).toBe('Pendente');
    });

    it('should handle unknown statuses gracefully', () => {
      expect(mapApiStatusToLabel('unknown_status')).toBe('Unknown_status');
      expect(mapApiStatusToLabel('')).toBe('Não informado');
      expect(mapApiStatusToLabel(null as any)).toBe('Não informado');
    });

    it('should handle status with keywords', () => {
      expect(mapApiStatusToLabel('order_delivered')).toBe('Entregue');
      expect(mapApiStatusToLabel('payment_cancelled')).toBe('Cancelado');
    });
  });

  describe('getStatusBadgeVariant', () => {
    it('should return correct variants for statuses', () => {
      expect(getStatusBadgeVariant('paid')).toBe('default');
      expect(getStatusBadgeVariant('delivered')).toBe('default');
      expect(getStatusBadgeVariant('cancelled')).toBe('destructive');
      expect(getStatusBadgeVariant('shipped')).toBe('secondary');
      expect(getStatusBadgeVariant('unknown')).toBe('outline');
    });
  });

  describe('statusMatchesFilter', () => {
    it('should match statuses correctly', () => {
      expect(statusMatchesFilter('paid', ['paid', 'shipped'])).toBe(true);
      expect(statusMatchesFilter('pending', ['paid', 'shipped'])).toBe(false);
      expect(statusMatchesFilter('any_status', [])).toBe(true);
    });
  });
});

describe('Format Utils', () => {
  describe('formatMoney', () => {
    it('should format money correctly', () => {
      expect(formatMoney(1000)).toBe('R$ 1.000,00');
      expect(formatMoney(10.5)).toBe('R$ 10,50');
      expect(formatMoney(0)).toBe('R$ 0,00');
    });

    it('should handle invalid inputs', () => {
      expect(formatMoney(null as any)).toBe('R$ 0,00');
      expect(formatMoney(undefined as any)).toBe('R$ 0,00');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = '2024-01-15T10:30:00Z';
      const formatted = formatDate(date);
      expect(formatted).toMatch(/15\/01\/2024/);
    });

    it('should handle invalid dates', () => {
      expect(formatDate('')).toBe('Data inválida');
      expect(formatDate(null as any)).toBe('Data inválida');
    });
  });

  describe('maskCpfCnpj', () => {
    it('should mask CPF correctly', () => {
      expect(maskCpfCnpj('12345678901')).toBe('***.***.***-01');
    });

    it('should mask CNPJ correctly', () => {
      expect(maskCpfCnpj('12345678000195')).toBe('**.***.***/****-95');
    });

    it('should handle invalid inputs', () => {
      expect(maskCpfCnpj('')).toBe('****');
      expect(maskCpfCnpj('123')).toBe('****');
    });
  });
});