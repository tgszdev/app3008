-- Script para adicionar funcionalidade de tickets internos
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar campo is_internal na tabela tickets se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'is_internal'
  ) THEN
    ALTER TABLE tickets ADD COLUMN is_internal BOOLEAN DEFAULT false;
    
    -- Criar índice para melhor performance
    CREATE INDEX idx_tickets_is_internal ON tickets(is_internal);
    
    -- Adicionar comentário explicativo
    COMMENT ON COLUMN tickets.is_internal IS 'Indica se o ticket é interno (visível apenas para admin e analyst)';
  END IF;
END $$;

-- 2. Garantir que a coluna is_internal já existe em ticket_comments (já deve existir)
-- Se não existir, este comando não fará nada
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ticket_comments' AND column_name = 'is_internal'
  ) THEN
    ALTER TABLE ticket_comments ADD COLUMN is_internal BOOLEAN DEFAULT false;
    
    -- Criar índice para melhor performance
    CREATE INDEX idx_ticket_comments_is_internal ON ticket_comments(is_internal);
    
    -- Adicionar comentário explicativo
    COMMENT ON COLUMN ticket_comments.is_internal IS 'Indica se o comentário é interno (visível apenas para admin e analyst)';
  END IF;
END $$;

-- 3. Criar ou atualizar políticas RLS para tickets internos
-- Primeiro, habilitar RLS se ainda não estiver habilitado
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- 4. Criar política para visualização de tickets
-- Admin e Analyst podem ver todos os tickets
-- Users só podem ver tickets não internos ou tickets criados por eles
DROP POLICY IF EXISTS "view_tickets_policy" ON tickets;
CREATE POLICY "view_tickets_policy" ON tickets
  FOR SELECT
  USING (
    -- Admin e analyst veem tudo
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'analyst')
    )
    OR
    -- Users veem apenas tickets não internos ou criados por eles
    (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'user'
      )
      AND (
        is_internal = false 
        OR created_by = auth.uid()
      )
    )
  );

-- 5. Criar política para comentários
-- Similar à política de tickets
DROP POLICY IF EXISTS "view_comments_policy" ON ticket_comments;
CREATE POLICY "view_comments_policy" ON ticket_comments
  FOR SELECT
  USING (
    -- Admin e analyst veem todos os comentários
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'analyst')
    )
    OR
    -- Users veem apenas comentários não internos
    (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'user'
      )
      AND is_internal = false
    )
  );

-- 6. Criar função para contar comentários visíveis
CREATE OR REPLACE FUNCTION get_visible_comment_count(ticket_id UUID, user_role TEXT)
RETURNS INTEGER AS $$
BEGIN
  IF user_role IN ('admin', 'analyst') THEN
    -- Admin e analyst veem todos os comentários
    RETURN (
      SELECT COUNT(*) 
      FROM ticket_comments 
      WHERE ticket_comments.ticket_id = $1
    );
  ELSE
    -- Users veem apenas comentários não internos
    RETURN (
      SELECT COUNT(*) 
      FROM ticket_comments 
      WHERE ticket_comments.ticket_id = $1 
      AND is_internal = false
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Funcionalidade de tickets internos adicionada com sucesso!';
  RAISE NOTICE 'Campos is_internal adicionados às tabelas tickets e ticket_comments';
  RAISE NOTICE 'Políticas RLS configuradas para restringir acesso baseado em role';
END $$;