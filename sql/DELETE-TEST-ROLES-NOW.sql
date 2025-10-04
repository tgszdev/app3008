-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  SOLUÇÃO IMEDIATA: Deletar Perfis de Teste                        ║
-- ║  Execute este SQL no Supabase SQL Editor AGORA                    ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- PASSO 1: Ver quantos perfis de teste existem
SELECT 
  COUNT(*) as total_test_roles,
  array_agg(name) as role_names
FROM roles
WHERE name LIKE '%test%' 
   OR name LIKE 'race_%'
   OR name IN ('testrm-rf', 'custom_escalation');

-- PASSO 2: Ver se há usuários usando esses perfis
SELECT 
  r.name as role_name,
  COUNT(u.id) as users_count,
  array_agg(u.email) as user_emails
FROM roles r
LEFT JOIN users u ON u.role = r.name
WHERE r.name LIKE '%test%' 
   OR r.name LIKE 'race_%'
   OR r.name IN ('testrm-rf', 'custom_escalation')
GROUP BY r.name
HAVING COUNT(u.id) > 0;

-- PASSO 3: DELETAR logs de auditoria primeiro (se a tabela existir)
DO $$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_audit_log') THEN
    DELETE FROM role_audit_log
    WHERE role_id IN (
      SELECT id FROM roles
      WHERE name LIKE '%test%' 
         OR name LIKE 'race_%'
         OR name IN ('testrm-rf', 'custom_escalation')
    );
    
    RAISE NOTICE 'Logs de auditoria deletados';
  ELSE
    RAISE NOTICE 'Tabela role_audit_log não existe';
  END IF;
END $$;

-- PASSO 4: DELETAR perfis de teste
DELETE FROM roles
WHERE (
  name LIKE '%test%' 
  OR name LIKE 'race_%'
  OR name IN ('testrm-rf', 'custom_escalation')
)
AND NOT EXISTS (
  -- Não deletar se houver usuários usando
  SELECT 1 FROM users WHERE users.role = roles.name
)
RETURNING name, display_name;

-- PASSO 5: Verificar resultado
SELECT 
  COUNT(*) as total_roles_remaining,
  COUNT(*) FILTER (WHERE is_system = true) as system_roles,
  COUNT(*) FILTER (WHERE is_system = false) as custom_roles
FROM roles;

-- PASSO 6: Listar perfis restantes
SELECT 
  name,
  display_name,
  is_system,
  (SELECT COUNT(*) FROM users WHERE users.role = roles.name) as users_count,
  created_at
FROM roles
ORDER BY is_system DESC, name;

-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  RESULTADO ESPERADO:                                               ║
-- ║  - Perfis restantes: 5 (admin, dev, analyst, user, n2)            ║
-- ║  - Perfis de teste deletados: ~17                                  ║
-- ║  - Sistema limpo e funcional                                       ║
-- ╚════════════════════════════════════════════════════════════════════╝

