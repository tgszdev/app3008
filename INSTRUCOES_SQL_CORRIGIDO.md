# 🔧 SOLUÇÃO PARA O ERRO SQL - INSTRUÇÕES COMPLETAS

## ❌ ERRO ENCONTRADO:
```
ERROR: 22P02: invalid input syntax for type json
LINE 37: ('email_provider', 'supabase', 'Provedor de email...
```

## ✅ CAUSA DO ERRO:
A tabela `system_settings` já existe no seu banco com a coluna `value` do tipo **JSON**, mas o script estava tentando inserir valores como **TEXT**.

## 🎯 SOLUÇÃO - USE ESTE SQL:

### COPIE E EXECUTE NO SUPABASE SQL EDITOR:

```sql
-- 1. CRIAR TABELA DE LOGS DE EMAIL
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to ON email_logs(to_email);

-- 2. INSERIR CONFIGURAÇÕES DE EMAIL (FORMATO JSON)
INSERT INTO system_settings (key, value, description) VALUES
  ('email_provider', '"supabase"'::json, 'Provedor de email')
ON CONFLICT (key) DO UPDATE SET value = '"supabase"'::json;

INSERT INTO system_settings (key, value, description) VALUES
  ('email_from', '"noreply@ithostbr.tech"'::json, 'Email remetente')
ON CONFLICT (key) DO UPDATE SET value = '"noreply@ithostbr.tech"'::json;

INSERT INTO system_settings (key, value, description) VALUES
  ('smtp_host', '""'::json, 'Host SMTP'),
  ('smtp_port', '"587"'::json, 'Porta SMTP'),
  ('smtp_user', '""'::json, 'Usuário SMTP'),
  ('smtp_pass', '""'::json, 'Senha SMTP'),
  ('sendgrid_api_key', '""'::json, 'SendGrid API'),
  ('resend_api_key', '""'::json, 'Resend API')
ON CONFLICT (key) DO NOTHING;

-- 3. CONFIGURAR RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Admins podem ver logs de email" ON email_logs;
CREATE POLICY "Admins podem ver logs de email" ON email_logs
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Sistema pode inserir logs de email" ON email_logs;
CREATE POLICY "Sistema pode inserir logs de email" ON email_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Sistema pode atualizar logs de email" ON email_logs;
CREATE POLICY "Sistema pode atualizar logs de email" ON email_logs
  FOR UPDATE USING (true);

-- 4. TRIGGER PARA UPDATED_AT
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
```

## 📧 CONFIGURAR PROVEDOR DE EMAIL

### OPÇÃO 1 - SendGrid (Recomendado):
```sql
UPDATE system_settings 
SET value = '"sendgrid"'::json 
WHERE key = 'email_provider';

UPDATE system_settings 
SET value = '"SG.sua_chave_api_aqui"'::json 
WHERE key = 'sendgrid_api_key';

UPDATE system_settings 
SET value = '"noreply@seudominio.com"'::json 
WHERE key = 'email_from';
```

### OPÇÃO 2 - SMTP (Gmail):
```sql
UPDATE system_settings SET value = '"smtp"'::json WHERE key = 'email_provider';
UPDATE system_settings SET value = '"smtp.gmail.com"'::json WHERE key = 'smtp_host';
UPDATE system_settings SET value = '"587"'::json WHERE key = 'smtp_port';
UPDATE system_settings SET value = '"seu-email@gmail.com"'::json WHERE key = 'smtp_user';
UPDATE system_settings SET value = '"senha-de-app-google"'::json WHERE key = 'smtp_pass';
UPDATE system_settings SET value = '"seu-email@gmail.com"'::json WHERE key = 'email_from';
```

### OPÇÃO 3 - Resend:
```sql
UPDATE system_settings SET value = '"resend"'::json WHERE key = 'email_provider';
UPDATE system_settings SET value = '"re_sua_chave_api"'::json WHERE key = 'resend_api_key';
UPDATE system_settings SET value = '"onboarding@resend.dev"'::json WHERE key = 'email_from';
```

## 🔍 VERIFICAR SE FUNCIONOU:

### 1. Verificar configurações:
```sql
SELECT key, value, description 
FROM system_settings 
WHERE key LIKE '%email%' OR key LIKE '%smtp%' OR key LIKE '%sendgrid%';
```

### 2. Verificar tabela de logs:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'email_logs';
```

### 3. Testar escalação manual:
```bash
curl -X POST https://seu-site.vercel.app/api/escalation/auto-execute
```

## ⚠️ IMPORTANTE:

1. **Use aspas duplas** e **::json** ao inserir valores na coluna JSON
2. **Exemplo correto**: `'"valor"'::json`
3. **Exemplo errado**: `'valor'`

## ✅ RESULTADO ESPERADO:

Após executar o SQL:
- ✅ Tabela `email_logs` criada
- ✅ Configurações de email inseridas
- ✅ RLS configurado
- ✅ Sistema pronto para enviar emails

## 📱 STATUS FINAL:

- **Cron Job**: ✅ Ativo (executa a cada 3 minutos)
- **Timezone**: ✅ Brasil (UTC-3)
- **Templates**: ✅ Profissionais
- **Escalação**: ✅ 1h, 4h, 24h configuradas

---

**Deploy no GitHub**: ✅ CONCLUÍDO
**URL**: https://github.com/tgszdev/app3008
**Última atualização**: Scripts SQL corrigidos para compatibilidade JSON