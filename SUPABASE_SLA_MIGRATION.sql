-- ============================================
-- SCRIPT DE MIGRAÇÃO PARA SISTEMA DE SLA
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Criar tabela de configurações de SLA
CREATE TABLE IF NOT EXISTS sla_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Tempos em minutos
  first_response_time INTEGER NOT NULL, 
  resolution_time INTEGER NOT NULL,
  
  -- Configurações de horário de trabalho
  business_hours_only BOOLEAN DEFAULT true,
  business_hours_start TIME DEFAULT '08:00:00',
  business_hours_end TIME DEFAULT '18:00:00',
  working_days VARCHAR(20) DEFAULT '1,2,3,4,5',
  
  -- Configurações de notificação
  alert_percentage INTEGER DEFAULT 80,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(category_id, priority)
);

-- 2. Criar tabela de rastreamento de SLA por ticket
CREATE TABLE IF NOT EXISTS ticket_sla (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  sla_configuration_id UUID REFERENCES sla_configurations(id),
  
  -- Tempos alvo baseados na configuração
  first_response_target TIMESTAMPTZ,
  resolution_target TIMESTAMPTZ,
  
  -- Tempos reais
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Status do SLA
  first_response_status VARCHAR(50) DEFAULT 'pending',
  resolution_status VARCHAR(50) DEFAULT 'pending',
  
  -- Tempos decorridos (em minutos)
  first_response_elapsed INTEGER,
  resolution_elapsed INTEGER,
  
  -- Pausas
  paused_at TIMESTAMPTZ,
  total_paused_time INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar tabela de histórico de pausas
CREATE TABLE IF NOT EXISTS sla_pause_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_sla_id UUID REFERENCES ticket_sla(id) ON DELETE CASCADE,
  paused_at TIMESTAMPTZ NOT NULL,
  resumed_at TIMESTAMPTZ,
  pause_reason TEXT,
  paused_by UUID REFERENCES users(id),
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar tabela de violações de SLA
CREATE TABLE IF NOT EXISTS sla_breaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  sla_configuration_id UUID REFERENCES sla_configurations(id),
  breach_type VARCHAR(50) NOT NULL,
  target_time TIMESTAMPTZ NOT NULL,
  actual_time TIMESTAMPTZ,
  breach_minutes INTEGER NOT NULL,
  justification TEXT,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sla_config_category_priority ON sla_configurations(category_id, priority);
CREATE INDEX IF NOT EXISTS idx_ticket_sla_ticket ON ticket_sla(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_sla_status ON ticket_sla(first_response_status, resolution_status);
CREATE INDEX IF NOT EXISTS idx_sla_breaches_ticket ON sla_breaches(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_breaches_created ON sla_breaches(created_at);

-- 6. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_sla_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar triggers para atualizar updated_at
CREATE TRIGGER update_sla_configurations_updated_at
  BEFORE UPDATE ON sla_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_updated_at();

CREATE TRIGGER update_ticket_sla_updated_at
  BEFORE UPDATE ON ticket_sla
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_updated_at();

-- 8. Habilitar RLS (Row Level Security)
ALTER TABLE sla_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_pause_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_breaches ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas de segurança
-- SLA Configurations - Apenas admin pode criar/editar, todos podem visualizar
CREATE POLICY "Todos podem visualizar configurações de SLA" ON sla_configurations
  FOR SELECT USING (true);

CREATE POLICY "Apenas admin pode criar configurações de SLA" ON sla_configurations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "Apenas admin pode atualizar configurações de SLA" ON sla_configurations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "Apenas admin pode deletar configurações de SLA" ON sla_configurations
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Ticket SLA - Todos podem visualizar, sistema pode criar/atualizar
CREATE POLICY "Todos podem visualizar SLA de tickets" ON ticket_sla
  FOR SELECT USING (true);

CREATE POLICY "Sistema pode criar registro de SLA" ON ticket_sla
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar registro de SLA" ON ticket_sla
  FOR UPDATE USING (true);

-- SLA Pause History - Todos podem visualizar, staff pode criar
CREATE POLICY "Todos podem visualizar histórico de pausas" ON sla_pause_history
  FOR SELECT USING (true);

CREATE POLICY "Staff pode criar pausas" ON sla_pause_history
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'analyst')
    )
  );

-- SLA Breaches - Todos podem visualizar, sistema pode criar
CREATE POLICY "Todos podem visualizar violações de SLA" ON sla_breaches
  FOR SELECT USING (true);

CREATE POLICY "Sistema pode criar violações" ON sla_breaches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin pode atualizar violações" ON sla_breaches
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- 10. Inserir configurações padrão de SLA
INSERT INTO sla_configurations (name, description, priority, first_response_time, resolution_time, business_hours_only)
VALUES 
  ('SLA Crítico', 'Configuração para tickets de prioridade crítica', 'critical', 30, 120, false),
  ('SLA Alto', 'Configuração para tickets de alta prioridade', 'high', 60, 240, true),
  ('SLA Médio', 'Configuração para tickets de média prioridade', 'medium', 120, 480, true),
  ('SLA Baixo', 'Configuração para tickets de baixa prioridade', 'low', 240, 960, true)
ON CONFLICT DO NOTHING;

-- 11. Adicionar campos de SLA na tabela tickets (se não existirem)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- ============================================
-- FIM DO SCRIPT DE MIGRAÇÃO
-- ============================================

-- Para verificar se as tabelas foram criadas:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%sla%';

-- Para verificar as configurações padrão:
-- SELECT * FROM sla_configurations;