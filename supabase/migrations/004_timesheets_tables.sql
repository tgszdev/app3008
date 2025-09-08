-- Criar tabela de apontamentos (timesheets) se não existir
CREATE TABLE IF NOT EXISTS timesheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hours_worked DECIMAL(5,2) NOT NULL CHECK (hours_worked > 0 AND hours_worked <= 24),
    description TEXT NOT NULL CHECK (char_length(description) >= 10),
    work_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_timesheets_ticket_id ON timesheets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_user_id ON timesheets(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status);
CREATE INDEX IF NOT EXISTS idx_timesheets_work_date ON timesheets(work_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_approved_by ON timesheets(approved_by);

-- Criar tabela de permissões de apontamentos se não existir
CREATE TABLE IF NOT EXISTS timesheet_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    can_submit BOOLEAN DEFAULT true,
    can_approve BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Criar índice para permissões
CREATE INDEX IF NOT EXISTS idx_timesheet_permissions_user_id ON timesheet_permissions(user_id);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela timesheets
DROP TRIGGER IF EXISTS update_timesheets_updated_at ON timesheets;
CREATE TRIGGER update_timesheets_updated_at
    BEFORE UPDATE ON timesheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger na tabela timesheet_permissions
DROP TRIGGER IF EXISTS update_timesheet_permissions_updated_at ON timesheet_permissions;
CREATE TRIGGER update_timesheet_permissions_updated_at
    BEFORE UPDATE ON timesheet_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para timesheets
-- Usuários podem ver seus próprios apontamentos
CREATE POLICY "Users can view own timesheets"
    ON timesheets FOR SELECT
    USING (auth.uid() = user_id);

-- Admins podem ver todos os apontamentos
CREATE POLICY "Admins can view all timesheets"
    ON timesheets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Usuários podem criar seus próprios apontamentos se tiverem permissão
CREATE POLICY "Users can create own timesheets with permission"
    ON timesheets FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM timesheet_permissions
            WHERE timesheet_permissions.user_id = auth.uid()
            AND timesheet_permissions.can_submit = true
        )
    );

-- Usuários podem atualizar seus próprios apontamentos pendentes
CREATE POLICY "Users can update own pending timesheets"
    ON timesheets FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- Admins e aprovadores podem atualizar qualquer apontamento
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

-- Usuários podem deletar seus próprios apontamentos pendentes
CREATE POLICY "Users can delete own pending timesheets"
    ON timesheets FOR DELETE
    USING (auth.uid() = user_id AND status = 'pending');

-- Políticas para timesheet_permissions
-- Usuários podem ver suas próprias permissões
CREATE POLICY "Users can view own permissions"
    ON timesheet_permissions FOR SELECT
    USING (auth.uid() = user_id);

-- Admins podem ver todas as permissões
CREATE POLICY "Admins can view all permissions"
    ON timesheet_permissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Apenas admins podem criar/atualizar permissões
CREATE POLICY "Only admins can manage permissions"
    ON timesheet_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Inserir permissões padrão para usuários existentes
INSERT INTO timesheet_permissions (user_id, can_submit, can_approve)
SELECT 
    id,
    true, -- todos podem submeter por padrão
    CASE WHEN role = 'admin' THEN true ELSE false END -- apenas admins podem aprovar
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM timesheet_permissions
    WHERE timesheet_permissions.user_id = users.id
);

-- Dados de teste (opcional - comentar em produção)
-- Inserir alguns apontamentos de exemplo
/*
INSERT INTO timesheets (ticket_id, user_id, hours_worked, description, work_date, status)
SELECT 
    t.id,
    u.id,
    ROUND((RANDOM() * 8 + 1)::numeric, 1),
    'Trabalho realizado no ticket #' || t.ticket_number || ' - Análise e implementação de melhorias',
    CURRENT_DATE - (FLOOR(RANDOM() * 30)::int),
    CASE 
        WHEN RANDOM() < 0.3 THEN 'approved'
        WHEN RANDOM() < 0.6 THEN 'pending'
        ELSE 'rejected'
    END
FROM tickets t
CROSS JOIN users u
WHERE t.status != 'closed'
AND u.role IN ('admin', 'agent')
LIMIT 10;
*/

-- Verificar estrutura das tabelas
SELECT 
    'timesheets' as table_name,
    COUNT(*) as record_count
FROM timesheets
UNION ALL
SELECT 
    'timesheet_permissions' as table_name,
    COUNT(*) as record_count
FROM timesheet_permissions;