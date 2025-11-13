import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🔒 Testes de Segurança - Search Path
 * 
 * Valida que todas as funções SECURITY DEFINER incluem SET search_path = public
 * para prevenir ataques de SQL injection via search path manipulation
 */

describe('Security: Function Search Path Validation', () => {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  
  it('should have SET search_path = public in all SECURITY DEFINER functions', () => {
    const migrationFiles = readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
    
    const functionsWithoutSearchPath: string[] = [];
    const securityDefinerFunctions: string[] = [];
    
    migrationFiles.forEach(file => {
      const content = readFileSync(join(migrationsDir, file), 'utf-8');
      
      // Regex para encontrar funções SECURITY DEFINER
      const functionRegex = /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
      const matches = [...content.matchAll(functionRegex)];
      
      matches.forEach(match => {
        const functionName = match[2];
        const functionStartIndex = match.index || 0;
        
        // Pegar o bloco da função (até LANGUAGE ou $$;)
        const functionBlock = content.slice(
          functionStartIndex,
          content.indexOf('$$;', functionStartIndex) + 3
        );
        
        // Verificar se é SECURITY DEFINER
        if (/SECURITY\s+DEFINER/i.test(functionBlock)) {
          securityDefinerFunctions.push(functionName);
          
          // Verificar se tem SET search_path = public
          if (!/SET\s+search_path\s*=\s*public/i.test(functionBlock)) {
            functionsWithoutSearchPath.push(`${functionName} (${file})`);
          }
        }
      });
    });
    
    // Relatório
    console.log(`\n📊 Security Definer Functions Found: ${securityDefinerFunctions.length}`);
    
    if (functionsWithoutSearchPath.length > 0) {
      console.log(`\n❌ Functions WITHOUT search_path protection:`);
      functionsWithoutSearchPath.forEach(func => {
        console.log(`  • ${func}`);
      });
    }
    
    // Falhar se houver funções sem search_path
    expect(functionsWithoutSearchPath).toEqual([]);
  });
  
  it('should not have mutable search_path in SECURITY DEFINER functions', () => {
    const migrationFiles = readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
    
    const functionsWithMutableSearchPath: string[] = [];
    
    migrationFiles.forEach(file => {
      const content = readFileSync(join(migrationsDir, file), 'utf-8');
      
      // Regex para encontrar funções SECURITY DEFINER
      const functionRegex = /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
      const matches = [...content.matchAll(functionRegex)];
      
      matches.forEach(match => {
        const functionName = match[2];
        const functionStartIndex = match.index || 0;
        
        // Pegar o bloco da função
        const functionBlock = content.slice(
          functionStartIndex,
          content.indexOf('$$;', functionStartIndex) + 3
        );
        
        // Verificar se é SECURITY DEFINER
        if (/SECURITY\s+DEFINER/i.test(functionBlock)) {
          // Verificar se NÃO tem SET search_path fixo
          if (!/SET\s+search_path\s*=\s*(public|pg_catalog|pg_temp)/i.test(functionBlock)) {
            functionsWithMutableSearchPath.push(`${functionName} (${file})`);
          }
        }
      });
    });
    
    if (functionsWithMutableSearchPath.length > 0) {
      console.log(`\n⚠️ Functions with mutable search_path:`);
      functionsWithMutableSearchPath.forEach(func => {
        console.log(`  • ${func}`);
      });
    }
    
    expect(functionsWithMutableSearchPath).toEqual([]);
  });
  
  it('should validate that critical functions have proper search_path', () => {
    // Lista de funções críticas que DEVEM ter search_path configurado
    const criticalFunctions = [
      'encrypt_integration_secret',
      'decrypt_integration_secret',
      'get_customer_secure',
      'search_customers_secure',
      'get_historico_vendas_masked',
      'create_invitation',
      'accept_invite',
      'check_user_permissions'
    ];
    
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
    
    const missingSearchPath: string[] = [];
    const foundFunctions: Set<string> = new Set();
    
    migrationFiles.forEach(file => {
      const content = readFileSync(join(migrationsDir, file), 'utf-8');
      
      criticalFunctions.forEach(funcName => {
        const functionRegex = new RegExp(
          `CREATE\\s+(OR\\s+REPLACE\\s+)?FUNCTION\\s+${funcName}`,
          'i'
        );
        
        if (functionRegex.test(content)) {
          foundFunctions.add(funcName);
          
          // Extrair o bloco da função
          const match = content.match(functionRegex);
          if (match && match.index !== undefined) {
            const functionBlock = content.slice(
              match.index,
              content.indexOf('$$;', match.index) + 3
            );
            
            // Verificar se tem SET search_path = public
            if (!/SET\s+search_path\s*=\s*public/i.test(functionBlock)) {
              missingSearchPath.push(funcName);
            }
          }
        }
      });
    });
    
    console.log(`\n🔍 Critical Functions Checked: ${foundFunctions.size}/${criticalFunctions.length}`);
    
    if (missingSearchPath.length > 0) {
      console.log(`\n❌ Critical functions missing search_path:`);
      missingSearchPath.forEach(func => {
        console.log(`  • ${func}`);
      });
    }
    
    expect(missingSearchPath).toEqual([]);
  });
});
