/**
 * 🔍 SISTEMA DE MONITORAMENTO DAS INTEGRAÇÕES
 * Monitora todos os fluxos entre Pedidos ↔ Estoque ↔ Histórico ↔ De-Para
 */

export interface LogIntegracao {
  timestamp: Date;
  operacao: string;
  origem: string;
  destino: string;
  dadosEnviados: any;
  resultado: 'sucesso' | 'erro' | 'aviso';
  detalhes: string;
  tempoExecucao?: number;
}

export interface StatusIntegracao {
  ativo: boolean;
  ultimaOperacao?: LogIntegracao;
  totalOperacoes: number;
  sucessos: number;
  erros: number;
  avisos: number;
}

export class MonitorIntegracao {
  private static instance: MonitorIntegracao;
  private logs: LogIntegracao[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): MonitorIntegracao {
    if (!MonitorIntegracao.instance) {
      MonitorIntegracao.instance = new MonitorIntegracao();
    }
    return MonitorIntegracao.instance;
  }

  /**
   * 📝 Registra uma operação de integração
   */
  registrarOperacao(
    operacao: string,
    origem: string,
    destino: string,
    dadosEnviados: any,
    resultado: 'sucesso' | 'erro' | 'aviso',
    detalhes: string,
    tempoExecucao?: number
  ): void {
    const log: LogIntegracao = {
      timestamp: new Date(),
      operacao,
      origem,
      destino,
      dadosEnviados,
      resultado,
      detalhes,
      tempoExecucao
    };

    this.logs.unshift(log);

    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log no console para debug
    const emoji = resultado === 'sucesso' ? '✅' : resultado === 'erro' ? '❌' : '⚠️';
    const tempo = tempoExecucao ? ` (${tempoExecucao}ms)` : '';
    console.log(`${emoji} ${operacao}: ${origem} → ${destino}${tempo}`, {
      detalhes,
      dados: dadosEnviados
    });
  }

  /**
   * 📊 Obtém o status atual das integrações
   */
  obterStatus(): StatusIntegracao {
    const sucessos = this.logs.filter(l => l.resultado === 'sucesso').length;
    const erros = this.logs.filter(l => l.resultado === 'erro').length;
    const avisos = this.logs.filter(l => l.resultado === 'aviso').length;

    return {
      ativo: true,
      ultimaOperacao: this.logs[0],
      totalOperacoes: this.logs.length,
      sucessos,
      erros,
      avisos
    };
  }

  /**
   * 📋 Obtém logs recentes
   */
  obterLogsRecentes(limite = 50): LogIntegracao[] {
    return this.logs.slice(0, limite);
  }

  /**
   * 🔍 Filtra logs por operação
   */
  filtrarLogsPorOperacao(operacao: string): LogIntegracao[] {
    return this.logs.filter(l => l.operacao === operacao);
  }

  /**
   * 🧹 Limpa logs antigos
   */
  limparLogs(): void {
    this.logs = [];
    console.log('🧹 Logs de integração limpos');
  }

  /**
   * 📈 Gera relatório de performance
   */
  gerarRelatorioPerformance(): {
    operacaoMaisLenta: LogIntegracao | null;
    operacaoMaisRapida: LogIntegracao | null;
    tempoMedio: number;
    operacoesPorTipo: Record<string, number>;
  } {
    const logsComTempo = this.logs.filter(l => l.tempoExecucao !== undefined);
    
    if (logsComTempo.length === 0) {
      return {
        operacaoMaisLenta: null,
        operacaoMaisRapida: null,
        tempoMedio: 0,
        operacoesPorTipo: {}
      };
    }

    const operacaoMaisLenta = logsComTempo.reduce((max, log) => 
      (log.tempoExecucao! > max.tempoExecucao!) ? log : max
    );

    const operacaoMaisRapida = logsComTempo.reduce((min, log) => 
      (log.tempoExecucao! < min.tempoExecucao!) ? log : min
    );

    const tempoMedio = logsComTempo.reduce((sum, log) => 
      sum + log.tempoExecucao!, 0
    ) / logsComTempo.length;

    const operacoesPorTipo = this.logs.reduce((acc, log) => {
      acc[log.operacao] = (acc[log.operacao] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      operacaoMaisLenta,
      operacaoMaisRapida,
      tempoMedio,
      operacoesPorTipo
    };
  }
}

/**
 * 🛠️ Utilitário para medir tempo de execução
 */
export function medirTempoExecucao<T>(
  operacao: string,
  origem: string,
  destino: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const inicio = Date.now();
    const monitor = MonitorIntegracao.getInstance();

    try {
      const resultado = await fn();
      const tempoExecucao = Date.now() - inicio;
      
      monitor.registrarOperacao(
        operacao,
        origem,
        destino,
        null,
        'sucesso',
        'Operação concluída com sucesso',
        tempoExecucao
      );

      resolve(resultado);
    } catch (error) {
      const tempoExecucao = Date.now() - inicio;
      
      monitor.registrarOperacao(
        operacao,
        origem,
        destino,
        null,
        'erro',
        error instanceof Error ? error.message : 'Erro desconhecido',
        tempoExecucao
      );

      reject(error);
    }
  });
}