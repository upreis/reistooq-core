# 📋 Formato de Importação de Estoque

**Criado em:** 2025-11-05  
**Última atualização:** 2025-11-05

---

## ✅ CAMPOS OBRIGATÓRIOS

Apenas **2 campos** são obrigatórios para importar produtos:

| Campo | Nome na Planilha | Tipo | Exemplo |
|-------|-----------------|------|---------|
| SKU Interno | `SKU Interno` | Texto | `PROD001` |
| Nome | `Nome` | Texto | `Produto Exemplo` |

**IMPORTANTE:** 
- Todos os outros campos são **opcionais**
- Se um campo estiver vazio, o sistema usará valores padrão

---

## 📊 CAMPOS OPCIONAIS

### 1. Informações Básicas
| Campo | Nome na Planilha | Tipo | Exemplo | Valor Padrão se Vazio |
|-------|-----------------|------|---------|----------------------|
| Descrição | `Descrição` | Texto | `Descrição do produto` | `null` |
| Código de Barras | `Código de Barras` | Texto/Número | `1234567890123` | `null` |
| URL da Imagem | `URL da Imagem` | URL | `https://exemplo.com/img.jpg` | `null` |
| Status | `Status` | Texto | `Ativo` ou `Inativo` | `Ativo` |

### 2. Categorias
| Campo | Nome na Planilha | Tipo | Exemplo | Nota |
|-------|-----------------|------|---------|------|
| Categoria Principal | `Categoria Principal` | Texto | `Eletrônicos` | Opcional |
| Categoria | `Categoria` | Texto | `Smartphones` | Opcional |

**Resultado:** Se ambos preenchidos → "Eletrônicos → Smartphones"

### 3. Estoque
| Campo | Nome na Planilha | Tipo | Exemplo | Valor Padrão |
|-------|-----------------|------|---------|--------------|
| Estoque Atual | `Estoque Atual` | Número | `10` | `0` |
| Estoque Mínimo | `Estoque Mínimo` | Número | `5` | `0` |
| Estoque Máximo | `Estoque Máximo` | Número | `100` | `0` |
| Localização | `Localização` | Texto | `Estoque A1` | `null` |

### 4. Preços
| Campo | Nome na Planilha | Tipo | Exemplo | Valor Padrão |
|-------|-----------------|------|---------|--------------|
| Preço Custo | `Preço Custo` | Número | `50.00` | `null` |
| Preço Venda | `Preço Venda` | Número | `75.00` | `null` |

**NOTA:** Pode deixar vazio se não souber o preço ainda!

### 5. Medidas e Pesos
| Campo | Nome na Planilha | Tipo | Exemplo | Valor Padrão |
|-------|-----------------|------|---------|--------------|
| Peso Líquido (Kg) | `Peso Líquido (Kg)` | Número | `0.5` | `null` |
| Peso Bruto (Kg) | `Peso Bruto (Kg)` | Número | `0.6` | `null` |
| Largura (cm) | `Largura (cm)` | Número | `10` | `null` |
| Altura (cm) | `Altura (cm)` | Número | `20` | `null` |
| Comprimento (cm) | `Comprimento (cm)` | Número | `15` | `null` |

### 6. Fiscais
| Campo | Nome na Planilha | Tipo | Exemplo | Valor Padrão |
|-------|-----------------|------|---------|--------------|
| NCM | `NCM` | Texto/Número | `85176990` | `null` |
| Código CEST | `Código CEST` | Texto/Número | `0100100` | `null` |
| Origem | `Origem` | Texto | `Nacional` | `null` |

### 7. Logística
| Campo | Nome na Planilha | Tipo | Exemplo | Valor Padrão |
|-------|-----------------|------|---------|--------------|
| Sob Encomenda | `Sob Encomenda` | Texto | `Sim` ou `Não` | `Não` |
| Dias para Preparação | `Dias para Preparação` | Número | `0` | `0` |
| Unidade de Medida | `Unidade de Medida` | Texto | `UN` | `null` |
| Nº Volumes | `Nº Volumes` | Número | `1` | `null` |
| Tipo Embalagem | `Tipo Embalagem` | Texto | `Caixa` | `null` |

---

## 📝 EXEMPLO DE PLANILHA MÍNIMA

**Apenas campos obrigatórios:**

| SKU Interno | Nome |
|-------------|------|
| PROD001 | Produto A |
| PROD002 | Produto B |
| PROD003 | Produto C |

**Resultado:** ✅ Importação bem-sucedida! Todos os outros campos ficarão vazios.

---

## 📝 EXEMPLO DE PLANILHA COMPLETA

