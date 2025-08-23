#!/usr/bin/env node

// 🧪 Script de Teste de Funcionalidade do Sistema de Pedidos
// Este script testa se as principais funcionalidades estão operacionais

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 TESTANDO FUNCIONALIDADES DO SISTEMA DE PEDIDOS...\n');

// Lista de testes a serem executados
const tests = [
  {
    name: 'Build do Sistema',
    command: 'npm run build',
    description: 'Verifica se o projeto compila sem erros',
    timeout: 60000
  },
  {
    name: 'Lint dos Arquivos Críticos',
    command: 'npx eslint src/pages/Pedidos.tsx src/components/pedidos/SimplePedidosPage.tsx src/services/pedidos.ts',
    description: 'Verifica qualidade do código dos arquivos principais',
    timeout: 30000
  },
  {
    name: 'TypeScript Check',
    command: 'npx tsc --noEmit',
    description: 'Verifica tipagem TypeScript',
    timeout: 45000
  }
];

let passedTests = 0;
let totalTests = tests.length;

function runTest(test) {
  return new Promise((resolve) => {
    console.log(`📋 Executando: ${test.name}`);
    console.log(`   ${test.description}`);
    
    const startTime = Date.now();
    const child = exec(test.command, { timeout: test.timeout }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        console.log(`   ❌ FALHOU (${duration}ms)`);
        if (stderr) console.log(`   Erro: ${stderr.slice(0, 200)}...`);
        resolve(false);
      } else {
        console.log(`   ✅ PASSOU (${duration}ms)`);
        passedTests++;
        resolve(true);
      }
    });

    child.on('timeout', () => {
      console.log(`   ⏰ TIMEOUT (${test.timeout}ms)`);
      resolve(false);
    });
  });
}

async function runAllTests() {
  console.log(`Iniciando ${totalTests} teste(s)...\n`);
  
  for (const test of tests) {
    await runTest(test);
    console.log(''); // Linha em branco
  }
  
  // Resultado final
  console.log('='.repeat(60));
  console.log(`📊 RESULTADO DOS TESTES:`);
  console.log(`✅ Passaram: ${passedTests}/${totalTests}`);
  console.log(`❌ Falharam: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('🛡️  Sistema de Pedidos está operacional');
    process.exit(0);
  } else {
    console.log('\n🚨 ALGUNS TESTES FALHARAM!');
    console.log('⚠️  Verifique os erros acima antes de prosseguir');
    process.exit(1);
  }
}

// Verificações preliminares
function preliminaryChecks() {
  console.log('🔍 Verificações preliminares...\n');
  
  // Verificar se node_modules existe
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    console.log('❌ node_modules não encontrado. Execute "npm install" primeiro.');
    process.exit(1);
  }
  
  // Verificar se package.json existe
  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    console.log('❌ package.json não encontrado. Execute este script na raiz do projeto.');
    process.exit(1);
  }
  
  console.log('✅ Verificações preliminares passaram\n');
}

// Função principal
async function main() {
  try {
    preliminaryChecks();
    await runAllTests();
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
    process.exit(1);
  }
}

main();