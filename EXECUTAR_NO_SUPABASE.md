# 🎯 INSTRUÇÕES: Executar SQL no Supabase Dashboard

## 📋 **PASSOS PARA CRIAR A TABELA DE HISTÓRICO:**

### **1. Acesse o Supabase Dashboard**
- Vá em https://supabase.com/dashboard
- Entre no seu projeto
- Clique em "SQL Editor" no menu lateral

### **2. Execute os comandos na ORDEM abaixo:**

---

#### **PASSO 1: Remover tabela se existir**
```sql
DROP TABLE IF EXISTS ticket_history CASCADE;
```

---

#### **PASSO 2: Criar tabela**
```sql
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
```

---

#### **PASSO 3: Adicionar foreign keys**
```sql
ALTER TABLE ticket_history 
ADD CONSTRAINT fk_ticket_history_ticket_id 
FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;

ALTER TABLE ticket_history 
ADD CONSTRAINT fk_ticket_history_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

---

#### **PASSO 4: Criar índices**
```sql
CREATE INDEX idx_ticket_history_ticket_id ON ticket_history (ticket_id);
CREATE INDEX idx_ticket_history_user_id ON ticket_history (user_id);
CREATE INDEX idx_ticket_history_action_type ON ticket_history (action_type);
CREATE INDEX idx_ticket_history_created_at ON ticket_history (created_at);
```

---

#### **PASSO 5: Habilitar RLS**
```sql
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
```

---

#### **PASSO 6: Criar políticas**
```sql
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

CREATE POLICY "System can insert ticket history" ON ticket_history
FOR INSERT
WITH CHECK (auth.role() = 'service_role');
```

---

#### **PASSO 7: Criar função de log**
```sql
CREATE OR REPLACE FUNCTION log_ticket_changes()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  old_user_name TEXT;
  new_user_name TEXT;
BEGIN
  -- Tentar obter user_id do contexto
  BEGIN
    current_user_id := current_setting('app.current_user_id', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    current_user_id := COALESCE(NEW.updated_by, NEW.created_by);
  END;

  IF current_user_id IS NULL THEN
    current_user_id := COALESCE(NEW.updated_by, NEW.created_by);
  END IF;

  -- Registrar mudança de status
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

  -- Registrar mudança de prioridade
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

  -- Registrar mudança de responsável
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    -- Buscar nomes dos usuários
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
      'assigned_to', 
      OLD.assigned_to::text, 
      NEW.assigned_to::text,
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
```

---

#### **PASSO 8: Criar trigger**
```sql
DROP TRIGGER IF EXISTS ticket_changes_trigger ON tickets;

CREATE TRIGGER ticket_changes_trigger
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_changes();
```

---

### **3. Verificar se funcionou**
```sql
-- Verificar se a tabela foi criada
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ticket_history' 
ORDER BY ordinal_position;

-- Verificar se o trigger foi criado
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'ticket_changes_trigger';
```

---

## ✅ **RESULTADO ESPERADO:**

Após executar todos os passos, você deve ver:
- ✅ Tabela `ticket_history` criada com 10 colunas
- ✅ Trigger `ticket_changes_trigger` ativo na tabela `tickets`
- ✅ Políticas RLS configuradas

## 🎉 **PRONTO!**

Agora o sistema de histórico está ativo e funcionando:
- 🔄 **Mudanças de status** serão registradas automaticamente
- 🎯 **Mudanças de prioridade** serão registradas automaticamente  
- 👤 **Mudanças de responsável** serão registradas automaticamente
- 📱 **Interface** já está implementada no frontend

**Teste alterando um ticket para ver o histórico funcionando!**

