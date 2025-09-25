// Run TypeScript fixes on all edge functions
import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";

function fixErrorHandling(content: string): string {
  // Fix error.message in object properties
  content = content.replace(
    /error: error\.message/g,
    'error: getErrorMessage(error)'
  );
  
  // Fix template literals with error.message
  content = content.replace(
    /\$\{error\.message\}/g,
    '${getErrorMessage(error)}'
  );
  
  // Fix direct error.message access
  content = content.replace(
    /([^a-zA-Z_])error\.message([^a-zA-Z_])/g,
    '$1getErrorMessage(error)$2'
  );
  
  // Fix e.message patterns
  content = content.replace(
    /e\.message/g,
    'getErrorMessage(e)'
  );
  
  content = content.replace(
    /e\?\.message/g,
    'getErrorMessage(e)'
  );
  
  content = content.replace(
    /error\?\.message/g,
    'getErrorMessage(error)'
  );
  
  // Fix function parameter types
  content = content.replace(
    /function ok\(data, status = 200\)/g,
    'function ok(data: any, status = 200)'
  );
  
  content = content.replace(
    /function fail\(msg, status = 400, details\)/g,
    'function fail(msg: any, status = 400, details?: any)'
  );
  
  // Fix other parameter types
  content = content.replace(
    /function dayStartISO\(d\)/g,
    'function dayStartISO(d: any)'
  );
  
  content = content.replace(
    /function dayEndISO\(d\)/g,
    'function dayEndISO(d: any)'
  );
  
  // Fix async function parameter types  
  content = content.replace(
    /async function refreshTokenIfNeeded\(integration_account_id, supabaseUrl, authHeader, internalToken\)/g,
    'async function refreshTokenIfNeeded(integration_account_id: any, supabaseUrl: any, authHeader: any, internalToken: any)'
  );
  
  // Fix templates access
  content = content.replace(
    /templates\[type\]/g,
    'templates[type as keyof typeof templates]'
  );
  
  // Fix null regex matches
  content = content.replace(
    /\.match\(\/\.\{1,2\}\/g\)\.map/g,
    '.match(/.{1,2}/g)?.map'
  );
  
  // Fix spread property conflicts
  content = content.replace(
    /success: healthResult\.success,\s*[^}]*\s*\.\.\.healthResult,/gs,
    '...healthResult,'
  );
  
  // Add getErrorMessage import if error handling patterns found but import missing
  if ((content.includes('getErrorMessage(') || content.includes('error.message')) && 
      !content.includes('getErrorMessage') && 
      !content.includes('_shared/error-handler')) {
    const importMatch = content.match(/import.*from.*'\.\.\/.*';/);
    if (importMatch) {
      content = content.replace(
        importMatch[0],
        importMatch[0] + "\nimport { getErrorMessage } from '../_shared/error-handler.ts';"
      );
    }
  }
  
  return content;
}

// Process all TypeScript files in supabase/functions
for await (const entry of walk("./supabase/functions", { 
  exts: [".ts"], 
  skip: [/_shared/] 
})) {
  if (entry.isFile) {
    try {
      const content = await Deno.readTextFile(entry.path);
      const newContent = fixErrorHandling(content);
      
      if (newContent !== content) {
        await Deno.writeTextFile(entry.path, newContent);
        console.log(`Fixed: ${entry.path}`);
      }
    } catch (err) {
      console.error(`Error processing ${entry.path}:`, err.message);
    }
  }
}

console.log('TypeScript error fixes applied!');