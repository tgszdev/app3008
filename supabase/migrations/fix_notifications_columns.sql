-- Adicionar colunas faltantes na tabela notifications (se não existirem)

-- Adicionar coluna action_url
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Adicionar coluna data
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS data JSONB;

-- Adicionar coluna severity
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'info';

-- Adicionar coluna type
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Adicionar coluna expires_at
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Verificar e adicionar coluna is_read (caso tenha sido criada como read)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Se existir coluna 'read', migrar dados para 'is_read' e remover
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'notifications' 
               AND column_name = 'read') THEN
        
        -- Copiar dados de 'read' para 'is_read' se necessário
        UPDATE notifications SET is_read = read WHERE is_read IS NULL;
        
        -- Remover coluna antiga
        ALTER TABLE notifications DROP COLUMN read;
    END IF;
END $$;

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;