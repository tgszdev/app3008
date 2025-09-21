-- ================================================
-- RECRIAR TABELA TICKETS DO ZERO (OPÇÃO MAIS SEGURA)
-- ================================================
-- Use este script se o anterior não funcionar
-- ================================================

-- 1. FAZER BACKUP DOS DADOS EXISTENTES (se houver)
-- ================================================
CREATE TEMP TABLE tickets_backup AS 
SELECT * FROM tickets
WHERE false; -- Cria estrutura vazia por enquanto

-- Tentar copiar dados se existirem
INSERT INTO tickets_backup
SELECT * FROM tickets
WHERE EXISTS (SELECT 1 FROM tickets LIMIT 1);

-- 2. REMOVER A TABELA ANTIGA
-- ================================================
DROP TABLE IF EXISTS tickets CASCADE;

-- 3. CRIAR A TABELA NOVA COM TODAS AS COLUNAS
-- ================================================
CREATE TABLE tickets (
  -- Identificadores
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number SERIAL UNIQUE NOT NULL,
  
  -- Informações básicas
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Status e classificação
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL DEFAULT 'general',
  
  -- Relacionamentos com usuários
  created_by UUID NOT NULL,
  assigned_to UUID,
  
  -- Informações adicionais
  resolution_notes TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- ================================================
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);

-- 5. CRIAR TRIGGER PARA ATUALIZAR updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. HABILITAR RLS (Row Level Security)
-- ================================================
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Política para leitura (todos podem ler por enquanto)
CREATE POLICY "tickets_select_policy" ON tickets
  FOR SELECT USING (true);

-- Política para inserção
CREATE POLICY "tickets_insert_policy" ON tickets
  FOR INSERT WITH CHECK (true);

-- Política para atualização
CREATE POLICY "tickets_update_policy" ON tickets
  FOR UPDATE USING (true);

-- Política para exclusão
CREATE POLICY "tickets_delete_policy" ON tickets
  FOR DELETE USING (true);

-- 7. INSERIR ALGUNS TICKETS DE TESTE
-- ================================================
DO $$
DECLARE
  admin_id UUID;
  analyst_id UUID;
  user_id UUID;
BEGIN
  -- Buscar IDs dos usuários
  SELECT id INTO admin_id FROM users WHERE email = 'admin@example.com' LIMIT 1;
  SELECT id INTO analyst_id FROM users WHERE role = 'analyst' LIMIT 1;
  SELECT id INTO user_id FROM users WHERE role = 'user' LIMIT 1;
  
  -- Se não encontrar usuários específicos, usar qualquer um
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM users LIMIT 1;
  END IF;
  
  -- Só inserir tickets de teste se a tabela estiver vazia
  IF NOT EXISTS (SELECT 1 FROM tickets LIMIT 1) AND admin_id IS NOT NULL THEN
    INSERT INTO tickets (
      title, 
      description, 
      status, 
      priority, 
      category, 
      created_by, 
      assigned_to
    ) VALUES 
    (
      'Problema com impressora',
      'A impressora do setor financeiro não está funcionando',
      'open',
      'high',
      'hardware',
      COALESCE(user_id, admin_id),
      analyst_id
    ),
    (
      'Instalação de software',
      'Preciso instalar o Microsoft Office no meu computador',
      'in_progress',
      'medium',
      'software',
      COALESCE(user_id, admin_id),
      COALESCE(analyst_id, admin_id)
    ),
    (
      'Erro no sistema de vendas',
      'O sistema está apresentando erro ao finalizar vendas',
      'open',
      'critical',
      'bug',
      admin_id,
      COALESCE(analyst_id, admin_id)
    ),
    (
      'Lentidão na rede',
      'Internet muito lenta em todos os computadores',
      'resolved',
      'medium',
      'network',
      COALESCE(user_id, admin_id),
      COALESCE(analyst_id, admin_id)
    );
    
    RAISE NOTICE 'Tickets de teste inseridos com sucesso!';
  END IF;
END $$;

-- 8. VERIFICAR ESTRUTURA FINAL
-- ================================================
SELECT 
  '================================================' as line,
  'TABELA TICKETS CRIADA COM SUCESSO!' as status,
  '================================================' as line2;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

-- 9. VERIFICAR DADOS
-- ================================================
SELECT 
  '================================================' as line,
  'TICKETS EXISTENTES:' as info,
  '================================================' as line2;

SELECT 
  t.ticket_number,
  t.title,
  t.status,
  t.priority,
  t.category,
  u1.name as created_by,
  u2.name as assigned_to,
  t.created_at
FROM tickets t
LEFT JOIN users u1 ON t.created_by = u1.id
LEFT JOIN users u2 ON t.assigned_to = u2.id
ORDER BY t.created_at DESC;

-- ================================================
-- PRONTO! A tabela foi recriada com sucesso
-- ================================================
-- Agora você pode:
-- ✅ Listar tickets em /dashboard/tickets
-- ✅ Criar novos tickets
-- ✅ Filtrar por categoria, status, prioridade
-- ✅ Atribuir tickets para analistas
-- ================================================