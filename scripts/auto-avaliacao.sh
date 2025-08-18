#!/bin/bash

# 🛡️ SISTEMA DE AUTO-AVALIAÇÃO REISTOQ
# Valida mudanças antes e depois da implementação

set -e

echo "🔍 INICIANDO AUTO-AVALIAÇÃO DO SISTEMA..."

# ===== VERIFICAÇÕES PRÉ-IMPLEMENTAÇÃO =====

echo ""
echo "📋 FASE 1: VERIFICAÇÕES PRÉ-IMPLEMENTAÇÃO"

# 1. Verificar Routers duplicados
echo "🔍 Verificando Routers duplicados..."

# Verificar imports de BrowserRouter (deve ter apenas 1 em main.tsx)
BROWSER_ROUTER_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "BrowserRouter")
BROWSER_ROUTER_COUNT=$(echo "$BROWSER_ROUTER_FILES" | grep -v "^$" | wc -l)

echo "📍 Arquivos com BrowserRouter:"
echo "$BROWSER_ROUTER_FILES"

if [ "$BROWSER_ROUTER_COUNT" -gt 1 ]; then
    echo "❌ ERRO CRÍTICO: $BROWSER_ROUTER_COUNT arquivos com BrowserRouter! Máximo permitido: 1 (main.tsx)"
    exit 1
elif [ "$BROWSER_ROUTER_COUNT" -eq 1 ]; then
    if echo "$BROWSER_ROUTER_FILES" | grep -q "main.tsx"; then
        echo "✅ BrowserRouter apenas em main.tsx (correto)"
    else
        echo "❌ ERRO: BrowserRouter não está em main.tsx"
        exit 1
    fi
else
    echo "❌ ERRO: Nenhum BrowserRouter encontrado"
    exit 1
fi

# 2. Verificar hooks condicionais
echo "🔍 Verificando hooks condicionais..."
CONDITIONAL_HOOKS=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "if.*use[A-Z]" | wc -l)
if [ "$CONDITIONAL_HOOKS" -gt 0 ]; then
    echo "⚠️ AVISO: $CONDITIONAL_HOOKS hooks condicionais encontrados"
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "if.*use[A-Z]"
else
    echo "✅ Hooks sem condicionais"
fi

# 3. Verificar exports duplicados
echo "🔍 Verificando exports duplicados..."
DUPLICATE_EXPORTS=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "export default" | while read file; do
    count=$(grep -c "export default" "$file")
    if [ "$count" -gt 1 ]; then
        echo "$file: $count exports"
    fi
done | wc -l)

if [ "$DUPLICATE_EXPORTS" -gt 0 ]; then
    echo "❌ ERRO: Exports duplicados encontrados"
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "export default" | while read file; do
        count=$(grep -c "export default" "$file")
        if [ "$count" -gt 1 ]; then
            echo "📍 $file: $count exports"
        fi
    done
    exit 1
else
    echo "✅ Exports únicos confirmados"
fi

# 4. Verificar imports circulares básicos
echo "🔍 Verificando imports circulares..."
CIRCULAR_IMPORTS=$(find src -name "*.tsx" -o -name "*.ts" | while read file; do
    imports=$(grep -o "from ['\"].*['\"]" "$file" | sed "s/from ['\"]//g" | sed "s/['\"]//g" | grep "^\./" | wc -l)
    if [ "$imports" -gt 10 ]; then
        echo "$file: $imports imports relativos"
    fi
done | wc -l)

if [ "$CIRCULAR_IMPORTS" -gt 0 ]; then
    echo "⚠️ AVISO: Possíveis imports circulares detectados"
else
    echo "✅ Imports aparentemente corretos"
fi

# ===== VERIFICAÇÕES DE SEGURANÇA =====

echo ""
echo "🔒 FASE 2: VERIFICAÇÕES DE SEGURANÇA"

# 5. Verificar uso de dados sensíveis
echo "🔍 Verificando acesso a dados sensíveis..."
SENSITIVE_ACCESS=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "from.*profiles\|from.*historico_vendas\|from.*integration_secrets" | wc -l)
if [ "$SENSITIVE_ACCESS" -gt 0 ]; then
    echo "⚠️ AVISO: $SENSITIVE_ACCESS acessos diretos a tabelas sensíveis encontrados"
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "from.*profiles\|from.*historico_vendas\|from.*integration_secrets"
    echo "💡 Use get_profiles_safe(), get_historico_vendas_masked() ao invés de acesso direto"
else
    echo "✅ Acesso a dados sensíveis seguro"
fi

