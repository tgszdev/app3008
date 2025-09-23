-- =====================================================
-- CONFIGURAÇÃO MULTI-TENANT - EXECUTAR NO SUPABASE DASHBOARD
-- =====================================================
-- 
-- Este arquivo deve ser executado no Supabase Dashboard
-- para configurar o sistema multi-tenant corretamente.
--
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este código
-- 4. Execute
-- 5. Faça logout e login novamente no sistema
--
-- =====================================================

-- 1. ADICIONAR COLUNAS MULTI-TENANT À TABELA USERS
-- =====================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'context' CHECK (user_type IN ('matrix', 'context')),
ADD COLUMN IF NOT EXISTS context_type TEXT CHECK (context_type IN ('organization', 'department')),
ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES contexts(id),
ADD COLUMN IF NOT EXISTS context_name TEXT,
ADD COLUMN IF NOT EXISTS context_slug TEXT,
ADD COLUMN IF NOT EXISTS available_contexts JSONB DEFAULT '[]'::jsonb;

-- 2. CRIAR TABELA USER_CONTEXTS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_contexts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  context_id UUID NOT NULL REFERENCES contexts(id) ON DELETE CASCADE, 
  can_manage BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, context_id)
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_contexts_user_id ON user_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contexts_context_id ON user_contexts(context_id);

-- 4. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Users can view their own contexts" ON user_contexts;
DROP POLICY IF EXISTS "Admins can manage all user contexts" ON user_contexts;

-- Criar novas políticas
CREATE POLICY "Users can view their own contexts" ON user_contexts
  FOR SELECT USING (auth.uid()::text = user_id::text);
  
CREATE POLICY "Admins can manage all user contexts" ON user_contexts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::uuid 
      AND role IN ('admin', 'analyst')
    )
  );

-- 5. CONFIGURAR USUÁRIOS EXISTENTES
-- =====================================================

-- Configurar usuários admin como usuários da matriz
UPDATE users 
SET 
  user_type = 'matrix',
  available_contexts = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug,
        'type', c.type,
        'can_manage', true
      )
    )
    FROM contexts c
  )
WHERE role = 'admin';

-- Configurar usuários normais como usuários de contexto
-- (assumindo que pertencem ao primeiro contexto disponível)
UPDATE users 
SET 
  user_type = 'context',
  context_type = (SELECT type FROM contexts LIMIT 1),
  context_id = (SELECT id FROM contexts LIMIT 1),
  context_name = (SELECT name FROM contexts LIMIT 1),
  context_slug = (SELECT slug FROM contexts LIMIT 1)
WHERE role != 'admin';

-- 6. CRIAR RELACIONAMENTOS NA TABELA USER_CONTEXTS
-- =====================================================

-- Para usuários admin (matriz) - acesso a todos os contextos
INSERT INTO user_contexts (user_id, context_id, can_manage)
SELECT 
  u.id,
  c.id,
  true
FROM users u
CROSS JOIN contexts c
WHERE u.role = 'admin'
ON CONFLICT (user_id, context_id) DO NOTHING;

-- Para usuários normais - acesso ao contexto padrão
INSERT INTO user_contexts (user_id, context_id, can_manage)
SELECT 
  u.id,
  (SELECT id FROM contexts LIMIT 1),
  false
FROM users u
WHERE u.role != 'admin'
ON CONFLICT (user_id, context_id) DO NOTHING;

-- 7. VERIFICAR CONFIGURAÇÃO
-- =====================================================

-- Verificar usuários configurados
SELECT 
  name,
  email,
  role,
  user_type,
  context_type,
  context_name,
  jsonb_array_length(available_contexts) as available_contexts_count
FROM users
ORDER BY role, name;

-- Verificar relacionamentos user_contexts
SELECT 
  u.name as user_name,
  u.role,
  c.name as context_name,
  c.type as context_type,
  uc.can_manage
FROM user_contexts uc
JOIN users u ON uc.user_id = u.id
JOIN contexts c ON uc.context_id = c.id
ORDER BY u.role, u.name, c.name;

-- =====================================================
-- CONFIGURAÇÃO CONCLUÍDA!
-- =====================================================
-- 
-- Agora você pode:
-- 1. Fazer logout do sistema
-- 2. Fazer login novamente
-- 3. Ver o seletor de organização no dashboard
-- 
-- Usuários admin verão um seletor para escolher entre organizações
-- Usuários normais verão apenas sua organização atribuída
-- =====================================================
