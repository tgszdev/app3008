-- ==============================================
-- VERIFICAR CONSTRAINT DA COLUNA time_condition
-- ==============================================

-- 1. Verificar a definição da constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM 
    pg_constraint
WHERE 
    conname = 'escalation_rules_time_condition_check';

-- 2. Verificar informações da coluna
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'escalation_rules' 
    AND column_name = 'time_condition';

-- 3. Verificar valores existentes na tabela
SELECT DISTINCT 
    time_condition,
    COUNT(*) as count
FROM 
    escalation_rules
GROUP BY 
    time_condition
ORDER BY 
    time_condition;

-- 4. Se a constraint for um ENUM, verificar valores permitidos
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM 
    pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE 
    t.typname = 'escalation_time_condition_enum'
    OR t.typname = 'time_condition_enum'
ORDER BY 
    e.enumsortorder;