-- Verificar se perfil admin existe
SELECT * FROM roles WHERE name = 'admin';

-- Se não existir, criar:
INSERT INTO roles (name, display_name, description, permissions, is_system)
VALUES ('admin', 'Administrador', 'Acesso total ao sistema', '{}', true)
ON CONFLICT (name) DO UPDATE
SET 
  display_name = 'Administrador',
  description = 'Acesso total ao sistema',
  is_system = true;

-- Ver todos os perfis
SELECT name, display_name, is_system FROM roles ORDER BY name;

