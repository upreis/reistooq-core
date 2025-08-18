# AUDITORIA COMPLETA DE SEGURANÇA DE DADOS - SISTEMA REISTOQ

## Objetivo Principal
Realizar auditoria completa de segurança de dados do sistema REISTOQ para:
1. **Corrigir vulnerabilidades críticas** (RLS expostas, dados sensíveis não mascarados)
2. **Implementar proteção adequada** para informações pessoais e comerciais
3. **Validar políticas de acesso** e permissões de usuários
4. **Garantir criptografia** de secrets e tokens
5. **Estabelecer controles de auditoria** e monitoramento de acesso

---

## PARTE A — AUDITORIA CRÍTICA DE ROW LEVEL SECURITY (RLS)

### A1. Auditoria de Políticas RLS (CRÍTICO)
**Verificar:**
- [ ] Todas as tabelas sensíveis têm RLS habilitado?
- [ ] Políticas de SELECT restringem acesso por organização?
- [ ] Políticas de INSERT/UPDATE/DELETE validam propriedade?
- [ ] Não há políticas com `USING (true)` expostas?
- [ ] Functions SECURITY DEFINER estão adequadamente protegidas?

**Correções Obrigatórias:**
```sql
-- Exemplo para tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_org" ON public.profiles 
FOR SELECT USING (organizacao_id = get_current_org_id());

CREATE POLICY "profiles_update_self" ON public.profiles 
FOR UPDATE USING (id = auth.uid());
```

### A2. Mascaramento de Dados Sensíveis (CRÍTICO)
**Verificar proteção de:**
- [ ] **CPF/CNPJ**: Mascarados como `***1234`
- [ ] **Telefones**: Mascarados como `****5678`
- [ ] **E-mails**: Mascarados como `u***@domain.com`
- [ ] **Nomes completos**: Reduzidos a inicial + sobrenome
- [ ] **Endereços**: Cidade/UF apenas, sem rua/número

**Implementar Functions de Mascaramento:**
```sql
CREATE OR REPLACE FUNCTION mask_cpf_cnpj(doc text)
RETURNS text AS $$
BEGIN
  RETURN CASE WHEN length(doc) > 4 
    THEN repeat('*', length(doc) - 4) || right(doc, 4)
    ELSE doc END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### A3. Tabelas com Acesso Direto Proibido (CRÍTICO)
**Bloquear acesso direto a:**
- [ ] `historico_vendas` → Usar `get_historico_vendas_masked()`
- [ ] `integration_secrets` → Apenas Edge Functions
- [ ] `pedidos` → Usar `get_pedidos_masked()`
- [ ] `profiles` → Usar `profiles_safe` view
- [ ] `organizacoes` → Apenas própria organização

**Implementar Bloqueio:**
```sql
-- Revogar acesso direto
CREATE POLICY "block_direct_access" ON public.historico_vendas
FOR ALL USING (false);

-- Forçar uso de function segura
GRANT EXECUTE ON FUNCTION get_historico_vendas_masked TO authenticated;
```

---

## PARTE B — AUDITORIA DE SECRETS E CREDENCIAIS

### B1. Criptografia de Integration Secrets (CRÍTICO)
**Verificar:**
- [ ] Todos os secrets estão criptografados com `pgp_sym_encrypt`?
- [ ] `APP_ENCRYPTION_KEY` configurada no Supabase?
- [ ] Campos legados (`client_secret`, `access_token`) foram nullificados?
- [ ] Edge Functions usam decrypt adequadamente?
- [ ] Não há secrets em plaintext no código frontend?

**Migração para Criptografia:**
```sql
-- Trigger para forçar criptografia
CREATE TRIGGER integration_secrets_encrypt_trigger
  BEFORE INSERT OR UPDATE ON integration_secrets
  FOR EACH ROW EXECUTE FUNCTION integration_secrets_prevent_plaintext();
```

### B2. Auditoria de Acesso a Secrets (CRÍTICO)
**Implementar:**
- [ ] Log de todos os acessos a secrets
- [ ] Identificação de function que solicita acesso
- [ ] Timestamp e user_id de quem acessa
- [ ] Rate limiting para tentativas de acesso
- [ ] Alertas para acessos suspeitos

**Tabela de Auditoria:**
```sql
CREATE TABLE integration_secret_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_account_id uuid NOT NULL,
  provider text NOT NULL,
  action text NOT NULL, -- 'access', 'update', 'create'
  requesting_function text,
  user_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
