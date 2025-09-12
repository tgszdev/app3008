-- ====================================================================
-- CORRIGIR SCHEMA REMOVENDO VIEWS DEPENDENTES PRIMEIRO
-- ====================================================================

-- 1. REMOVER VIEWS QUE DEPENDEM DA TABELA SESSIONS
DROP VIEW IF EXISTS active_sessions CASCADE;
DROP VIEW IF EXISTS session_monitoring CASCADE;
DROP VIEW IF EXISTS user_session_summary CASCADE;

-- 2. AGORA PODEMOS ALTERAR O TIPO DO ID
ALTER TABLE public.sessions ALTER COLUMN id TYPE text;

-- 3. GARANTIR QUE sessionToken SEJA ÚNICO
ALTER TABLE public.sessions 
  DROP CONSTRAINT IF EXISTS sessions_sessiontoken_key;
ALTER TABLE public.sessions 
  ADD CONSTRAINT sessions_sessiontoken_key UNIQUE ("sessionToken");

-- 4. GARANTIR QUE A TABELA USERS TENHA ESTRUTURA CORRETA
-- Adicionar colunas que podem estar faltando
DO $$
BEGIN
  -- Adicionar emailVerified se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'emailVerified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN "emailVerified" TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Adicionar image se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'image'
  ) THEN
    ALTER TABLE public.users ADD COLUMN image TEXT;
  END IF;
END $$;

-- 5. RECRIAR TABELA ACCOUNTS COM ESTRUTURA CORRETA
DROP TABLE IF EXISTS public.accounts CASCADE;
CREATE TABLE public.accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, "providerAccountId")
);

-- 6. RECRIAR TABELA VERIFICATION_TOKENS
DROP TABLE IF EXISTS public.verification_tokens CASCADE;
CREATE TABLE public.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- 7. CRIAR ÍNDICES NECESSÁRIOS
CREATE INDEX IF NOT EXISTS accounts_userId_idx ON public.accounts("userId");

-- 8. RECRIAR VIEW DE SESSÕES ATIVAS (OPCIONAL - ÚTIL PARA MONITORAMENTO)
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
    s.id,
    s."sessionToken",
    s."userId",
    u.email,
    u.name,
    s.expires,
    s.created_at,
    s.updated_at,
    CASE 
        WHEN s.expires > NOW() THEN 'Ativa'
        ELSE 'Expirada'
    END as status
FROM public.sessions s
LEFT JOIN public.users u ON s."userId" = u.id
WHERE s.expires > NOW()
ORDER BY s.created_at DESC;

-- 9. LIMPAR SESSÕES EXPIRADAS
DELETE FROM public.sessions WHERE expires < NOW();

-- 10. VERIFICAR ESTRUTURA FINAL
SELECT 
    'ESTRUTURA FINAL' as info,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'sessions'
ORDER BY ordinal_position;