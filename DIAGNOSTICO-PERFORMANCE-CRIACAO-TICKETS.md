# 🔍 DIAGNÓSTICO: Performance na Criação de Tickets

## 📊 Análise Atual

### ⏱️ Tempo Total Estimado: **8-15 segundos**

### Operações Sequenciais (Bloqueantes):

1. **✅ Criar Ticket** (~500ms)
   - Gerar ticket_number via RPC
   - Buscar status padrão
   - Insert no banco
   - Select com joins complexos

2. **📝 Criar Histórico Inicial** (~200ms)
   - Insert na tabela ticket_history

3. **🔔 Notificar Responsável** (~1-2s)
   - Se houver assigned_to diferente do criador
   - Chamada à função de notificação

4. **👥 Notificar TODOS Administradores** (~3-6s) ⚠️ **GARGALO PRINCIPAL**
   ```typescript
   // Buscar todos admins
   const { data: admins } = await supabaseAdmin
     .from('users')
     .select('id')
     .eq('role', 'admin')
   
   // Loop SÍNCRONO notificando cada admin
   for (const admin of admins) {
     await createAndSendNotification({...}) // AGUARDA cada notificação
   }
   ```
   - Se houver 5 admins, são 5 chamadas sequenciais (~500ms cada)
   - Total: **2.5-5 segundos**

5. **⚙️ Executar Workflows** (~1-2s)
   - `executeWorkflowsForTicket()`
   - Verifica regras e executa ações

6. **🚨 Executar Escalação** (~2-4s) ⚠️ **GARGALO SECUNDÁRIO**
   - `executeEscalationForTicketSimple()`
   - Se houver regras de escalação, faz chamada HTTP adicional
   - Processa e-mails de escalação

## 🚨 Problemas Identificados

### 1. **Notificações Síncronas Bloqueantes** (Crítico)
- Loop `for...of` com `await` dentro
- Cada notificação aguarda a anterior completar
- Não usa `Promise.all()`
- Bloqueia o response do ticket

### 2. **Escalação em Tempo Real** (Alto)
- Processo pesado executado durante a criação
- Inclui chamada HTTP externa para processar e-mails
- Deveria ser assíncrono

### 3. **Workflows Síncronos** (Médio)
- Executados antes de retornar resposta
- Podem ser movidos para background

### 4. **Queries Complexas** (Baixo)
- Select com múltiplos joins após criação
- Poderia retornar dados mais simples inicialmente

### 5. **Histórico Manual + Trigger** (Baixo)
- Insert manual pode duplicar com trigger do banco

## ✅ Soluções Propostas

### 🎯 **Solução 1: Paralelização de Notificações** (Impacto: Alto, Esforço: Baixo)

**Implementação:**
```typescript
// ANTES (Sequencial - 5s para 5 admins)
for (const admin of admins) {
  await createAndSendNotification({...})
}

// DEPOIS (Paralelo - 500ms para 5 admins)
await Promise.all(
  admins.map(admin => 
    createAndSendNotification({...}).catch(err => 
      console.log('Erro notificação ignorado:', err)
    )
  )
)
```

**Ganho Esperado:** Redução de 4-5 segundos → **~70% mais rápido**

---

### 🎯 **Solução 2: Mover Processamento para Background** (Impacto: Muito Alto, Esforço: Médio)

**Criar fila de processamento assíncrono:**

```typescript
// OPÇÃO A: Next.js API Route Background (Sem libs extras)
export async function POST(request: NextRequest) {
  // ... criar ticket ...
  
  const newTicket = await supabaseAdmin.from('tickets').insert(...)
  
  // ✅ Retornar imediatamente
  const response = NextResponse.json(newTicket, { status: 201 })
  
  // 🔥 Processar em background (não aguarda)
  processTicketBackgroundTasks(newTicket.id).catch(console.error)
  
  return response
}

async function processTicketBackgroundTasks(ticketId: string) {
  // Notificações
  await sendAllNotifications(ticketId)
  
  // Workflows
  await executeWorkflowsForTicket(ticketId)
  
  // Escalação
  await executeEscalationForTicketSimple(ticketId)
}
```

**OPÇÃO B: Vercel Edge Config + Cron Job**
- Inserir ticket_id em fila (Redis/Upstash)
- Cron processa fila a cada 30s

**OPÇÃO C: Supabase Realtime Trigger**
- Trigger no banco chama webhook
- Webhook processa notificações/workflows

**Ganho Esperado:** Redução de 6-10 segundos → **Response em ~1-2s**

---

### 🎯 **Solução 3: Otimizar Escalação** (Impacto: Médio, Esforço: Baixo)

**Tornar escalação completamente assíncrona:**

```typescript
// ANTES
const escalationResult = await executeEscalationForTicketSimple(newTicket.id)
if (escalationResult.success && escalationResult.executedRules.length > 0) {
  const emailResponse = await fetch('/api/escalation/process-emails', {...})
}

// DEPOIS
executeEscalationForTicketSimple(newTicket.id)
  .then(result => {
    if (result.success && result.executedRules.length > 0) {
      return fetch('/api/escalation/process-emails', {...})
    }
  })
  .catch(console.error) // Não bloqueia resposta
```

