import { describe, it, expect } from 'vitest';
import { get, show } from '@/services/orders';

// Mock data based on ML orders/search structure
const mockRawOrder = {
  id: 123456789,
  status: 'paid',
  status_detail: 'accredited',
  pack_id: 'PACK123',
  pickup_id: 'PICKUP456',
  manufacturing_ending_date: '2024-01-15T10:00:00.000Z',
  comment: 'Test comment from buyer',
  tags: ['test_tag', 'priority'],
  date_created: '2024-01-10T10:00:00.000Z',
  date_closed: '2024-01-12T15:30:00.000Z',
  last_updated: '2024-01-12T16:00:00.000Z',
  total_amount: 150.50,
  paid_amount: 150.50,
  currency_id: 'BRL',
  buyer: {
    id: 987654321,
    nickname: 'BUYER_TEST'
  },
  seller: {
    id: 123456789
  },
  shipping: {
    id: 555666777
  },
  order_items: [
    {
      item: {
        id: 'MLB123456',
        title: 'Test Product',
        seller_sku: 'SKU-001',
        seller_custom_field: 'CUSTOM-001',
        variation_id: 'VAR-001'
      },
      quantity: 2,
      unit_price: 75.25,
      full_unit_price: 80.00
    }
  ],
  payments: [
    {
      shipping_cost: 15.00
    }
  ],
  coupon: {
    amount: 5.00
  }
};

const mockUnifiedOrder = {
  id: '123456789',
  numero: '123456789',
  nome_cliente: 'João Silva',
  cpf_cnpj: '12345678901',
  data_pedido: '2024-01-10T10:00:00.000Z',
  data_prevista: '2024-01-12T15:30:00.000Z',
  situacao: 'paid',
  valor_total: 150.50,
  valor_frete: 15.00,
  valor_desconto: 5.00,
  numero_ecommerce: '123456789',
  numero_venda: '123456789',
  empresa: 'mercadolivre',
  cidade: 'São Paulo',
  uf: 'SP',
  codigo_rastreamento: 'BR123456789SP',
  url_rastreamento: 'https://rastreamento.correios.com.br/BR123456789SP',
  obs: 'SKU-001, CUSTOM-002',
  obs_interna: 'Internal note',
  integration_account_id: '5740f717-1771-4298-b8c9-464ffb8d8dce',
  created_at: '2024-01-10T10:00:00.000Z',
  updated_at: '2024-01-12T16:00:00.000Z'
};

const mockRow = {
  raw: mockRawOrder,
  unified: mockUnifiedOrder
};

describe('Data Accessors', () => {
  describe('get function', () => {
    it('should access nested properties correctly', () => {
      expect(get(mockRawOrder, 'buyer.id')).toBe(987654321);
      expect(get(mockRawOrder, 'seller.id')).toBe(123456789);
      expect(get(mockRawOrder, 'shipping.id')).toBe(555666777);
      expect(get(mockRawOrder, 'order_items.0.item.seller_sku')).toBe('SKU-001');
    });

    it('should return undefined for missing properties', () => {
      expect(get(mockRawOrder, 'nonexistent')).toBeUndefined();
      expect(get(mockRawOrder, 'buyer.nonexistent')).toBeUndefined();
    });

    it('should handle null/undefined objects', () => {
      expect(get(null, 'test')).toBeUndefined();
      expect(get(undefined, 'test')).toBeUndefined();
    });
  });

  describe('show function', () => {
    it('should return value for truthy values', () => {
      expect(show('test')).toBe('test');
      expect(show(123)).toBe(123);
      expect(show(0)).toBe(0); // Important: should preserve 0
      expect(show(false)).toBe(false); // Important: should preserve false
    });

    it('should return "—" for null/undefined', () => {
      expect(show(null)).toBe('—');
      expect(show(undefined)).toBe('—');
    });
  });

  describe('Raw ML field accessors', () => {
    it('should access pack_id correctly', () => {
      expect(show(get(mockRow.raw, 'pack_id'))).toBe('PACK123');
    });

    it('should access pickup_id correctly', () => {
      expect(show(get(mockRow.raw, 'pickup_id'))).toBe('PICKUP456');
    });

    it('should access status fields correctly', () => {
      expect(show(get(mockRow.raw, 'status'))).toBe('paid');
      expect(show(get(mockRow.raw, 'status_detail'))).toBe('accredited');
    });

    it('should access buyer/seller/shipping IDs correctly', () => {
      expect(show(get(mockRow.raw, 'buyer.id'))).toBe(987654321);
      expect(show(get(mockRow.raw, 'seller.id'))).toBe(123456789);
      expect(show(get(mockRow.raw, 'shipping.id'))).toBe(555666777);
    });

    it('should handle tags array correctly', () => {
      const tags = get(mockRow.raw, 'tags');
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.join(', ')).toBe('test_tag, priority');
    });

    it('should extract SKUs from order items', () => {
      const items = get(mockRow.raw, 'order_items');
      expect(Array.isArray(items)).toBe(true);
      if (items && items.length > 0) {
        const skus = items.map((item: any) => 
          get(item, 'item.seller_sku') ?? get(item, 'item.seller_custom_field') ?? '—'
        );
        expect(skus).toEqual(['SKU-001']);
      }
    });
  });

  describe('Unified field accessors', () => {
    it('should access unified fields correctly', () => {
      expect(show(get(mockRow.unified, 'nome_cliente'))).toBe('João Silva');
      expect(show(get(mockRow.unified, 'cpf_cnpj'))).toBe('12345678901');
      expect(show(get(mockRow.unified, 'valor_frete'))).toBe(15.00);
      expect(show(get(mockRow.unified, 'codigo_rastreamento'))).toBe('BR123456789SP');
    });

    it('should handle fallbacks to raw data', () => {
      const rowWithoutUnified = { raw: mockRawOrder, unified: null };
      expect(show(get(rowWithoutUnified.unified, 'nome_cliente') ?? get(rowWithoutUnified.raw, 'buyer.nickname'))).toBe('BUYER_TEST');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty order items', () => {
      const emptyItemsOrder = { ...mockRawOrder, order_items: [] };
      const items = get(emptyItemsOrder, 'order_items');
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(0);
    });

    it('should handle missing nested objects', () => {
      const incompleteOrder = { id: 123, status: 'paid' };
      expect(show(get(incompleteOrder, 'buyer.id'))).toBe('—');
      expect(show(get(incompleteOrder, 'shipping.id'))).toBe('—');
    });

    it('should preserve zero values in show function', () => {
      const zeroValues = {
        raw: { ...mockRawOrder, pack_id: 0, total_amount: 0 },
        unified: { ...mockUnifiedOrder, valor_frete: 0 }
      };
      expect(show(get(zeroValues.raw, 'pack_id'))).toBe(0);
      expect(show(get(zeroValues.raw, 'total_amount'))).toBe(0);
      expect(show(get(zeroValues.unified, 'valor_frete'))).toBe(0);
    });
  });
});