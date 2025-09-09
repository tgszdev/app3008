-- Script para corrigir o nome da coluna de descrição na tabela timesheets
-- Este script trata tanto o caso de 'description' quanto 'activity_description'

-- 1. Verificar se existe a coluna 'activity_description'
DO $$
BEGIN
    -- Se NÃO existe activity_description, criar ela
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' 
        AND column_name = 'activity_description'
    ) THEN
        -- Verificar se existe 'description' para copiar os dados
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'timesheets' 
            AND column_name = 'description'
        ) THEN
            -- Adicionar nova coluna activity_description
            ALTER TABLE timesheets 
            ADD COLUMN activity_description TEXT;
            
            -- Copiar dados de description para activity_description
            UPDATE timesheets 
            SET activity_description = description;
            
            -- Remover coluna description antiga
            ALTER TABLE timesheets 
            DROP COLUMN IF EXISTS description;
        ELSE
            -- Se não existe nenhuma das duas, criar activity_description
            ALTER TABLE timesheets 
            ADD COLUMN activity_description TEXT;
        END IF;
    END IF;
END $$;

-- 2. Garantir que todos os registros tenham descrição válida
UPDATE timesheets 
SET activity_description = CASE 
    WHEN activity_description IS NULL OR activity_description = '' 
        THEN 'Trabalho realizado - descrição não informada'
    WHEN char_length(activity_description) < 10 
        THEN activity_description || ' - complemento automático'
    ELSE activity_description
END
WHERE activity_description IS NULL 
   OR activity_description = '' 
   OR char_length(activity_description) < 10;

-- 3. Tornar a coluna NOT NULL
ALTER TABLE timesheets 
ALTER COLUMN activity_description SET NOT NULL;

-- 4. Remover constraint antiga se existir (pode ter qualquer nome)
ALTER TABLE timesheets 
DROP CONSTRAINT IF EXISTS timesheets_description_length;

ALTER TABLE timesheets 
DROP CONSTRAINT IF EXISTS timesheets_activity_description_length;

-- 5. Adicionar nova constraint com o nome correto da coluna
ALTER TABLE timesheets 
ADD CONSTRAINT timesheets_activity_description_length 
CHECK (char_length(activity_description) >= 10);

-- 6. Verificar outras colunas necessárias
DO $$
BEGIN
    -- approval_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' 
        AND column_name = 'approval_date'
    ) THEN
        ALTER TABLE timesheets 
        ADD COLUMN approval_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- rejection_reason
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' 
        AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE timesheets 
        ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- approved_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' 
        AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE timesheets 
        ADD COLUMN approved_by UUID REFERENCES users(id);
    END IF;
    
    -- status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE timesheets 
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending';
    END IF;
    
    -- hours_worked
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' 
        AND column_name = 'hours_worked'
    ) THEN
        ALTER TABLE timesheets 
        ADD COLUMN hours_worked DECIMAL(5,2) NOT NULL DEFAULT 0;
    END IF;
    
    -- work_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' 
        AND column_name = 'work_date'
    ) THEN
        ALTER TABLE timesheets 
        ADD COLUMN work_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 7. Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'timesheets'
ORDER BY ordinal_position;

-- 8. Mensagem de sucesso
SELECT 'Script executado com sucesso! Coluna activity_description configurada corretamente.' as message;