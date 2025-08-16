#!/bin/bash
# Script para verificar uso de select('*') no código
# Uso: npm run guard:select ou ./scripts/guard-select.sh

echo "🔍 Verificando uso de select('*') no código..."

# Buscar por select('*') em arquivos TypeScript/JavaScript
violations=$(grep -r "select('\\*')" src/ 2>/dev/null | wc -l)

if [ $violations -gt 0 ]; then
  echo "❌ Encontradas $violations violações de select('*'):"
  grep -r "select('\\*')" src/ --color=always -n
  echo ""
  echo "💡 Use lista explícita de colunas ou RPC/view segura."
  exit 1
else
  echo "✅ Nenhuma violação de select('*') encontrada!"
  exit 0
fi