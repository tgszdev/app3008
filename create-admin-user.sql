-- ================================================
-- Script para criar o usuário administrador padrão
-- ================================================

-- Senha: admin123
-- Hash gerado com bcrypt (10 rounds)
-- Para gerar novo hash, use: https://bcrypt-generator.com/

-- Deletar usuário admin existente (se houver)
DELETE FROM users WHERE email = 'admin@example.com';

-- Inserir novo usuário admin
INSERT INTO users (
    email,
    password_hash,
    name,
    role,
    department,
    phone,
    is_active,
    created_at,
    updated_at
) VALUES (
    'admin@example.com',
    '$2a$10$qVPQejPGUNnzBOX1Gut4buUVLXauhbR6QY.sDk9SHV7Rg1sepaive', -- senha: admin123
    'Administrador do Sistema',
    'admin',
    'Tecnologia da Informação',
    '(11) 99999-9999',
    true,
    NOW(),
    NOW()
);

-- Criar preferências padrão para o admin
INSERT INTO user_preferences (
    user_id,
    theme,
    language,
    email_notifications,
    push_notifications,
    notification_sound,
    updated_at
) VALUES (
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'system',
    'pt-BR',
    true,
    true,
    true,
    NOW()
);

-- Verificar se foi criado
SELECT 
    id,
    email,
    name,
    role,
    department,
    is_active,
    created_at
FROM users 
WHERE email = 'admin@example.com';

-- ================================================
-- IMPORTANTE: Após o primeiro login, altere a senha!
-- ================================================