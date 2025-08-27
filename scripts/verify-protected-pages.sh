#!/bin/bash

# 🛡️ SCRIPT DE VERIFICAÇÃO - PÁGINAS PROTEGIDAS
# Este script verifica se as páginas protegidas estão íntegras

echo "🛡️ VERIFICANDO SISTEMA DE PROTEÇÃO DE PÁGINAS CRÍTICAS"
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
SUCCESS=0
WARNING=0
ERROR=0

# Função para verificar arquivo
check_protected_file() {
    local filepath=$1
    local description=$2
    
    if [ -f "$filepath" ]; then
        # Verifica se tem o header de proteção
        if grep -q "🛡️" "$filepath" 2>/dev/null; then
            echo -e "${GREEN}✅ PROTEGIDO${NC} - $description ($filepath)"
            ((SUCCESS++))
        else
            echo -e "${YELLOW}⚠️  SEM PROTEÇÃO${NC} - $description ($filepath)"
            ((WARNING++))
        fi
    else
        echo -e "${RED}❌ ARQUIVO NÃO ENCONTRADO${NC} - $description ($filepath)"
        ((ERROR++))
    fi
}

echo ""
echo "🔍 VERIFICANDO PÁGINAS PRINCIPAIS..."

# Páginas principais
check_protected_file "src/pages/Pedidos.tsx" "Página Pedidos"
check_protected_file "src/pages/Historico.tsx" "Página Histórico"
check_protected_file "src/pages/Scanner.tsx" "Página Scanner"
check_protected_file "src/pages/DePara.tsx" "Página De-Para"
check_protected_file "src/pages/Estoque.tsx" "Página Estoque"
check_protected_file "src/pages/Index.tsx" "Dashboard Principal"

echo ""
echo "🔍 VERIFICANDO COMPONENTES CRÍTICOS..."

# Componentes críticos
check_protected_file "src/components/pedidos/SimplePedidosPage.tsx" "Componente Principal Pedidos"
check_protected_file "src/components/pedidos/PedidosTable.tsx" "Tabela de Pedidos"
check_protected_file "src/components/pedidos/PedidosTableMemo.tsx" "Tabela Memoizada"
check_protected_file "src/features/historico/components/HistoricoSimplePage.tsx" "Componente Histórico"

echo ""
echo "🔍 VERIFICANDO GUARDS DE PROTEÇÃO..."

# Guards
check_protected_file "src/core/pedidos/guards/PedidosGuard.tsx" "Guard Pedidos"
check_protected_file "src/core/historico/guards/HistoricoGuard.tsx" "Guard Histórico"

echo ""
echo "🔍 VERIFICANDO DOCUMENTAÇÃO..."

# Documentação
check_protected_file "PROTECTED_PAGES.md" "Documentação de Proteção"

echo ""
echo "=================================================="
echo "📊 RELATÓRIO FINAL:"
echo -e "${GREEN}✅ Sucessos: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Avisos: $WARNING${NC}"
echo -e "${RED}❌ Erros: $ERROR${NC}"

if [ $ERROR -eq 0 ]; then
    echo -e "\n${GREEN}🛡️ SISTEMA DE PROTEÇÃO OPERACIONAL${NC}"
    exit 0
else
    echo -e "\n${RED}🚨 PROBLEMAS DETECTADOS NO SISTEMA DE PROTEÇÃO${NC}"
    exit 1
fi