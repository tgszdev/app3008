-- ═══════════════════════════════════════════════════════════
-- TABELAS PARA META WHATSAPP BUSINESS API
-- ═══════════════════════════════════════════════════════════

-- 1️⃣ Mensagens enviadas
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id VARCHAR(255) UNIQUE, -- Meta Message ID
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_phone VARCHAR(20) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read, failed
    
    -- Timestamps
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    -- Dados
    error_message TEXT,
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_user ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_id ON whatsapp_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_sent ON whatsapp_messages(sent_at DESC);

-- 2️⃣ Mensagens recebidas
CREATE TABLE IF NOT EXISTS whatsapp_received_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id VARCHAR(255) UNIQUE,
    from_phone VARCHAR(20) NOT NULL,
    message_text TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    raw_data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_rcv_phone ON whatsapp_received_messages(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_rcv_processed ON whatsapp_received_messages(processed);

-- 3️⃣ Campo phone em users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

COMMENT ON COLUMN users.phone IS 'WhatsApp: +5511987654321';

-- 4️⃣ Preferências WhatsApp
ALTER TABLE user_notification_preferences 
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE;

-- 5️⃣ Atualizar JSONBs
DO $$
BEGIN
    UPDATE user_notification_preferences
    SET 
      ticket_created = COALESCE(ticket_created, '{}'::jsonb) || '{"whatsapp": false}'::jsonb,
      ticket_assigned = COALESCE(ticket_assigned, '{}'::jsonb) || '{"whatsapp": false}'::jsonb,
      ticket_updated = COALESCE(ticket_updated, '{}'::jsonb) || '{"whatsapp": false}'::jsonb,
      comment_added = COALESCE(comment_added, '{}'::jsonb) || '{"whatsapp": false}'::jsonb
    WHERE NOT (ticket_created ? 'whatsapp');
END $$;

-- 6️⃣ View de métricas
CREATE OR REPLACE VIEW whatsapp_metrics AS
SELECT 
  DATE(sent_at) as date,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status IN ('delivered', 'read')) as delivered,
  COUNT(*) FILTER (WHERE status = 'read') as read,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('delivered', 'read'))::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as delivery_rate
FROM whatsapp_messages
GROUP BY DATE(sent_at)
ORDER BY date DESC;

-- ✅ Pronto para Meta WhatsApp!