```

### B3. Validação de Permissões de Usuário (CRÍTICO)
**Verificar sistema RBAC:**
- [ ] Usuários têm apenas permissões necessárias?
- [ ] Roles estão corretamente atribuídas?
- [ ] `has_permission()` é usada em todas as políticas?
- [ ] Não há bypass de permissões?
- [ ] Convites validam e-mail corretamente?

---

## PARTE C — AUDITORIA DE EDGE FUNCTIONS

### C1. Segurança de Edge Functions (CRÍTICO)
**Verificar:**
- [ ] Functions não expostas (`verify_jwt = true`) quando necessário
- [ ] CORS headers restritivos para functions sensíveis
- [ ] Validação de input em todas as functions
- [ ] Não há vazamento de secrets em logs
- [ ] Error handling não expõe informações internas

**Headers de Segurança:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://seu-dominio.com', // Não usar '*'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true'
};
```

### C2. Validação de Entrada (CRÍTICO)
**Implementar em todas as functions:**
```typescript
// Validação obrigatória
if (!req.body?.integration_account_id) {
  return new Response(JSON.stringify({ 
    error: 'Missing required fields' 
  }), { status: 400 });
}

// Sanitização
const cleanInput = req.body.integration_account_id.replace(/[^a-zA-Z0-9-]/g, '');
```

### C3. Rate Limiting e Throttling (CRÍTICO)
**Implementar proteção contra:**
- [ ] Tentativas excessivas de OAuth
- [ ] Acesso repetitivo a secrets
- [ ] Calls em massa para APIs externas
- [ ] Brute force em endpoints sensíveis

---

## PARTE D — AUDITORIA DE DADOS PESSOAIS (LGPD/GDPR)

### D1. Classificação de Dados Sensíveis
**Identificar e proteger:**
- [ ] **Dados Pessoais**: Nome, CPF, telefone, e-mail
- [ ] **Dados Comerciais**: Pedidos, faturamento, produtos
- [ ] **Dados de Integração**: Tokens, credentials
- [ ] **Dados de Sistema**: Logs, auditoria, configurações

### D2. Direitos dos Titulares (CRÍTICO)
**Implementar capacidades:**
- [ ] **Visualização**: Usuário pode ver seus dados
- [ ] **Correção**: Usuário pode atualizar dados incorretos
- [ ] **Exclusão**: Processo para deletar dados (GDPR Art. 17)
- [ ] **Portabilidade**: Export de dados em formato legível
- [ ] **Opt-out**: Desativar processamento de dados

### D3. Retenção e Purga de Dados
**Implementar políticas:**
```sql
-- Auto-limpeza de dados expirados
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Limpar tokens OAuth expirados
  DELETE FROM oauth_states WHERE expires_at < now() - interval '1 day';
  
  -- Limpar logs antigos (>1 ano)
  DELETE FROM audit_logs WHERE created_at < now() - interval '1 year';
  
  -- Anonimizar dados de usuários inativos (>2 anos)
  UPDATE profiles SET 
    nome_completo = 'Usuário Inativo',
    telefone = NULL,
    email = 'inativo@removed.com'
  WHERE updated_at < now() - interval '2 years';
END;
$$ LANGUAGE plpgsql;
```

---

## PARTE E — AUDITORIA DE FRONTEND

### E1. Proteção de Dados no Cliente (CRÍTICO)
**Verificar:**
- [ ] Não há dados sensíveis em localStorage/sessionStorage
- [ ] Console.log não imprime secrets/tokens
- [ ] Network requests não exposem dados em URLs
- [ ] Cache do browser não armazena dados sensíveis
- [ ] Componentes mascararam dados adequadamente

### E2. Validação de Permissões no Frontend
**Implementar:**
```typescript
// Hook de proteção
const useSecureData = (permission: string) => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(permission)) {
    throw new Error('Acesso negado');
  }
  
  return { /* dados protegidos */ };
};
```

