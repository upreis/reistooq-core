#!/bin/bash

# 🔒 Script de Validação de Search Path em Funções
# Verifica se todas as funções SECURITY DEFINER incluem SET search_path = public

set -e

echo "🔍 Verificando funções SECURITY DEFINER..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
total_functions=0
functions_with_search_path=0
functions_without_search_path=0

# Array para armazenar funções sem search_path
declare -a missing_functions

# Buscar todas as funções SECURITY DEFINER nos arquivos de migração
for migration in supabase/migrations/*.sql; do
  if [ -f "$migration" ]; then
    # Procurar por funções SECURITY DEFINER
    while IFS= read -r line; do
      if [[ $line =~ CREATE[[:space:]]+(OR[[:space:]]+REPLACE[[:space:]]+)?FUNCTION[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*) ]]; then
        function_name="${BASH_REMATCH[2]}"
        
        # Ler as próximas linhas para verificar SECURITY DEFINER e SET search_path
        has_security_definer=false
        has_search_path=false
        
        # Ler o bloco da função (próximas 50 linhas ou até $$)
        temp_block=""
        line_count=0
        while IFS= read -r next_line && [ $line_count -lt 50 ]; do
          temp_block+="$next_line"
          
          if [[ $next_line =~ SECURITY[[:space:]]+DEFINER ]]; then
            has_security_definer=true
          fi
          
          if [[ $next_line =~ SET[[:space:]]+search_path[[:space:]]*=[[:space:]]*public ]]; then
            has_search_path=true
          fi
          
          # Sair se encontrar o fim da função
          if [[ $next_line =~ \$\$[[:space:]]*LANGUAGE ]]; then
            break
          fi
          
          ((line_count++))
        done
        
        # Se é SECURITY DEFINER, verificar search_path
        if [ "$has_security_definer" = true ]; then
          ((total_functions++))
          
          if [ "$has_search_path" = true ]; then
            ((functions_with_search_path++))
          else
            ((functions_without_search_path++))
            missing_functions+=("$function_name")
          fi
        fi
      fi
    done < "$migration"
  fi
done

# Gerar relatório
echo ""
echo "📊 Relatório de Validação:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total de funções SECURITY DEFINER: $total_functions"
echo -e "${GREEN}✅ Funções com SET search_path: $functions_with_search_path${NC}"

if [ $functions_without_search_path -gt 0 ]; then
  echo -e "${RED}❌ Funções SEM SET search_path: $functions_without_search_path${NC}"
  echo ""
  echo "Funções que precisam de correção:"
  for func in "${missing_functions[@]}"; do
    echo -e "  ${RED}• $func${NC}"
  done
  echo ""
  echo -e "${RED}🚨 VALIDAÇÃO FALHOU!${NC}"
  echo "Por favor, adicione 'SET search_path = public' às funções listadas acima."
  exit 1
else
  echo -e "${GREEN}✅ Todas as funções SECURITY DEFINER incluem SET search_path = public${NC}"
  echo ""
  echo -e "${GREEN}🎉 VALIDAÇÃO APROVADA!${NC}"
  exit 0
fi
