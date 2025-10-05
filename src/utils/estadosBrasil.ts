// Mapeamento de nomes completos de estados para siglas
export const ESTADOS_BRASIL: Record<string, string> = {
  'Acre': 'AC',
  'Alagoas': 'AL',
  'Amapá': 'AP',
  'Amazonas': 'AM',
  'Bahia': 'BA',
  'Ceará': 'CE',
  'Distrito Federal': 'DF',
  'Espírito Santo': 'ES',
  'Goiás': 'GO',
  'Maranhão': 'MA',
  'Mato Grosso': 'MT',
  'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG',
  'Pará': 'PA',
  'Paraíba': 'PB',
  'Paraná': 'PR',
  'Pernambuco': 'PE',
  'Piauí': 'PI',
  'Rio de Janeiro': 'RJ',
  'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS',
  'Rondônia': 'RO',
  'Roraima': 'RR',
  'Santa Catarina': 'SC',
  'São Paulo': 'SP',
  'Sergipe': 'SE',
  'Tocantins': 'TO'
};

// Mapeamento inverso (sigla para nome completo)
export const SIGLAS_ESTADOS: Record<string, string> = Object.fromEntries(
  Object.entries(ESTADOS_BRASIL).map(([nome, sigla]) => [sigla, nome])
);

/**
 * Converte nome completo do estado para sigla
 * @param nomeEstado - Nome completo do estado
 * @returns Sigla do estado ou o valor original se não encontrar
 */
export function getNomePorSigla(sigla: string): string {
  return SIGLAS_ESTADOS[sigla] || sigla;
}

/**
 * Converte sigla do estado para nome completo
 * @param sigla - Sigla do estado
 * @returns Nome completo do estado ou o valor original se não encontrar
 */
export function getSiglaPorNome(nomeEstado: string): string {
  return ESTADOS_BRASIL[nomeEstado] || nomeEstado;
}

/**
 * Normaliza o campo UF para sigla, independente se vier como nome ou sigla
 * @param uf - UF como nome completo ou sigla
 * @returns Sigla do estado
 */
export function normalizarUF(uf: string): string {
  if (!uf) return '';
  
  // Se já é uma sigla (2 caracteres)
  if (uf.length === 2) return uf.toUpperCase();
  
  // Se é nome completo, converte para sigla
  return ESTADOS_BRASIL[uf] || uf;
}
