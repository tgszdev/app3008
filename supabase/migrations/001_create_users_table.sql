-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'analyst', 'admin')),
  department TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Create RLS policies (desabilitado por padrão - usar service role key)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir apenas leitura para usuários autenticados
CREATE POLICY "Users can view all users" ON users
  FOR SELECT
  USING (true);

-- Política para permitir apenas admins criarem/editarem/deletarem usuários
CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT
  USING (false); -- Sempre usar service role key

CREATE POLICY "Only admins can update users" ON users
  FOR UPDATE
  USING (false); -- Sempre usar service role key

CREATE POLICY "Only admins can delete users" ON users
  FOR DELETE
  USING (false); -- Sempre usar service role key

-- Criar usuário admin padrão (senha: admin123)
-- Hash gerado com bcrypt para 'admin123'
INSERT INTO users (email, name, password_hash, role, department, is_active)
VALUES (
  'admin@example.com',
  'Administrador',
  '$2a$10$X7h3TTgKrxj1Hn8CnWKxCOY7jRl2M1FGRvmFqEqjGw2yR3BKfSfB6',
  'admin',
  'Tecnologia da Informação',
  true
) ON CONFLICT (email) DO NOTHING;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();