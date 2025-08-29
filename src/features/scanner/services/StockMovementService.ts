// ============================================================================
// STOCK MOVEMENT SERVICE - Integração completa com movimentações de estoque
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StockMovement {
  id?: string;
  produto_id: string;
  tipo_movimentacao: 'entrada' | 'saida' | 'ajuste' | 'transferencia';
  quantidade_anterior: number;
  quantidade_nova: number;
  quantidade_movimentada: number;
  motivo: string;
  observacoes?: string;
  created_at?: string;
}

export interface StockMovementRequest {
  produto_id: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  motivo: string;
  observacoes?: string;
}

export interface Product {
  id: string;
  nome: string;
  sku_interno: string;
  quantidade_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  localizacao?: string;
}

export interface NotificationConfig {
  enable_push: boolean;
  enable_email: boolean;
  enable_sound: boolean;
  enable_vibration: boolean;
}

class StockMovementService {
  private static instance: StockMovementService;
  private notificationConfig: NotificationConfig = {
    enable_push: true,
    enable_email: true,
    enable_sound: true,
    enable_vibration: true
  };

  static getInstance(): StockMovementService {
    if (!StockMovementService.instance) {
      StockMovementService.instance = new StockMovementService();
    }
    return StockMovementService.instance;
  }

  // ============================================================================
  // MOVIMENTAÇÕES DE ESTOQUE
  // ============================================================================

  /**
   * Processar entrada de estoque via scanner
   */
  async processStockIn(request: StockMovementRequest): Promise<{ success: boolean; movement?: StockMovement; error?: string }> {
    try {
      console.log('📦 [StockService] Processing stock IN:', request);
      
      // 1. Buscar produto atual
      const product = await this.getProduct(request.produto_id);
      if (!product) {
        return { success: false, error: 'Produto não encontrado' };
      }

      // 2. Calcular nova quantidade
      const newQuantity = product.quantidade_atual + request.quantidade;
      
      // 3. Validar movimento
      const validation = this.validateMovement(product, request.tipo, request.quantidade);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 4. Executar movimento
      const movement = await this.executeMovement({
        produto_id: request.produto_id,
        tipo_movimentacao: 'entrada',
        quantidade_anterior: product.quantidade_atual,
        quantidade_nova: newQuantity,
        quantidade_movimentada: request.quantidade,
        motivo: request.motivo,
        observacoes: request.observacoes
      });

      // 5. Atualizar produto
      const updated = await this.updateProductStock(request.produto_id, newQuantity);
      if (!updated) {
        throw new Error('Falha ao atualizar o estoque do produto');
      }

      // 6. Verificar alertas
      await this.checkStockAlerts(product, newQuantity);

      // 7. Feedback visual e háptico
      this.provideFeedback('success', 'Entrada registrada com sucesso!');

      return { success: true, movement };
    } catch (error: any) {
      console.error('❌ [StockService] Stock IN failed:', error);
      this.provideFeedback('error', 'Erro ao processar entrada de estoque');
      return { success: false, error: error.message };
    }
  }

  /**
   * Processar saída de estoque via scanner
   */
  async processStockOut(request: StockMovementRequest): Promise<{ success: boolean; movement?: StockMovement; error?: string }> {
    try {
      console.log('📤 [StockService] Processing stock OUT:', request);
      
      const product = await this.getProduct(request.produto_id);
      if (!product) {
        return { success: false, error: 'Produto não encontrado' };
      }

      const newQuantity = product.quantidade_atual - request.quantidade;
      
      // Validar se há estoque suficiente
      if (newQuantity < 0) {
        this.provideFeedback('warning', 'Estoque insuficiente!');
        return { success: false, error: `Estoque insuficiente. Disponível: ${product.quantidade_atual}` };
      }

      const validation = this.validateMovement(product, request.tipo, request.quantidade);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const movement = await this.executeMovement({
        produto_id: request.produto_id,
        tipo_movimentacao: 'saida',
        quantidade_anterior: product.quantidade_atual,
        quantidade_nova: newQuantity,
        quantidade_movimentada: request.quantidade,
        motivo: request.motivo,
        observacoes: request.observacoes
      });

      const updated = await this.updateProductStock(request.produto_id, newQuantity);
      if (!updated) {
        throw new Error('Falha ao atualizar o estoque do produto');
      }
      await this.checkStockAlerts(product, newQuantity);

      this.provideFeedback('success', 'Saída registrada com sucesso!');
      return { success: true, movement };
    } catch (error: any) {
      console.error('❌ [StockService] Stock OUT failed:', error);
      this.provideFeedback('error', 'Erro ao processar saída de estoque');
      return { success: false, error: error.message };
    }
  }

