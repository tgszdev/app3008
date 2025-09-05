-- Tabela de configurações de SLA por prioridade e categoria
CREATE TABLE IF NOT EXISTS sla_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Tempos em minutos
  first_response_time INTEGER NOT NULL, -- Tempo para primeira resposta em minutos
  resolution_time INTEGER NOT NULL, -- Tempo para resolução em minutos
  
  -- Configurações de horário de trabalho
  business_hours_only BOOLEAN DEFAULT true, -- Considerar apenas horário comercial
  business_hours_start TIME DEFAULT '08:00:00',
  business_hours_end TIME DEFAULT '18:00:00',
  working_days VARCHAR(20) DEFAULT '1,2,3,4,5', -- 1=Segunda, 7=Domingo
  
  -- Configurações de notificação
  alert_percentage INTEGER DEFAULT 80, -- Alertar quando atingir X% do tempo
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(category_id, priority)
);

-- Tabela de rastreamento de SLA por ticket
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
  first_response_status VARCHAR(50) DEFAULT 'pending', -- pending, met, breached
  resolution_status VARCHAR(50) DEFAULT 'pending', -- pending, met, breached
  
  -- Tempos decorridos (em minutos)
  first_response_elapsed INTEGER,
  resolution_elapsed INTEGER,
  
  -- Pausas (quando ticket está em espera)
  paused_at TIMESTAMPTZ,
  total_paused_time INTEGER DEFAULT 0, -- Em minutos
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de histórico de pausas do SLA
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

-- Tabela de violações de SLA
CREATE TABLE IF NOT EXISTS sla_breaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  sla_configuration_id UUID REFERENCES sla_configurations(id),
  breach_type VARCHAR(50) NOT NULL, -- first_response, resolution
  target_time TIMESTAMPTZ NOT NULL,
  actual_time TIMESTAMPTZ,
  breach_minutes INTEGER NOT NULL,
  justification TEXT,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sla_config_category_priority ON sla_configurations(category_id, priority);
CREATE INDEX IF NOT EXISTS idx_ticket_sla_ticket ON ticket_sla(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_sla_status ON ticket_sla(first_response_status, resolution_status);
CREATE INDEX IF NOT EXISTS idx_sla_breaches_ticket ON sla_breaches(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_breaches_created ON sla_breaches(created_at);

-- Função para calcular tempo útil entre duas datas
CREATE OR REPLACE FUNCTION calculate_business_minutes(
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  business_hours_only BOOLEAN DEFAULT true,
  business_start TIME DEFAULT '08:00:00',
  business_end TIME DEFAULT '18:00:00',
  working_days VARCHAR DEFAULT '1,2,3,4,5'
) RETURNS INTEGER AS $$
DECLARE
  total_minutes INTEGER := 0;
  current_date DATE;
  current_start TIMESTAMPTZ;
  current_end TIMESTAMPTZ;
  day_of_week INTEGER;
BEGIN
  -- Se não considerar apenas horário comercial, retorna diferença total
  IF NOT business_hours_only THEN
    RETURN EXTRACT(EPOCH FROM (end_time - start_time)) / 60;
  END IF;
  
  current_date := DATE(start_time);
  
  WHILE current_date <= DATE(end_time) LOOP
    day_of_week := EXTRACT(DOW FROM current_date);
    
    -- Verifica se é dia útil
    IF POSITION(day_of_week::TEXT IN working_days) > 0 THEN
      -- Define início e fim do dia útil
      current_start := GREATEST(
        start_time,
        current_date + business_start
      );
      
      current_end := LEAST(
        end_time,
        current_date + business_end
      );
      
      -- Adiciona minutos se houver tempo útil
      IF current_end > current_start THEN
        total_minutes := total_minutes + EXTRACT(EPOCH FROM (current_end - current_start)) / 60;
      END IF;
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN total_minutes;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_sla_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sla_configurations_updated_at
  BEFORE UPDATE ON sla_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_updated_at();

CREATE TRIGGER update_ticket_sla_updated_at
  BEFORE UPDATE ON ticket_sla
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_updated_at();