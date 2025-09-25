// Script temporário para corrigir erros TypeScript em edge functions
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function fixErrorHandling(content) {
  // Fix error.message access
  content = content.replace(
    /return fail\(`([^`]*)\$\{error\.message\}([^`]*)`/g,
    'const errorMessage = error instanceof Error ? error.message : "Unknown error";\n    return fail(`$1${errorMessage}$2`'
  );
  
  // Fix other error.message patterns
  content = content.replace(
    /error: error\.message/g,
    'error: error instanceof Error ? error.message : "Unknown error"'
  );
  
  // Fix template literals with error.message
  content = content.replace(
    /\$\{error\.message\}/g,
    '${error instanceof Error ? error.message : "Unknown error"}'
  );
  
  // Fix updateData object property assignments
  content = content.replace(
    /updateData\.([a-zA-Z_]+) = /g,
    '(updateData as any).$1 = '
  );
  
  // Fix templates access
  content = content.replace(
    /templates\[type\]/g,
    'templates[type as keyof typeof templates]'
  );
  
  return content;
}

function processDirectory(dir) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory() && file !== '_shared') {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') && !file.includes('_shared')) {
      try {
        let content = readFileSync(filePath, 'utf8');
        const newContent = fixErrorHandling(content);
        
        if (newContent !== content) {
          writeFileSync(filePath, newContent);
          console.log(`Fixed: ${filePath}`);
        }
      } catch (err) {
        console.error(`Error processing ${filePath}:`, err.message);
      }
    }
  }
}

// Process all edge functions
processDirectory('./supabase/functions');
console.log('TypeScript error fixes applied!');