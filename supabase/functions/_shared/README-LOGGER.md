# 🔍 Sistema de Logging Condicional

Sistema inteligente de logging que exibe logs detalhados apenas em ambiente de desenvolvimento, mantendo logs de produção limpos e focados.

## 📦 Como Usar

```typescript
import { logger } from '../_shared/logger.ts';

// Logs que aparecem APENAS em desenvolvimento
logger.info('Processando dados...', { count: 100 });
logger.debug('Estrutura de dados:', myObject);

// Logs que aparecem SEMPRE (críticos)
logger.warn('Atenção: taxa limite próxima');
logger.error('Erro ao processar:', error);
logger.progress('Processando lote 5/20...');
```

## 🎯 Níveis de Log

### `logger.info()` - Informações Gerais
- ✅ Exibido apenas em DEV
- Use para: logs informativos, detalhes de processamento, dumps de dados

### `logger.debug()` - Debug Detalhado
- ✅ Exibido apenas em DEV
- Use para: estruturas de objetos, traces de execução, valores intermediários

### `logger.warn()` - Avisos
- ⚠️ SEMPRE exibido (DEV + PROD)
- Use para: situações anormais mas não críticas, rate limits, dados incompletos

### `logger.error()` - Erros
- 🔥 SEMPRE exibido (DEV + PROD)
- Use para: exceções, falhas de API, erros de validação

### `logger.progress()` - Progresso
- 📊 SEMPRE exibido (DEV + PROD)
- Use para: atualizações de progresso que o usuário precisa ver

## 🔧 Ativando Modo DEV

Configure a variável de ambiente na Edge Function:

```bash
# Opção 1: Via Dashboard Supabase
ENVIRONMENT=development

# Opção 2: Via DEBUG flag
DEBUG=true
```

## ✅ Exemplo Completo

```typescript
import { logger } from '../_shared/logger.ts';

export const processData = async (items: any[]) => {
  logger.progress(`Processando ${items.length} itens...`);
  
  for (let i = 0; i < items.length; i++) {
    logger.debug(`Item ${i}:`, items[i]); // Só em DEV
    
    try {
      const result = await processItem(items[i]);
      logger.info(`Item ${i} processado:`, result); // Só em DEV
    } catch (error) {
      logger.error(`Erro no item ${i}:`, error); // Sempre
    }
  }
  
  logger.progress(`✅ ${items.length} itens processados`);
};
```

## 📊 Logs em Produção vs Desenvolvimento

### Produção (Limpo)
```
[PROGRESS] Processando 100 itens...
[WARN] Rate limit próximo: 80%
[ERROR] Erro no item 42: Network timeout
[PROGRESS] ✅ 100 itens processados
```

### Desenvolvimento (Detalhado)
```
[INFO] Iniciando processamento...
[DEBUG] Configuração: { batchSize: 5, timeout: 30000 }
[PROGRESS] Processando 100 itens...
[INFO] Lote 1/20 iniciado
[DEBUG] Item 0: { id: 123, name: "Test" }
[WARN] Rate limit próximo: 80%
[ERROR] Erro no item 42: Network timeout
[DEBUG] Stack trace: ...
[INFO] Lote 20/20 finalizado
[PROGRESS] ✅ 100 itens processados
```

## 🎓 Boas Práticas

1. **Use `logger.progress()` para feedback do usuário**
   ```typescript
   logger.progress(`Processando lote ${i}/${total}...`);
   ```

2. **Use `logger.debug()` para dumps de dados**
   ```typescript
   logger.debug('Resposta da API:', apiResponse);
   ```

3. **Use `logger.error()` para exceções**
   ```typescript
   catch (err) {
     logger.error('Falha ao processar:', err);
   }
   ```

4. **Evite `console.log` direto**
   ```typescript
   // ❌ NÃO FAÇA
   console.log('Processando...');
   
   // ✅ FAÇA
   logger.info('Processando...');
   ```
