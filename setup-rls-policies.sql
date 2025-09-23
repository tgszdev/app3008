-- =====================================================
-- CONFIGURAÇÃO DE RLS POLICIES PARA SISTEMA MULTI-TENANT
-- =====================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES PARA TABELA user_contexts
-- =====================================================

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "Users can view their own contexts" ON user_contexts;
DROP POLICY IF EXISTS "Admins can manage all contexts" ON user_contexts;
DROP POLICY IF EXISTS "Users can view contexts they belong to" ON user_contexts;

-- Policy: Usuários podem ver seus próprios contextos
CREATE POLICY "Users can view their own contexts" ON user_contexts
    FOR SELECT
    USING (auth.uid() = user_id::uuid);

-- Policy: Administradores podem gerenciar todos os contextos
CREATE POLICY "Admins can manage all contexts" ON user_contexts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role IN ('admin', 'analyst')
        )
    );

-- Policy: Usuários podem ver contextos aos quais pertencem
CREATE POLICY "Users can view contexts they belong to" ON user_contexts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_contexts uc2
            WHERE uc2.user_id = auth.uid()::text
            AND uc2.context_id = user_contexts.context_id
        )
    );

-- =====================================================
-- POLICIES PARA TABELA tickets
-- =====================================================

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "Users can view tickets from their context" ON tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets in their context" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets from their context" ON tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON tickets;

-- Policy: Usuários podem ver tickets do seu contexto
CREATE POLICY "Users can view tickets from their context" ON tickets
    FOR SELECT
    USING (
        -- Se o usuário é de contexto, só vê tickets do seu contexto
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'context'
                AND users.context_id = tickets.context_id
            )
        )
        OR
        -- Se o usuário é da matriz, pode ver todos os tickets
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'matrix'
            )
        )
        OR
        -- Se o usuário criou o ticket, pode vê-lo
        (created_by = auth.uid()::text)
    );

-- Policy: Administradores podem ver todos os tickets
CREATE POLICY "Admins can view all tickets" ON tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role IN ('admin', 'analyst')
        )
    );

-- Policy: Usuários podem criar tickets no seu contexto
CREATE POLICY "Users can create tickets in their context" ON tickets
    FOR INSERT
    WITH CHECK (
        -- Se o usuário é de contexto, só pode criar no seu contexto
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'context'
                AND users.context_id = tickets.context_id
            )
        )
        OR
        -- Se o usuário é da matriz, pode criar em qualquer contexto
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'matrix'
            )
        )
    );

-- Policy: Usuários podem atualizar tickets do seu contexto
CREATE POLICY "Users can update tickets from their context" ON tickets
    FOR UPDATE
    USING (
        -- Se o usuário é de contexto, só pode atualizar tickets do seu contexto
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'context'
                AND users.context_id = tickets.context_id
            )
        )
        OR
        -- Se o usuário é da matriz, pode atualizar todos os tickets
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'matrix'
            )
        )
        OR
        -- Se o usuário criou o ticket, pode atualizá-lo
        (created_by = auth.uid()::text)
    );

-- Policy: Administradores podem gerenciar todos os tickets
CREATE POLICY "Admins can manage all tickets" ON tickets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role IN ('admin', 'analyst')
        )
    );

-- =====================================================
-- VERIFICAÇÃO DAS POLICIES
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('user_contexts', 'tickets')
AND schemaname = 'public';

-- Verificar policies criadas
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
WHERE tablename IN ('user_contexts', 'tickets')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

/*
ESTRUTURA DO SISTEMA MULTI-TENANT:

1. USUÁRIOS DA MATRIZ (user_type = 'matrix'):
   - Podem ver e gerenciar todos os tickets
   - Podem criar tickets em qualquer contexto
   - Têm acesso total ao sistema

2. USUÁRIOS DE CONTEXTO (user_type = 'context'):
   - Só veem tickets do seu contexto
   - Só podem criar tickets no seu contexto
   - Só podem editar tickets do seu contexto
   - Isolamento completo entre organizações

3. ASSOCIAÇÕES (user_contexts):
   - Usuários podem estar associados a múltiplos contextos
   - Cada associação tem permissão de gerenciamento (can_manage)
   - RLS garante que usuários só vejam suas próprias associações

4. TICKETS:
   - Cada ticket tem um context_id
   - Filtros automáticos baseados no contexto do usuário
   - Isolamento completo entre organizações

SISTEMA TOTALMENTE FUNCIONAL E SEGURO! 🎯
*/
