-- Script para garantir que a tabela user_notification_preferences tem todos os campos necessários

-- 1. Adicionar colunas que podem estar faltando (se não existirem)
DO $$ 
BEGIN
    -- ticket_status_changed (se precisar adicionar como campo separado)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_notification_preferences' 
                   AND column_name = 'ticket_status_changed') THEN
        ALTER TABLE user_notification_preferences 
        ADD COLUMN ticket_status_changed JSONB DEFAULT '{"email": true, "push": false, "in_app": true}'::jsonb;
    END IF;

    -- ticket_priority_changed (se precisar adicionar como campo separado)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_notification_preferences' 
                   AND column_name = 'ticket_priority_changed') THEN
        ALTER TABLE user_notification_preferences 
        ADD COLUMN ticket_priority_changed JSONB DEFAULT '{"email": true, "push": false, "in_app": true}'::jsonb;
    END IF;
END $$;

-- 2. Atualizar registros existentes para garantir que têm valores padrão corretos
UPDATE user_notification_preferences
SET 
    ticket_created = COALESCE(ticket_created, '{"email": true, "push": false, "in_app": true}'::jsonb),
    ticket_assigned = COALESCE(ticket_assigned, '{"email": true, "push": false, "in_app": true}'::jsonb),
    ticket_updated = COALESCE(ticket_updated, '{"email": true, "push": false, "in_app": true}'::jsonb),
    ticket_resolved = COALESCE(ticket_resolved, '{"email": true, "push": false, "in_app": true}'::jsonb),
    comment_added = COALESCE(comment_added, '{"email": true, "push": false, "in_app": true}'::jsonb),
    comment_mention = COALESCE(comment_mention, '{"email": true, "push": false, "in_app": true}'::jsonb)
WHERE 
    ticket_created IS NULL OR
    ticket_assigned IS NULL OR
    ticket_updated IS NULL OR
    ticket_resolved IS NULL OR
    comment_added IS NULL OR
    comment_mention IS NULL;

-- 3. Criar preferências para usuários que não têm
INSERT INTO user_notification_preferences (
    user_id,
    email_enabled,
    push_enabled,
    in_app_enabled,
    ticket_created,
    ticket_assigned,
    ticket_updated,
    ticket_resolved,
    comment_added,
    comment_mention,
    quiet_hours_enabled,
    quiet_hours_start,
    quiet_hours_end,
    email_frequency
)
SELECT 
    u.id,
    true, -- email_enabled
    false, -- push_enabled
    true, -- in_app_enabled
    '{"email": true, "push": false, "in_app": true}'::jsonb,
    '{"email": true, "push": false, "in_app": true}'::jsonb,
    '{"email": true, "push": false, "in_app": true}'::jsonb,
    '{"email": true, "push": false, "in_app": true}'::jsonb,
    '{"email": true, "push": false, "in_app": true}'::jsonb,
    '{"email": true, "push": false, "in_app": true}'::jsonb,
    false, -- quiet_hours_enabled
    '22:00'::time, -- quiet_hours_start
    '08:00'::time, -- quiet_hours_end
    'immediate' -- email_frequency
FROM users u
LEFT JOIN user_notification_preferences p ON u.id = p.user_id
WHERE p.id IS NULL;

-- 4. Verificar o resultado
SELECT 
    u.email,
    u.name,
    p.email_enabled,
    p.ticket_created->>'email' as ticket_created_email,
    p.ticket_assigned->>'email' as ticket_assigned_email,
    p.ticket_updated->>'email' as ticket_updated_email,
    p.ticket_resolved->>'email' as ticket_resolved_email,
    p.comment_added->>'email' as comment_added_email,
    p.comment_mention->>'email' as comment_mention_email
FROM users u
LEFT JOIN user_notification_preferences p ON u.id = p.user_id
ORDER BY u.email;