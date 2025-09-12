-- ============================================
-- SISTEMA DE SESSÃO ÚNICA - SUPABASE
-- Autor: Sistema de Suporte
-- Data: 2024-12-12
-- Versão: 1.0
-- ============================================
-- ATENÇÃO: Execute este script no Supabase SQL Editor
-- Menu: SQL Editor > New Query > Cole este script > Run
-- ============================================

-- 1. CRIAR TABELA DE SESSÕES (PADRÃO NEXTAUTH)
-- Esta tabela segue o padrão exato do NextAuth para compatibilidade
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sessionToken TEXT UNIQUE NOT NULL,  -- Token único da sessão
  userId UUID NOT NULL,                -- ID do usuário (referência para users)
  expires TIMESTAMPTZ NOT NULL,        -- Quando a sessão expira
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADICIONAR FOREIGN KEY PARA USERS
-- Conecta sessions com a tabela users existente
ALTER TABLE public.sessions 
  ADD CONSTRAINT fk_sessions_user 
  FOREIGN KEY (userId) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(sessionToken);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires);

-- 4. CRIAR TABELA DE CONTAS (NECESSÁRIA PARA O ADAPTER)
-- NextAuth precisa desta tabela mesmo que não usemos OAuth
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  userId UUID NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_accounts_user FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 5. CRIAR TABELA DE VERIFICATION TOKENS (NECESSÁRIA PARA O ADAPTER)
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- 6. FUNÇÃO PARA INVALIDAR SESSÕES ANTIGAS
-- Esta é a mágica que garante sessão única
CREATE OR REPLACE FUNCTION public.invalidate_old_user_sessions()
RETURNS TRIGGER AS $$
DECLARE
  sessions_invalidated INTEGER;
BEGIN
  -- Conta quantas sessões serão invalidadas
  SELECT COUNT(*) INTO sessions_invalidated
  FROM public.sessions 
  WHERE userId = NEW.userId 
    AND id != NEW.id
    AND expires > NOW();

  -- Expira todas as outras sessões ativas do usuário
  UPDATE public.sessions 
  SET 
    expires = NOW() - INTERVAL '1 second',
    updated_at = NOW()
  WHERE userId = NEW.userId 
    AND id != NEW.id
    AND expires > NOW();
    
  -- Log para debug (aparece no Supabase Logs)
  IF sessions_invalidated > 0 THEN
    RAISE LOG 'Sessão única: Invalidadas % sessão(ões) para usuário %', 
      sessions_invalidated, NEW.userId;
  END IF;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. CRIAR TRIGGER PARA EXECUTAR A FUNÇÃO
DROP TRIGGER IF EXISTS trigger_enforce_single_session ON public.sessions;
CREATE TRIGGER trigger_enforce_single_session
AFTER INSERT ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.invalidate_old_user_sessions();

-- 8. HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- 9. CRIAR POLÍTICAS DE SEGURANÇA
-- Permite que o service_role (usado pelo servidor) acesse tudo
CREATE POLICY "Service role full access sessions" ON public.sessions
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Service role full access accounts" ON public.accounts
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Service role full access verification" ON public.verification_tokens
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 10. FUNÇÃO PARA LIMPAR SESSÕES EXPIRADAS (MANUTENÇÃO)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.sessions 
  WHERE expires < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE LOG 'Limpeza: % sessões expiradas removidas', deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 11. CRIAR VIEW PARA MONITORAR SESSÕES (ÚTIL PARA DEBUG)
CREATE OR REPLACE VIEW public.active_sessions AS
SELECT 
  s.id,
  s.sessionToken,
  s.userId,
  u.email as user_email,
  u.name as user_name,
  s.expires,
  s.created_at,
  CASE 
    WHEN s.expires > NOW() THEN 'ACTIVE'
    ELSE 'EXPIRED'
  END as status,
  EXTRACT(EPOCH FROM (s.expires - NOW()))/60 as minutes_remaining
FROM public.sessions s
JOIN public.users u ON s.userId = u.id
ORDER BY s.created_at DESC;

-- 12. FUNÇÃO PARA VERIFICAR STATUS DO SISTEMA
CREATE OR REPLACE FUNCTION public.check_session_system_status()
RETURNS TABLE(
  total_sessions BIGINT,
  active_sessions BIGINT,
  expired_sessions BIGINT,
  users_with_sessions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_sessions,
    COUNT(CASE WHEN expires > NOW() THEN 1 END)::BIGINT as active_sessions,
    COUNT(CASE WHEN expires <= NOW() THEN 1 END)::BIGINT as expired_sessions,
    COUNT(DISTINCT userId)::BIGINT as users_with_sessions
  FROM public.sessions;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ SISTEMA DE SESSÃO ÚNICA CRIADO COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tabelas criadas:';
  RAISE NOTICE '  - sessions (sessões dos usuários)';
  RAISE NOTICE '  - accounts (contas OAuth - necessária para adapter)';
  RAISE NOTICE '  - verification_tokens (tokens de verificação)';
  RAISE NOTICE '';
  RAISE NOTICE 'Funcionalidades ativas:';
  RAISE NOTICE '  ✓ Trigger que invalida sessões antigas automaticamente';
  RAISE NOTICE '  ✓ Row Level Security habilitado';
  RAISE NOTICE '  ✓ Função de limpeza de sessões expiradas';
  RAISE NOTICE '  ✓ View para monitorar sessões ativas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximo passo: Instalar @auth/supabase-adapter no projeto';
END $$;