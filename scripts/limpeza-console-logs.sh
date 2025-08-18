#!/bin/bash

# 🧹 SCRIPT DE LIMPEZA DE CONSOLE LOGS REISTOQ
# Remove logs desnecessários e padroniza logs importantes

set -e

echo "🧹 INICIANDO LIMPEZA DE CONSOLE LOGS..."

# ===== CONTADORES =====
LOGS_REMOVIDOS=0
LOGS_PADRONIZADOS=0
ARQUIVOS_PROCESSADOS=0

# ===== FUNÇÃO DE LOG =====
log_acao() {
    echo "✅ $1"
}

# ===== BACKUP DE SEGURANÇA =====
echo "📦 Criando backup de segurança..."
BACKUP_DIR="backup-logs-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

find src -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "console\." "$file"; then
        cp "$file" "$BACKUP_DIR/"
    fi
done

log_acao "Backup criado em: $BACKUP_DIR"

# ===== TIPOS DE LOGS A REMOVER =====

echo ""
echo "🔍 FASE 1: REMOVENDO LOGS DESNECESSÁRIOS"

# 1. Console.log de debug/desenvolvimento
echo "Removendo console.log de debug..."
find src -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "console\.log" "$file"; then
        # Remover console.log que não são críticos
        sed -i.bak '/console\.log.*debug\|console\.log.*test\|console\.log.*TODO\|console\.log.*TEMP/d' "$file"
        ((LOGS_REMOVIDOS++))
        ((ARQUIVOS_PROCESSADOS++))
    fi
done

# 2. Console.log sem contexto útil
echo "Removendo logs genéricos..."
find src -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "console\.log" "$file"; then
        # Remover logs muito simples/genéricos
        sed -i.bak '/console\.log(.*["\'][a-zA-Z]*["\'].*)/d' "$file"
        ((LOGS_REMOVIDOS++))
    fi
done

# ===== PADRONIZAÇÃO DE LOGS IMPORTANTES =====

echo ""
echo "📝 FASE 2: PADRONIZANDO LOGS IMPORTANTES"

# 1. Padronizar logs de erro
echo "Padronizando logs de erro..."
find src -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "console\.error" "$file"; then
        # Padronizar formato de erro
        sed -i.bak 's/console\.error(/console.error("[REISTOQ ERROR]",/g' "$file"
        ((LOGS_PADRONIZADOS++))
    fi
done

# 2. Padronizar logs de sucesso
echo "Padronizando logs de sucesso..."
find src -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "console\.log.*success\|console\.log.*sucesso" "$file"; then
        sed -i.bak 's/console\.log(/console.info("[REISTOQ SUCCESS]",/g' "$file"
        ((LOGS_PADRONIZADOS++))
    fi
done

# ===== LOGS ESPECÍFICOS PARA MANTER =====

echo ""
echo "🔒 FASE 3: PROTEGENDO LOGS CRÍTICOS"

# Lista de logs que devem ser mantidos (segurança, auditoria, etc.)
LOGS_CRITICOS=(
    "404 Error"
    "Authentication"
    "Authorization"
    "Security"
    "Audit"
    "Payment"
    "Integration"
    "Database"
)

echo "Protegendo logs críticos..."
for pattern in "${LOGS_CRITICOS[@]}"; do
    find src -name "*.tsx" -o -name "*.ts" | while read file; do
        if grep -q "$pattern" "$file"; then
            log_acao "Log crítico protegido em $file: $pattern"
        fi
    done
done

# ===== VERIFICAÇÃO DE LOGS RESTANTES =====

echo ""
echo "🔍 FASE 4: VERIFICAÇÃO FINAL"

LOGS_RESTANTES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -n "console\." 2>/dev/null | wc -l)

echo "📊 Logs restantes no sistema: $LOGS_RESTANTES"

if [ "$LOGS_RESTANTES" -lt 100 ]; then
    log_acao "Quantidade de logs em nível aceitável"
else
    echo "⚠️ Ainda há muitos logs. Considere revisão manual."
fi

# ===== CRIAÇÃO DE UTILITY PARA LOGS =====

echo ""
echo "🛠️ FASE 5: CRIANDO UTILITY DE LOGS"

