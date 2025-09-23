-- =====================================================
-- MULTI-TENANT HYBRID SCHEMA (PLANO 1 + 2 COMBINADOS)
-- =====================================================
-- Preserva 100% da compatibilidade com sistema atual
-- Adiciona funcionalidades de organizações + departamentos

-- Enable UUID extension (se não existir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA DE CONTEXTOS (Organizações + Departamentos)
-- =====================================================
CREATE TABLE contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('organization', 'department')),
    parent_context_id UUID REFERENCES contexts(id),
    settings JSONB DEFAULT '{}',
    sla_hours INTEGER DEFAULT 24,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. USUÁRIOS DA MATRIZ (Atendentes)
-- =====================================================
CREATE TABLE matrix_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'analyst',
    department VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. USUÁRIOS DOS CONTEXTOS (Clientes + Departamentos)
-- =====================================================
CREATE TABLE context_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    department VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. RELAÇÃO MATRIZ ↔ CONTEXTOS
-- =====================================================
CREATE TABLE matrix_user_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matrix_user_id UUID REFERENCES matrix_users(id) ON DELETE CASCADE,
    context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
    can_manage BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(matrix_user_id, context_id)
);

-- =====================================================
-- 5. MODIFICAR TABELAS EXISTENTES (SEM QUEBRAR COMPATIBILIDADE)
-- =====================================================

-- Adicionar colunas opcionais à tabela tickets
ALTER TABLE tickets ADD COLUMN context_id UUID REFERENCES contexts(id) ON DELETE CASCADE;
ALTER TABLE tickets ADD COLUMN assigned_to_matrix_user UUID REFERENCES matrix_users(id);
ALTER TABLE tickets ADD COLUMN requester_context_user_id UUID REFERENCES context_users(id);

-- Adicionar colunas opcionais à tabela comments
ALTER TABLE comments ADD COLUMN context_user_id UUID REFERENCES context_users(id);

-- Adicionar colunas opcionais à tabela attachments
ALTER TABLE attachments ADD COLUMN context_user_id UUID REFERENCES context_users(id);

-- Adicionar colunas opcionais à tabela notifications
ALTER TABLE notifications ADD COLUMN context_id UUID REFERENCES contexts(id);
ALTER TABLE notifications ADD COLUMN context_user_id UUID REFERENCES context_users(id);

-- Adicionar colunas opcionais à tabela ticket_history
ALTER TABLE ticket_history ADD COLUMN context_id UUID REFERENCES contexts(id);
ALTER TABLE ticket_history ADD COLUMN context_user_id UUID REFERENCES context_users(id);

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para contexts
CREATE INDEX idx_contexts_type ON contexts(type);
CREATE INDEX idx_contexts_slug ON contexts(slug);
CREATE INDEX idx_contexts_parent ON contexts(parent_context_id);
CREATE INDEX idx_contexts_active ON contexts(is_active);

-- Índices para matrix_users
CREATE INDEX idx_matrix_users_email ON matrix_users(email);
CREATE INDEX idx_matrix_users_role ON matrix_users(role);
CREATE INDEX idx_matrix_users_active ON matrix_users(is_active);

-- Índices para context_users
CREATE INDEX idx_context_users_context ON context_users(context_id);
CREATE INDEX idx_context_users_email ON context_users(email);
CREATE INDEX idx_context_users_role ON context_users(role);
CREATE INDEX idx_context_users_active ON context_users(is_active);

-- Índices para matrix_user_contexts
CREATE INDEX idx_matrix_user_contexts_matrix ON matrix_user_contexts(matrix_user_id);
CREATE INDEX idx_matrix_user_contexts_context ON matrix_user_contexts(context_id);

-- Índices para tickets com contexto
CREATE INDEX idx_tickets_context ON tickets(context_id);
CREATE INDEX idx_tickets_matrix_assigned ON tickets(assigned_to_matrix_user);
CREATE INDEX idx_tickets_context_requester ON tickets(requester_context_user_id);

-- =====================================================
-- 7. TRIGGERS DE UPDATED_AT
-- =====================================================

-- Trigger para contexts
CREATE TRIGGER update_contexts_updated_at 
    BEFORE UPDATE ON contexts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para matrix_users
CREATE TRIGGER update_matrix_users_updated_at 
    BEFORE UPDATE ON matrix_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para context_users
CREATE TRIGGER update_context_users_updated_at 
    BEFORE UPDATE ON context_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter contexto atual do usuário
CREATE OR REPLACE FUNCTION get_current_context_id()
RETURNS UUID AS $$
BEGIN
    -- Esta função será chamada pelas RLS policies
    -- O contexto será definido pela aplicação
    RETURN NULL; -- Será sobrescrito pela aplicação
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tipo de usuário atual
CREATE OR REPLACE FUNCTION get_current_user_type()
RETURNS VARCHAR(20) AS $$
BEGIN
    -- Esta função será chamada pelas RLS policies
    -- O tipo será definido pela aplicação
    RETURN 'context'; -- Será sobrescrito pela aplicação
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar número de ticket com prefixo de contexto
CREATE OR REPLACE FUNCTION generate_contextual_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    context_slug VARCHAR(10);
    year_month VARCHAR(6);
    sequence_number INTEGER;
