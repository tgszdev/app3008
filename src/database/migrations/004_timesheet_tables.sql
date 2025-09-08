-- Tabela de apontamentos de horas
CREATE TABLE IF NOT EXISTS timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_description TEXT NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL CHECK (hours_worked > 0 AND hours_worked <= 24),
    work_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_timesheets_ticket_id ON timesheets(ticket_id);
CREATE INDEX idx_timesheets_user_id ON timesheets(user_id);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_work_date ON timesheets(work_date);

-- Tabela de permissões de apontamento
CREATE TABLE IF NOT EXISTS timesheet_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100),
    role VARCHAR(50),
    can_submit_timesheet BOOLEAN DEFAULT false,
    can_approve_timesheet BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Índices para permissões
CREATE INDEX idx_timesheet_permissions_user_id ON timesheet_permissions(user_id);
CREATE INDEX idx_timesheet_permissions_department ON timesheet_permissions(department);
CREATE INDEX idx_timesheet_permissions_role ON timesheet_permissions(role);

-- Tabela de histórico de aprovações/rejeições
CREATE TABLE IF NOT EXISTS timesheet_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'edited')),
    performed_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_timesheet_history_timesheet_id ON timesheet_history(timesheet_id);
CREATE INDEX idx_timesheet_history_performed_by ON timesheet_history(performed_by);

-- View para estatísticas de apontamentos
CREATE OR REPLACE VIEW timesheet_statistics AS
SELECT 
    t.id,
    t.ticket_id,
    t.user_id,
    t.hours_worked,
    t.work_date,
    t.status,
    t.created_at,
    tk.title as ticket_title,
    tk.status as ticket_status,
    tk.priority as ticket_priority,
    u.name as user_name,
    u.email as user_email,
    u.department as user_department,
    approver.name as approver_name
FROM timesheets t
INNER JOIN tickets tk ON t.ticket_id = tk.id
INNER JOIN users u ON t.user_id = u.id
LEFT JOIN users approver ON t.approved_by = approver.id;

-- Função para calcular total de horas por ticket
CREATE OR REPLACE FUNCTION get_ticket_total_hours(p_ticket_id UUID)
RETURNS TABLE (
    total_hours DECIMAL,
    approved_hours DECIMAL,
    pending_hours DECIMAL,
    rejected_hours DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(hours_worked), 0) as total_hours,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN hours_worked ELSE 0 END), 0) as approved_hours,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN hours_worked ELSE 0 END), 0) as pending_hours,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN hours_worked ELSE 0 END), 0) as rejected_hours
    FROM timesheets
    WHERE ticket_id = p_ticket_id;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular horas por usuário em período
CREATE OR REPLACE FUNCTION get_user_hours_summary(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_hours DECIMAL,
    approved_hours DECIMAL,
    pending_hours DECIMAL,
    rejected_hours DECIMAL,
    tickets_worked INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(hours_worked), 0) as total_hours,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN hours_worked ELSE 0 END), 0) as approved_hours,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN hours_worked ELSE 0 END), 0) as pending_hours,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN hours_worked ELSE 0 END), 0) as rejected_hours,
        COUNT(DISTINCT ticket_id)::INTEGER as tickets_worked
    FROM timesheets
    WHERE user_id = p_user_id
    AND work_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_timesheet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_timesheets_updated_at
    BEFORE UPDATE ON timesheets
    FOR EACH ROW
    EXECUTE FUNCTION update_timesheet_updated_at();

CREATE TRIGGER update_timesheet_permissions_updated_at
    BEFORE UPDATE ON timesheet_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_timesheet_updated_at();

-- RLS Policies
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_history ENABLE ROW LEVEL SECURITY;

-- Policies para timesheets
CREATE POLICY "Users can view their own timesheets" ON timesheets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view timesheets for tickets they are assigned" ON timesheets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tickets 
            WHERE tickets.id = timesheets.ticket_id 
            AND tickets.assignee_id = auth.uid()
        )
    );

CREATE POLICY "Users with approval permission can view all timesheets" ON timesheets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM timesheet_permissions 
            WHERE user_id = auth.uid() 
            AND can_approve_timesheet = true
        )
    );

CREATE POLICY "Users can create timesheets for their assigned tickets" ON timesheets
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM tickets 
            WHERE tickets.id = ticket_id 
            AND tickets.assignee_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM timesheet_permissions 
            WHERE user_id = auth.uid() 
            AND can_submit_timesheet = true
        )
    );

CREATE POLICY "Users can update their pending timesheets" ON timesheets
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND status = 'pending'
    );

CREATE POLICY "Approvers can update timesheet status" ON timesheets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM timesheet_permissions 
            WHERE user_id = auth.uid() 
            AND can_approve_timesheet = true
        )
    );

-- Policies para timesheet_permissions
CREATE POLICY "Admins can manage timesheet permissions" ON timesheet_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own permissions" ON timesheet_permissions
    FOR SELECT USING (auth.uid() = user_id);

-- Policies para timesheet_history
CREATE POLICY "Users can view history of their timesheets" ON timesheet_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM timesheets 
            WHERE timesheets.id = timesheet_id 
            AND timesheets.user_id = auth.uid()
        )
    );

CREATE POLICY "Approvers can view all history" ON timesheet_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM timesheet_permissions 
            WHERE user_id = auth.uid() 
            AND can_approve_timesheet = true
        )
    );

CREATE POLICY "System can insert history" ON timesheet_history
    FOR INSERT WITH CHECK (true);

-- Inserir permissões padrão para admin
INSERT INTO timesheet_permissions (user_id, role, can_submit_timesheet, can_approve_timesheet)
SELECT id, role, true, true FROM users WHERE role = 'admin'
ON CONFLICT (user_id) DO UPDATE 
SET can_submit_timesheet = true, can_approve_timesheet = true;

-- Inserir permissões padrão para agents
INSERT INTO timesheet_permissions (user_id, role, can_submit_timesheet, can_approve_timesheet)
SELECT id, role, true, false FROM users WHERE role = 'agent'
ON CONFLICT (user_id) DO UPDATE 
SET can_submit_timesheet = true, can_approve_timesheet = false;