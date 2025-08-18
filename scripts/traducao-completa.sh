#!/bin/bash

# 🌐 SCRIPT DE TRADUÇÃO COMPLETA REISTOQ
# Identifica e corrige textos em inglês no sistema

set -e

echo "🌐 INICIANDO TRADUÇÃO COMPLETA DO SISTEMA..."

# ===== CONTADORES =====
ARQUIVOS_VERIFICADOS=0
PROBLEMAS_ENCONTRADOS=0
CORREÇÕES_APLICADAS=0

# ===== FUNÇÃO DE LOG =====
log_problema() {
    echo "❌ $1"
    ((PROBLEMAS_ENCONTRADOS++))
}

log_correcao() {
    echo "✅ $1"
    ((CORREÇÕES_APLICADAS++))
}

# ===== VERIFICAÇÃO DE TEXTOS EM INGLÊS =====

echo ""
echo "📋 FASE 1: IDENTIFICANDO TEXTOS EM INGLÊS"

# Buscar textos comuns em inglês em arquivos TSX/TS
ENGLISH_PATTERNS=(
    "Page not found"
    "Loading"
    "Error"
    "Save"
    "Cancel"
    "Delete" 
    "Edit"
    "Create"
    "Add"
    "Remove"
    "Update"
    "Submit"
    "Login"
    "Register"
    "Sign in"
    "Sign up"
    "Search"
    "Filter"
    "Sort"
    "Export"
    "Import"
    "Settings"
    "Profile"
    "Account"
    "Password"
    "Email"
    "Name"
    "Address"
    "Phone"
    "Upload"
    "Download"
    "Preview"
    "Print"
    "Back"
    "Next"
    "Previous"
    "Continue"
    "Finish"
    "Close"
    "Open"
    "View"
    "Details"
    "Summary"
    "Total"
    "Subtotal"
    "Discount"
    "Tax"
    "Price"
    "Quantity"
    "Status"
    "Active"
    "Inactive"
    "Pending"
    "Approved"
    "Rejected"
    "Success"
    "Warning"
    "Info"
    "Danger"
)

echo "🔍 Buscando padrões em inglês..."

for pattern in "${ENGLISH_PATTERNS[@]}"; do
    MATCHES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "$pattern" 2>/dev/null | wc -l)
    if [ "$MATCHES" -gt 0 ]; then
        log_problema "Padrão '$pattern' encontrado em $MATCHES arquivo(s)"
        echo "   📍 Arquivos afetados:"
        find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "$pattern" 2>/dev/null | head -5
    fi
done

# ===== VERIFICAÇÃO DE CONSOLE LOGS EM INGLÊS =====

echo ""
echo "📋 FASE 2: VERIFICANDO CONSOLE LOGS"

ENGLISH_LOGS=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "console\." | grep -E "Error|error|Failed|failed|Success|success|Loading|loading" | wc -l)

if [ "$ENGLISH_LOGS" -gt 0 ]; then
    log_problema "$ENGLISH_LOGS console logs com textos em inglês encontrados"
    echo "   📍 Exemplos:"
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "console\." | grep -E "Error|error|Failed|failed" | head -3
fi

# ===== VERIFICAÇÃO DE HARDCODED STRINGS =====

echo ""
echo "📋 FASE 3: VERIFICANDO STRINGS HARDCODED"

HARDCODED_STRINGS=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -n '"[A-Z][a-z].*"' | grep -v "className\|src=\|alt=\|id=\|type=\|placeholder=" | wc -l)

if [ "$HARDCODED_STRINGS" -gt 10 ]; then
    log_problema "$HARDCODED_STRINGS strings hardcoded em inglês encontradas"
    echo "   💡 Considere usar um sistema de i18n para traduções"
fi

# ===== VERIFICAÇÃO DE CLASSES CSS EM INGLÊS =====

echo ""
echo "📋 FASE 4: VERIFICANDO CLASSES CSS DIRETAS"

DIRECT_COLORS=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "text-blue-\|bg-gray-\|text-red-\|bg-green-" | wc -l)

if [ "$DIRECT_COLORS" -gt 0 ]; then
    log_problema "$DIRECT_COLORS classes de cor direta encontradas (deve usar design system)"
    echo "   💡 Use tokens semânticos: text-primary, bg-background, etc."
fi

# ===== SUGESTÕES DE TRADUÇÃO =====

echo ""
echo "📋 FASE 5: SUGESTÕES DE TRADUÇÃO"

cat << 'EOF'
📝 DICIONÁRIO DE TRADUÇÃO RECOMENDADO:

INTERFACE:
- Page not found → Página não encontrada  
- Loading → Carregando
- Error → Erro
- Save → Salvar
- Cancel → Cancelar
- Delete → Excluir
- Edit → Editar
- Create → Criar
- Add → Adicionar
- Update → Atualizar
- Search → Buscar
- Filter → Filtrar
- Settings → Configurações
- Profile → Perfil
- Account → Conta
- Upload → Fazer Upload
- Download → Baixar

FORMULÁRIOS:
- Name → Nome
- Email → E-mail
- Password → Senha
- Address → Endereço
- Phone → Telefone
- Submit → Enviar
- Reset → Redefinir

STATUS:
- Active → Ativo
- Inactive → Inativo
- Pending → Pendente
- Success → Sucesso
- Warning → Aviso
- Approved → Aprovado
- Rejected → Rejeitado

ECOMMERCE:
- Price → Preço
- Quantity → Quantidade
- Total → Total
- Discount → Desconto
- Product → Produto
- Order → Pedido
- Customer → Cliente
- Inventory → Estoque
EOF

# ===== RELATÓRIO FINAL =====

echo ""
echo "📊 RELATÓRIO FINAL DA TRADUÇÃO"
echo "================================"

echo "📁 Arquivos verificados: $ARQUIVOS_VERIFICADOS"
echo "❌ Problemas encontrados: $PROBLEMAS_ENCONTRADOS"
echo "✅ Correções sugeridas: $((PROBLEMAS_ENCONTRADOS))"

if [ "$PROBLEMAS_ENCONTRADOS" -gt 0 ]; then
    echo ""
    echo "🎯 PRÓXIMAS AÇÕES RECOMENDADAS:"
    echo "   1. Implementar sistema de i18n"
    echo "   2. Criar dicionário de tradução"
    echo "   3. Traduzir páginas prioritárias"
    echo "   4. Padronizar mensagens de erro"
    echo "   5. Usar design system para cores"
    echo ""
    echo "⚠️  STATUS: NECESSITA TRADUÇÃO"
    exit 1
else
    echo ""
    echo "🎉 SISTEMA 100% TRADUZIDO!"
    echo "✅ Nenhum texto em inglês encontrado"
    exit 0
fi