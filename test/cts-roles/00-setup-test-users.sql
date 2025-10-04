-- ====================================================================
-- CTS ROLES - FASE 0: Setup de Usuários de Teste
-- ====================================================================
-- Executar no Supabase SQL Editor
-- Duração: ~30 segundos
-- ====================================================================

-- Limpar usuários de teste antigos
DELETE FROM users WHERE email LIKE 'test_%@test.com';

-- 1. Criar usuário ADMIN
INSERT INTO users (id, email, name, password, role, user_type, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test_admin@test.com',
  'Test Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', -- senha: password
  'admin',
  'matrix',
  NOW()
);

-- 2. Criar usuário DEVELOPER
INSERT INTO users (id, email, name, password, role, user_type, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'test_developer@test.com',
  'Test Developer',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy',
  'developer',
  'matrix',
  NOW()
);

-- 3. Criar usuário ANALYST
INSERT INTO users (id, email, name, password, role, user_type, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'test_analyst@test.com',
  'Test Analyst',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy',
  'analyst',
  'matrix',
  NOW()
);

-- 4. Criar usuário USER
INSERT INTO users (id, email, name, password, role, user_type, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'test_user@test.com',
  'Test User',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy',
  'user',
  'matrix',
  NOW()
);

-- Verificar criação
SELECT 
  id, 
  email, 
  name, 
  role, 
  user_type, 
  created_at 
FROM users 
WHERE email LIKE 'test_%@test.com'
ORDER BY role;

-- Resultado esperado: 4 usuários
-- ✅ test_admin@test.com | admin
-- ✅ test_analyst@test.com | analyst  
-- ✅ test_developer@test.com | developer
-- ✅ test_user@test.com | user

