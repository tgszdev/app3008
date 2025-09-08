-- Adicionar colunas faltantes na tabela timesheet_permissions
ALTER TABLE timesheet_permissions 
ADD COLUMN IF NOT EXISTS can_submit BOOLEAN DEFAULT true;

ALTER TABLE timesheet_permissions 
ADD COLUMN IF NOT EXISTS can_approve BOOLEAN DEFAULT false;

-- Atualizar permissões existentes baseado no role do usuário
UPDATE timesheet_permissions tp
SET 
  can_submit = true,
  can_approve = CASE 
    WHEN u.role = 'admin' THEN true 
    ELSE false 
  END
FROM users u
WHERE tp.user_id = u.id;

-- Inserir permissões para usuários que ainda não têm
INSERT INTO timesheet_permissions (user_id, can_submit, can_approve)
SELECT 
  u.id,
  true,
  CASE WHEN u.role = 'admin' THEN true ELSE false END
FROM users u
LEFT JOIN timesheet_permissions tp ON u.id = tp.user_id
WHERE tp.id IS NULL;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'timesheet_permissions'
ORDER BY ordinal_position;