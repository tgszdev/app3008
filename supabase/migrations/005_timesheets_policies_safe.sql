-- Script seguro para criar/atualizar políticas de timesheets
-- Este script verifica se as políticas já existem antes de criar

-- Função auxiliar para verificar se uma política existe
DO $$
BEGIN
    -- Habilitar RLS se ainda não estiver habilitado
    ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE timesheet_permissions ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas antigas se existirem (para recriar com definições atualizadas)
    DROP POLICY IF EXISTS "Users can view own timesheets" ON timesheets;
    DROP POLICY IF EXISTS "Admins can view all timesheets" ON timesheets;
    DROP POLICY IF EXISTS "Users can create own timesheets with permission" ON timesheets;
    DROP POLICY IF EXISTS "Users can update own pending timesheets" ON timesheets;
    DROP POLICY IF EXISTS "Approvers can update timesheets" ON timesheets;
    DROP POLICY IF EXISTS "Users can delete own pending timesheets" ON timesheets;
    
    DROP POLICY IF EXISTS "Users can view own permissions" ON timesheet_permissions;
    DROP POLICY IF EXISTS "Admins can view all permissions" ON timesheet_permissions;
    DROP POLICY IF EXISTS "Only admins can manage permissions" ON timesheet_permissions;
END $$;

-- Criar políticas para timesheets
-- Política 1: Usuários podem ver seus próprios apontamentos
CREATE POLICY "Users can view own timesheets"
    ON timesheets FOR SELECT
    USING (auth.uid() = user_id);

-- Política 2: Admins podem ver todos os apontamentos
CREATE POLICY "Admins can view all timesheets"
    ON timesheets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Política 3: Usuários podem criar seus próprios apontamentos se tiverem permissão
CREATE POLICY "Users can create own timesheets with permission"
    ON timesheets FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND (
            -- Verifica se tem permissão explícita
            EXISTS (
                SELECT 1 FROM timesheet_permissions
                WHERE timesheet_permissions.user_id = auth.uid()
                AND timesheet_permissions.can_submit = true
            )
            OR 
            -- Ou se não existe registro de permissão (assume permissão padrão)
            NOT EXISTS (
                SELECT 1 FROM timesheet_permissions
                WHERE timesheet_permissions.user_id = auth.uid()
            )
        )
    );

-- Política 4: Usuários podem atualizar seus próprios apontamentos pendentes
CREATE POLICY "Users can update own pending timesheets"
    ON timesheets FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- Política 5: Admins e aprovadores podem atualizar qualquer apontamento
CREATE POLICY "Approvers can update timesheets"
    ON timesheets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM timesheet_permissions
            WHERE timesheet_permissions.user_id = auth.uid()
            AND timesheet_permissions.can_approve = true
        )
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Política 6: Usuários podem deletar seus próprios apontamentos pendentes
CREATE POLICY "Users can delete own pending timesheets"
    ON timesheets FOR DELETE
    USING (auth.uid() = user_id AND status = 'pending');

-- Criar políticas para timesheet_permissions
-- Política 1: Usuários podem ver suas próprias permissões
CREATE POLICY "Users can view own permissions"
    ON timesheet_permissions FOR SELECT
    USING (auth.uid() = user_id);

-- Política 2: Admins podem ver todas as permissões
CREATE POLICY "Admins can view all permissions"
    ON timesheet_permissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Política 3: Apenas admins podem gerenciar permissões
CREATE POLICY "Only admins can manage permissions"
    ON timesheet_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Garantir que todos os usuários tenham registro de permissão
INSERT INTO timesheet_permissions (user_id, can_submit, can_approve)
SELECT 
    id,
    true, -- todos podem submeter por padrão
    CASE WHEN role = 'admin' THEN true ELSE false END -- apenas admins podem aprovar
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM timesheet_permissions
    WHERE timesheet_permissions.user_id = users.id
)
ON CONFLICT (user_id) DO UPDATE
SET 
    can_submit = EXCLUDED.can_submit,
    can_approve = EXCLUDED.can_approve,
    updated_at = CURRENT_TIMESTAMP;

-- Verificar o resultado
SELECT 
    'Políticas criadas/atualizadas com sucesso!' as message,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'timesheets') as timesheets_policies,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'timesheet_permissions') as permissions_policies,
    (SELECT COUNT(*) FROM timesheet_permissions) as permission_records;