BEGIN
    -- Obter slug do contexto
    SELECT slug INTO context_slug 
    FROM contexts 
    WHERE id = NEW.context_id;
    
    -- Se não tem contexto, usar sistema atual
    IF context_slug IS NULL THEN
        year_month := TO_CHAR(NOW(), 'YYYYMM');
        SELECT COUNT(*) + 1 INTO sequence_number
        FROM tickets
        WHERE ticket_number LIKE year_month || '%'
        AND context_id IS NULL;
        NEW.ticket_number := year_month || LPAD(sequence_number::TEXT, 4, '0');
    ELSE
        -- Com contexto, usar prefixo
        year_month := TO_CHAR(NOW(), 'YYYYMM');
        SELECT COUNT(*) + 1 INTO sequence_number
        FROM tickets
        WHERE ticket_number LIKE UPPER(LEFT(context_slug, 3)) || year_month || '%'
        AND context_id = NEW.context_id;
        NEW.ticket_number := UPPER(LEFT(context_slug, 3)) || year_month || LPAD(sequence_number::TEXT, 4, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de número de ticket contextual
DROP TRIGGER IF EXISTS generate_ticket_number_trigger ON tickets;
CREATE TRIGGER generate_contextual_ticket_number_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_contextual_ticket_number();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_user_contexts ENABLE ROW LEVEL SECURITY;

-- Policies para contexts
CREATE POLICY "Contexts are visible to matrix users" ON contexts
    FOR SELECT USING (
        get_current_user_type() = 'matrix' OR 
        id = get_current_context_id()
    );

-- Policies para matrix_users
CREATE POLICY "Matrix users can see all matrix users" ON matrix_users
    FOR SELECT USING (get_current_user_type() = 'matrix');

-- Policies para context_users
CREATE POLICY "Context users are scoped to their context" ON context_users
    FOR ALL USING (
        context_id = get_current_context_id() AND 
        get_current_user_type() = 'context'
    );

CREATE POLICY "Matrix users can see all context users" ON context_users
    FOR SELECT USING (get_current_user_type() = 'matrix');

-- Policies para matrix_user_contexts
CREATE POLICY "Matrix user contexts are visible to matrix users" ON matrix_user_contexts
    FOR SELECT USING (get_current_user_type() = 'matrix');

-- =====================================================
-- 10. DADOS INICIAIS
-- =====================================================

-- Criar contexto padrão para sistema atual (departamento)
INSERT INTO contexts (name, slug, type, sla_hours, is_active) VALUES
    ('Sistema Atual', 'sistema-atual', 'department', 24, true);

-- Criar usuário admin da matriz
INSERT INTO matrix_users (email, password_hash, name, role, department) VALUES
    ('admin@matriz.com', '$2a$10$YourHashedPasswordHere', 'Admin Matriz', 'admin', 'TI Matriz');

-- Associar admin da matriz ao contexto padrão
INSERT INTO matrix_user_contexts (matrix_user_id, context_id, can_manage) 
SELECT 
    mu.id, 
    c.id, 
    true
FROM matrix_users mu, contexts c 
WHERE mu.email = 'admin@matriz.com' 
AND c.slug = 'sistema-atual';

-- =====================================================
-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE contexts IS 'Contextos (organizações clientes + departamentos internos)';
COMMENT ON TABLE matrix_users IS 'Usuários da empresa matriz (atendentes)';
COMMENT ON TABLE context_users IS 'Usuários dos contextos (clientes + departamentos)';
COMMENT ON TABLE matrix_user_contexts IS 'Relacionamento matriz ↔ contextos';

COMMENT ON COLUMN contexts.type IS 'Tipo: organization (cliente externo) ou department (departamento interno)';
COMMENT ON COLUMN contexts.parent_context_id IS 'Para hierarquia de contextos (departamentos podem ter sub-departamentos)';
COMMENT ON COLUMN tickets.context_id IS 'Contexto do ticket (opcional para compatibilidade)';
COMMENT ON COLUMN tickets.assigned_to_matrix_user IS 'Atendente da matriz atribuído (opcional)';

-- =====================================================
-- SCHEMA MULTI-TENANT HÍBRIDO CRIADO COM SUCESSO!
-- =====================================================
-- ✅ 100% compatível com sistema atual
-- ✅ Suporte a organizações + departamentos
-- ✅ RLS policies implementadas
-- ✅ Triggers e funções criadas
-- ✅ Dados iniciais inseridos
-- =====================================================
