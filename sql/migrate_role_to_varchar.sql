-- ============================================================================
-- MIGRAÇÃO: Converter campo role de ENUM para VARCHAR
-- Permite roles customizadas além das padrão (admin, analyst, user)
-- ============================================================================

-- PASSO 1: Criar uma coluna temporária
ALTER TABLE users ADD COLUMN role_new VARCHAR(50);

-- PASSO 2: Copiar os valores existentes
UPDATE users SET role_new = role::TEXT;

-- PASSO 3: Remover a coluna antiga
ALTER TABLE users DROP COLUMN role;

-- PASSO 4: Renomear a nova coluna
ALTER TABLE users RENAME COLUMN role_new TO role;

-- PASSO 5: Adicionar constraint para não permitir NULL
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

-- PASSO 6: Adicionar valor padrão
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- PASSO 7: Adicionar índice para performance
CREATE INDEX idx_users_role ON users(role);

-- PASSO 8: Adicionar comentário explicativo
COMMENT ON COLUMN users.role IS 'User role - can be system roles (admin, analyst, user) or custom roles from roles table';

-- VERIFICAÇÃO: Confirmar que a migração funcionou
-- SELECT DISTINCT role FROM users;

-- NOTA: Após executar esta migração, o tipo ENUM user_role não é mais usado
-- e pode ser removido se não for usado em outras tabelas:
-- DROP TYPE IF EXISTS user_role CASCADE;