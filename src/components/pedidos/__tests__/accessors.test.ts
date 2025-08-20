// src/components/pedidos/__tests__/accessors.test.ts
import { describe, it, expect } from 'vitest';
import { get, show } from '@/services/orders';

describe('Order Accessors', () => {
  const mockRow = {
    raw: {
      id: 12345,
      status: 'paid',
      pack_id: 'PACK123',
      pickup_id: 'PICKUP456',
      manufacturing_ending_date: '2024-01-15T10:00:00Z',
      comment: 'Test comment',
      status_detail: 'confirmed',
      tags: ['tag1', 'tag2', 'tag3'],
      buyer: { id: 'BUYER123', nickname: 'Test Buyer' },
      seller: { id: 'SELLER456' },
      shipping: { id: 'SHIPPING789' },
      date_created: '2024-01-10T10:00:00Z',
      date_closed: '2024-01-20T10:00:00Z',
      last_updated: '2024-01-12T10:00:00Z',
      order_items: [
        {
          item: {
            seller_sku: 'SKU001',
            seller_custom_field: 'CUSTOM001'
          }
        },
        {
          item: {
            seller_sku: null,
            seller_custom_field: 'CUSTOM002'
          }
        }
      ],
      payments: [
        { shipping_cost: 15.50 }
      ]
    },
    unified: {
      id: 'unified-12345',
      numero: 'ORDER-001',
      nome_cliente: 'João Silva',
      cpf_cnpj: '123.456.789-00',
      data_pedido: '2024-01-10T10:00:00Z',
      data_prevista: '2024-01-20T10:00:00Z',
      situacao: 'pago',
      valor_total: 99.99,
      valor_frete: 15.50,
      valor_desconto: 5.00,
      numero_ecommerce: 'EC-001',
      numero_venda: 'VE-001',
      empresa: 'mercadolivre',
      cidade: 'São Paulo',
      uf: 'SP',
      codigo_rastreamento: 'TR123456',
      url_rastreamento: 'https://tracking.com/TR123456',
      obs: 'Observação do pedido',
      obs_interna: 'Obs interna',
      integration_account_id: 'acc-123',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-12T10:00:00Z'
    }
  };

  describe('get helper', () => {
    it('should access nested properties correctly', () => {
      expect(get(mockRow.raw, 'buyer.id')).toBe('BUYER123');
      expect(get(mockRow.raw, 'shipping.id')).toBe('SHIPPING789');
      expect(get(mockRow.raw, 'order_items.0.item.seller_sku')).toBe('SKU001');
    });

    it('should return undefined for non-existent paths', () => {
      expect(get(mockRow.raw, 'nonexistent.path')).toBeUndefined();
      expect(get(mockRow.raw, 'buyer.nonexistent')).toBeUndefined();
    });

    it('should handle null/undefined objects gracefully', () => {
      expect(get(null, 'any.path')).toBeUndefined();
      expect(get(undefined, 'any.path')).toBeUndefined();
    });
  });

  describe('show helper', () => {
    it('should return value for truthy values', () => {
      expect(show('test')).toBe('test');
      expect(show(123)).toBe(123);
      expect(show(true)).toBe(true);
      expect(show(0)).toBe(0); // Important: should show 0
      expect(show(false)).toBe(false); // Important: should show false
    });

    it('should return "—" for null/undefined', () => {
      expect(show(null)).toBe('—');
      expect(show(undefined)).toBe('—');
    });

    it('should preserve empty strings', () => {
      expect(show('')).toBe(''); // Empty string is preserved
    });
  });

  describe('RAW field accessors', () => {
    it('should access pack_id correctly', () => {
      expect(get(mockRow.raw, 'pack_id')).toBe('PACK123');
    });

    it('should access pickup_id correctly', () => {
      expect(get(mockRow.raw, 'pickup_id')).toBe('PICKUP456');
    });

    it('should access shipping.id correctly', () => {
      expect(get(mockRow.raw, 'shipping.id')).toBe('SHIPPING789');
    });

    it('should access buyer.id correctly', () => {
      expect(get(mockRow.raw, 'buyer.id')).toBe('BUYER123');
    });

    it('should access seller.id correctly', () => {
      expect(get(mockRow.raw, 'seller.id')).toBe('SELLER456');
    });

    it('should access status correctly', () => {
      expect(get(mockRow.raw, 'status')).toBe('paid');
    });

    it('should access status_detail correctly', () => {
      expect(get(mockRow.raw, 'status_detail')).toBe('confirmed');
    });

    it('should access comment correctly', () => {
      expect(get(mockRow.raw, 'comment')).toBe('Test comment');
    });

    it('should access tags array correctly', () => {
      expect(get(mockRow.raw, 'tags')).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('UNIFIED field accessors', () => {
    it('should access unified fields correctly', () => {
      expect(get(mockRow.unified, 'numero')).toBe('ORDER-001');
      expect(get(mockRow.unified, 'nome_cliente')).toBe('João Silva');
      expect(get(mockRow.unified, 'valor_total')).toBe(99.99);
      expect(get(mockRow.unified, 'situacao')).toBe('pago');
    });
  });

  describe('SKU extraction', () => {
    it('should extract SKUs from order_items', () => {
      const orderItems = get(mockRow.raw, 'order_items');
      expect(Array.isArray(orderItems)).toBe(true);
      
      const skus = orderItems.map((item: any) => 
        get(item, 'item.seller_sku') ?? get(item, 'item.seller_custom_field')
      ).filter(Boolean);
      
      expect(skus).toEqual(['SKU001', 'CUSTOM002']);
    });
  });

  describe('Fallback patterns', () => {
    it('should use unified with raw fallback for numero', () => {
      const numero = get(mockRow.unified, 'numero') ?? String(get(mockRow.raw, 'id'));
      expect(numero).toBe('ORDER-001');
    });

    it('should use raw fallback when unified is null', () => {
      const rowWithoutUnified = { ...mockRow, unified: null };
      const numero = get(rowWithoutUnified.unified, 'numero') ?? String(get(rowWithoutUnified.raw, 'id'));
      expect(numero).toBe('12345');
    });

    it('should use buyer.nickname as nome_cliente fallback', () => {
      const nome = get(mockRow.unified, 'nome_cliente') ?? get(mockRow.raw, 'buyer.nickname');
      expect(nome).toBe('João Silva');
    });
  });

  describe('Error handling', () => {
    it('should not throw errors for missing nested properties', () => {
      expect(() => get(mockRow.raw, 'missing.deeply.nested.property')).not.toThrow();
      expect(() => show(get(mockRow.raw, 'missing.property'))).not.toThrow();
    });

    it('should handle malformed data gracefully', () => {
      const malformedRow = { raw: null, unified: undefined };
      expect(() => get(malformedRow.raw, 'any.path')).not.toThrow();
      expect(() => show(get(malformedRow.unified, 'any.path'))).not.toThrow();
    });
  });
});