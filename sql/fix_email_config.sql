-- =====================================================
-- CORREÇÃO DA CONFIGURAÇÃO DE E-MAIL
-- =====================================================

-- 1. Corrigir configuração de e-mail
UPDATE system_settings 
SET 
    value = jsonb_build_object(
        'from', 'rodrigues220589@gmail.com',
        'host', 'smtp.gmail.com',
        'pass', 'ee43f6ab8dd5326f5fd8dc7513bd25cd:20b8e6d6a333a18d9c84c359dfb8449dc59f7527b926dd3a58e3228fdd0300f3',
        'port', '587',
        'user', 'rodrigues220589@gmail.com',
        'secure', false,
        'service', 'smtp',
        'fromName', 'Sistema de Suporte Técnico'
    ),
    updated_at = NOW()
WHERE key = 'email_config';

-- 2. Verificar se a correção foi aplicada
SELECT 
    key,
    value,
    updated_at
FROM system_settings 
WHERE key = 'email_config';

-- 3. Corrigir regra de escalação para habilitar e-mails
UPDATE escalation_rules 
SET actions = jsonb_build_object(
    'add_comment', 'Ticket não atribuído há mais de 1 hora. Supervisor notificado.',
    'send_email_notification', true,
    'notify_supervisor', jsonb_build_object(
        'recipients', jsonb_build_array('2a33241e-ed38-48b5-9c84-e8c354ae9606')
    )
)
WHERE id = 'ef3c711f-bb78-4624-99a4-aa025790811c';

-- 4. Verificar se a regra foi corrigida
SELECT 
    id,
    name,
    actions
FROM escalation_rules 
WHERE id = 'ef3c711f-bb78-4624-99a4-aa025790811c';

-- 5. Testar envio de e-mail manual
-- SELECT sendEmail(
--     'rodrigues2205@icloud.com',
--     'Teste de E-mail - Sistema de Escalação',
--     '<h1>Teste de E-mail</h1><p>Este é um teste do sistema de escalação.</p>',
--     'Teste de E-mail\n\nEste é um teste do sistema de escalação.'
-- );
