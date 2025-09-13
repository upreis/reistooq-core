-- Criar nova tabela vendas_completas com 200+ campos organizados por seções
CREATE TABLE public.vendas_completas (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL,
  
  -- SEÇÃO 1: DADOS BÁSICOS DA VENDA
  order_id TEXT UNIQUE NOT NULL,
  order_date_created TIMESTAMP WITH TIME ZONE,
  order_date_closed TIMESTAMP WITH TIME ZONE,
  order_last_updated TIMESTAMP WITH TIME ZONE,
  order_status TEXT,
  order_status_detail TEXT,
  order_total_amount DECIMAL(15,2),
  order_paid_amount DECIMAL(15,2),
  order_currency_id TEXT,
  order_pack_id TEXT,
  order_tags JSONB DEFAULT '[]'::jsonb,
  order_manufacturing_ending_date TIMESTAMP WITH TIME ZONE,
  order_manufacturing_start_date TIMESTAMP WITH TIME ZONE,
  order_expiration_date TIMESTAMP WITH TIME ZONE,
  order_fulfilled BOOLEAN,
  order_mediations JSONB,
  order_context JSONB,
  
  -- SEÇÃO 2: DADOS DO PRODUTO
  item_id TEXT,
  item_title TEXT,
  item_category_id TEXT,
  item_condition TEXT,
  item_warranty TEXT,
  item_variation_id TEXT,
  item_variation_attributes JSONB,
  item_quantity INTEGER,
  item_unit_price DECIMAL(15,2),
  item_full_unit_price DECIMAL(15,2),
  item_sale_fee DECIMAL(15,2),
  item_listing_type_id TEXT,
  item_seller_sku TEXT,
  item_seller_custom_field TEXT,
  item_differential_pricing JSONB,
  item_bundle JSONB,
  item_picture_urls JSONB,
  item_catalog_product_id TEXT,
  item_global_price DECIMAL(15,2),
  item_manufacturing_days INTEGER,
  
  -- SEÇÃO 3: DADOS DE PAGAMENTO
  payment_id TEXT,
  payment_status TEXT,
  payment_status_detail TEXT,
  payment_method_id TEXT,
  payment_payment_type_id TEXT,
  payment_installments INTEGER,
  payment_transaction_amount DECIMAL(15,2),
  payment_transaction_amount_refunded DECIMAL(15,2),
  payment_taxes_amount DECIMAL(15,2),
  payment_shipping_cost DECIMAL(15,2),
  payment_date_approved TIMESTAMP WITH TIME ZONE,
  payment_date_created TIMESTAMP WITH TIME ZONE,
  payment_date_last_modified TIMESTAMP WITH TIME ZONE,
  payment_available_actions JSONB,
  payment_card_id TEXT,
  payment_card_first_six_digits TEXT,
  payment_card_last_four_digits TEXT,
  payment_issuer_id TEXT,
  payment_issuer_name TEXT,
  payment_atm_transfer_reference JSONB,
  payment_coupon_amount DECIMAL(15,2),
  payment_installment_amount DECIMAL(15,2),
  payment_deferred_period TEXT,
  payment_authorization_code TEXT,
  payment_operation_type TEXT,
  payment_total_paid_amount DECIMAL(15,2),
  payment_overpaid_amount DECIMAL(15,2),
  
  -- SEÇÃO 4: DADOS DE ENVIO COMPLETOS
  shipping_id TEXT,
  shipping_status TEXT,
  shipping_substatus TEXT,
  shipping_mode TEXT,
  shipping_method TEXT,
  shipping_cost DECIMAL(15,2),
  shipping_date_created TIMESTAMP WITH TIME ZONE,
  shipping_date_shipped TIMESTAMP WITH TIME ZONE,
  shipping_date_delivered TIMESTAMP WITH TIME ZONE,
  shipping_date_first_printed TIMESTAMP WITH TIME ZONE,
  shipping_tracking_number TEXT,
  shipping_tracking_method TEXT,
  shipping_receiver_address JSONB,
  shipping_sender_address JSONB,
  shipping_dimensions JSONB,
  shipping_logistic_type TEXT,
  shipping_estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  shipping_estimated_delivery_time JSONB,
  shipping_estimated_handling_limit TIMESTAMP WITH TIME ZONE,
  shipping_gross_amount DECIMAL(15,2),
  shipping_net_amount DECIMAL(15,2),
  shipping_service_id TEXT,
  shipping_priority TEXT,
  shipping_comments TEXT,
  shipping_preferences JSONB,
  shipping_market_place TEXT,
  shipping_type TEXT,
  shipping_application_id TEXT,
  shipping_option JSONB,
  shipping_tags JSONB,
  shipping_delay JSONB,
  shipping_handling_time INTEGER,
  shipping_local_pick_up BOOLEAN,
  shipping_store_pick_up BOOLEAN,
  
  -- SEÇÃO 5: DADOS DE USUÁRIOS DETALHADOS
  buyer_id TEXT,
  buyer_nickname TEXT,
  buyer_email TEXT,
  buyer_first_name TEXT,
  buyer_last_name TEXT,
  buyer_phone JSONB,
  buyer_alternative_phone JSONB,
  buyer_identification JSONB,
  buyer_address JSONB,
  buyer_address_billing JSONB,
  buyer_reputation JSONB,
  buyer_tags JSONB,
  buyer_billing_info JSONB,
  
  seller_id TEXT,
  seller_nickname TEXT,
  seller_email TEXT,
  seller_first_name TEXT,
  seller_last_name TEXT,
  seller_phone JSONB,
  seller_address JSONB,
  seller_reputation JSONB,
  seller_tags JSONB,
  seller_eshop JSONB,
  seller_status JSONB,
  
  -- SEÇÃO 6: DADOS DE RECLAMAÇÕES E DEVOLUÇÕES
  claim_id TEXT,
  claim_status TEXT,
  claim_stage TEXT,
  claim_type TEXT,
  claim_reason_id TEXT,
  claim_date_created TIMESTAMP WITH TIME ZONE,
  claim_last_updated TIMESTAMP WITH TIME ZONE,
  claim_related_entities JSONB,
  claim_resolution JSONB,
  claim_participants JSONB,
  
  return_id TEXT,
  return_status TEXT,
  return_status_money TEXT,
  return_subtype TEXT,
  return_date_created TIMESTAMP WITH TIME ZONE,
  return_refund_at TIMESTAMP WITH TIME ZONE,
  return_shipment_status TEXT,
  return_intermediate_check JSONB,
  return_tracking_number TEXT,
  return_cause JSONB,
  return_resolution JSONB,
  
  -- SEÇÃO 7: DADOS DE TROCAS
  change_id TEXT,
  change_status TEXT,
  change_type TEXT,
  change_estimated_exchange_date JSONB,
  change_new_orders_ids JSONB,
  change_date_created TIMESTAMP WITH TIME ZONE,
  change_reason JSONB,
  change_tracking_info JSONB,
  
  -- SEÇÃO 8: DADOS DE MENSAGENS
  messages_count INTEGER DEFAULT 0,
  last_message_date TIMESTAMP WITH TIME ZONE,
  last_message_from TEXT,
  unread_messages_count INTEGER DEFAULT 0,
  messages_from_buyer INTEGER DEFAULT 0,
  messages_from_seller INTEGER DEFAULT 0,
  
  -- SEÇÃO 9: DADOS DE FEEDBACK COMPLETOS
  feedback_sale_id TEXT,
  feedback_buyer_id TEXT,
  feedback_buyer_rating TEXT,
  feedback_buyer_message TEXT,
  feedback_buyer_date_created TIMESTAMP WITH TIME ZONE,
  feedback_buyer_fulfilled BOOLEAN,
  feedback_buyer_reply JSONB,
  feedback_seller_id TEXT,
  feedback_seller_rating TEXT,
  feedback_seller_message TEXT,
  feedback_seller_date_created TIMESTAMP WITH TIME ZONE,
  feedback_seller_fulfilled BOOLEAN,
  feedback_seller_reply JSONB,
  
  -- SEÇÃO 10: DADOS DE CONTEXTO E APLICAÇÃO
  context_channel TEXT,
  context_site TEXT,
  context_flows JSONB,
  context_application_id TEXT,
  context_device TEXT,
  context_beta_feature JSONB,
  context_sources JSONB,
  
  -- SEÇÃO 11: DADOS DE PROMOÇÕES E DESCONTOS
  coupon_id TEXT,
  coupon_amount DECIMAL(15,2),
  promotion_id TEXT,
  promotion_type TEXT,
  promotion_amount DECIMAL(15,2),
  discount_campaigns JSONB,
  loyalty_discount DECIMAL(15,2),
  marketplace_fee DECIMAL(15,2),
  
  -- SEÇÃO 12: DADOS DE FULFILLMENT
  fulfillment_id TEXT,
  fulfillment_status TEXT,
  fulfillment_date_created TIMESTAMP WITH TIME ZONE,
  fulfillment_estimated_delivery TIMESTAMP WITH TIME ZONE,
  fulfillment_type TEXT,
  fulfillment_preference JSONB,
  
  -- SEÇÃO 13: DADOS DE TAXES E FISCAIS
  taxes_amount DECIMAL(15,2),
  taxes_currency_id TEXT,
  tax_exempted BOOLEAN,
  invoice_id TEXT,
  invoice_status TEXT,
  invoice_date_created TIMESTAMP WITH TIME ZONE,
  invoice_data JSONB,
  
  -- SEÇÃO 14: DADOS DE EXPERIÊNCIA E QUALIDADE
  experience_decorations JSONB,
  alpha_program JSONB,
  beta_program JSONB,
  quality_evaluation JSONB,
  
  -- SEÇÃO 15: DADOS DE ANALYTICS E TRACKING
  tracking_id TEXT,
  tracking_data JSONB,
  analytics_data JSONB,
  conversion_data JSONB,
  attribution_data JSONB,
  
  -- METADADOS E CONTROLE
  data_completeness_score INTEGER DEFAULT 0 CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_errors JSONB DEFAULT '[]'::jsonb,
  sync_duration_ms INTEGER,
  endpoints_accessed JSONB DEFAULT '[]'::jsonb,
  data_sources JSONB DEFAULT '{}'::jsonb,
  
  -- Raw data completo para backup
  raw_order_data JSONB,
  raw_payment_data JSONB,
  raw_shipping_data JSONB,
  raw_claims_data JSONB,
  raw_feedback_data JSONB,
  raw_messages_data JSONB
);

