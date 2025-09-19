-- Sistema de Email e Configurações

-- 1. Criar tabela de logs de email
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status VARCHAR(50) DEFAULT 'queued', -- queued, sent, failed
  provider VARCHAR(50), -- supabase, smtp, sendgrid, resend
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to ON email_logs(to_email);

-- 2. Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para system_settings
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- 3. Inserir configurações padrão de email
-- Verificar se a coluna value é JSON ou TEXT e inserir adequadamente
INSERT INTO system_settings (key, value, description) VALUES
  ('email_provider', '"supabase"', 'Provedor de email (supabase, smtp, sendgrid, resend)')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO system_settings (key, value, description) VALUES
  ('email_from', '"noreply@ithostbr.tech"', 'Email remetente padrão')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO system_settings (key, value, description) VALUES
  ('smtp_host', '""', 'Host do servidor SMTP')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('smtp_port', '"587"', 'Porta do servidor SMTP')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('smtp_user', '""', 'Usuário SMTP')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('smtp_pass', '""', 'Senha SMTP')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('sendgrid_api_key', '""', 'API Key do SendGrid')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('resend_api_key', '""', 'API Key do Resend')
  ON CONFLICT (key) DO NOTHING;

-- 4. Trigger para atualizar updated_at em email_logs
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

-- 5. Trigger para atualizar updated_at em system_settings
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- 6. RLS para email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver logs de email
DROP POLICY IF EXISTS "Admins podem ver logs de email" ON email_logs;
CREATE POLICY "Admins podem ver logs de email" ON email_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Política: Sistema pode inserir logs
DROP POLICY IF EXISTS "Sistema pode inserir logs de email" ON email_logs;
CREATE POLICY "Sistema pode inserir logs de email" ON email_logs
  FOR INSERT
  WITH CHECK (true);

-- Política: Sistema pode atualizar logs
DROP POLICY IF EXISTS "Sistema pode atualizar logs de email" ON email_logs;
CREATE POLICY "Sistema pode atualizar logs de email" ON email_logs
  FOR UPDATE
  USING (true);

-- 7. RLS para system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler configurações
DROP POLICY IF EXISTS "Todos podem ler configurações" ON system_settings;
CREATE POLICY "Todos podem ler configurações" ON system_settings
  FOR SELECT USING (true);

-- Política: Apenas admins podem modificar
DROP POLICY IF EXISTS "Admins podem modificar configurações" ON system_settings;
CREATE POLICY "Admins podem modificar configurações" ON system_settings
  FOR INSERT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins podem atualizar configurações" ON system_settings;
CREATE POLICY "Admins podem atualizar configurações" ON system_settings
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins podem deletar configurações" ON system_settings;
CREATE POLICY "Admins podem deletar configurações" ON system_settings
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE 'Sistema de email configurado com sucesso!';
  RAISE NOTICE 'Tabelas criadas: email_logs, system_settings';
  RAISE NOTICE 'Configure as credenciais de email na tabela system_settings';
END $$;