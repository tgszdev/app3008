-- Verificar se as tabelas existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'tickets', 'timesheets', 'timesheet_permissions')
ORDER BY table_name;

-- Verificar estrutura da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela tickets
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tickets'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela timesheets
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'timesheets'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela timesheet_permissions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'timesheet_permissions'
ORDER BY ordinal_position;

-- Verificar foreign keys das tabelas de apontamentos
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('timesheets', 'timesheet_permissions');

-- Verificar índices
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('timesheets', 'timesheet_permissions')
ORDER BY tablename, indexname;

-- Verificar políticas RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('timesheets', 'timesheet_permissions')
ORDER BY tablename, policyname;

-- Contar registros em cada tabela
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'timesheets', COUNT(*) FROM timesheets
UNION ALL
SELECT 'timesheet_permissions', COUNT(*) FROM timesheet_permissions;

-- Verificar usuários e suas permissões
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    tp.can_submit,
    tp.can_approve
FROM users u
LEFT JOIN timesheet_permissions tp ON u.id = tp.user_id
ORDER BY u.role, u.name;

-- Verificar apontamentos recentes
SELECT 
    t.id,
    t.work_date,
    t.hours_worked,
    t.status,
    u.name as user_name,
    tk.ticket_number,
    t.description
FROM timesheets t
JOIN users u ON t.user_id = u.id
JOIN tickets tk ON t.ticket_id = tk.id
ORDER BY t.created_at DESC
LIMIT 10;