-- Tabela para armazenar mensagens de claims
CREATE TABLE IF NOT EXISTS reclamacoes_mensagens (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  sender_id BIGINT,
  sender_role TEXT,
  receiver_id BIGINT,
  receiver_role TEXT,
  message TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  date_created TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reclamacoes_mensagens_claim ON reclamacoes_mensagens(claim_id);
CREATE INDEX IF NOT EXISTS idx_reclamacoes_mensagens_date ON reclamacoes_mensagens(date_created DESC);

-- RLS Policies
ALTER TABLE reclamacoes_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reclamacoes_mensagens_select_org"
  ON reclamacoes_mensagens
  FOR SELECT
  USING (
    claim_id IN (
      SELECT claim_id FROM reclamacoes
      WHERE integration_account_id IN (
        SELECT id FROM integration_accounts
        WHERE organization_id = get_current_org_id()
      )
    )
  );

CREATE POLICY "reclamacoes_mensagens_insert_org"
  ON reclamacoes_mensagens
  FOR INSERT
  WITH CHECK (
    claim_id IN (
      SELECT claim_id FROM reclamacoes
      WHERE integration_account_id IN (
        SELECT id FROM integration_accounts
        WHERE organization_id = get_current_org_id()
      )
    )
  );

CREATE POLICY "reclamacoes_mensagens_update_org"
  ON reclamacoes_mensagens
  FOR UPDATE
  USING (
    claim_id IN (
      SELECT claim_id FROM reclamacoes
      WHERE integration_account_id IN (
        SELECT id FROM integration_accounts
        WHERE organization_id = get_current_org_id()
      )
    )
  );

CREATE POLICY "reclamacoes_mensagens_delete_org"
  ON reclamacoes_mensagens
  FOR DELETE
  USING (
    claim_id IN (
      SELECT claim_id FROM reclamacoes
      WHERE integration_account_id IN (
        SELECT id FROM integration_accounts
        WHERE organization_id = get_current_org_id()
      )
    )
  );