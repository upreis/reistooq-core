-- 1. Tabela e colunas mínimas (não recriar se já existem)
create extension if not exists pgcrypto;

-- Verificar se a tabela existe e adicionar colunas necessárias
do $$
begin
  -- Adicionar created_by se não existir
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'historico_vendas' 
                 and column_name = 'created_by') then
    alter table public.historico_vendas add column created_by uuid;
  end if;
  
  -- Adicionar origem se não existir
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'historico_vendas' 
                 and column_name = 'origem') then
    alter table public.historico_vendas add column origem text;
  end if;
  
  -- Adicionar raw se não existir
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'historico_vendas' 
                 and column_name = 'raw') then
    alter table public.historico_vendas add column raw jsonb;
  end if;
end$$;

-- 2. Permissões mínimas (apenas o necessário)
grant select, insert on public.historico_vendas to authenticated;
revoke update on public.historico_vendas from authenticated;

-- 3. RLS owner-only
alter table public.historico_vendas enable row level security;

-- Apaga políticas antigas (org/integration_account_id) se existirem
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
     where schemaname='public' and tablename='historico_vendas'
  loop
    execute format('drop policy if exists %I on public.historico_vendas', r.policyname);
  end loop;
end$$;

-- SELECT: só vê o que criou
create policy hv_select_own on public.historico_vendas
for select using (created_by = auth.uid());

-- INSERT: só pode inserir se created_by == auth.uid()
create policy hv_insert_own on public.historico_vendas
for insert with check (created_by = auth.uid());