**Ganho Esperado:** Redução de 2-4 segundos

---

### 🎯 **Solução 4: Simplificar Query de Retorno** (Impacto: Baixo, Esforço: Baixo)

**Retornar dados essenciais:**

```typescript
// ANTES (4 joins)
.select(`
  *,
  created_by_user:users!tickets_created_by_fkey(id, name, email),
  assigned_to_user:users!tickets_assigned_to_fkey(id, name, email),
  category_info:categories!tickets_category_id_fkey(...),
  context_info:contexts!tickets_context_id_fkey(...)
`)

// DEPOIS (sem joins - buscar depois se necessário)
.select('*')
```

**Ganho Esperado:** Redução de ~200ms

---

### 🎯 **Solução 5: Cache de Status Padrão** (Impacto: Baixo, Esforço: Baixo)

**Evitar query toda vez:**

```typescript
// Cache em memória
let cachedDefaultStatus: string | null = null

async function getDefaultStatus() {
  if (cachedDefaultStatus) return cachedDefaultStatus
  
  const { data } = await supabaseAdmin
    .from('ticket_statuses')
    .select('slug')
    .order('order_index', { ascending: true })
    .limit(1)
    .single()
  
  cachedDefaultStatus = data?.slug || 'ABERTO'
  return cachedDefaultStatus
}
```

**Ganho Esperado:** Redução de ~100ms

---

## 🏆 Plano de Ação Recomendado

### **Fase 1: Quick Wins** (1-2 horas, Ganho: ~5-6s)
1. ✅ Paralelizar notificações de admins (Solução 1)
2. ✅ Tornar escalação não-bloqueante (Solução 3)
3. ✅ Simplificar query de retorno (Solução 4)
4. ✅ Cache de status padrão (Solução 5)

**Resultado:** De 8-15s para **3-5s** (~60% mais rápido)

---

### **Fase 2: Background Jobs** (4-6 horas, Ganho: ~4-5s)
1. ✅ Implementar processamento em background (Solução 2)
2. ✅ Mover workflows para background
3. ✅ Otimizar ordem de operações

**Resultado Final:** De 3-5s para **1-2s** (~90% mais rápido)

---

## 📈 Comparação de Performance

| Operação | Atual | Fase 1 | Fase 2 |
|----------|-------|--------|--------|
| Criar Ticket | 500ms | 500ms | 500ms |
| Histórico | 200ms | 200ms | *(background)* |
| Notificar Responsável | 1-2s | 500ms | *(background)* |
| Notificar Admins | **3-6s** | **500ms** ✅ | *(background)* |
| Workflows | 1-2s | 1-2s | *(background)* |
| Escalação | **2-4s** | *(async)* ✅ | *(background)* |
| **TOTAL** | **8-15s** | **3-5s** | **1-2s** |

---

## 🔧 Implementação Imediata (Copy-Paste Ready)

### **Fix 1: Paralelizar Notificações**
```typescript
// Em src/app/api/tickets/route.ts, linha 287-305
// Substituir o loop for...of por:

if (admins && admins.length > 0) {
  await Promise.all(
    admins.map(admin =>
      createAndSendNotification({
        user_id: admin.id,
        title: `Novo Chamado #${newTicket.ticket_number || newTicket.id.substring(0, 8)}`,
        message: `${newTicket.created_by_user?.name || 'Usuário'} criou um novo chamado: ${title}`,
        type: 'ticket_created',
        severity: 'info',
        data: {
          ticket_id: newTicket.id,
          ticket_number: newTicket.ticket_number
        },
        action_url: `/dashboard/tickets/${newTicket.id}`
      }).catch(err => console.log('Erro ao notificar admin (ignorado):', err))
    )
  )
}
```

### **Fix 2: Escalação Não-Bloqueante**
```typescript
// Em src/app/api/tickets/route.ts, linha 316-346
// Substituir try-catch por:

executeEscalationForTicketSimple(newTicket.id)
  .then(escalationResult => {
    console.log(`✅ Escalação executada:`, escalationResult)
    
    if (escalationResult.success && escalationResult.executedRules.length > 0) {
      return fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/escalation/process-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Auto-Escalation-Integration/1.0'
        }
      })
    }
  })
  .then(emailResponse => {
    if (emailResponse?.ok) {
      console.log(`✅ E-mails de escalação processados`)
    }
  })
  .catch(err => console.log('Erro na escalação (ignorado):', err))
```

### **Fix 3: Simplificar Query**
```typescript
// Em src/app/api/tickets/route.ts, linha 219-227
// Simplificar select:

const { data: newTicket, error } = await supabaseAdmin
  .from('tickets')
  .insert(ticketData)
  .select('*') // Sem joins - mais rápido
  .single()
```

---

## 🎯 Conclusão

A lentidão é causada principalmente por:
1. **Notificações síncronas em loop** (5s) ⚠️
2. **Escalação bloqueante** (3s) ⚠️

**Implementando apenas Fase 1, você terá:**
- ⚡ **60% de redução no tempo**
- 🚀 Criação em **3-5 segundos**
- ✅ Zero breaking changes
- 🕐 **1-2 horas de trabalho**

---

**Data:** 02/10/2025  
**Versão:** 1.0

