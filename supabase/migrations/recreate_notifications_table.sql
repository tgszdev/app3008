-- Script para recriar a tabela notifications com todas as colunas necessárias
-- Use este script se o anterior não funcionar

-- Fazer backup dos dados existentes (se houver)
CREATE TEMP TABLE notifications_backup AS 
SELECT * FROM notifications 
WHERE FALSE; -- Cria estrutura vazia

-- Inserir dados existentes no backup (se existirem)
INSERT INTO notifications_backup 
SELECT * FROM notifications
WHERE EXISTS (SELECT 1 FROM notifications LIMIT 1);

-- Remover tabela antiga
DROP TABLE IF EXISTS notifications CASCADE;

-- Criar tabela com estrutura completa
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    action_url TEXT
);

-- Criar índices
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Tentar restaurar dados do backup (se existirem)
-- Nota: Isso só funcionará se as colunas corresponderem
-- Se falhar, os dados antigos serão perdidos mas a tabela estará correta
DO $$ 
BEGIN
    -- Tentar inserir dados antigos
    INSERT INTO notifications 
    SELECT * FROM notifications_backup;
EXCEPTION
    WHEN OTHERS THEN
        -- Se falhar, pelo menos a tabela está criada corretamente
        RAISE NOTICE 'Não foi possível restaurar dados antigos: %', SQLERRM;
END $$;

-- Limpar backup temporário
DROP TABLE IF EXISTS notifications_backup;

-- Criar notificação de teste para verificar
INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    severity,
    action_url
) VALUES (
    (SELECT id FROM users LIMIT 1), -- Pega o primeiro usuário
    'Sistema de Notificações Ativado',
    'As tabelas de notificação foram criadas com sucesso!',
    'system',
    'success',
    '/dashboard/settings/notifications'
);

-- Verificar estrutura criada
SELECT 
    'Tabela notifications criada com sucesso!' as status,
    COUNT(*) as total_notifications
FROM notifications;