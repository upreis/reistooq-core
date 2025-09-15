# Como Verificar as Novas Colunas de Indicadores

## Localização
As novas colunas foram adicionadas na página `/ml-orders-completas`, aba **"Devoluções Avançadas"**.

## Novas Colunas Adicionadas
1. **📋 Claim** - Indica se há dados detalhados do claim disponíveis
2. **📦 Return** - Indica se há dados de devolução disponíveis  
3. **⚖️ Mediação** - Indica se há dados de mediação disponíveis
4. **📎 Anexos** - Indica se há anexos/evidências disponíveis

## Como Visualizar

### 1. Acesse a página correta:
- Vá para `/ml-orders-completas`
- Clique na aba "Devoluções Avançadas" (segunda aba)

### 2. Na tabela você verá:
- As 4 novas colunas após a coluna "Status"
- Ícones coloridos quando há dados disponíveis:
  - 📋 (azul) = Dados de Claim
  - 📦 (verde) = Dados de Return
  - ⚖️ (laranja) = Dados de Mediação
  - 📎 (cinza) = Anexos
- "-" (cinza claro) quando não há dados

### 3. Para ver os dados funcionando:
- Execute uma sincronização/busca de dados
- Os registros que foram processados com a nova API mostrarão os ícones
- Clique no ícone "👁️" (Ver detalhes) para ver todos os dados completos

## Estrutura da Tabela Atualizada:
```
Order ID | Produto | SKU | Comprador | Qtd | Valor | Status | 📋 | 📦 | ⚖️ | 📎 | Data Criação | Data Atualização | Tipo | Motivo | Ações
```

## Exemplo de Dados para Teste:
Se você tiver dados com a estrutura:
```javascript
{
  "dados_claim": { /* dados do claim */ },
  "dados_return": { /* dados de return */ },
  // etc...
}
```

Os ícones aparecerão automaticamente na tabela.

## Troubleshooting:
- Se não vir as colunas: certifique-se de estar na aba "Devoluções Avançadas" 
- Se os ícones não aparecem: verifique se há dados sincronizados recentemente
- As colunas só mostrarão ícones para registros que tenham os dados correspondentes

As modificações foram aplicadas no arquivo correto: `src/components/ml/DevolucaoAvancadasTab.tsx`