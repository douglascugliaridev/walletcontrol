-- ============================================================================
-- RLS em `public._prisma_migrations`
--
-- O linter do Supabase ("RLS Disabled in Public") apontou esta tabela. Ela
-- escapa da migration `20260927000000_enable_rls` por um motivo estrutural:
-- `_prisma_migrations` nao aparece no `schema.prisma`, logo nao e uma tabela
-- de dominio e o Prisma a cria e mantem por conta propria. Por isso o RLS
-- habilitado nas quatro tabelas de dominio nao a alcanca.
--
-- O que ela expoe: nome de cada migration aplicada, checksum, timestamps de
-- inicio/fim e o `logs` das migrations que falharam. Nao ha dado de usuario
-- aqui, mas e informacao de infraestrutura: revela o historico de mudancas do
-- schema (nomes de tabelas, colunas e enums) e o log de falha carrega o SQL e
-- o campo `detail` do Postgres, que inclui os valores das linhas que
-- motivaram a violacao. Com a chave `anon` -- publica por natureza e que
-- acabou no bundle do front -- qualquer pessoa podia ler tudo isso via Data API
-- sem nenhuma credencial.
--
-- Decisoes:
--   * ENABLE ROW LEVEL SECURITY, sem FORCE. Sem FORCE, o owner da tabela e
--     qualquer role com BYPASSRLS seguem ignorando a RLS, entao o
--     `prisma migrate deploy` / `migrate resolve` nao muda de comportamento. No
--     Supabase quem aplica migrations e a role `postgres`, que tem BYPASSRLS;
--     localmente e o superusuario `walletcontrol`. FORCE quebraria os dois
--     comandos, porque o Prisma precisa ler e escrever esta tabela.
--   * Nenhuma policy. RLS habilitada sem policy e o estado mais restritivo
--     possivel (default deny): `anon` e `authenticated` recebem zero linhas,
--     em qualquer operacao. Deliberado -- e uma tabela de bookkeeping interno
--     do Prisma, sem uso legitimo via Data API.
--   * Alem da RLS, REVOKE dos privilegios que o Supabase concede por padrao a
--     `anon`/`authenticated` em toda tabela criada em `public`. O PostgREST so
--     coloca no schema cache as tabelas para as quais a role tem privilegio,
--     entao o REVOKE, alem de negar, ainda tira a tabela da listagem.
--   * Idempotente: `ENABLE ROW LEVEL SECURITY` nao acumula, e o laco de DROP
--     de policies e tolerante a banco sem nenhuma.
--   * Segura em banco novo: o Prisma cria `_prisma_migrations` antes de
--     aplicar qualquer migration, mas o guard `to_regclass` evita erro caso a
--     tabela ainda nao exista.
--
-- Nota: `_prisma_migrations` e a unica tabela de `public` sem RLS depois desta
-- migration. Se um dia o Prisma passar a oferecer um destino customizado para
-- ela (hoje `prisma.config.ts` em v7 so aceita `path` e `seed`), o ideal
-- seria move-la para um schema que nao seja exposto ao PostgREST.
-- ============================================================================

DO $$
DECLARE
    policy_name text;
BEGIN
    IF to_regclass('public._prisma_migrations') IS NULL THEN
        RAISE NOTICE 'public._prisma_migrations ausente: nada a fazer.';
        RETURN;
    END IF;

    -- 1) Habilita RLS. Sem FORCE (ver nota sobre BYPASSRLS no cabecalho).
    EXECUTE 'ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY';

    -- 2) Garante o estado "sem policy". A RLS acima ja nega tudo, mas derruba
    --    qualquer policy ad-hoc que reabriria o acesso via Data API.
    FOR policy_name IN
        SELECT pol.polname
        FROM pg_policy pol
        WHERE pol.polrelid = 'public._prisma_migrations'::regclass
    LOOP
        EXECUTE format('DROP POLICY %I ON public._prisma_migrations', policy_name);
    END LOOP;

    -- 3) Defense in depth: revoga os privilegios padrao do Supabase.
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE ALL ON TABLE public._prisma_migrations FROM anon';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE ALL ON TABLE public._prisma_migrations FROM authenticated';
    END IF;
END
$$;