-- ================================================
-- Script para CORRIGIR/CRIAR o usuário admin
-- Execute este script se tiver problemas de login
-- ================================================

-- Primeiro, verificar se o usuário existe
SELECT id, email, name, role, is_active 
FROM users 
WHERE email = 'admin@example.com';

-- Deletar o usuário admin existente (se houver)
DELETE FROM users WHERE email = 'admin@example.com';

-- Deletar preferências órfãs
DELETE FROM user_preferences 
WHERE user_id NOT IN (SELECT id FROM users);

-- Criar novo usuário admin com hash correto
-- Senha: admin123
INSERT INTO users (
    id,
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
    gen_random_uuid(),
    'admin@example.com',
    '$2a$10$qVPQejPGUNnzBOX1Gut4buUVLXauhbR6QY.sDk9SHV7Rg1sepaive',
    'Administrador do Sistema',
    'admin',
    'Tecnologia da Informação',
    '(11) 99999-9999',
    true,
    NOW(),
    NOW()
);

-- Verificar se foi criado corretamente
SELECT 
    id,
    email,
    name,
    role,
    department,
    is_active,
    password_hash,
    created_at
FROM users 
WHERE email = 'admin@example.com';

-- ================================================
-- IMPORTANTE: 
-- 1. Copie TODO este script
-- 2. Cole no SQL Editor do Supabase
-- 3. Execute (Run)
-- 4. Verifique se aparece o usuário criado
-- 5. Tente fazer login com:
--    Email: admin@example.com
--    Senha: admin123
-- ================================================