# 6. Verificar logs com dados sensíveis
echo "🔍 Verificando logs com dados sensíveis..."
SENSITIVE_LOGS=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "console\.log.*password\|console\.log.*secret\|console\.log.*token\|console\.log.*key" | wc -l)
if [ "$SENSITIVE_LOGS" -gt 0 ]; then
    echo "❌ ERRO DE SEGURANÇA: $SENSITIVE_LOGS logs com dados sensíveis"
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "console\.log.*password\|console\.log.*secret\|console\.log.*token\|console\.log.*key"
    exit 1
else
    echo "✅ Logs sem dados sensíveis"
fi

# ===== VERIFICAÇÕES DE QUALIDADE =====

echo ""
echo "📊 FASE 3: VERIFICAÇÕES DE QUALIDADE"

# 7. Verificar TODOs antigos
echo "🔍 Verificando TODOs antigos..."
TODO_COUNT=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "TODO\|FIXME\|XXX" | wc -l)
if [ "$TODO_COUNT" -gt 20 ]; then
    echo "⚠️ AVISO: $TODO_COUNT TODOs encontrados - considere limpeza"
else
    echo "✅ TODOs em quantidade aceitável: $TODO_COUNT"
fi

# 8. Verificar any excessivo no TypeScript
echo "🔍 Verificando uso de 'any' no TypeScript..."
ANY_COUNT=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -n ": any\|<any>" | wc -l)
if [ "$ANY_COUNT" -gt 10 ]; then
    echo "⚠️ AVISO: $ANY_COUNT usos de 'any' - considere tipagem específica"
    echo "📍 Locais:"
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -n ": any\|<any>" | head -5
else
    echo "✅ Uso de 'any' controlado: $ANY_COUNT"
fi

# ===== VERIFICAÇÕES DE PERFORMANCE =====

echo ""
echo "⚡ FASE 4: VERIFICAÇÕES DE PERFORMANCE"

# 9. Verificar imports pesados
echo "🔍 Verificando imports pesados..."
HEAVY_IMPORTS=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "import.*\*.*from\|import.*{.*{.*}.*}.*from" | wc -l)
if [ "$HEAVY_IMPORTS" -gt 5 ]; then
    echo "⚠️ AVISO: $HEAVY_IMPORTS imports pesados encontrados"
    echo "💡 Considere tree shaking ou imports específicos"
else
    echo "✅ Imports otimizados"
fi

# 10. Verificar re-renders desnecessários
echo "🔍 Verificando possíveis re-renders desnecessários..."
RERENDER_RISKS=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "onClick.*=>.*{}\|onChange.*=>.*{}" | wc -l)
if [ "$RERENDER_RISKS" -gt 10 ]; then
    echo "⚠️ AVISO: $RERENDER_RISKS funções inline encontradas"
    echo "💡 Considere useCallback para otimização"
else
    echo "✅ Funções otimizadas"
fi

# ===== RELATÓRIO FINAL =====

echo ""
echo "📋 RELATÓRIO FINAL DA AUTO-AVALIAÇÃO"
echo "=================================="

# Status geral
if [ "$ROUTER_COUNT" -le 1 ] && [ "$DUPLICATE_EXPORTS" -eq 0 ] && [ "$SENSITIVE_LOGS" -eq 0 ]; then
    echo "✅ STATUS GERAL: APROVADO PARA IMPLEMENTAÇÃO"
    echo ""
    echo "🎯 RESUMO:"
    echo "   • Router único: ✅"
    echo "   • Exports únicos: ✅"
    echo "   • Segurança: ✅"
    echo "   • Hooks condicionais: $CONDITIONAL_HOOKS"
    echo "   • TODOs: $TODO_COUNT"
    echo "   • Uso de 'any': $ANY_COUNT"
    echo ""
    echo "💡 PRÓXIMOS PASSOS:"
    echo "   1. Implementar mudanças planejadas"
    echo "   2. Executar testes unitários"
    echo "   3. Executar auto-avaliação pós-implementação"
    echo "   4. Deploy após validação completa"
else
    echo "❌ STATUS GERAL: BLOQUEADO - CORRIGIR ERROS CRÍTICOS"
    echo ""
    echo "🚨 ERROS CRÍTICOS A CORRIGIR:"
    [ "$ROUTER_COUNT" -gt 1 ] && echo "   • Routers duplicados: $ROUTER_COUNT"
    [ "$DUPLICATE_EXPORTS" -gt 0 ] && echo "   • Exports duplicados: $DUPLICATE_EXPORTS"
    [ "$SENSITIVE_LOGS" -gt 0 ] && echo "   • Logs com dados sensíveis: $SENSITIVE_LOGS"
    echo ""
    echo "🛑 NÃO PROSSIGA ATÉ CORRIGIR TODOS OS ERROS CRÍTICOS"
    exit 1
fi

echo ""
echo "🛡️ Auto-avaliação concluída com sucesso!"
echo "📅 Executado em: $(date)"
echo "🔄 Próxima avaliação recomendada após próxima mudança significativa"