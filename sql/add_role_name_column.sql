-- ============================================================================
-- Adicionar coluna role_name para armazenar roles customizadas
-- Mantém compatibilidade com o ENUM existente
-- ============================================================================

-- Adicionar coluna role_name se não existir
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_name VARCHAR(50);

-- Copiar valores existentes de role para role_name
UPDATE users 
SET role_name = role::TEXT 
WHERE role_name IS NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN users.role_name IS 'Actual role name including custom roles. The role column maintains ENUM compatibility';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_users_role_name ON users(role_name);

-- ============================================================================
-- IMPORTANTE: Após executar este script no Supabase
-- ============================================================================
-- 1. A coluna 'role' continua usando o ENUM (admin, analyst, user)
-- 2. A coluna 'role_name' armazena a role real (incluindo customizadas)
-- 3. Para roles customizadas, 'role' será 'user' e 'role_name' terá o valor real
-- 4. Para roles padrão, ambas as colunas terão o mesmo valor
-- ============================================================================