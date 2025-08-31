-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number SERIAL UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'feature_request', 'bug', 'other')),
  
  -- Relacionamentos
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadados
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);

-- Create comments table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Comentários internos só visíveis para analistas/admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON ticket_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON ticket_comments(created_at DESC);

-- Create attachments table
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES ticket_comments(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for attachments
CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachments_comment_id ON ticket_attachments(comment_id);

-- Create ticket history/audit table
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'assigned', 'commented', 'resolved', 'closed'
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for history
CREATE INDEX IF NOT EXISTS idx_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON ticket_history(created_at DESC);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-increment ticket number
CREATE OR REPLACE FUNCTION get_next_ticket_number()
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) + 1 INTO next_number FROM tickets;
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Sample tickets for testing
INSERT INTO tickets (title, description, status, priority, category, created_by, assigned_to)
SELECT 
  'Problema ao fazer login no sistema',
  'Usuário não consegue acessar o sistema após resetar a senha. Erro 403 aparece na tela.',
  'open',
  'high',
  'technical',
  (SELECT id FROM users WHERE email = 'user1@example.com'),
  (SELECT id FROM users WHERE email = 'analyst1@example.com')
WHERE NOT EXISTS (
  SELECT 1 FROM tickets WHERE title = 'Problema ao fazer login no sistema'
);

INSERT INTO tickets (title, description, status, priority, category, created_by, assigned_to)
SELECT 
  'Solicitação de nova funcionalidade',
  'Gostaríamos de ter um relatório de chamados por departamento.',
  'in_progress',
  'medium',
  'feature_request',
  (SELECT id FROM users WHERE email = 'user2@example.com'),
  (SELECT id FROM users WHERE email = 'analyst2@example.com')
WHERE NOT EXISTS (
  SELECT 1 FROM tickets WHERE title = 'Solicitação de nova funcionalidade'
);

INSERT INTO tickets (title, description, status, priority, category, created_by)
SELECT 
  'Sistema lento pela manhã',
  'O sistema fica muito lento entre 9h e 10h da manhã.',
  'open',
  'medium',
  'technical',
  (SELECT id FROM users WHERE email = 'user3@example.com'),
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tickets WHERE title = 'Sistema lento pela manhã'
);