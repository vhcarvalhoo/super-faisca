-- =====================================================================
-- Super Faísca — banco de dados do login (Supabase)
-- Cole TUDO isto no Supabase: menu "SQL Editor" > "New query" > Run.
-- Pode rodar de novo sem problema (o script é seguro para repetir).
-- =====================================================================

-- 1) Tabela com a situação de cada conta
create table if not exists public.acessos (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  nome          text,
  criado_em     timestamptz not null default now(),
  teste_ate     timestamptz not null default (now() + interval '7 days'),  -- 7 dias grátis
  liberado_ate  timestamptz,                                               -- preenchido quando você libera
  bloqueado     boolean not null default false,
  observacao    text,
  atualizado_em timestamptz not null default now()
);

-- 2) Quem pode usar o painel de administração (coloque o SEU e-mail no passo 8)
create table if not exists public.admins (
  email text primary key
);

-- 3) Segurança: cada pessoa só vê a própria linha e NINGUÉM consegue se liberar sozinho
alter table public.acessos enable row level security;
alter table public.admins  enable row level security;

create or replace function public.sou_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

drop policy if exists "ver o proprio acesso" on public.acessos;
create policy "ver o proprio acesso" on public.acessos
  for select using (user_id = auth.uid() or public.sou_admin());

-- 4) Cria a linha automaticamente quando alguém cria uma conta no app
create or replace function public.novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.acessos (user_id, email, nome)
  values (new.id, new.email, new.raw_user_meta_data ->> 'nome')
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.novo_usuario();

-- 5) O app pergunta "meu acesso está ativo?". A resposta usa o relógio do SERVIDOR.
create or replace function public.meu_acesso()
returns json language plpgsql security definer set search_path = public as $$
declare a public.acessos;
begin
  if auth.uid() is null then return null; end if;
  select * into a from public.acessos where user_id = auth.uid();
  if not found then
    insert into public.acessos (user_id, email, nome)
    select u.id, u.email, u.raw_user_meta_data ->> 'nome' from auth.users u where u.id = auth.uid()
    returning * into a;
  end if;
  return json_build_object(
    'email', a.email, 'nome', a.nome, 'criado_em', a.criado_em,
    'teste_ate', a.teste_ate, 'liberado_ate', a.liberado_ate, 'bloqueado', a.bloqueado, 'agora', now(),
    'ativo', (not a.bloqueado) and (now() < a.teste_ate or (a.liberado_ate is not null and now() < a.liberado_ate)),
    'acesso_ate', greatest(a.teste_ate, coalesce(a.liberado_ate, a.teste_ate)),
    'status', case
       when a.bloqueado then 'bloqueado'
       when a.liberado_ate is not null and now() < a.liberado_ate then 'liberado'
       when now() < a.teste_ate then 'teste'
       else 'expirado' end
  );
end $$;

-- 6) Funções do painel de administração (só funcionam para e-mails da tabela admins)
create or replace function public.admin_lista()
returns table (user_id uuid, email text, nome text, criado_em timestamptz, teste_ate timestamptz,
               liberado_ate timestamptz, bloqueado boolean, observacao text, status text, agora timestamptz)
language sql stable security definer set search_path = public as $$
  select a.user_id, a.email, a.nome, a.criado_em, a.teste_ate, a.liberado_ate, a.bloqueado, a.observacao,
         case when a.bloqueado then 'bloqueado'
              when a.liberado_ate is not null and now() < a.liberado_ate then 'liberado'
              when now() < a.teste_ate then 'teste'
              else 'expirado' end,
         now()
  from public.acessos a
  where public.sou_admin()
  order by a.criado_em desc;
$$;

-- soma dias de acesso (a partir de hoje ou do fim do acesso atual, o que for maior)
create or replace function public.admin_liberar(alvo uuid, dias int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'sem permissão'; end if;
  update public.acessos
     set liberado_ate = greatest(now(), coalesce(liberado_ate, now())) + make_interval(days => dias),
         bloqueado = false, atualizado_em = now()
   where user_id = alvo;
end $$;

-- define uma data exata (use 2100-01-01 para "sem prazo" ou null para tirar a liberação)
create or replace function public.admin_definir(alvo uuid, ate timestamptz)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'sem permissão'; end if;
  update public.acessos set liberado_ate = ate, atualizado_em = now() where user_id = alvo;
end $$;

create or replace function public.admin_bloquear(alvo uuid, bloquear boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'sem permissão'; end if;
  update public.acessos set bloqueado = bloquear, atualizado_em = now() where user_id = alvo;
end $$;

create or replace function public.admin_observacao(alvo uuid, texto text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'sem permissão'; end if;
  update public.acessos set observacao = texto, atualizado_em = now() where user_id = alvo;
end $$;

-- estende o teste grátis (por exemplo, dar mais 7 dias para alguém testar)
create or replace function public.admin_estender_teste(alvo uuid, dias int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'sem permissão'; end if;
  update public.acessos set teste_ate = greatest(now(), teste_ate) + make_interval(days => dias), atualizado_em = now()
   where user_id = alvo;
end $$;

-- 7) Quem pode chamar cada função (visitantes sem login não podem nada)
revoke all on function public.meu_acesso(), public.admin_lista(), public.admin_liberar(uuid, int),
  public.admin_definir(uuid, timestamptz), public.admin_bloquear(uuid, boolean), public.admin_observacao(uuid, text),
  public.admin_estender_teste(uuid, int), public.sou_admin() from public, anon;
grant execute on function public.meu_acesso(), public.admin_lista(), public.admin_liberar(uuid, int),
  public.admin_definir(uuid, timestamptz), public.admin_bloquear(uuid, boolean), public.admin_observacao(uuid, text),
  public.admin_estender_teste(uuid, int), public.sou_admin() to authenticated;

-- 8) TROQUE pelo seu e-mail (o mesmo que você vai usar para entrar no painel) e rode esta linha:
-- insert into public.admins (email) values ('seu-email@exemplo.com') on conflict do nothing;
