-- Script para inserir apenas as configurações de email
-- Use este script se as tabelas já existem

-- 1. Criar tabela email_logs se não existir
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status VARCHAR(50) DEFAULT 'queued',
  provider VARCHAR(50),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to ON email_logs(to_email);

-- 2. Inserir configurações na tabela system_settings existente
-- OPÇÃO A: Se a coluna 'value' for do tipo JSON/JSONB, use isto:
INSERT INTO system_settings (key, value, description) VALUES
  ('email_provider', '"supabase"'::json, 'Provedor de email (supabase, smtp, sendgrid, resend)')
ON CONFLICT (key) DO UPDATE SET value = '"supabase"'::json;

INSERT INTO system_settings (key, value, description) VALUES
  ('email_from', '"noreply@ithostbr.tech"'::json, 'Email remetente padrão')
ON CONFLICT (key) DO UPDATE SET value = '"noreply@ithostbr.tech"'::json;

INSERT INTO system_settings (key, value, description) VALUES
  ('smtp_host', '""'::json, 'Host do servidor SMTP')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('smtp_port', '"587"'::json, 'Porta do servidor SMTP')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('smtp_user', '""'::json, 'Usuário SMTP')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('smtp_pass', '""'::json, 'Senha SMTP')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('sendgrid_api_key', '""'::json, 'API Key do SendGrid')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('resend_api_key', '""'::json, 'API Key do Resend')
ON CONFLICT (key) DO NOTHING;

-- 3. Configurar RLS se necessário
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para email_logs
DROP POLICY IF EXISTS "Admins podem ver logs de email" ON email_logs;
CREATE POLICY "Admins podem ver logs de email" ON email_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Sistema pode inserir logs de email" ON email_logs;
CREATE POLICY "Sistema pode inserir logs de email" ON email_logs
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Sistema pode atualizar logs de email" ON email_logs;
CREATE POLICY "Sistema pode atualizar logs de email" ON email_logs
  FOR UPDATE
  USING (true);

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_logs_updated_at ON email_logs;
CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_logs_updated_at();

-- 5. Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE '✅ Configurações de email inseridas com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Para configurar SendGrid:';
  RAISE NOTICE 'UPDATE system_settings SET value = ''"sendgrid"''::json WHERE key = ''email_provider'';';
  RAISE NOTICE 'UPDATE system_settings SET value = ''"SUA_API_KEY"''::json WHERE key = ''sendgrid_api_key'';';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Para configurar SMTP:';
  RAISE NOTICE 'UPDATE system_settings SET value = ''"smtp"''::json WHERE key = ''email_provider'';';
  RAISE NOTICE 'UPDATE system_settings SET value = ''"smtp.gmail.com"''::json WHERE key = ''smtp_host'';';
  RAISE NOTICE 'UPDATE system_settings SET value = ''"seu-email@gmail.com"''::json WHERE key = ''smtp_user'';';
  RAISE NOTICE 'UPDATE system_settings SET value = ''"sua-senha"''::json WHERE key = ''smtp_pass'';';
END $$;