  /**
   * Processar ajuste de estoque via scanner
   */
  async processStockAdjustment(request: StockMovementRequest): Promise<{ success: boolean; movement?: StockMovement; error?: string }> {
    try {
      console.log('⚖️ [StockService] Processing stock ADJUSTMENT:', request);
      
      const product = await this.getProduct(request.produto_id);
      if (!product) {
        return { success: false, error: 'Produto não encontrado' };
      }

      const newQuantity = request.quantidade;
      const movementQuantity = Math.abs(newQuantity - product.quantidade_atual);
      const movementType = newQuantity > product.quantidade_atual ? 'entrada' : 'saida';

      const movement = await this.executeMovement({
        produto_id: request.produto_id,
        tipo_movimentacao: 'ajuste',
        quantidade_anterior: product.quantidade_atual,
        quantidade_nova: newQuantity,
        quantidade_movimentada: movementQuantity,
        motivo: request.motivo || 'Ajuste de inventário',
        observacoes: request.observacoes
      });

      const updated = await this.updateProductStock(request.produto_id, newQuantity);
      if (!updated) {
        throw new Error('Falha ao atualizar o estoque do produto');
      }
      await this.checkStockAlerts(product, newQuantity);

      this.provideFeedback('success', 'Ajuste realizado com sucesso!');
      return { success: true, movement };
    } catch (error: any) {
      console.error('❌ [StockService] Stock ADJUSTMENT failed:', error);
      this.provideFeedback('error', 'Erro ao processar ajuste de estoque');
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // OPERAÇÕES DE PRODUTO
  // ============================================================================

  /**
   * Buscar produto por ID ou código de barras
   */
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, sku_interno, quantidade_atual, estoque_minimo, estoque_maximo, localizacao')
        .or(`id.eq.${productId},sku_interno.eq.${productId},codigo_barras.eq.${productId}`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ [StockService] Failed to get product:', error);
      return null;
    }
  }

  /**
   * Atualizar quantidade do produto
   */
  async updateProductStock(productId: string, newQuantity: number): Promise<boolean> {
    try {
      // Obter organização atual para respeitar RLS
      const { data: orgId, error: orgErr } = await supabase.rpc('get_current_org_id');
      if (orgErr || !orgId) {
        throw orgErr || new Error('Organização atual não encontrada');
      }

      // Tentar atualizar com organization_id da org atual
      let { error, data } = await supabase
        .from('produtos')
        .update({
          quantidade_atual: newQuantity,
          ultima_movimentacao: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('organization_id', orgId)
        .select('id')
        .single();

      // Se não encontrou (produto possivelmente órfão), aplicar fallback corrigindo organization_id
      if (error && error.code === 'PGRST116') {
        console.warn('🔄 [StockService] Produto possivelmente órfão. Aplicando fallback com organization_id...');
        const { error: fallbackErr, data: fallbackData } = await supabase
          .from('produtos')
          .update({ quantidade_atual: newQuantity, ultima_movimentacao: new Date().toISOString(), organization_id: orgId })
          .eq('id', productId)
          .is('organization_id', null)
          .select('id')
          .single();
        if (fallbackErr) {
          console.error('❌ [StockService] Fallback também falhou:', fallbackErr);
          throw fallbackErr;
        }
        if (!fallbackData) {
          console.error('❌ [StockService] Produto não encontrado nem como órfão');
          return false;
        }
        console.log('✅ [StockService] Produto órfão corrigido com sucesso');
        return true;
      }

      if (error) {
        console.error('❌ [StockService] Erro na atualização do produto:', error);
        throw error;
      }
      
      if (!data) {
        console.error('❌ [StockService] Produto não encontrado ou não atualizado');
        return false;
      }
      
      console.log('✅ [StockService] Produto atualizado com sucesso:', data);
      return true;
    } catch (error) {
      console.error('❌ [StockService] Failed to update product stock:', error);
      return false;
    }
  }

  // ============================================================================
  // MOVIMENTAÇÕES
  // ============================================================================

  /**
   * Executar movimentação na base de dados
   */
  async executeMovement(movement: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement> {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .insert([movement])
        .select()
        .single();

      if (error) throw error;
      return data as StockMovement;
    } catch (error) {
      console.error('❌ [StockService] Failed to execute movement:', error);
      throw error;
    }
  }

  /**
   * Buscar histórico de movimentações
   */
  async getMovementHistory(productId?: string, limit: number = 50): Promise<StockMovement[]> {
    try {
      let query = supabase
        .from('movimentacoes_estoque')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (productId) {
        query = query.eq('produto_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as StockMovement[];
    } catch (error) {
      console.error('❌ [StockService] Failed to get movement history:', error);
      return [];
    }
  }

  // ============================================================================
  // VALIDAÇÕES
  // ============================================================================

  /**
   * Validar movimento antes de executar
   */
  validateMovement(product: Product, type: string, quantity: number): { valid: boolean; error?: string } {
    // Validar quantidade positiva
    if (quantity <= 0) {
      return { valid: false, error: 'Quantidade deve ser maior que zero' };
    }

    // Validar saída com estoque suficiente
    if (type === 'saida' && product.quantidade_atual < quantity) {
      return { valid: false, error: `Estoque insuficiente. Disponível: ${product.quantidade_atual}` };
    }

    // Validar limite máximo (entrada)
    if (type === 'entrada' && product.estoque_maximo > 0) {
      const newQuantity = product.quantidade_atual + quantity;
      if (newQuantity > product.estoque_maximo) {
        return { 
          valid: false, 
          error: `Quantidade excede estoque máximo (${product.estoque_maximo})` 
        };
      }
    }

    return { valid: true };
  }

  // ============================================================================
  // ALERTAS E NOTIFICAÇÕES
  // ============================================================================

  /**
   * Verificar alertas de estoque após movimentação
   */
  async checkStockAlerts(product: Product, newQuantity: number): Promise<void> {
    try {
      // Alerta de estoque baixo
      if (newQuantity <= product.estoque_minimo && newQuantity > 0) {
        await this.triggerLowStockAlert(product, newQuantity);
      }

      // Alerta de estoque zerado
      if (newQuantity === 0) {
        await this.triggerOutOfStockAlert(product);
      }

      // Alerta de estoque alto (se definido)
      if (product.estoque_maximo > 0 && newQuantity >= product.estoque_maximo * 0.9) {
        await this.triggerHighStockAlert(product, newQuantity);
      }
    } catch (error) {
      console.error('❌ [StockService] Failed to check stock alerts:', error);
    }
  }

  async triggerLowStockAlert(product: Product, currentStock: number): Promise<void> {
    const message = `⚠️ Estoque baixo: ${product.nome} (${currentStock} unidades)`;
    
    if (this.notificationConfig.enable_sound) {
      this.playAlertSound('warning');
    }

    toast.warning(message, {
      description: `Estoque mínimo: ${product.estoque_minimo}`,
      action: {
        label: 'Ver Produto',
        onClick: () => {
          // Navigate to product page
          console.log('Navigate to product:', product.id);
        }
      }
    });
  }

  async triggerOutOfStockAlert(product: Product): Promise<void> {
    const message = `🚨 Produto em falta: ${product.nome}`;
    
    if (this.notificationConfig.enable_sound) {
      this.playAlertSound('error');
    }

    toast.error(message, {
      description: 'Produto sem estoque disponível',
      action: {
        label: 'Repor Estoque',
        onClick: () => {
          // Navigate to restock action
          console.log('Restock product:', product.id);
        }
      }
    });
  }

  async triggerHighStockAlert(product: Product, currentStock: number): Promise<void> {
    const message = `📈 Estoque alto: ${product.nome} (${currentStock} unidades)`;
    
    toast.info(message, {
      description: `Próximo ao estoque máximo: ${product.estoque_maximo}`
    });
  }

  // ============================================================================
  // FEEDBACK E UX
  // ============================================================================

  /**
   * Fornecer feedback visual, sonoro e háptico
   */
  provideFeedback(type: 'success' | 'warning' | 'error', message: string): void {
    // Vibração háptica
    if (this.notificationConfig.enable_vibration && 'vibrate' in navigator) {
      const patterns = {
        success: [100],
        warning: [100, 50, 100],
        error: [200, 100, 200]
      };
      navigator.vibrate(patterns[type]);
    }

    // Som
    if (this.notificationConfig.enable_sound) {
      this.playAlertSound(type);
    }

    // Toast visual
    const toastFn = type === 'success' ? toast.success : type === 'warning' ? toast.warning : toast.error;
    toastFn(message);
  }

  /**
   * Reproduzir som de alerta
   */
  playAlertSound(type: 'success' | 'warning' | 'error'): void {
    try {
      // Frequências para diferentes tipos de alerta
      const frequencies = {
        success: [523, 659, 784], // C5, E5, G5
        warning: [440, 440], // A4, A4
        error: [220, 185] // A3, F#3
      };

      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        frequencies[type].forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime + index * 0.1);
          oscillator.stop(audioContext.currentTime + 0.2 + index * 0.1);
        });
      }
    } catch (error) {
      console.warn('⚠️ [StockService] Could not play alert sound:', error);
    }
  }

  // ============================================================================
  // CONFIGURAÇÃO
  // ============================================================================

  updateNotificationConfig(config: Partial<NotificationConfig>): void {
    this.notificationConfig = { ...this.notificationConfig, ...config };
  }

  getNotificationConfig(): NotificationConfig {
    return { ...this.notificationConfig };
  }
}

export const stockMovementService = StockMovementService.getInstance();