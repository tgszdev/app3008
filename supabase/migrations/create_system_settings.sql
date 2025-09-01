-- Tabela para armazenar configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id)
);

-- Índice para busca rápida por chave
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Comentários na tabela
COMMENT ON TABLE system_settings IS 'Armazena configurações do sistema como email, integrations, etc';
COMMENT ON COLUMN system_settings.key IS 'Chave única da configuração (ex: email_config, smtp_settings)';
COMMENT ON COLUMN system_settings.value IS 'Valor da configuração em formato JSON';
COMMENT ON COLUMN system_settings.description IS 'Descrição da configuração';
COMMENT ON COLUMN system_settings.updated_by IS 'Usuário que fez a última atualização';

-- Função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp automaticamente
CREATE TRIGGER update_system_settings_timestamp
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- Inserir configurações padrão (opcional)
INSERT INTO system_settings (key, value, description) VALUES
  ('email_config', 
   '{"service": "smtp", "host": "smtp.gmail.com", "port": "587", "secure": false, "user": "", "pass": "", "from": "", "fromName": "Sistema de Suporte Técnico"}'::jsonb, 
   'Configurações de email SMTP')
ON CONFLICT (key) DO NOTHING;

-- Permissões (ajuste conforme necessário)
-- Apenas admins podem ler e escrever configurações do sistema
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy para admins
CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Grant necessário para o service role
GRANT ALL ON system_settings TO service_role;
GRANT USAGE ON SEQUENCE system_settings_id_seq TO service_role;