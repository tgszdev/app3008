-- Criação da tabela de Status de Chamados com ordenação
-- Executar este script no Supabase (SQL Editor)

-- 1) Tabela principal
CREATE TABLE IF NOT EXISTS public.ticket_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_final BOOLEAN NOT NULL DEFAULT false,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Índices úteis
CREATE INDEX IF NOT EXISTS idx_ticket_statuses_order ON public.ticket_statuses(order_index);

-- 3) Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_statuses_updated_at ON public.ticket_statuses;
CREATE TRIGGER set_ticket_statuses_updated_at
BEFORE UPDATE ON public.ticket_statuses
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_timestamp();

-- 4) RLS (ajuste conforme política do projeto)
ALTER TABLE public.ticket_statuses ENABLE ROW LEVEL SECURITY;

-- Leitura para usuários autenticados
DROP POLICY IF EXISTS "Ticket statuses são visíveis para usuários autenticados" ON public.ticket_statuses;
CREATE POLICY "Ticket statuses são visíveis para usuários autenticados"
  ON public.ticket_statuses
  FOR SELECT
  TO authenticated
  USING (true);

-- Escrita apenas via role de serviço (API server) ou admins (se usarem auth.uid() em outra política)
DROP POLICY IF EXISTS "Ticket statuses - escrita via serviço" ON public.ticket_statuses;
CREATE POLICY "Ticket statuses - escrita via serviço"
  ON public.ticket_statuses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5) Seed básico (opcional)
DO $$
DECLARE
  has_any BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.ticket_statuses) INTO has_any;
  IF NOT has_any THEN
    INSERT INTO public.ticket_statuses(name, slug, color, description, is_default, is_final, order_index)
    VALUES
      ('Aberto', 'aberto', '#2563eb', 'Chamado aberto/novo', true, false, 1),
      ('Em Progresso', 'em-progresso', '#9333ea', 'Atendimento em andamento', false, false, 2),
      ('Aguardando Cliente', 'aguardando-cliente', '#f59e0b', 'Pausado aguardando retorno do cliente', false, false, 3),
      ('Resolvido', 'resolvido', '#16a34a', 'Solução aplicada, aguardando validação/fechamento', false, true, 4),
      ('Fechado', 'fechado', '#334155', 'Chamado concluído/encerrado', false, true, 5);
  END IF;
END$$;