-- Índices para performance
CREATE INDEX idx_vendas_completas_order_id ON public.vendas_completas(order_id);
CREATE INDEX idx_vendas_completas_organization_id ON public.vendas_completas(organization_id);
CREATE INDEX idx_vendas_completas_order_date_created ON public.vendas_completas(order_date_created);
CREATE INDEX idx_vendas_completas_order_status ON public.vendas_completas(order_status);
CREATE INDEX idx_vendas_completas_payment_status ON public.vendas_completas(payment_status);
CREATE INDEX idx_vendas_completas_shipping_status ON public.vendas_completas(shipping_status);
CREATE INDEX idx_vendas_completas_completeness ON public.vendas_completas(data_completeness_score);
CREATE INDEX idx_vendas_completas_last_sync ON public.vendas_completas(last_sync);

-- RLS Policies
ALTER TABLE public.vendas_completas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendas_completas_org_select" ON public.vendas_completas
  FOR SELECT USING (organization_id = public.get_current_org_id());

CREATE POLICY "vendas_completas_org_insert" ON public.vendas_completas
  FOR INSERT WITH CHECK (organization_id = public.get_current_org_id());

CREATE POLICY "vendas_completas_org_update" ON public.vendas_completas
  FOR UPDATE USING (organization_id = public.get_current_org_id());

CREATE POLICY "vendas_completas_org_delete" ON public.vendas_completas
  FOR DELETE USING (organization_id = public.get_current_org_id());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_vendas_completas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vendas_completas_updated_at
  BEFORE UPDATE ON public.vendas_completas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendas_completas_updated_at();

-- Trigger para definir organization_id
CREATE OR REPLACE FUNCTION public.set_vendas_completas_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id = public.get_current_org_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_vendas_completas_organization
  BEFORE INSERT ON public.vendas_completas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vendas_completas_organization();