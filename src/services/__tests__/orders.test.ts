import { describe, it, expect, vi } from 'vitest';
import { fetchUnifiedOrders } from '../orders';

// Mock supabase client
const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke
    }
  }
}));

describe('fetchUnifiedOrders', () => {
  it('should return data when unified-orders responds with ok: true', async () => {
    const mockResponse = {
      ok: true,
      url: 'https://api.mercadolibre.com/orders/search',
      paging: { total: 1, offset: 0, limit: 10 },
      results: [{ id: '12345', status: 'paid', total_amount: 100 }]
    };

    mockInvoke.mockResolvedValueOnce({
      data: mockResponse,
      error: null
    });

    const result = await fetchUnifiedOrders({
      integration_account_id: '5740f717-1771-4298-b8c9-464ffb8d8dce',
      status: 'paid',
      limit: 10
    });

    expect(result).toEqual(mockResponse);
    expect(mockInvoke).toHaveBeenCalledWith('unified-orders', {
      body: {
        integration_account_id: '5740f717-1771-4298-b8c9-464ffb8d8dce',
        status: 'paid',
        limit: 10
      }
    });
  });

  it('should throw error when supabase returns error', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error('Network error')
    });

    await expect(
      fetchUnifiedOrders({
        integration_account_id: '5740f717-1771-4298-b8c9-464ffb8d8dce'
      })
    ).rejects.toThrow('Network error');
  });

  it('should throw error when unified-orders responds with ok: false', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { ok: false, error: 'Invalid account' },
      error: null
    });

    await expect(
      fetchUnifiedOrders({
        integration_account_id: 'invalid-id'
      })
    ).rejects.toThrow('unified-orders: resposta inesperada');
  });
});