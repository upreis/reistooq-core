#!/bin/bash

echo "🔍 DIAGNÓSTICO ESPECÍFICO - ROUTER DUPLICADO"
echo "============================================"

# Verificar todos os imports de Router
echo ""
echo "📁 Imports de Router encontrados:"
find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "import.*Router\|from.*Router" | head -10

echo ""
echo "🔍 Componentes que podem estar criando Router:"
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "Router" | while read file; do
    echo "📍 Verificando: $file"
    if grep -q "Router.*>" "$file" || grep -q "<.*Router" "$file"; then
        echo "   ⚠️ Possível Router encontrado:"
        grep -n "Router.*>\|<.*Router" "$file" | head -3
    fi
done

echo ""
echo "🧪 Testando se o erro ainda existe:"
echo "   Para confirmar, acesse a aplicação e verifique o console."

echo ""
echo "💡 Arquivos que importam Router:"
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "Router" | head -10