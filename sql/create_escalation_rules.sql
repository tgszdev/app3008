-- =====================================================
-- SISTEMA DE ESCALAÇÃO POR TEMPO
-- =====================================================

-- Tabela para regras de escalação por tempo
CREATE TABLE IF NOT EXISTS escalation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  
  -- Condições para ativação da regra
  conditions JSONB NOT NULL DEFAULT '{}',
  
  -- Ações a serem executadas
  actions JSONB NOT NULL DEFAULT '{}',
  
  -- Configurações de tempo
  time_condition VARCHAR(50) NOT NULL, -- 'unassigned_time', 'no_response_time', 'resolution_time'
  time_threshold INTEGER NOT NULL, -- em minutos
  time_unit VARCHAR(10) NOT NULL DEFAULT 'minutes', -- 'minutes', 'hours', 'days'
  
  -- Configurações de horário comercial
  business_hours_only BOOLEAN NOT NULL DEFAULT true,
  business_hours_start TIME DEFAULT '08:00:00',
  business_hours_end TIME DEFAULT '18:00:00',
  working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Segunda, 7=Domingo
  
  -- Configurações de repetição
  repeat_escalation BOOLEAN NOT NULL DEFAULT false,
  repeat_interval INTEGER DEFAULT 60, -- em minutos
  max_repeats INTEGER DEFAULT 3,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Índices
  CONSTRAINT escalation_rules_name_key UNIQUE (name),
  CONSTRAINT escalation_rules_priority_check CHECK (priority >= 1 AND priority <= 100),
  CONSTRAINT escalation_rules_time_threshold_check CHECK (time_threshold > 0),
  CONSTRAINT escalation_rules_time_condition_check CHECK (time_condition IN ('unassigned_time', 'no_response_time', 'resolution_time', 'custom_time'))
);

-- Tabela para logs de escalação
CREATE TABLE IF NOT EXISTS escalation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES escalation_rules(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Dados da escalação
  escalation_type VARCHAR(50) NOT NULL, -- 'unassigned', 'no_response', 'resolution', 'custom'
  time_elapsed INTEGER NOT NULL, -- em minutos
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Condições que foram atendidas
  conditions_met JSONB NOT NULL DEFAULT '{}',
  
  -- Ações executadas
  actions_executed JSONB NOT NULL DEFAULT '{}',
  
  -- Resultado
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações de escalação por categoria/prioridade
CREATE TABLE IF NOT EXISTS escalation_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Configurações de tempo por prioridade
  low_priority_config JSONB NOT NULL DEFAULT '{}',
  medium_priority_config JSONB NOT NULL DEFAULT '{}',
  high_priority_config JSONB NOT NULL DEFAULT '{}',
  critical_priority_config JSONB NOT NULL DEFAULT '{}',
  
  -- Configurações por categoria
  category_configs JSONB NOT NULL DEFAULT '{}',
  
  -- Configurações globais
  global_config JSONB NOT NULL DEFAULT '{}',
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_escalation_rules_active ON escalation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_priority ON escalation_rules(priority);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_time_condition ON escalation_rules(time_condition);
CREATE INDEX IF NOT EXISTS idx_escalation_logs_ticket_id ON escalation_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_escalation_logs_rule_id ON escalation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_escalation_logs_triggered_at ON escalation_logs(triggered_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_escalation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_escalation_rules_updated_at
  BEFORE UPDATE ON escalation_rules
  FOR EACH ROW
  EXECUTE FUNCTION set_escalation_rules_updated_at();

-- RLS (Row Level Security)
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_configs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage escalation rules" ON escalation_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view escalation logs" ON escalation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Admins can manage escalation configs" ON escalation_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Inserir regras de escalação padrão
INSERT INTO escalation_rules (name, description, conditions, actions, time_condition, time_threshold, time_unit, business_hours_only) VALUES
  (
    'Escalação - 1h sem atribuição',
    'Notifica supervisor quando ticket não é atribuído em 1 hora',
    '{"assigned_to": null, "status": "open"}',
    '{"notify_supervisor": true, "add_comment": "Ticket não atribuído há mais de 1 hora. Supervisor notificado."}',
    'unassigned_time',
    60,
    'minutes',
    true
  ),
  (
    'Escalação - 4h sem resposta',
    'Aumenta prioridade quando não há resposta em 4 horas',
    '{"status": "in_progress", "last_comment_hours": "> 4"}',
    '{"increase_priority": true, "add_comment": "Prioridade aumentada devido à falta de resposta há mais de 4 horas."}',
    'no_response_time',
    240,
    'minutes',
    true
  ),
  (
    'Escalação - 24h sem resolução',
    'Escala para gerência quando ticket não é resolvido em 24 horas',
    '{"status": "in_progress", "created_hours_ago": "> 24"}',
    '{"escalate_to_management": true, "add_comment": "Ticket escalado para gerência devido ao tempo de resolução excedido."}',
    'resolution_time',
    1440,
    'minutes',
    true
  ),
  (
    'Escalação - 2h sem atribuição (Crítico)',
    'Escalação mais rápida para tickets críticos',
    '{"assigned_to": null, "status": "open", "priority": "critical"}',
    '{"notify_supervisor": true, "escalate_to_management": true, "add_comment": "Ticket crítico não atribuído há mais de 2 horas. Gerência notificada."}',
    'unassigned_time',
    120,
    'minutes',
    false
  )
ON CONFLICT (name) DO NOTHING;

-- Inserir configuração padrão
INSERT INTO escalation_configs (name, description, low_priority_config, medium_priority_config, high_priority_config, critical_priority_config) VALUES
  (
    'Configuração Padrão de Escalação',
    'Configurações padrão para escalação por tempo baseada na prioridade do ticket',
    '{"unassigned_time": 120, "no_response_time": 480, "resolution_time": 2880}',
    '{"unassigned_time": 90, "no_response_time": 360, "resolution_time": 2160}',
    '{"unassigned_time": 60, "no_response_time": 240, "resolution_time": 1440}',
    '{"unassigned_time": 30, "no_response_time": 120, "resolution_time": 720}'
  )
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE escalation_rules IS 'Regras de escalação por tempo para tickets';
COMMENT ON TABLE escalation_logs IS 'Logs de execução das regras de escalação';
COMMENT ON TABLE escalation_configs IS 'Configurações de escalação por categoria e prioridade';

COMMENT ON COLUMN escalation_rules.time_condition IS 'Tipo de condição de tempo: unassigned_time, no_response_time, resolution_time, custom_time';
COMMENT ON COLUMN escalation_rules.time_threshold IS 'Limite de tempo em minutos para ativação da regra';
COMMENT ON COLUMN escalation_rules.conditions IS 'Condições JSON para ativação da regra';
COMMENT ON COLUMN escalation_rules.actions IS 'Ações JSON a serem executadas quando a regra é ativada';
COMMENT ON COLUMN escalation_rules.working_days IS 'Array de dias da semana (1=Segunda, 7=Domingo)';
COMMENT ON COLUMN escalation_rules.repeat_escalation IS 'Se a regra deve ser repetida periodicamente';
COMMENT ON COLUMN escalation_rules.max_repeats IS 'Número máximo de repetições da regra';
