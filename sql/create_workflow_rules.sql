-- Criação da tabela de Regras de Workflow
-- Executar este script no Supabase (SQL Editor)

-- 1) Tabela principal
CREATE TABLE IF NOT EXISTS public.workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Índices úteis
CREATE INDEX IF NOT EXISTS idx_workflow_rules_active ON public.workflow_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_priority ON public.workflow_rules(priority);

-- 3) Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS set_workflow_rules_updated_at ON public.workflow_rules;
CREATE TRIGGER set_workflow_rules_updated_at
BEFORE UPDATE ON public.workflow_rules
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_timestamp();

-- 4) RLS (ajuste conforme política do projeto)
ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;

-- Leitura para usuários autenticados
DROP POLICY IF EXISTS "Workflow rules são visíveis para usuários autenticados" ON public.workflow_rules;
CREATE POLICY "Workflow rules são visíveis para usuários autenticados"
  ON public.workflow_rules
  FOR SELECT
  TO authenticated
  USING (true);

-- Escrita apenas via role de serviço (API server) ou admins
DROP POLICY IF EXISTS "Workflow rules - escrita via serviço" ON public.workflow_rules;
CREATE POLICY "Workflow rules - escrita via serviço"
  ON public.workflow_rules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5) Tabela de logs de execução
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.workflow_rules(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  conditions_met JSONB NOT NULL DEFAULT '{}',
  actions_executed JSONB NOT NULL DEFAULT '{}',
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_workflow_executions_rule_id ON public.workflow_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_ticket_id ON public.workflow_executions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_executed_at ON public.workflow_executions(executed_at);

-- RLS para logs
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workflow executions são visíveis para usuários autenticados" ON public.workflow_executions;
CREATE POLICY "Workflow executions são visíveis para usuários autenticados"
  ON public.workflow_executions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Workflow executions - escrita via serviço" ON public.workflow_executions;
CREATE POLICY "Workflow executions - escrita via serviço"
  ON public.workflow_executions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6) Seed básico (exemplos de regras)
DO $$
DECLARE
  has_any BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.workflow_rules) INTO has_any;
  IF NOT has_any THEN
    INSERT INTO public.workflow_rules(name, description, is_active, priority, conditions, actions)
    VALUES
      (
        'Hardware para Técnico',
        'Atribui automaticamente tickets de hardware para técnico especializado',
        true,
        1,
        '{"category": "hardware"}'::jsonb,
        '{"assign_to": "auto", "set_priority": "medium", "add_comment": "Atribuído automaticamente por categoria"}'::jsonb
      ),
      (
        'Escalação 2 horas',
        'Escala tickets sem atribuição após 2 horas',
        true,
        2,
        '{"time_since_creation": "> 2 hours", "assigned_to": null, "status": "open"}'::jsonb,
        '{"set_priority": "high", "notify": ["supervisor@empresa.com"], "add_comment": "Escalado automaticamente - sem atribuição há mais de 2 horas"}'::jsonb
      ),
      (
        'Software para Suporte',
        'Atribui tickets de software para equipe de suporte',
        true,
        3,
        '{"category": "software"}'::jsonb,
        '{"assign_to": "auto", "set_priority": "medium", "add_comment": "Atribuído automaticamente para suporte de software"}'::jsonb
      );
  END IF;
END$$;