### E3. Sanitização de Inputs
**Garantir em todos os formulários:**
- [ ] Validação de CPF/CNPJ formato
- [ ] Escape de caracteres especiais
- [ ] Prevenção de XSS em campos de texto
- [ ] Validação de tipos antes de envio
- [ ] Rate limiting em submissões

---

## ENTREGÁVEIS OBRIGATÓRIOS

### 1. Relatório de Vulnerabilidades Encontradas
```
🚨 CRÍTICAS DE SEGURANÇA:
- RLS não habilitado em [tabela]
- Dados sensíveis expostos em [tabela/campo]
- Secrets não criptografados em [localização]
- Acesso direto permitido a [tabela protegida]

⚠️ RISCOS MÉDIOS:
- Mascaramento incompleto em [campo]
- Logs expostos em [function]
- Permissões muito amplas em [role]

🔍 CONFORMIDADE LGPD/GDPR:
- Direito de acesso: [status]
- Direito de correção: [status]
- Direito de exclusão: [status]
```

### 2. Políticas RLS Aplicadas
```sql
-- profiles: Acesso restrito por organização
CREATE POLICY "profiles_org_access" ON profiles...

-- historico_vendas: Bloqueio total, apenas via function
CREATE POLICY "historico_block_direct" ON historico_vendas...

-- integration_secrets: Apenas Edge Functions
CREATE POLICY "secrets_edge_only" ON integration_secrets...
```

### 3. Functions de Mascaramento Criadas
```sql
-- mask_phone(): ****1234
-- mask_cpf(): ***12.345.678-**
-- mask_email(): u***@domain.com
-- mask_name(): João D.
```

### 4. Validação de Segurança (Checklist)
```
1. ✅ RLS habilitado em todas as tabelas
2. ✅ Dados sensíveis mascarados adequadamente
3. ✅ Secrets criptografados e auditados
4. ✅ Edge Functions com autenticação adequada
5. ✅ Frontend não expõe dados sensíveis
6. ✅ Conformidade LGPD implementada
7. ✅ Rate limiting em endpoints críticos
8. ✅ Logs de auditoria funcionais
```

### 5. Melhorias Preventivas de Segurança
```
- Monitoramento automático de vazamentos
- Alertas para tentativas de acesso suspeitas
- Backup criptografado de dados sensíveis
- Rotação automática de secrets
- Penetration testing automatizado
- Compliance dashboard implementado
```

---

## INSTRUÇÕES DE EXECUÇÃO

### Prioridade 1 - VULNERABILIDADES CRÍTICAS (Executar IMEDIATAMENTE)
1. Habilitar RLS em todas as tabelas expostas
2. Criptografar todos os integration_secrets
3. Bloquear acesso direto a tabelas sensíveis
4. Implementar mascaramento de dados pessoais
5. Corrigir Edge Functions expostas

### Prioridade 2 - PROTEÇÕES ADICIONAIS (Dentro de 24h)
1. Implementar auditoria de acesso
2. Configurar rate limiting
3. Validar permissões de usuários
4. Sanitizar inputs do frontend
5. Configurar alertas de segurança

### Prioridade 3 - CONFORMIDADE E MONITORAMENTO (Dentro de 1 semana)
1. Implementar direitos LGPD/GDPR
2. Configurar retenção de dados
3. Setup de monitoramento contínuo
4. Documentação de segurança
5. Treinamento da equipe

---

## VALIDAÇÃO DE SEGURANÇA

### Testes Obrigatórios Após Correções:
```bash
# 1. Tentar acessar dados sem permissão
# 2. Verificar mascaramento de dados sensíveis
# 3. Validar criptografia de secrets
# 4. Testar rate limiting
# 5. Confirmar logs de auditoria
# 6. Verificar CORS e autenticação
```

### Ferramentas de Validação:
- Supabase Security Scanner
- Manual SQL injection testing
- OWASP ZAP scanning
- Custom compliance checking

**CRÍTICO:** 
- 🚨 Aplicar correções de **VULNERABILIDADES CRÍTICAS** IMEDIATAMENTE
- 🔒 Validar cada correção com testes de segurança
- 📋 Documentar todas as mudanças para auditoria
- 🔄 Implementar monitoramento contínuo pós-correção
- ⚖️ Garantir conformidade LGPD/GDPR em todas as alterações