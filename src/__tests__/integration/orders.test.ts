// F6.2: Testes de integração para APIs
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUnifiedOrders } from '@/services/orders';

// Mock do Supabase
const mockSupabase = {
  functions: {
    invoke: vi.fn()
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Orders API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUnifiedOrders', () => {
    it('should fetch orders successfully', async () => {
      const mockResponse = {
        data: {
          ok: true,
          results: [
            {
              raw: { id: '123', status: 'paid' },
              unified: { id: '123', situacao: 'pago' }
            }
          ],
          paging: { total: 1, limit: 25, offset: 0 }
        },
        error: null
      };

      mockSupabase.functions.invoke.mockResolvedValue(mockResponse);

      const result = await fetchUnifiedOrders({
        integration_account_id: 'test-account-id',
        limit: 25,
        offset: 0
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('unified-orders', {
        body: {
          integration_account_id: 'test-account-id',
          limit: 25,
          offset: 0,
          enrich: true,
          include_shipping: true,
          debug: false
        }
      });
    });

    it('should handle API errors gracefully', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'API Error', status: 500 }
      });

      await expect(fetchUnifiedOrders({
        integration_account_id: 'test-account-id'
      })).rejects.toThrow('API Error');
    });

    it('should handle 401 errors with token refresh', async () => {
      // Primeira chamada falha com 401
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Unauthorized', status: 401 }
        })
        // Refresh token
        .mockResolvedValueOnce({
          data: { ok: true },
          error: null
        })
        // Segunda tentativa com sucesso
        .mockResolvedValueOnce({
          data: {
            ok: true,
            results: [],
            paging: { total: 0 }
          },
          error: null
        });

      const result = await fetchUnifiedOrders({
        integration_account_id: 'test-account-id'
      });

      expect(result.ok).toBe(true);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(3);
    });

    it('should require integration_account_id', async () => {
      await expect(fetchUnifiedOrders({
        integration_account_id: ''
      })).rejects.toThrow('integration_account_id é obrigatório');
    });
  });
});