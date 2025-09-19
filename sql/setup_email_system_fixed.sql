-- Sistema de Email e Configurações (VERSÃO CORRIGIDA)
-- Este script funciona tanto se a tabela system_settings já existir quanto se não existir

-- 1. Criar tabela de logs de email (se não existir)
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

-- 2. Verificar se system_settings existe e qual o tipo da coluna value
DO $$
DECLARE
    table_exists boolean;
    column_type text;
BEGIN
    -- Verificar se a tabela existe
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        -- Criar tabela se não existir (com value como TEXT)
        CREATE TABLE system_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value TEXT,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Criar índice
        CREATE INDEX idx_system_settings_key ON system_settings(key);
        
        RAISE NOTICE 'Tabela system_settings criada com sucesso';
    END IF;
END $$;

-- 3. Inserir/Atualizar configurações de email
-- Usa INSERT ... ON CONFLICT para funcionar em ambos os casos

-- Se a coluna value for JSON, use este bloco:
-- (Descomente se sua coluna value for do tipo JSON/JSONB)
/*
INSERT INTO system_settings (key, value, description) VALUES
  ('email_provider', '"supabase"'::json, 'Provedor de email'),
  ('email_from', '"noreply@ithostbr.tech"'::json, 'Email remetente padrão'),
  ('smtp_host', '""'::json, 'Host do servidor SMTP'),
  ('smtp_port', '"587"'::json, 'Porta do servidor SMTP'),
  ('smtp_user', '""'::json, 'Usuário SMTP'),
  ('smtp_pass', '""'::json, 'Senha SMTP'),
  ('sendgrid_api_key', '""'::json, 'API Key do SendGrid'),
  ('resend_api_key', '""'::json, 'API Key do Resend')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();
*/

-- Se a coluna value for TEXT, use este bloco:
-- (Este é o padrão - funciona na maioria dos casos)
INSERT INTO system_settings (key, value, description) VALUES
  ('email_provider', 'supabase', 'Provedor de email (supabase, smtp, sendgrid, resend)'),
  ('email_from', 'noreply@ithostbr.tech', 'Email remetente padrão'),
  ('smtp_host', '', 'Host do servidor SMTP'),
  ('smtp_port', '587', 'Porta do servidor SMTP'),
  ('smtp_user', '', 'Usuário SMTP'),
  ('smtp_pass', '', 'Senha SMTP'),
  ('sendgrid_api_key', '', 'API Key do SendGrid'),
  ('resend_api_key', '', 'API Key do Resend')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4. Triggers para atualizar updated_at
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

-- 5. RLS (Row Level Security)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

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

-- Políticas para system_settings
DROP POLICY IF EXISTS "Todos podem ler configurações" ON system_settings;
CREATE POLICY "Todos podem ler configurações" ON system_settings
  FOR SELECT USING (true);

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

-- 6. Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de email configurado com sucesso!';
  RAISE NOTICE '📋 Tabelas configuradas: email_logs, system_settings';
  RAISE NOTICE '🔧 Configure as credenciais de email na tabela system_settings';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Para configurar o email, use:';
  RAISE NOTICE 'UPDATE system_settings SET value = ''sendgrid'' WHERE key = ''email_provider'';';
  RAISE NOTICE 'UPDATE system_settings SET value = ''SUA_API_KEY'' WHERE key = ''sendgrid_api_key'';';
END $$;