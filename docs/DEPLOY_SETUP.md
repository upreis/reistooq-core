# Configuração de Deploy Automático

## 🚀 GitHub Actions - Deploy de Edge Functions

Este projeto está configurado para fazer deploy automático das Edge Functions do Supabase sempre que houver alterações no diretório `supabase/functions/`.

### Pré-requisitos

Para o deploy automático funcionar, você precisa configurar o **Access Token** do Supabase no GitHub.

### Passo a Passo

#### 1. Gerar Access Token no Supabase

1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em **"Generate new token"**
3. Dê um nome descritivo (ex: "GitHub Actions - Reistooq")
4. Copie o token gerado (você só verá uma vez!)

#### 2. Adicionar Secret no GitHub

1. Vá até o repositório no GitHub
2. Acesse: **Settings** → **Secrets and variables** → **Actions**
3. Clique em **"New repository secret"**
4. Adicione:
   - **Name:** `SUPABASE_ACCESS_TOKEN`
   - **Value:** [cole o token copiado do Supabase]
5. Clique em **"Add secret"**

### Como Funciona

O workflow é acionado automaticamente quando:
- ✅ Há push na branch `main`
- ✅ Arquivos em `supabase/functions/` são modificados
- ✅ O próprio workflow é alterado

Você também pode acionar manualmente:
1. Vá em **Actions** no GitHub
2. Selecione **"Deploy Edge Functions"**
3. Clique em **"Run workflow"**

### Verificar Deploy

Após o push, você pode:

1. **Ver o progresso:**
   - GitHub → Actions → Deploy Edge Functions

2. **Verificar logs no Supabase:**
   - https://supabase.com/dashboard/project/tdjyfqnxvjgossuncpwm/functions

### Deploy Manual (Linha de Comando)

Se preferir fazer deploy manual local:

```bash
# Conectar ao projeto
supabase link --project-ref tdjyfqnxvjgossuncpwm

# Deploy de uma função específica
supabase functions deploy get-devolucoes-direct

# Deploy de todas as funções
supabase functions deploy
```

### Troubleshooting

**Erro: "Invalid access token"**
- Verifique se o secret `SUPABASE_ACCESS_TOKEN` está configurado corretamente
- Gere um novo token se necessário

**Erro: "Failed to parse config"**
- Certifique-se que `supabase/config.toml` está no formato correto
- Não deve conter seções `[db]`, `[auth]` ou `.cron`

**Deploy não é acionado automaticamente**
- Verifique se as mudanças foram feitas em `supabase/functions/`
- Confirme que o push foi para a branch `main`
