import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listPedidos } from '../pedidos';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

const mockSupabase = supabase as any;

describe('pedidos service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call supabase with correct parameters', async () => {
    const mockData = [
      {
        id: '123',
        numero: 'P001',
        nome_cliente: 'João Silva',
        cpf_cnpj: '12345678901',
        data_pedido: '2024-01-15',
        situacao: 'Pago',
        valor_total: 150.00
      }
    ];

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: mockData,
        count: 1,
        error: null
      })
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    const result = await listPedidos({
      integrationAccountId: 'test-account-id',
      page: 1,
      pageSize: 25
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('pedidos');
    expect(mockQuery.select).toHaveBeenCalledWith(
      expect.stringContaining('id,'),
      { count: 'exact' }
    );
    expect(mockQuery.eq).toHaveBeenCalledWith('integration_account_id', 'test-account-id');
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mockQuery.range).toHaveBeenCalledWith(0, 24);

    expect(result).toEqual({
      data: mockData,
      count: 1,
      error: null
    });
  });

  it('should handle pagination correctly', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        count: 0,
        error: null
      })
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    await listPedidos({
      integrationAccountId: 'test-account-id',
      page: 3,
      pageSize: 10
    });

    expect(mockQuery.range).toHaveBeenCalledWith(20, 29);
  });
});