-- ====================================================================
-- SCRIPT PARA CORRIGIR NOMES DAS COLUNAS PARA O PADRÃO NEXTAUTH
-- ====================================================================

-- 1. RENOMEAR COLUNAS NA TABELA SESSIONS
ALTER TABLE public.sessions 
  RENAME COLUMN sessiontoken TO "sessionToken";

ALTER TABLE public.sessions 
  RENAME COLUMN userid TO "userId";

-- 2. VERIFICAR SE A TABELA USERS EXISTE E TEM AS COLUNAS CORRETAS
-- Se não existir, vamos criar
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  image TEXT,
  "emailVerified" TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. VERIFICAR SE A TABELA ACCOUNTS EXISTE
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, "providerAccountId")
);

-- 4. VERIFICAR SE A TABELA VERIFICATION_TOKENS EXISTE
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- 5. RECRIAR ÍNDICES COM NOMES CORRETOS
DROP INDEX IF EXISTS sessions_user_id_idx;
DROP INDEX IF EXISTS sessions_session_token_idx;

CREATE INDEX IF NOT EXISTS sessions_userId_idx ON public.sessions("userId");
CREATE INDEX IF NOT EXISTS sessions_sessionToken_idx ON public.sessions("sessionToken");
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON public.sessions(expires);

-- 6. RECRIAR O TRIGGER COM NOMES DE COLUNA CORRETOS
-- Primeiro, remover o trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_enforce_single_session ON public.sessions;

-- Recriar a função com nomes corretos
CREATE OR REPLACE FUNCTION public.invalidate_old_user_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma nova sessão é criada, expira todas as outras sessões do mesmo usuário
  UPDATE public.sessions 
  SET expires = NOW() - INTERVAL '1 second'
  WHERE "userId" = NEW."userId" 
    AND id != NEW.id
    AND expires > NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
CREATE TRIGGER trigger_enforce_single_session
AFTER INSERT ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.invalidate_old_user_sessions();

-- 7. VERIFICAR RESULTADO
SELECT 
    'Colunas corrigidas em sessions' as status,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'sessions'
ORDER BY ordinal_position;