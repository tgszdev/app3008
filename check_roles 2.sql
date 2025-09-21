-- Verificar todas as roles no banco
SELECT id, name, display_name, is_system, created_at 
FROM roles 
ORDER BY created_at DESC;

-- Verificar usuários e suas roles
SELECT id, email, role, role_name 
FROM users 
WHERE role_name IS NOT NULL OR role != 'user';
