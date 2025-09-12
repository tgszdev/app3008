-- ====================================================================
-- GARANTIR SCHEMA COMPLETO DO NEXTAUTH COM SUPABASE
-- ====================================================================

-- 1. AJUSTAR TABELA SESSIONS PARA COMPATIBILIDADE TOTAL
-- Primeiro, verificar se precisamos alterar o tipo do ID
DO $$
BEGIN
  -- Alterar tipo de ID se necessário (NextAuth espera text/string)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'id' 
    AND data_type != 'text'
  ) THEN
    ALTER TABLE public.sessions ALTER COLUMN id TYPE text;
  END IF;
END $$;

-- Garantir que sessionToken seja único
ALTER TABLE public.sessions 
  DROP CONSTRAINT IF EXISTS sessions_sessiontoken_key;
ALTER TABLE public.sessions 
  ADD CONSTRAINT sessions_sessiontoken_key UNIQUE ("sessionToken");

-- 2. GARANTIR QUE A TABELA USERS TENHA ESTRUTURA CORRETA
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

-- 3. RECRIAR TABELA ACCOUNTS COM ESTRUTURA CORRETA
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

-- 4. RECRIAR TABELA VERIFICATION_TOKENS
DROP TABLE IF EXISTS public.verification_tokens CASCADE;
CREATE TABLE public.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- 5. CRIAR ÍNDICES NECESSÁRIOS
CREATE INDEX IF NOT EXISTS accounts_userId_idx ON public.accounts("userId");

-- 6. LIMPAR SESSÕES ANTIGAS (OPCIONAL - DESCOMENTE SE QUISER)
-- DELETE FROM public.sessions WHERE expires < NOW();

-- 7. VERIFICAR ESTRUTURA FINAL
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('sessions', 'accounts', 'users', 'verification_tokens')
ORDER BY table_name, ordinal_position;