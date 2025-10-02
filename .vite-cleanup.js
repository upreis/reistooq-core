// Script para limpar cache do Vite
const fs = require('fs');
const path = require('path');

const viteDir = path.join(__dirname, 'node_modules', '.vite');

try {
  if (fs.existsSync(viteDir)) {
    fs.rmSync(viteDir, { recursive: true, force: true });
    console.log('✅ Cache do Vite limpo com sucesso!');
  } else {
    console.log('ℹ️ Nenhum cache do Vite encontrado.');
  }
} catch (error) {
  console.error('❌ Erro ao limpar cache:', error);
}
