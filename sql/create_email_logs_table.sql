-- Criar tabela de logs de email
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status VARCHAR(50) DEFAULT 'queued', -- queued, sent, failed
  provider VARCHAR(50), -- supabase, smtp, sendgrid, resend
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to ON email_logs(to);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_logs_updated_at();

-- RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver logs de email
CREATE POLICY "Admins podem ver logs de email" ON email_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Política: Sistema pode inserir logs
CREATE POLICY "Sistema pode inserir logs de email" ON email_logs
  FOR INSERT
  WITH CHECK (true);

-- Política: Sistema pode atualizar logs
CREATE POLICY "Sistema pode atualizar logs de email" ON email_logs
  FOR UPDATE
  USING (true);