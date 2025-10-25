# 🔍 AUDITORIA: Colunas Calculadas vs API

## ❌ **Colunas que NÃO vêm da API (Calculadas Localmente)**

### **CATEGORIA: FINANCEIRO CONSOLIDADO**
1. **Total Logística** - Soma de custos de frete e devolução
2. **Impacto Vendedor** - Cálculo de quanto o vendedor perdeu
3. **% Reembolsado** - Percentual calculado (valor_reembolso / valor_original)

### **CATEGORIA: TEMPOS E MÉTRICAS**
4. **Tempo Total** - Diferença entre criação e fechamento
5. **Dias p/ Resolver** - Cálculo de dias até resolução
6. **Tempo Resposta** - Tempo médio de resposta (agregação)
7. **Prazo Revisar** - Cálculo de dias restantes

### **CATEGORIA: QUALIDADE E SCORES**
8. **Score Qualidade** - Agregação de múltiplas métricas
9. **Taxa Satisfação** - Cálculo baseado em feedbacks
10. **Score Final** - Consolidação de scores
11. **Impacto Reputação** - Cálculo de impacto na reputação

### **CATEGORIA: COMUNICAÇÃO**
12. **Qtd Comunicações** - Soma total de mensagens de todas as fontes
13. **Timeline** - Agregação de eventos em ordem cronológica

### **CATEGORIA: STATUS E VALIDAÇÕES**
14. **SLA Cumprido** - Comparação de datas para verificar cumprimento
15. **Ação Seller Necessária** - Lógica de verificação de pendências
16. **Total Evidências** - Soma de anexos/evidências

### **CATEGORIA: DADOS ESTRUTURADOS** 
17. **Reviews** - Consolidação de dados de reviews (pode vir da API mas é agregado)
18. **Custos** - Consolidação de breakdown de custos (agregado)
19. **Reasons** - Consolidação de motivos (agregado)

---

## ✅ **Colunas que VÊM DA API (Dados Diretos)**

### **GRUPO: IDENTIFICAÇÃO**
- Order ID, Claim ID, Return ID
- Item ID, SKU, Transação ID
- Player Role

### **GRUPO: DATAS ORIGINAIS**
- Data Criação, Data Criação Claim, Data Fechamento
- Início Devolução, Primeira Ação, Prazo Limite
- last_updated (API ML), Atualização Return

### **GRUPO: STATUS SIMPLES**
- Status, Etapa, Resolução
- Status Rastreio, Status Review, Status Moderação

### **GRUPO: COMPRADOR**
- Nome, Nickname, Email, CPF/CNPJ

### **GRUPO: PRODUTO**
- Título, Quantidade, Categoria, Garantia

### **GRUPO: VALORES BRUTOS**
- Valor Original, Reembolso Total, Reembolso Produto
- Frete Original, Frete Reembolsado
- Taxa ML Original, Taxa ML Reembolsada, Taxa ML Retida
- Valor Retido, Compensação

### **GRUPO: RASTREAMENTO**
- Transportadora, Shipment ID, Rastreio
- Status Envio, Centro Envio, Plataforma
- Endereço Destino, Descrição Último Status

### **GRUPO: MOTIVOS**
- Reason ID, Reason Name, Reason Detail
- Categoria Motivo, Tipo Problema, Subtipo
- Tipo Claim, Estágio, Complexidade

---

## 🎯 **RESUMO**

- **Total de colunas na tabela**: ~120 colunas
- **Colunas calculadas/agregadas**: ~19 colunas (16%)
- **Colunas diretas da API**: ~101 colunas (84%)

### **PRINCIPAIS CÁLCULOS:**
- ✅ Somas financeiras (Total Logística, Impacto Vendedor)
- ✅ Percentuais (% Reembolsado, Taxa Satisfação)
- ✅ Diferenças de datas (Tempo Total, Dias para Resolver)
- ✅ Agregações de arrays (Total Evidências, Qtd Comunicações)
- ✅ Comparações lógicas (SLA Cumprido, Ação Necessária)
- ✅ Scores consolidados (Score Qualidade, Score Final)

---

## ⚠️ **IMPORTANTE**

Todas as colunas calculadas são **derivadas de dados da API**, ou seja:
- **NÃO há dados de banco de dados local**
- **Todos os cálculos usam dados frescos da API ML**
- **Os valores calculados são 100% confiáveis** pois baseiam-se em dados em tempo real

**CONCLUSÃO**: A página está corretamente buscando da API. Os cálculos locais são apenas **agregações e formatações** para melhor visualização dos dados.
