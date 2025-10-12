# 📊 RESUMO: Campos Vazios na Tabela de Devoluções

## ✅ O QUE DESCOBRIMOS

### 1. **Os exemplos são REAIS ou FICTÍCIOS?**
**RESPOSTA: São REAIS** - Baseados na documentação oficial da API do Mercado Livre.

**MAS** nem todos os 50 claims têm todos os dados disponíveis.

---

## 📈 ESTATÍSTICAS DOS DADOS (dos logs):

### Dados que EXISTEM (parcialmente):
- ✅ `claimDetails` - **presente em ~80% dos casos**
- ✅ `claimMessages` - **presente em ~40% dos casos**  
- ✅ `returnsV2` - **presente em ~20% dos casos**

### Dados que NÃO EXISTEM (para nenhum claim):
- ❌ `mediationDetails` - **0% (404 = não existe)**
- ❌ `claimAttachments` - **0% (405 = endpoint bloqueado)**
- ❌ `shipmentHistory` - **0% (404 = não tem shipment ainda)**
- ❌ `changeDetails` - **0% (não são trocas)**

---

## 🔍 POR QUE OS DADOS ESTÃO VAZIOS?

### 1. **ULTIMA_MENSAGEM_DATA** (0/41)
- ✅ Endpoint funciona: `/messages/packs/{pack_id}/sellers/{seller_id}`
- ⚠️ **Problema**: Apenas 40% dos claims têm mensagens
- 📊 **Realidade**: 20 de 50 claims terão esse campo

### 2. **DATA_ESTIMADA_TROCA** (0/41)  
- ❌ Endpoint não existe: `/post-purchase/v1/changes/{change_id}`
- ⚠️ **Problema**: Nenhum claim atual é uma "troca"
- 📊 **Realidade**: 0% terão esse campo (são todos devoluções)

### 3. **DATA_VENCIMENTO_ACAO** (0/41)
- ✅ Endpoint funciona: `/post-purchase/v1/claims/{claim_id}`
- ❌ **Problema**: Campo `resolution.deadline` vem NULL da API
- 📊 **Realidade**: ML não informa deadline em claims antigos

### 4. **STATUS_RASTREAMENTO** (parcial)
- ✅ Endpoint funciona: `/shipments/{id}/history`
- ⚠️ **Problema**: Nem todo return tem shipment criado ainda
- 📊 **Realidade**: ~20% dos claims terão rastreamento

### 5. **ANEXOS** (18/41 detectados)
- ❌ Endpoint bloqueado: Retorna 405 (Method Not Allowed)
- ⚠️ **Problema**: Provável limitação de permissão da API ML
- 📊 **Realidade**: 0% via API (precisa buscar de outra forma)

---

## 🎯 CONCLUSÃO

### ✅ Campos que APARECERÃO (quando houver dados):
- `ultima_mensagem_data` - ~40% dos claims
- `numero_interacoes` - ~40% dos claims  
- `status_rastreamento` - ~20% dos claims
- `codigo_rastreamento` - ~20% dos claims

### ❌ Campos que FICARÃO VAZIOS (para sempre):
- `data_estimada_troca` - Não há trocas nos dados atuais
- `data_vencimento_acao` - ML não fornece para claims antigos
- `anexos_comprador/vendedor/ml` - API bloqueada (405)

### 🔄 Campos que PODEM APARECER (futuramente):
- `data_estimada_troca` - SE houver claims de troca
- `anexos_*` - SE ML liberar o endpoint

---

## 💡 PRÓXIMOS PASSOS

1. ✅ **Aceitar realidade**: Nem todo campo terá dados
2. ✅ **Melhorar UI**: Mostrar "N/A" quando campo vazio
3. ✅ **Documentar**: Explicar quais campos podem ficar vazios
4. ⚠️ **Investigar**: Por que anexos retornam 405 (permissão?)

---

## 🔧 STATUS ATUAL DA IMPLEMENTAÇÃO

✅ **ml-api-direct** - Buscando todos os endpoints possíveis  
✅ **processClaimData** - Mapeamento corrigido  
✅ **Logs detalhados** - Identificando exatamente o que falha  
⚠️ **Attachments** - Endpoint bloqueado (405)  

**RESULTADO ESPERADO**: Campos de mensagem e rastreamento aparecerão para ~20-40% dos claims. Campos de troca e anexos ficarão vazios.
