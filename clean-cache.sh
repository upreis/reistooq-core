#!/bin/bash

echo "🧹 Limpando cache do Vite e node_modules..."

# Remove cache do Vite
rm -rf node_modules/.vite
echo "✅ Cache .vite removido"

# Remove dist
rm -rf dist
echo "✅ Pasta dist removida"

# Remove cache do navegador (instruções)
echo ""
echo "⚠️  IMPORTANTE: Você PRECISA limpar o cache do navegador!"
echo ""
echo "Chrome/Edge:"
echo "  1. Abra DevTools (F12)"
echo "  2. Clique com botão direito no ícone de reload"
echo "  3. Selecione 'Limpar cache e fazer recarga forçada'"
echo ""
echo "Ou simplesmente:"
echo "  - Windows/Linux: Ctrl + Shift + R"
echo "  - Mac: Cmd + Shift + R"
echo ""
echo "✅ Limpeza concluída! Agora recarregue a página com Ctrl+Shift+R"
