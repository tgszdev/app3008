-- ================================================
-- SCRIPT COMPLETO PARA SETUP DO BANCO SUPABASE
-- ================================================
-- Execute este script no SQL Editor do Supabase
-- https://supabase.com/dashboard/project/eyfvvximmeqmwdfqzqov/editor
-- ================================================

-- 1. CRIAR TABELA DE USUÁRIOS (se não existir)
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'analyst', 'admin')),
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA DE TICKETS
-- ================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number SERIAL UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL DEFAULT 'general',
  created_by UUID NOT NULL,
  assigned_to UUID,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Adicionar as foreign keys
  CONSTRAINT fk_tickets_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. CRIAR TABELA DE COMENTÁRIOS
-- ================================================
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Foreign keys
  CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. CRIAR TABELA DE ANEXOS
-- ================================================
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  comment_id UUID,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Foreign keys
  CONSTRAINT fk_attachments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_attachments_comment FOREIGN KEY (comment_id) REFERENCES ticket_comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_attachments_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. CRIAR TABELA DE HISTÓRICO
-- ================================================
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Foreign keys
  CONSTRAINT fk_history_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- ================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON ticket_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_history_ticket_id ON ticket_history(ticket_id);

-- 7. CRIAR FUNÇÃO PARA ATUALIZAR updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. CRIAR TRIGGERS
-- ================================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON ticket_comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. HABILITAR RLS (Row Level Security)
-- ================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- 10. CRIAR POLÍTICAS DE SEGURANÇA BÁSICAS
-- ================================================
-- Permitir leitura para todos (temporário - ajustar conforme necessário)
CREATE POLICY "Allow read access to all users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow read access to all tickets" ON tickets FOR SELECT USING (true);
CREATE POLICY "Allow read access to all comments" ON ticket_comments FOR SELECT USING (true);
CREATE POLICY "Allow read access to all attachments" ON ticket_attachments FOR SELECT USING (true);
CREATE POLICY "Allow read access to all history" ON ticket_history FOR SELECT USING (true);

-- Permitir inserção (temporário - ajustar conforme necessário)
CREATE POLICY "Allow insert tickets" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert comments" ON ticket_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert history" ON ticket_history FOR INSERT WITH CHECK (true);

-- Permitir update (temporário - ajustar conforme necessário)
CREATE POLICY "Allow update tickets" ON tickets FOR UPDATE USING (true);
CREATE POLICY "Allow update users" ON users FOR UPDATE USING (true);

-- Permitir delete (temporário - ajustar conforme necessário)
CREATE POLICY "Allow delete tickets" ON tickets FOR DELETE USING (true);
CREATE POLICY "Allow delete users" ON users FOR DELETE USING (true);

-- 11. INSERIR USUÁRIO ADMIN PADRÃO (se não existir)
-- ================================================
INSERT INTO users (email, name, password_hash, role, department, is_active)
VALUES (
  'admin@example.com',
  'Administrador do Sistema',
  '$2a$10$X7h3TTgKrxj1Hn8CnWKxCOY7jRl2M1FGRvmFqEqjGw2yR3BKfSfB6', -- senha: admin123
  'admin',
  'Tecnologia da Informação',
  true
) ON CONFLICT (email) DO NOTHING;

-- 12. VERIFICAR SE AS TABELAS FORAM CRIADAS
-- ================================================
SELECT 
  'Tabelas criadas:' as info,
  COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'tickets', 'ticket_comments', 'ticket_attachments', 'ticket_history');

-- 13. VERIFICAR RELACIONAMENTOS
-- ================================================
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('tickets', 'ticket_comments', 'ticket_attachments', 'ticket_history');

-- ================================================
-- FIM DO SCRIPT
-- ================================================
-- Após executar, você deve ver:
-- 1. Mensagem confirmando a criação das 5 tabelas
-- 2. Lista dos relacionamentos criados
-- 3. Usuário admin criado (se não existia)
-- ================================================