| SKU Interno | Nome | Descrição | Estoque Atual | Preço Custo | Preço Venda | Categoria Principal | Categoria |
|-------------|------|-----------|---------------|-------------|-------------|---------------------|-----------|
| PROD001 | Produto A | Descrição A | 10 | 50.00 | 75.00 | Eletrônicos | Smartphones |
| PROD002 | Produto B | Descrição B | 5 | 30.00 | 45.00 | | |
| PROD003 | Produto C | | 0 | | | Festas | Balões |

**Resultado:** 
- PROD001: Completo
- PROD002: Sem categoria
- PROD003: Sem descrição, estoque 0, sem preços

---

## ⚠️ REGRAS IMPORTANTES

### 1. SKU Duplicado
❌ **Erro se:**
- Mesmo SKU aparece **2x na planilha**

✅ **OK se:**
- SKU já existe no sistema → Sistema **ATUALIZA** o produto

### 2. Campos Numéricos
❌ **Erro se:**
- Colocar texto em campo numérico (ex: "abc" em Estoque Atual)

✅ **OK se:**
- Deixar vazio → Sistema usa `0` ou `null`
- Colocar número com decimais: `10.5` ou `10,5`

### 3. URL da Imagem
❌ **Erro se:**
- URL inválida (ex: "imagem.jpg" sem https://)

✅ **OK se:**
- URL completa: `https://exemplo.com/imagem.jpg`
- Campo vazio

### 4. Categorias
- ✅ Podem ficar vazias
- ✅ Não precisam existir previamente no sistema
- ✅ Serão criadas automaticamente

---

## 🎯 COMPORTAMENTO DE IMPORTAÇÃO

### Produto NOVO (SKU não existe):
```
✅ Cria produto em `produtos`
✅ Cria estoque em `estoque_por_local` → Estoque Principal
✅ Quantidade = valor da coluna "Estoque Atual" (ou 0 se vazia)
```

### Produto EXISTENTE (SKU já existe):
```
✅ Atualiza produto em `produtos`
✅ Atualiza/Cria estoque em `estoque_por_local` → Estoque Principal
✅ Campos vazios na planilha → MANTÉM valores do sistema
✅ Campos preenchidos → SUBSTITUI valores do sistema
```

---

## 📥 ONDE OS PRODUTOS APARECEM

**Após importação bem-sucedida:**
- ✅ Produtos aparecem em: **Estoque Principal**
- ❌ Produtos NÃO aparecem em: Outros locais de estoque

**Para transferir para outros locais:**
1. Vá em Estoque Principal
2. Selecione os produtos
3. Use "Transferir Estoque" → Escolha destino

---

## 🚨 TROUBLESHOOTING

### "Importação concluída mas produtos não aparecem"
**Causas possíveis:**
1. ❌ Você está vendo outro local (não Estoque Principal)
   - **Solução:** Mude para "Estoque Principal" no seletor de local

2. ❌ Filtros ativos na tabela
   - **Solução:** Clique em "Limpar Filtros"

3. ❌ Busca ativa
   - **Solução:** Limpe o campo de busca

### "SKUs duplicados na planilha"
**Causa:** Mesmo SKU repetido no arquivo Excel
**Solução:** 
```
Procure duplicados:
1. Selecione coluna "SKU Interno"
2. Formatação Condicional → Realçar Duplicatas
3. Remova linhas duplicadas
```

### "Erro ao criar produto"
**Possíveis causas:**
1. SKU vazio
2. Nome vazio
3. Texto em campo numérico
4. URL de imagem inválida

**Como resolver:**
1. Baixe relatório de erros (botão no modal)
2. Corrija linhas com erro no Excel
3. Importe novamente

---

## 💡 DICAS PROFISSIONAIS

### 1. Importar Primeiro, Preencher Depois
```
✅ Estratégia rápida:
1. Importe apenas SKU + Nome
2. Complete dados depois (preços, estoque, etc.)
3. Re-importe planilha atualizada (sistema faz UPSERT)
```

### 2. Atualização em Massa
```
✅ Para atualizar preços de 1000 produtos:
1. Baixe lista atual (Export)
2. Atualize apenas coluna "Preço Venda"
3. Re-importe → Sistema atualiza só os preços!
```

### 3. Validação Prévia no Excel
```
=SE(ÉERROS(PROCV(A2;A:A;1;FALSO));"OK";"DUPLICADO")
```
Fórmula para detectar SKUs duplicados antes de importar

---

## 📞 SUPORTE

**Logs detalhados:**
- Console do navegador (F12) mostra cada passo da importação
- Procure por `[createProduct]` e `❌` para ver erros

**Relatório de Erros:**
- Clique em "Baixar Relatório" após importação com erros
- Excel mostrará linha, SKU e motivo do erro
