-- ============================================================================
-- ALTERNATIVA: Adicionar novos valores ao ENUM existente
-- Esta é uma abordagem mais conservadora que mantém o ENUM
-- ============================================================================

-- Para adicionar um novo valor ao ENUM user_role:
-- ALTER TYPE user_role ADD VALUE 'dev';

-- Porém, isso tem limitações:
-- 1. Precisa ser executado para cada nova role
-- 2. Não pode ser feito em uma transação
-- 3. Valores não podem ser removidos facilmente

-- ============================================================================
-- SOLUÇÃO RECOMENDADA: Usar a tabela roles para validação
-- ============================================================================

-- Em vez de usar ENUM, recomendamos:
-- 1. Converter o campo para VARCHAR (use migrate_role_to_varchar.sql)
-- 2. Criar uma função de validação que verifica contra a tabela roles

-- Função para validar se a role existe
CREATE OR REPLACE FUNCTION validate_user_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Permitir roles do sistema sempre
    IF NEW.role IN ('admin', 'analyst', 'user') THEN
        RETURN NEW;
    END IF;
    
    -- Verificar se a role existe na tabela roles
    IF EXISTS (SELECT 1 FROM roles WHERE name = NEW.role) THEN
        RETURN NEW;
    END IF;
    
    -- Se não encontrou, rejeitar
    RAISE EXCEPTION 'Invalid role: %. Role must exist in roles table or be a system role (admin, analyst, user)', NEW.role;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar roles (após converter para VARCHAR)
-- CREATE TRIGGER validate_user_role_trigger
-- BEFORE INSERT OR UPDATE ON users
-- FOR EACH ROW
-- EXECUTE FUNCTION validate_user_role();