-- =====================================================
-- TABELA DE AÇÕES DE ESCALAÇÃO
-- =====================================================

-- Tabela para definir ações disponíveis no sistema de escalação
CREATE TABLE IF NOT EXISTS escalation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE, -- Nome interno da ação
  display_name VARCHAR(255) NOT NULL, -- Nome para exibição
  description TEXT, -- Descrição da ação
  action_type VARCHAR(50) NOT NULL, -- Tipo da ação: notification, escalation, priority, assignment, comment
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_config BOOLEAN NOT NULL DEFAULT false, -- Se a ação requer configuração adicional
  config_schema JSONB, -- Schema JSON para configuração da ação
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_escalation_actions_name ON escalation_actions(name);
CREATE INDEX IF NOT EXISTS idx_escalation_actions_type ON escalation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_escalation_actions_active ON escalation_actions(is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_escalation_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_escalation_actions_updated_at'
  ) THEN
    CREATE TRIGGER set_escalation_actions_updated_at
      BEFORE UPDATE ON escalation_actions
      FOR EACH ROW
      EXECUTE FUNCTION set_escalation_actions_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE escalation_actions ENABLE ROW LEVEL SECURITY;

-- Política RLS (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'escalation_actions' 
    AND policyname = 'Admins can manage escalation actions'
  ) THEN
    CREATE POLICY "Admins can manage escalation actions" ON escalation_actions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = 'admin'
        )
      );
  END IF;
END $$;

-- Inserir ações padrão do sistema
INSERT INTO escalation_actions (name, display_name, description, action_type, requires_config, config_schema) VALUES
  (
    'notify_supervisor',
    'Notificar Supervisor',
    'Envia notificação para supervisores (analysts e admins) sobre o ticket',
    'notification',
    true,
    '{
      "type": "object",
      "properties": {
        "recipients": {
          "type": "array",
          "title": "Destinatários",
          "description": "Selecione os usuários que receberão a notificação",
          "items": {
            "type": "string"
          }
        },
        "notification_type": {
          "type": "string",
          "title": "Tipo de Notificação",
          "description": "Tipo de notificação a ser enviada",
          "enum": ["email", "in_app", "both"],
          "default": "both"
        }
      },
      "required": ["recipients"]
    }'
  ),
  (
    'escalate_to_management',
    'Escalar para Gerência',
    'Escala o ticket para gerência (apenas admins)',
    'escalation',
    false,
    null
  ),
  (
    'increase_priority',
    'Aumentar Prioridade',
    'Aumenta a prioridade do ticket automaticamente',
    'priority',
    false,
    null
  ),
  (
    'auto_assign',
    'Atribuir Automaticamente',
    'Atribui o ticket automaticamente a um usuário disponível',
    'assignment',
    false,
    null
  ),
  (
    'add_comment',
    'Adicionar Comentário',
    'Adiciona um comentário automático ao ticket',
    'comment',
    true,
    '{
      "type": "object",
      "properties": {
        "comment_text": {
          "type": "string",
          "title": "Texto do Comentário",
          "description": "Comentário que será adicionado automaticamente"
        }
      },
      "required": ["comment_text"]
    }'
  ),
  (
    'set_status',
    'Alterar Status',
    'Altera o status do ticket automaticamente',
    'status_change',
    true,
    '{
      "type": "object",
      "properties": {
        "target_status": {
          "type": "string",
          "title": "Status de Destino",
          "description": "Status para o qual o ticket será alterado"
        }
      },
      "required": ["target_status"]
    }'
  ),
  (
    'assign_to_user',
    'Atribuir para Usuário Específico',
    'Atribui o ticket para um usuário específico',
    'assignment',
    true,
    '{
      "type": "object",
      "properties": {
        "user_id": {
          "type": "string",
          "title": "ID do Usuário",
          "description": "ID do usuário para atribuir o ticket"
        }
      },
      "required": ["user_id"]
    }'
  ),
  (
    'send_email_notification',
    'Enviar Email',
    'Envia notificação por email para usuários específicos',
    'notification',
    true,
    '{
      "type": "object",
      "properties": {
        "recipients": {
          "type": "array",
          "title": "Destinatários",
          "description": "Selecione os usuários que receberão o email",
          "items": {
            "type": "string"
          }
        },
        "email_template": {
          "type": "string",
          "title": "Template de Email",
          "description": "Template de email a ser usado",
          "enum": ["escalation", "priority_increase", "assignment", "custom"],
          "default": "escalation"
        },
        "subject": {
          "type": "string",
          "title": "Assunto do Email",
          "description": "Assunto personalizado do email"
        },
        "message": {
          "type": "string",
          "title": "Mensagem",
          "description": "Mensagem personalizada do email"
        }
      },
      "required": ["recipients"]
    }'
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  action_type = EXCLUDED.action_type,
  requires_config = EXCLUDED.requires_config,
  config_schema = EXCLUDED.config_schema,
  updated_at = NOW();

-- Comentários para documentação
COMMENT ON TABLE escalation_actions IS 'Ações disponíveis no sistema de escalação';
COMMENT ON COLUMN escalation_actions.name IS 'Nome interno da ação (usado no código)';
COMMENT ON COLUMN escalation_actions.display_name IS 'Nome para exibição na interface';
COMMENT ON COLUMN escalation_actions.action_type IS 'Tipo da ação: notification, escalation, priority, assignment, comment, status_change';
COMMENT ON COLUMN escalation_actions.requires_config IS 'Se a ação requer configuração adicional';
COMMENT ON COLUMN escalation_actions.config_schema IS 'Schema JSON para validação da configuração da ação';