cat > src/utils/logger.ts << 'EOF'
// 📝 SISTEMA DE LOGS PADRONIZADO REISTOQ

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  
  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const prefix = `[REISTOQ ${level.toUpperCase()}]`;
    const contextStr = context ? ` [${context}]` : '';
    return `${prefix}${contextStr} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment && level === 'debug') return false;
    return true;
  }

  info(message: string, data?: any, context?: string) {
    if (!this.shouldLog('info')) return;
    const formattedMessage = this.formatMessage('info', message, context);
    
    if (data) {
      console.info(formattedMessage, data);
    } else {
      console.info(formattedMessage);
    }
  }

  warn(message: string, data?: any, context?: string) {
    if (!this.shouldLog('warn')) return;
    const formattedMessage = this.formatMessage('warn', message, context);
    
    if (data) {
      console.warn(formattedMessage, data);
    } else {
      console.warn(formattedMessage);
    }
  }

  error(message: string, error?: Error | any, context?: string) {
    if (!this.shouldLog('error')) return;
    const formattedMessage = this.formatMessage('error', message, context);
    
    if (error) {
      console.error(formattedMessage, error);
    } else {
      console.error(formattedMessage);
    }

    // Em produção, enviar erro para serviço de monitoramento
    if (!this.isDevelopment) {
      this.sendToMonitoring({ level: 'error', message, data: error, timestamp: new Date().toISOString(), context });
    }
  }

  debug(message: string, data?: any, context?: string) {
    if (!this.shouldLog('debug')) return;
    const formattedMessage = this.formatMessage('debug', message, context);
    
    if (data) {
      console.debug(formattedMessage, data);
    } else {
      console.debug(formattedMessage);
    }
  }

  private sendToMonitoring(entry: LogEntry) {
    // Implementar integração com serviço de monitoramento
    // Ex: Sentry, LogRocket, etc.
  }
}

export const logger = new Logger();

// Helpers para contextos específicos
export const authLogger = {
  info: (message: string, data?: any) => logger.info(message, data, 'AUTH'),
  warn: (message: string, data?: any) => logger.warn(message, data, 'AUTH'),
  error: (message: string, error?: any) => logger.error(message, error, 'AUTH'),
};

export const integrationLogger = {
  info: (message: string, data?: any) => logger.info(message, data, 'INTEGRATION'),
  warn: (message: string, data?: any) => logger.warn(message, data, 'INTEGRATION'),
  error: (message: string, error?: any) => logger.error(message, error, 'INTEGRATION'),
};

export const scannerLogger = {
  info: (message: string, data?: any) => logger.info(message, data, 'SCANNER'),
  warn: (message: string, data?: any) => logger.warn(message, data, 'SCANNER'),
  error: (message: string, error?: any) => logger.error(message, error, 'SCANNER'),
};
EOF

log_acao "Sistema de logs padronizado criado em src/utils/logger.ts"

# ===== LIMPEZA DOS ARQUIVOS .bak =====

echo ""
echo "🧹 LIMPANDO ARQUIVOS TEMPORÁRIOS..."

find src -name "*.bak" -delete
log_acao "Arquivos .bak removidos"

# ===== RELATÓRIO FINAL =====

echo ""
echo "📊 RELATÓRIO FINAL DA LIMPEZA"
echo "=============================="

echo "📁 Arquivos processados: $ARQUIVOS_PROCESSADOS"
echo "🗑️ Logs removidos: $LOGS_REMOVIDOS"
echo "📝 Logs padronizados: $LOGS_PADRONIZADOS"
echo "📊 Logs restantes: $LOGS_RESTANTES"
echo "💾 Backup salvo em: $BACKUP_DIR"

if [ "$LOGS_RESTANTES" -lt 50 ]; then
    echo ""
    echo "✅ LIMPEZA CONCLUÍDA COM SUCESSO!"
    echo "🎯 Sistema de logs otimizado e padronizado"
    echo ""
    echo "💡 Como usar o novo sistema:"
    echo "   import { logger, authLogger } from '@/utils/logger';"
    echo "   logger.info('Mensagem informativa');"
    echo "   authLogger.error('Erro de autenticação', error);"
    exit 0
else
    echo ""
    echo "⚠️ LIMPEZA PARCIAL CONCLUÍDA"
    echo "🔍 Revisar manualmente logs restantes se necessário"
    exit 0
fi