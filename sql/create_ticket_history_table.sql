-- ================================================
-- TABELA DE HISTÓRICO DE TICKETS
-- ================================================
-- Esta tabela registra todas as mudanças importantes nos tickets

-- Criar tabela de histórico de tickets
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL, -- 'priority_changed', 'status_changed', 'assigned', 'unassigned', 'comment_added', 'created', 'reopened', 'escalated'
  field_changed VARCHAR(50), -- 'priority', 'status', 'assigned_to', 'description', 'title', etc.
  old_value TEXT, -- Valor anterior (se aplicável)
  new_value TEXT, -- Novo valor (se aplicável)
  description TEXT, -- Descrição da mudança
  metadata JSONB, -- Dados extras (como detalhes da escalação, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_ticket_history_ticket_id (ticket_id),
  INDEX idx_ticket_history_user_id (user_id),
  INDEX idx_ticket_history_action_type (action_type),
  INDEX idx_ticket_history_created_at (created_at),
  INDEX idx_ticket_history_field_changed (field_changed)
);

-- Habilitar RLS
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem histórico (baseado na permissão tickets_view_history)
CREATE POLICY "Users can view ticket history if they have permission" ON ticket_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.id = ticket_history.ticket_id
      AND (
        -- Admin e analyst podem ver todos os históricos
        auth.jwt() ->> 'role' IN ('admin', 'analyst', 'dev')
        OR
        -- Users podem ver histórico de seus próprios tickets (se tiverem permissão)
        (t.created_by = (auth.jwt() ->> 'sub')::uuid AND auth.jwt() ->> 'role' = 'user')
      )
    )
  );

-- Política para inserção (apenas sistema pode inserir)
CREATE POLICY "Only system can insert ticket history" ON ticket_history
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Função para registrar mudanças automaticamente
CREATE OR REPLACE FUNCTION log_ticket_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar mudança de status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_history (ticket_id, user_id, action_type, field_changed, old_value, new_value, description)
    VALUES (
      NEW.id,
      COALESCE((current_setting('app.current_user_id', true))::uuid, NEW.updated_by),
      'status_changed',
      'status',
      OLD.status,
      NEW.status,
      format('Status alterado de "%s" para "%s"', OLD.status, NEW.status)
    );
  END IF;

  -- Registrar mudança de prioridade
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO ticket_history (ticket_id, user_id, action_type, field_changed, old_value, new_value, description)
    VALUES (
      NEW.id,
      COALESCE((current_setting('app.current_user_id', true))::uuid, NEW.updated_by),
      'priority_changed',
      'priority',
      OLD.priority,
      NEW.priority,
      format('Prioridade alterada de "%s" para "%s"', OLD.priority, NEW.priority)
    );
  END IF;

  -- Registrar mudança de responsável
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    DECLARE
      old_user_name TEXT;
      new_user_name TEXT;
    BEGIN
      -- Buscar nomes dos usuários
      IF OLD.assigned_to IS NOT NULL THEN
        SELECT name INTO old_user_name FROM users WHERE id = OLD.assigned_to;
      END IF;
      
      IF NEW.assigned_to IS NOT NULL THEN
        SELECT name INTO new_user_name FROM users WHERE id = NEW.assigned_to;
      END IF;

      INSERT INTO ticket_history (ticket_id, user_id, action_type, field_changed, old_value, new_value, description)
      VALUES (
        NEW.id,
        COALESCE((current_setting('app.current_user_id', true))::uuid, NEW.updated_by),
        CASE 
          WHEN OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN 'assigned'
          WHEN OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN 'unassigned'
          ELSE 'reassigned'
        END,
        'assigned_to',
        OLD.assigned_to::text,
        NEW.assigned_to::text,
        CASE 
          WHEN OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN 
            format('Ticket atribuído para %s', COALESCE(new_user_name, 'usuário desconhecido'))
          WHEN OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN 
            format('Ticket desatribuído de %s', COALESCE(old_user_name, 'usuário desconhecido'))
          ELSE 
            format('Ticket reatribuído de %s para %s', 
              COALESCE(old_user_name, 'usuário desconhecido'), 
              COALESCE(new_user_name, 'usuário desconhecido'))
        END
      );
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para registrar mudanças automaticamente
DROP TRIGGER IF EXISTS ticket_change_history_trigger ON tickets;
CREATE TRIGGER ticket_change_history_trigger
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_change();

-- Inserir registro de criação para tickets existentes (opcional)
-- INSERT INTO ticket_history (ticket_id, user_id, action_type, description, created_at)
-- SELECT 
--   id,
--   created_by,
--   'created',
--   'Ticket criado',
--   created_at
-- FROM tickets
-- WHERE NOT EXISTS (
--   SELECT 1 FROM ticket_history 
--   WHERE ticket_id = tickets.id AND action_type = 'created'
-- );

-- Comentário informativo
COMMENT ON TABLE ticket_history IS 'Histórico de mudanças nos tickets - registra todas as alterações importantes';
COMMENT ON COLUMN ticket_history.action_type IS 'Tipo da ação: priority_changed, status_changed, assigned, unassigned, comment_added, created, reopened, escalated';
COMMENT ON COLUMN ticket_history.field_changed IS 'Campo que foi alterado: priority, status, assigned_to, description, title, etc.';
COMMENT ON COLUMN ticket_history.metadata IS 'Dados extras em formato JSON para informações complementares';
