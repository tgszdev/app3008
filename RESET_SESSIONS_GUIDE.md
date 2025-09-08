# 🔐 Guia para Reiniciar Todas as Sessões

## Método 1: Alterar NEXTAUTH_SECRET (Mais Rápido)

### No Vercel:
1. Acesse o dashboard do Vercel
2. Vá para Settings > Environment Variables
3. Localize `NEXTAUTH_SECRET`
4. Gere um novo secret:
   ```bash
   openssl rand -base64 32
   ```
5. Atualize o valor
6. Faça redeploy da aplicação

**Resultado**: Todas as sessões serão invalidadas imediatamente, pois os tokens JWT não poderão mais ser decodificados.

---

## Método 2: Script SQL no Supabase

Execute este script no Supabase SQL Editor para limpar sessões do banco:

```sql
-- Limpar todas as sessões ativas (se você estiver armazenando no banco)
DELETE FROM sessions WHERE expires > NOW();

-- Opcional: Limpar todos os tokens de autenticação
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;

-- Forçar logout de todos os usuários do Supabase Auth
UPDATE auth.users SET last_sign_in_at = NULL;
```

---

## Método 3: API Endpoint para Invalidar Sessões

Crie este endpoint para invalidar sessões programaticamente:

### `/src/app/api/admin/invalidate-sessions/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userRole = (session?.user as any)?.role
    
    // Apenas admin pode invalidar todas as sessões
    if (!session || userRole !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Adicionar flag de invalidação com timestamp
    await supabaseAdmin
      .from('system_settings')
      .upsert({
        key: 'sessions_invalidated_at',
        value: new Date().toISOString()
      })

    // Opcional: Registrar no log de auditoria
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: session.user?.id,
        action: 'invalidate_all_sessions',
        entity_type: 'system',
        entity_id: null,
        details: {
          invalidated_at: new Date().toISOString(),
          reason: 'Manual invalidation by admin'
        }
      })

    return NextResponse.json({ 
      success: true, 
      message: 'Todas as sessões foram invalidadas' 
    })
  } catch (error) {
    console.error('Erro ao invalidar sessões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

---

## Método 4: Middleware para Verificar Validade

Adicione no middleware para verificar se sessões foram invalidadas:

### Atualizar `/src/middleware.ts`
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (token) {
    // Verificar se há invalidação global
    const invalidationTime = await checkGlobalInvalidation()
    
    if (invalidationTime && token.iat) {
      const tokenIssuedAt = new Date(token.iat * 1000)
      const invalidatedAt = new Date(invalidationTime)
      
      // Se o token foi emitido antes da invalidação, forçar logout
      if (tokenIssuedAt < invalidatedAt) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        
        // Limpar cookies de sessão
        response.cookies.delete('next-auth.session-token')
        response.cookies.delete('__Secure-next-auth.session-token')
        
        return response
      }
    }
  }
  
  return NextResponse.next()
}
```

---

## Método 5: Comando via Terminal (Development)

Para desenvolvimento local, você pode criar um script:

### `/scripts/reset-sessions.js`
```javascript
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function resetAllSessions() {
  try {
    // Limpar sessões do Supabase
    const { error: sessionsError } = await supabase.auth.admin.signOut('all')
    
    if (sessionsError) {
      console.error('Erro ao limpar sessões:', sessionsError)
      return
    }
    
    console.log('✅ Todas as sessões foram invalidadas')
    
    // Opcional: Registrar no banco
    await supabase
      .from('system_logs')
      .insert({
        action: 'sessions_reset',
        timestamp: new Date().toISOString(),
        details: { method: 'script' }
      })
      
  } catch (error) {
    console.error('Erro:', error)
  }
}

resetAllSessions()
```

Execute com:
```bash
node scripts/reset-sessions.js
```

---

## Método 6: Interface Admin no Dashboard

Adicione um botão no painel admin:

### Component: `/src/components/admin/ResetSessionsButton.tsx`
```tsx
'use client'

import { useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export function ResetSessionsButton() {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleReset = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/admin/invalidate-sessions')
      toast.success('Todas as sessões foram invalidadas!')
      
      // Fazer logout do usuário atual após 3 segundos
      setTimeout(() => {
        window.location.href = '/login'
      }, 3000)
    } catch (error) {
      toast.error('Erro ao invalidar sessões')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 mb-3">
          <AlertTriangle size={20} />
          <span className="font-semibold">Confirmar Ação</span>
        </div>
        <p className="text-sm text-red-700 mb-4">
          Isso irá deslogar TODOS os usuários, incluindo você. 
          Tem certeza?
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {loading ? 'Processando...' : 'Sim, invalidar todas'}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleReset}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
    >
      <RefreshCw size={18} />
      Invalidar Todas as Sessões
    </button>
  )
}
```

---

## 🚀 Recomendação

**Para produção**, use o **Método 1** (alterar NEXTAUTH_SECRET):
- Mais simples e rápido
- Não requer código adicional
- Efeito imediato
- Seguro e confiável

**Para desenvolvimento**, qualquer método funciona bem.

---

## ⚠️ Importante

Após invalidar as sessões:
1. Todos os usuários precisarão fazer login novamente
2. Tokens de API podem ser afetados
3. Sessões de integração podem precisar ser renovadas
4. Considere notificar os usuários com antecedência