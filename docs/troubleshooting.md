# Guia de Troubleshooting - ReistoOQ Core

## 🚨 Problemas Comuns e Soluções

### 1. Problemas de Autenticação

#### Erro: "User not authenticated"
**Sintomas**: Usuário não consegue acessar funcionalidades protegidas
**Causas possíveis**:
- Token JWT expirado
- Sessão inválida
- Configuração incorreta do Supabase

**Soluções**:
1. Faça logout e login novamente
2. Limpe o localStorage do navegador
3. Verifique se o projeto Supabase está ativo
4. Confirme as configurações de autenticação

\`\`\`javascript
// Debug: Verificar token atual
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
\`\`\`

#### Erro: "Invalid JWT token"
**Soluções**:
1. Reinicie a aplicação
2. Verifique se as chaves do Supabase estão corretas
3. Confirme se o usuário tem permissões adequadas

### 2. Problemas de API / Integração

#### Erro: "Failed to fetch orders from Mercado Livre"
**Sintomas**: Pedidos não carregam ou falham na sincronização
**Causas possíveis**:
- Token ML expirado
- Rate limiting da API
- Conta de integração inativa

**Soluções**:
1. Verificar token no dashboard:
\`\`\`sql
SELECT expires_at, is_active 
FROM integration_accounts 
WHERE provider = 'mercadolivre';
\`\`\`

2. Renovar token manualmente:
- Acesse Configurações > Integrações
- Reconecte a conta do Mercado Livre

3. Verificar logs das Edge Functions:
\`\`\`bash
# No Supabase Dashboard
Functions > unified-orders > Logs
\`\`\`

#### Erro: "Webhook validation failed"
**Sintomas**: Atualizações em tempo real não funcionam
**Soluções**:
1. Verificar configuração do webhook no ML
2. Confirmar se a URL está acessível
3. Validar certificado SSL

### 3. Problemas de Performance

#### Carregamento Lento de Páginas
**Sintomas**: Páginas demoram para carregar
**Diagnóstico**:
1. Abra o Dashboard de Monitoramento
2. Verifique métricas de API
3. Analise tempo de resposta

**Soluções**:
1. Implementar cache local:
\`\`\`javascript
// Configurar cache no React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});
\`\`\`

2. Otimizar queries do banco
3. Reduzir tamanho das requisições

#### High Memory Usage
**Sintomas**: Navegador fica lento ou trava
**Soluções**:
1. Verificar vazamentos de memória
2. Otimizar re-renders desnecessários
3. Implementar pagination adequada

### 4. Problemas de Banco de Dados

#### Erro: "RLS Policy Violation"
**Sintomas**: Usuário não consegue acessar dados
**Soluções**:
1. Verificar políticas RLS:
\`\`\`sql
SELECT * FROM pg_policies 
WHERE tablename = 'nome_da_tabela';
\`\`\`

2. Confirmar organização do usuário:
\`\`\`sql
SELECT organizacao_id FROM profiles 
WHERE id = auth.uid();
\`\`\`

#### Erro: "Connection timeout"
**Sintomas**: Queries demoram ou falham
**Soluções**:
1. Verificar status do Supabase
2. Otimizar queries lentas
3. Adicionar índices necessários

### 5. Problemas de Interface

#### Componentes não Renderizam
**Sintomas**: Tela branca ou componentes quebrados
**Debug**:
1. Verificar console do navegador
2. Usar React Developer Tools
3. Verificar Error Boundary

**Soluções**:
\`\`\`javascript
// Adicionar Error Boundary
<ErrorBoundary>
  <ComponenteProblematico />
</ErrorBoundary>
\`\`\`

#### Responsividade Mobile Quebrada
**Sintomas**: Layout quebrado em mobile
**Soluções**:
1. Verificar classes Tailwind CSS
2. Testar em diferentes dispositivos
3. Usar MobileAppShell quando necessário

### 6. Problemas de Build/Deploy

#### Build Fails
**Sintomas**: npm run build falha
**Soluções**:
1. Limpar cache:
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

2. Verificar erros TypeScript:
\`\`\`bash
npm run type-check
\`\`\`

3. Atualizar dependências:
\`\`\`bash
npm audit fix
\`\`\`

#### Deploy Fails
**Sintomas**: Deploy falha na plataforma
**Soluções**:
1. Verificar variáveis de ambiente
2. Confirmar build local
3. Verificar logs de deploy

## 🔧 Ferramentas de Debug

### 1. Monitoramento em Tempo Real
Acesse: `/monitoring/system-health`
- Status de APIs
- Métricas de performance
- Logs de erro

### 2. Console do Navegador
\`\`\`javascript
// Debug de autenticação
console.log('Auth user:', await supabase.auth.getUser());

// Debug de queries
console.log('Query result:', data);

// Debug de store
console.log('Store state:', usePerformanceStore.getState());
\`\`\`

### 3. Supabase Dashboard
- Logs das Edge Functions
- Métricas de banco
- Usuários ativos
- Status das integrações

### 4. Network Tab
- Verificar requisições HTTP
- Analisar tempo de resposta
- Identificar falhas de rede

## 📋 Checklist de Diagnóstico

### Quando algo não funciona:

1. **[ ]** Verificar console para erros JavaScript
2. **[ ]** Confirmar se usuário está autenticado
3. **[ ]** Validar permissões de acesso
4. **[ ]** Verificar status das integrações
5. **[ ]** Analisar logs das Edge Functions
6. **[ ]** Testar conectividade com Supabase
7. **[ ]** Verificar variáveis de ambiente
8. **[ ]** Confirmar dados no banco
9. **[ ]** Testar em ambiente limpo
10. **[ ]** Verificar métricas de performance

## 🆘 Quando Pedir Ajuda

Se o problema persistir após seguir este guia:

1. **Documente o problema**:
   - Passos para reproduzir
   - Mensagens de erro completas
   - Screenshots se aplicável
   - Logs relevantes

2. **Informações do ambiente**:
   - Versão do navegador
   - Sistema operacional
   - Horário do problema
   - Usuário afetado

3. **Crie uma issue**:
   - Use template apropriado
   - Inclua todas as informações
   - Marque como prioridade se crítico

## 🔄 Procedimentos de Recovery

### Em caso de sistema instável:

1. **Rollback imediato**:
   - Reverter último deploy
   - Notificar usuários
   - Investigar causa raiz

2. **Backup de dados**:
   - Exportar dados críticos
   - Verificar integridade
   - Documentar estado

3. **Restauração**:
   - Deploy de versão estável
   - Testar funcionalidades críticas
   - Monitorar por 24h

---

**Lembre-se**: Em caso de dúvida, sempre priorize a estabilidade do sistema. É melhor reverter uma mudança do que deixar o sistema instável.