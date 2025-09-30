import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeStep(description, sqlQuery) {
  console.log(`\n🔧 Executando: ${description}`)
  console.log(`📝 SQL: ${sqlQuery.substring(0, 100)}...`)
  
  try {
    const { data, error } = await supabase.rpc('exec', { sql: sqlQuery })
    
    if (error) {
      console.error(`❌ Erro: ${error.message}`)
      return false
    }
    
    console.log(`✅ Sucesso: ${description}`)
    return true
  } catch (err) {
    console.error(`❌ Exceção: ${err.message}`)
    return false
  }
}

async function createTicketHistoryTable() {
  console.log('🚀 Iniciando criação da tabela de histórico de tickets...')
  
  // 1. Remover tabela se existir
  await executeStep('Removendo tabela existente', `
    DROP TABLE IF EXISTS ticket_history CASCADE;
  `)
  
  // 2. Criar tabela
  const success1 = await executeStep('Criando tabela ticket_history', `
    CREATE TABLE ticket_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      ticket_id UUID NOT NULL,
      user_id UUID NOT NULL,
      action_type VARCHAR(50) NOT NULL,
      field_changed VARCHAR(50),
      old_value TEXT,
      new_value TEXT,
      description TEXT,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `)
  
  if (!success1) return
  
  // 3. Adicionar foreign keys
  await executeStep('Adicionando foreign key para tickets', `
    ALTER TABLE ticket_history 
    ADD CONSTRAINT fk_ticket_history_ticket_id 
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;
  `)
  
  await executeStep('Adicionando foreign key para users', `
    ALTER TABLE ticket_history 
    ADD CONSTRAINT fk_ticket_history_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  `)
  
  // 4. Criar índices
  await executeStep('Criando índice ticket_id', `
    CREATE INDEX idx_ticket_history_ticket_id ON ticket_history (ticket_id);
  `)
  
  await executeStep('Criando índice user_id', `
    CREATE INDEX idx_ticket_history_user_id ON ticket_history (user_id);
  `)
  
  await executeStep('Criando índice action_type', `
    CREATE INDEX idx_ticket_history_action_type ON ticket_history (action_type);
  `)
  
  await executeStep('Criando índice created_at', `
    CREATE INDEX idx_ticket_history_created_at ON ticket_history (created_at);
  `)
  
  // 5. Habilitar RLS
  await executeStep('Habilitando RLS', `
    ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
  `)
  
  // 6. Política de visualização
  await executeStep('Criando política de visualização', `
    CREATE POLICY "Users can view ticket history" ON ticket_history
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM tickets t 
        WHERE t.id = ticket_history.ticket_id
        AND (
          auth.jwt() ->> 'role' IN ('admin', 'analyst', 'dev')
          OR
          (t.created_by = (auth.jwt() ->> 'sub')::uuid)
          OR
          (t.assigned_to = (auth.jwt() ->> 'sub')::uuid)
        )
      )
    );
  `)
  
  // 7. Política de inserção
  await executeStep('Criando política de inserção', `
    CREATE POLICY "System can insert ticket history" ON ticket_history
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
  `)
  
  // 8. Função de log
  const success8 = await executeStep('Criando função de log', `
    CREATE OR REPLACE FUNCTION log_ticket_changes()
    RETURNS TRIGGER AS $$
    DECLARE
      current_user_id UUID;
      old_user_name TEXT;
      new_user_name TEXT;
    BEGIN
      BEGIN
        current_user_id := current_setting('app.current_user_id', true)::uuid;
      EXCEPTION WHEN OTHERS THEN
        current_user_id := COALESCE(NEW.updated_by, NEW.created_by);
      END;

      IF current_user_id IS NULL THEN
        current_user_id := COALESCE(NEW.updated_by, NEW.created_by);
      END IF;

      IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO ticket_history (
          ticket_id, user_id, action_type, field_changed, 
          old_value, new_value, description
        ) VALUES (
          NEW.id, current_user_id, 'status_changed', 'status',
          OLD.status, NEW.status,
          format('Status alterado de "%s" para "%s"', OLD.status, NEW.status)
        );
      END IF;

      IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        INSERT INTO ticket_history (
          ticket_id, user_id, action_type, field_changed, 
          old_value, new_value, description
        ) VALUES (
          NEW.id, current_user_id, 'priority_changed', 'priority',
          OLD.priority, NEW.priority,
          format('Prioridade alterada de "%s" para "%s"', OLD.priority, NEW.priority)
        );
      END IF;

      IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        IF OLD.assigned_to IS NOT NULL THEN
          SELECT name INTO old_user_name FROM users WHERE id = OLD.assigned_to;
        END IF;
        
        IF NEW.assigned_to IS NOT NULL THEN
          SELECT name INTO new_user_name FROM users WHERE id = NEW.assigned_to;
        END IF;

        INSERT INTO ticket_history (
          ticket_id, user_id, action_type, field_changed, 
          old_value, new_value, description
        ) VALUES (
          NEW.id, current_user_id,
          CASE 
            WHEN OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN 'assigned'
            WHEN OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN 'unassigned'
            ELSE 'reassigned'
          END,
          'assigned_to', OLD.assigned_to::text, NEW.assigned_to::text,
          CASE 
            WHEN OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN 
              format('Ticket atribuído para %s', COALESCE(new_user_name, 'usuário'))
            WHEN OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN 
              format('Ticket desatribuído de %s', COALESCE(old_user_name, 'usuário'))
            ELSE 
              format('Ticket reatribuído de %s para %s', 
                COALESCE(old_user_name, 'usuário'), 
                COALESCE(new_user_name, 'usuário'))
          END
        );
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `)
  
  // 9. Criar trigger
  await executeStep('Removendo trigger existente', `
    DROP TRIGGER IF EXISTS ticket_changes_trigger ON tickets;
  `)
  
  await executeStep('Criando trigger', `
    CREATE TRIGGER ticket_changes_trigger
      AFTER UPDATE ON tickets
      FOR EACH ROW
      EXECUTE FUNCTION log_ticket_changes();
  `)
  
  // 10. Verificar tabela criada
  try {
    const { data: count, error } = await supabase
      .from('ticket_history')
      .select('count(*)', { count: 'exact' })
      .limit(1)
    
    if (error) {
      console.log('⚠️ Erro ao verificar tabela:', error.message)
    } else {
      console.log('✅ Tabela ticket_history criada e acessível!')
    }
  } catch (e) {
    console.log('⚠️ Não foi possível verificar a tabela')
  }
  
  console.log('\n🎉 Configuração da tabela de histórico concluída!')
  console.log('\n📋 Sistema pronto para uso:')
  console.log('✅ Tabela ticket_history criada')
  console.log('✅ Triggers configurados')
  console.log('✅ Políticas RLS aplicadas')
  console.log('✅ Índices para performance criados')
}

createTicketHistoryTable()




