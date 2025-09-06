# 🔗 Modal de Mapeamento Inline - Página Pedidos

## Funcionalidade Implementada

Na página `/pedidos`, quando o status da coluna "Status da Baixa" for **"Mapear Incompleto"** ou **"Sem Mapear"**, o status agora é **clicável** e abre um modal de mapeamento diretamente na página, sem precisar navegar para `/de-para`.

## Como Funciona

### 1. **Visual Identificável**
- Status "Mapear Incompleto" e "Sem Mapear" têm:
  - **Cursor pointer** ao passar o mouse
  - **Borda tracejada dourada** para indicar que é clicável
  - **Tooltip** explicativo: "Clique para criar mapeamento"
  - **Efeito hover** com sombra e transição suave

### 2. **Modal de Mapeamento**
- **Informações do pedido** exibidas automaticamente
- **SKU do pedido** pré-preenchido (campo readonly)
- **Formulário completo** para criar mapeamento:
  - SKU de Estoque (obrigatório)
  - SKU Unitário (opcional)
  - Quantidade por Kit
  - Observações
  - Status Ativo/Inativo

### 3. **Integração Inteligente**
- **Auto-preenchimento**: SKU do pedido detectado automaticamente
- **Contexto preservado**: Informações do pedido exibidas no modal
- **Observações automáticas**: Referência ao pedido origem
- **Recarga automática**: Mapeamentos são reprocessados após salvar

## Benefícios para o Usuário

### ✅ **Fluxo Otimizado**
1. Usuário vê pedido com "Mapear Incompleto"
2. Clica diretamente no status
3. Modal abre com dados pré-preenchidos
4. Preenche apenas o SKU de estoque
5. Salva e volta à tabela com status atualizado

### ✅ **Sem Navegação**
- Não precisa sair da página `/pedidos`
- Não perde contexto ou filtros aplicados
- Processo muito mais rápido e eficiente

### ✅ **Visual Intuitivo**
- Fácil identificação de itens clicáveis
- Feedback visual claro
- Experiência consistente

## Implementação Técnica

### Componentes Criados
- **`MapeamentoModal.tsx`**: Modal especializado para pedidos
- **Event system**: Comunicação entre tabela e modal via CustomEvents
- **Auto-reload**: Reprocessamento automático de mapeamentos

### Integração
- Modal integrado na `SimplePedidosPage`
- Listener para evento `openMapeamentoModal`
- Uso dos hooks existentes de SKU mapping
- Compatível com sistema de persistência

### Dados Preservados
- Todos os filtros da página
- Estado de paginação
- Seleções de pedidos
- Cache de dados

## Próximos Passos Sugeridos

1. **Mapeamento em Lote**: Mapear múltiplos pedidos simultaneamente
2. **Sugestões Automáticas**: IA para sugerir SKUs baseado em histórico
3. **Validação de SKU**: Verificar se SKU de estoque existe
4. **Histórico de Mapeamentos**: Ver alterações anteriores no modal