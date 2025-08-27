-- base
create extension if not exists pgcrypto;

create table if not exists public.historico_vendas (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  created_by           uuid not null,
  origem               text not null default 'baixa_estoque',

  -- básicas
  id_unico             text not null,
  numero_pedido        text,
  empresa              text,
  nome_cliente         text,
  situacao             text,
  data_pedido          date,

  -- financeiras simples
  valor_total          numeric,
  valor_frete          numeric,
  valor_desconto       numeric,

  -- envio simples
  cidade               text,
  uf                   text,
  codigo_rastreamento  text,

  -- foto completa
  raw                  jsonb
);

-- acrescenta sem quebrar se já existir
alter table public.historico_vendas
  add column if not exists created_by uuid,
  add column if not exists origem text default 'baixa_estoque',
  add column if not exists id_unico text,
  add column if not exists raw jsonb;

create unique index if not exists historico_vendas_uniq
  on public.historico_vendas (id_unico, origem);

-- RLS: cada usuário só vê/insere o que criou
alter table public.historico_vendas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='historico_vendas' and policyname='hv_insert_own'
  ) then
    create policy hv_insert_own on public.historico_vendas
      for insert with check (auth.uid() = created_by);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='historico_vendas' and policyname='hv_select_own'
  ) then
    create policy hv_select_own on public.historico_vendas
      for select using (auth.uid() = created_by);
  end if;
end$$;

grant select, insert on public.historico_vendas to authenticated;