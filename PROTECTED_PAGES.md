# 🛡️ PÁGINAS PROTEGIDAS - SISTEMA DE BLINDAGEM

## ⚠️ ATENÇÃO CRÍTICA
**ESTAS PÁGINAS SÃO PROTEGIDAS E NÃO DEVEM SER MODIFICADAS SEM AUTORIZAÇÃO EXPLÍCITA**

### 📋 Lista de Páginas Protegidas

1. **PEDIDOS** - `/pedidos`
2. **HISTÓRICO** - `/historico` 
3. **SCANNER** - `/scanner`
4. **DE-PARA** - `/depara`
5. **ESTOQUE** - `/estoque`
6. **DASHBOARD** - `/` (página inicial)

### 🔒 Arquivos Protegidos

#### Pedidos
- `src/pages/Pedidos.tsx` 🛡️
- `src/components/pedidos/SimplePedidosPage.tsx` 🛡️
- `src/components/pedidos/PedidosTable.tsx` 🛡️
- `src/components/pedidos/PedidosTableMemo.tsx` 🛡️
- `src/components/pedidos/PedidosFilters.tsx` 🛡️
- `src/core/pedidos/guards/PedidosGuard.tsx` 🛡️

#### Histórico
- `src/pages/Historico.tsx` 🛡️
- `src/features/historico/components/HistoricoSimplePage.tsx` 🛡️
- `src/core/historico/guards/HistoricoGuard.tsx` 🛡️

#### Scanner
- `src/pages/Scanner.tsx` 🛡️
- `src/components/scanner/` 🛡️

#### De-Para
- `src/pages/DePara.tsx` 🛡️
- `src/components/sku-map/` 🛡️

#### Estoque
- `src/pages/Estoque.tsx` 🛡️
- `src/components/estoque/` 🛡️

#### Dashboard
- `src/pages/Index.tsx` 🛡️

### 🚨 Regras de Proteção

1. **NUNCA** modifique estes arquivos sem permissão explícita
2. **SEMPRE** pergunte antes de fazer qualquer alteração
3. **APENAS** modificações solicitadas diretamente pelo usuário
4. **MANTENHA** a funcionalidade exata como está
5. **PRESERVE** toda a lógica de negócio existente

### ✅ Modificações Permitidas (apenas se solicitado)
- Correção de bugs específicos
- Melhorias de performance pontuais
- Ajustes de UI/UX específicos
- Correções de acessibilidade

### ❌ Modificações Proibidas
- Refatoração não solicitada
- Mudanças de arquitetura
- Alteração de fluxos de dados
- Remoção de funcionalidades
- Mudanças de estado/hooks sem necessidade

### 🔍 Como Verificar Proteção
Execute o script de verificação:
```bash
./scripts/verify-protected-pages.sh
```

### 📞 Em Caso de Dúvida
**SEMPRE PERGUNTE AO USUÁRIO ANTES DE MODIFICAR QUALQUER PÁGINA PROTEGIDA**

---
*Documento criado em: ${new Date().toLocaleDateString('pt-BR')}*
*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*