#!/usr/bin/env node

// 🛡️ Script de Verificação da Blindagem do Sistema de Pedidos
// Este script verifica se todos os componentes críticos estão presentes e funcionais

const fs = require('fs');
const path = require('path');

const CRITICAL_FILES = [
  'src/pages/Pedidos.tsx',
  'src/components/pedidos/SimplePedidosPage.tsx',
  'src/services/pedidos.ts',
  'src/hooks/usePedidosFilters.ts',
  'src/components/pedidos/PedidosFilters.tsx',
  'src/components/pedidos/PedidosTable.tsx',
  'src/components/pedidos/BaixaEstoqueModal.tsx',
  'src/components/MeliOrders.tsx',
  'src/core/pedidos/index.ts',
  'src/core/pedidos/guards/PedidosGuard.tsx',
  'src/core/pedidos/BLINDAGEM_SISTEMA_PEDIDOS.md'
];

const CRITICAL_FUNCTIONS = {
  'src/services/pedidos.ts': ['listPedidos', 'usePedidosHybrid', 'mapMlToUi'],
  'src/hooks/usePedidosFilters.ts': ['usePedidosFilters'],
  'src/components/pedidos/PedidosFilters.tsx': ['PedidosFilters'],
  'src/components/pedidos/PedidosTable.tsx': ['PedidosTable']
};

console.log('🛡️  VERIFICANDO BLINDAGEM DO SISTEMA DE PEDIDOS...\n');

let allGood = true;
let errors = [];
let warnings = [];

// 1. Verificar existência dos arquivos críticos
console.log('📂 Verificando arquivos críticos...');
CRITICAL_FILES.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - ARQUIVO AUSENTE`);
    errors.push(`Arquivo crítico ausente: ${file}`);
    allGood = false;
  }
});

// 2. Verificar conteúdo crítico dos arquivos
console.log('\n🔍 Verificando conteúdo dos arquivos...');
Object.entries(CRITICAL_FUNCTIONS).forEach(([file, functions]) => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    functions.forEach(func => {
      if (content.includes(func)) {
        console.log(`   ✅ ${file} - ${func}`);
      } else {
        console.log(`   ⚠️  ${file} - ${func} NÃO ENCONTRADA`);
        warnings.push(`Função ${func} não encontrada em ${file}`);
      }
    });
  }
});

// 3. Verificar se a página principal está protegida
console.log('\n🛡️  Verificando proteção da página principal...');
const pedidosPagePath = path.join(process.cwd(), 'src/pages/Pedidos.tsx');
if (fs.existsSync(pedidosPagePath)) {
  const content = fs.readFileSync(pedidosPagePath, 'utf8');
  if (content.includes('PedidosGuard')) {
    console.log('   ✅ Página principal protegida com PedidosGuard');
  } else {
    console.log('   ⚠️  Página principal SEM proteção PedidosGuard');
    warnings.push('Página Pedidos.tsx não está protegida com PedidosGuard');
  }
  
  if (content.includes('PÁGINA PROTEGIDA')) {
    console.log('   ✅ Comentário de proteção presente');
  } else {
    console.log('   ⚠️  Comentário de proteção ausente');
    warnings.push('Comentário de proteção ausente em Pedidos.tsx');
  }
}

// 4. Verificar integridade do SimplePedidosPage
console.log('\n📊 Verificando SimplePedidosPage...');
const simplePedidosPath = path.join(process.cwd(), 'src/components/pedidos/SimplePedidosPage.tsx');
if (fs.existsSync(simplePedidosPath)) {
  const content = fs.readFileSync(simplePedidosPath, 'utf8');
  const stats = fs.statSync(simplePedidosPath);
  
  // Verificar se tem o tamanho esperado (aproximadamente 1194 linhas)
  const lines = content.split('\n').length;
  if (lines > 1000 && lines < 1500) {
    console.log(`   ✅ Arquivo tem tamanho esperado (${lines} linhas)`);
  } else {
    console.log(`   ⚠️  Arquivo tem tamanho inesperado (${lines} linhas)`);
    warnings.push(`SimplePedidosPage.tsx tem ${lines} linhas (esperado: ~1194)`);
  }
  
  // Verificar funções críticas
  const criticalParts = [
    'loadOrders',
    'loadAccounts', 
    'processarMapeamentos',
    'simplificarStatus',
    'renderStatusBaixa'
  ];
  
  criticalParts.forEach(part => {
    if (content.includes(part)) {
      console.log(`   ✅ Função ${part} presente`);
    } else {
      console.log(`   ❌ Função ${part} AUSENTE`);
      errors.push(`Função crítica ausente: ${part}`);
      allGood = false;
    }
  });
}

// 5. Verificar package.json
console.log('\n📦 Verificando dependências...');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const criticalDeps = [
    '@supabase/supabase-js',
    'react-router-dom',
    'lucide-react',
    '@tanstack/react-query'
  ];
  
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`   ✅ ${dep}`);
    } else {
      console.log(`   ⚠️  ${dep} - Dependência ausente`);
      warnings.push(`Dependência ausente: ${dep}`);
    }
  });
}

// 6. Resultado final
console.log('\n' + '='.repeat(60));
if (allGood && errors.length === 0) {
  console.log('🎉 SISTEMA BLINDADO ÍNTEGRO!');
  console.log('✅ Todos os componentes críticos estão presentes');
  console.log('✅ Funcionalidade principal protegida');
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} aviso(s):`);
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log('\n🛡️  Sistema de Pedidos operacional e protegido');
  process.exit(0);
} else {
  console.log('🚨 SISTEMA COMPROMETIDO!');
  console.log(`❌ ${errors.length} erro(s) crítico(s) encontrado(s):`);
  errors.forEach(error => console.log(`   - ${error}`));
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} aviso(s):`);
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log('\n🆘 AÇÃO NECESSÁRIA: Corrija os erros antes de prosseguir');
  process.exit(1);
}