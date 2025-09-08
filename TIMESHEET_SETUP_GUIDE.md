# Guia de Configuração do Sistema de Apontamentos

## 🎯 Melhorias Implementadas

### 1. **Novo Layout dos Cards de Apontamentos**
- Cards com gradiente escuro (slate-800 para slate-900)
- Exibição do número do ticket em destaque (#27)
- Contador de apontamentos no canto superior direito
- Barra de progresso visual mostrando percentual aprovado
- Estatísticas completas: Aprovadas, Pendentes, Rejeitadas (sem abreviações)
- Botões de ação integrados no card

### 2. **Validações Aprimoradas**
- Descrição obrigatória com mínimo de 10 caracteres
- Data do trabalho não pode ser futura
- Mensagens de ajuda para cada campo

### 3. **Interface Melhorada**
- Calendário moderno com seleção de data
- Histórico de apontamentos expandível
- Exibição completa do dia da semana e data
- Visualização apenas dos próprios apontamentos por padrão

## 📋 Passo 1: Executar SQL no Supabase

Execute o seguinte SQL no editor SQL do Supabase:

```sql
-- Tabela de apontamentos de horas
CREATE TABLE IF NOT EXISTS timesheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hours_worked DECIMAL(10, 2) NOT NULL CHECK (hours_worked > 0),
  description TEXT NOT NULL,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approval_date TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_timesheets_ticket_id ON timesheets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_user_id ON timesheets(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_work_date ON timesheets(work_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status);

-- Tabela de permissões de apontamentos
CREATE TABLE IF NOT EXISTS timesheet_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_submit BOOLEAN DEFAULT true,
  can_approve BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_timesheets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_timesheets_updated_at_trigger
  BEFORE UPDATE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION update_timesheets_updated_at();

CREATE TRIGGER update_timesheet_permissions_updated_at_trigger
  BEFORE UPDATE ON timesheet_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_timesheets_updated_at();

-- RLS (Row Level Security)
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_permissions ENABLE ROW LEVEL SECURITY;

-- Política para timesheets: usuários podem ver seus próprios apontamentos e admin pode ver todos
CREATE POLICY "Users can view own timesheets" ON timesheets
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Política para timesheets: usuários podem criar seus próprios apontamentos se tiverem permissão
CREATE POLICY "Users can create own timesheets" ON timesheets
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM timesheet_permissions 
      WHERE timesheet_permissions.user_id = auth.uid() 
      AND timesheet_permissions.can_submit = true
    )
  );

-- Política para timesheets: usuários podem atualizar seus próprios apontamentos pendentes
CREATE POLICY "Users can update own pending timesheets" ON timesheets
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Política para timesheets: admins e aprovadores podem aprovar/rejeitar
CREATE POLICY "Admins and approvers can manage timesheets" ON timesheets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    ) OR EXISTS (
      SELECT 1 FROM timesheet_permissions 
      WHERE timesheet_permissions.user_id = auth.uid() 
      AND timesheet_permissions.can_approve = true
    )
  );

-- Política para timesheet_permissions: apenas admins podem gerenciar
CREATE POLICY "Only admins can manage timesheet permissions" ON timesheet_permissions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Política para timesheet_permissions: usuários podem ver suas próprias permissões
CREATE POLICY "Users can view own permissions" ON timesheet_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Inserir permissão padrão para todos os usuários existentes
INSERT INTO timesheet_permissions (user_id, can_submit, can_approve)
SELECT 
  id,
  true,
  CASE WHEN role = 'admin' THEN true ELSE false END
FROM users
ON CONFLICT (user_id) DO NOTHING;
```

## 🚀 Passo 2: Verificar a Aplicação

1. Acesse: https://3000-inf71qwtpa8mbn30ykzsp-6532622b.e2b.dev
2. Faça login no sistema
3. No menu lateral, clique em "Apontamentos"
4. Teste as funcionalidades:
   - Adicionar apontamento
   - Visualizar histórico
   - Aprovar/Rejeitar (se for admin)

## ✅ Funcionalidades Implementadas

### Para Usuários:
- ✅ Adicionar apontamentos de horas
- ✅ Visualizar próprios apontamentos
- ✅ Excluir apontamentos pendentes
- ✅ Ver status de aprovação
- ✅ Filtrar por período, status e ticket

### Para Administradores:
- ✅ Aprovar/Rejeitar apontamentos
- ✅ Gerenciar permissões de usuários
- ✅ Visualizar todos os apontamentos
- ✅ Adicionar motivo de rejeição

### Melhorias de UI/UX:
- ✅ Cards com design moderno e gradiente
- ✅ Barra de progresso visual
- ✅ Estatísticas sem abreviações (Aprovadas, Pendentes, Rejeitadas)
- ✅ Calendário com dia da semana completo
- ✅ Descrição obrigatória com validação
- ✅ Data limitada ao presente (sem datas futuras)
- ✅ Histórico expandível por ticket

## 🔧 Troubleshooting

Se houver algum erro:

1. **Erro 404 nas APIs**: Verifique se o SQL foi executado corretamente
2. **Erro de permissão**: Certifique-se de que as políticas RLS foram criadas
3. **Apontamentos não aparecem**: Verifique se há tickets criados no sistema

## 📊 Status do Sistema

- **URL da Aplicação**: https://3000-inf71qwtpa8mbn30ykzsp-6532622b.e2b.dev
- **Status**: ✅ Funcionando
- **Melhorias Aplicadas**: 
  - Layout dos cards corrigido
  - Barra de progresso funcionando
  - Estatísticas completas sem abreviações
  - Validação de descrição obrigatória
  - Calendário moderno implementado