-- =====================================================
-- CORREÇÃO DEFINITIVA DO RLS - SISTEMA MULTI-TENANT ESCALÁVEL
-- FUNCIONA AUTOMATICAMENTE PARA NOVOS USUÁRIOS E ORGANIZAÇÕES
-- =====================================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_contexts DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as policies existentes
DROP POLICY IF EXISTS "Users can view their own contexts" ON user_contexts;
DROP POLICY IF EXISTS "Admins can manage all contexts" ON user_contexts;
DROP POLICY IF EXISTS "Users can view contexts they belong to" ON user_contexts;
DROP POLICY IF EXISTS "Users can view tickets from their context" ON tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets in their context" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets from their context" ON tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON tickets;
DROP POLICY IF EXISTS "Context users can view their tickets" ON tickets;
DROP POLICY IF EXISTS "Matrix users can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets in their context" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets in their context" ON tickets;

-- 3. Reabilitar RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;

-- 4. Criar policies escaláveis e funcionais

-- =====================================================
-- POLICIES PARA user_contexts (ESCALÁVEIS)
-- =====================================================

-- Policy: Usuários veem apenas suas próprias associações
CREATE POLICY "Users can view their own contexts" ON user_contexts
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- Policy: Usuários podem inserir suas próprias associações
CREATE POLICY "Users can insert their own contexts" ON user_contexts
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Policy: Usuários podem atualizar suas próprias associações
CREATE POLICY "Users can update their own contexts" ON user_contexts
    FOR UPDATE
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- Policy: Usuários podem deletar suas próprias associações
CREATE POLICY "Users can delete their own contexts" ON user_contexts
    FOR DELETE
    USING (auth.uid()::text = user_id);

-- Policy: Administradores podem gerenciar todas as associações
CREATE POLICY "Admins can manage all contexts" ON user_contexts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role IN ('admin', 'analyst')
        )
    );

-- =====================================================
-- POLICIES PARA tickets (ESCALÁVEIS)
-- =====================================================

-- Policy: Usuários de contexto veem apenas tickets do seu contexto
CREATE POLICY "Context users can view their tickets" ON tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.user_type = 'context'
            AND users.context_id = tickets.context_id
        )
    );

-- Policy: Usuários matrix veem todos os tickets
CREATE POLICY "Matrix users can view all tickets" ON tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.user_type = 'matrix'
        )
    );

-- Policy: Administradores veem todos os tickets
CREATE POLICY "Admins can view all tickets" ON tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role IN ('admin', 'analyst')
        )
    );

-- Policy: Usuários podem ver tickets que criaram
CREATE POLICY "Users can view tickets they created" ON tickets
    FOR SELECT
    USING (created_by = auth.uid()::text);

-- Policy: Criação de tickets - usuários podem criar no seu contexto
CREATE POLICY "Users can create tickets in their context" ON tickets
    FOR INSERT
    WITH CHECK (
        -- Se é usuário de contexto, só pode criar no seu contexto
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'context'
                AND users.context_id = tickets.context_id
            )
        )
        OR
        -- Se é usuário matrix, pode criar em qualquer contexto
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'matrix'
            )
        )
        OR
        -- Se é admin, pode criar em qualquer contexto
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.role IN ('admin', 'analyst')
            )
        )
    );

-- Policy: Atualização de tickets - usuários podem atualizar no seu contexto
CREATE POLICY "Users can update tickets in their context" ON tickets
    FOR UPDATE
    USING (
        -- Se é usuário de contexto, só pode atualizar no seu contexto
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'context'
                AND users.context_id = tickets.context_id
            )
        )
        OR
        -- Se é usuário matrix, pode atualizar todos
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'matrix'
            )
        )
        OR
        -- Se é admin, pode atualizar todos
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.role IN ('admin', 'analyst')
            )
        )
        OR
        -- Se criou o ticket, pode atualizar
        (created_by = auth.uid()::text)
    );

-- Policy: Deleção de tickets - usuários podem deletar no seu contexto
CREATE POLICY "Users can delete tickets in their context" ON tickets
    FOR DELETE
    USING (
        -- Se é usuário de contexto, só pode deletar no seu contexto
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'context'
                AND users.context_id = tickets.context_id
            )
        )
        OR
        -- Se é usuário matrix, pode deletar todos
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.user_type = 'matrix'
            )
        )
        OR
        -- Se é admin, pode deletar todos
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()::text 
                AND users.role IN ('admin', 'analyst')
            )
        )
        OR
        -- Se criou o ticket, pode deletar
        (created_by = auth.uid()::text)
    );

-- 5. Verificar se as policies foram criadas
SELECT 
    'Policies Created' as status,
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename IN ('user_contexts', 'tickets')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Verificar se RLS está habilitado
SELECT 
    'RLS Status' as status,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('user_contexts', 'tickets')
AND schemaname = 'public';

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

/*
CORREÇÕES APLICADAS:

1. RLS habilitado corretamente
2. Policies simplificadas e funcionais
3. Separação clara entre usuários de contexto e matrix
4. Admins têm acesso total
5. Usuários de contexto veem apenas tickets do seu contexto
6. Usuários matrix veem todos os tickets

SISTEMA MULTI-TENANT TOTALMENTE FUNCIONAL! 🎯
*/
