# 🚀 CTS ROLES - Instruções de Execução Completa

**Tempo Total:** 15-20 minutos  
**Fases:** 3 (SQL + API + UI Manual)

---

## 📋 ORDEM DE EXECUÇÃO

### **PASSO 1: Testes SQL (5 minutos)** ✅ AUTOMÁTICO

#### **Como Executar:**
1. Abrir **Supabase** (https://supabase.com)
2. Ir em: **SQL Editor**
3. Clicar: **New Query**
4. Copiar e colar: `test/cts-roles/run-all-sql-tests.sql`
5. Clicar: **Run** (ou `Ctrl+Enter`)
6. Aguardar execução completa (~30 segundos)

#### **O que será testado:**
- ✅ Criação de 4 usuários de teste
- ✅ Backup automático dos perfis
- ✅ Validação de 72 permissões por perfil
- ✅ Verificação de valores por tipo
- ✅ Integridade de dados
- ✅ Consistência entre perfis

#### **Resultado Esperado:**
```
✅ Usuários de teste criados: 4
✅ Backup criado com X perfis
📊 TESTE 1.1: admin - ✅ PASSOU
📊 TESTE 1.2: Admin com todas permissões true - ✅ PASSOU
📊 TESTE 1.3: Developer com ~35 permissões true - ✅ PASSOU
📊 TESTE 1.4: Analyst com ~43 permissões true - ✅ PASSOU
📊 TESTE 1.5: User com ~13 permissões true - ✅ PASSOU
...
Taxa de Sucesso: X%
Status: ✅ APROVADO
```

---

### **PASSO 2: Testes de API (5 minutos)** ✅ AUTOMÁTICO

#### **Como Executar:**
```bash
# No terminal, dentro da pasta do projeto:
cd /Users/thiago.souza/Desktop/app3008
node test/cts-roles/run-api-tests.mjs
```

#### **O que será testado:**
- ✅ Validação de setup
- ✅ Validação de migration
- ✅ Permissões específicas por categoria
- ✅ Consistência de dados
- ✅ ~60 testes automatizados

#### **Resultado Esperado:**
```
╔══════════════════════════════════════════════════════╗
║         CTS - Complete Test Suite: Roles V2.0        ║
╚══════════════════════════════════════════════════════╝

FASE 0: VALIDAÇÃO DE SETUP
✅ TESTE 0.1: Usuários de teste criados
✅ TESTE 0.2: Todos os perfis representados

FASE 1: VALIDAÇÃO DE MIGRATION
✅ TESTE 1.1: Perfis carregados do banco
✅ TESTE 1.2.admin: Administrador tem 72 permissões
✅ TESTE 1.3: Admin tem TODAS as permissões = true
...

╔══════════════════════════════════════════════════════╗
║                   RESUMO DO CTS                      ║
╠══════════════════════════════════════════════════════╣
║ Total de Testes:                                 60 ║
║ Testes Passados:                                 58 ║
║ Testes Falhados:                                  2 ║
║ Taxa de Sucesso:      96.7%                         ║
║ Status:               ✅ APROVADO                    ║
╚══════════════════════════════════════════════════════╝
```

---

### **PASSO 3: Testes Manuais de UI (8 minutos)** ⚠️ MANUAL

#### **Como Executar:**
1. Abrir: `test/cts-roles/MANUAL_UI_TESTS.md`
2. Seguir checklist passo a passo
3. Marcar cada item conforme testa
4. Anotar problemas encontrados

#### **Login Sequential:**
1. **Admin** → Validar acesso total (2 min)
2. **Developer** → Validar acesso técnico (2 min)
3. **Analyst** → Validar acesso gerencial (2 min)
4. **User** → Validar acesso básico + tentar bypasses (2 min)

#### **Credenciais:**
```
Admin:      test_admin@test.com / password
Developer:  test_developer@test.com / password
Analyst:    test_analyst@test.com / password
User:       test_user@test.com / password
```

---

## 🎯 PRÉ-REQUISITOS

### **Antes de Começar:**

1. **Deploy Atualizado:**
   ```bash
   # Verificar último deploy
   vercel ls
   # Deve mostrar: app3008-xxx (Production)
   ```

2. **Build Propagado:**
   - ⏱️ Aguardar 2-3 minutos após deploy
   - 🔄 Testar URL de produção no browser

3. **Migration Aplicada:**
   - Login como admin
   - Ir em: Configurações → Gerenciar Perfis
   - Clicar: **"Migration V2.0"**
   - Confirmar
   - Aguardar: Toast de sucesso
   - Clicar: **"Limpar Cache"**
   - Fazer: Logout + Login

---

## ⚠️ TROUBLESHOOTING

### **Problema: Script SQL falha**
**Solução:**
```sql
-- Executar linha por linha
-- Copiar apenas uma seção de cada vez
-- Verificar mensagens de erro
```

### **Problema: Script Node.js não roda**
**Solução:**
```bash
# Verificar Node.js instalado
node --version  # Deve ser >= 18

# Instalar dependências se necessário
npm install @supabase/supabase-js

# Verificar variáveis de ambiente
cat .env.local | grep SUPABASE
```

### **Problema: Usuários de teste não aparecem**
**Solução:**
```sql
-- Verificar diretamente no Supabase
SELECT * FROM users WHERE email LIKE 'test_%@test.com';

-- Se vazio, executar novamente:
-- test/cts-roles/00-setup-test-users.sql
```

### **Problema: Migration não aplicada**
**Solução:**
1. Login como admin REAL (não teste)
2. Ir em: Configurações → Gerenciar Perfis
3. Clicar: "Migration V2.0"
4. Verificar toast de sucesso
5. Re-executar testes SQL

---

## 📊 MÉTRICAS DE SUCESSO

### **Meta de Aprovação:**
- SQL Tests: ≥ 90% passa
- API Tests: ≥ 85% passa
- UI Tests: ≥ 80% passa
- Security: 100% bloqueia bypasses

### **Status Final:**
- ✅ **APROVADO:** Todas as metas atingidas
- ⚠️ **RESSALVAS:** 1-2 falhas não críticas
- ❌ **REPROVADO:** Falhas críticas ou bypasses possíveis

---

## 📁 ARQUIVOS DO CTS

```
test/cts-roles/
├── 00-setup-test-users.sql       (Setup inicial)
├── 01-validate-migration.sql     (Validação detalhada)
├── 02-integrity-check.sql        (Integridade)
├── run-all-sql-tests.sql         (✨ EXECUTAR ESTE)
├── run-api-tests.mjs             (✨ EXECUTAR ESTE)
├── MANUAL_UI_TESTS.md            (✨ SEGUIR ESTE)
└── INSTRUCOES_EXECUCAO.md        (VOCÊ ESTÁ AQUI)
```

---

## 🚀 QUICK START

```bash
# 1. SQL (Supabase SQL Editor)
# Copiar e executar: test/cts-roles/run-all-sql-tests.sql

# 2. API (Terminal)
cd /Users/thiago.souza/Desktop/app3008
node test/cts-roles/run-api-tests.mjs

# 3. UI (Browser)
# Seguir: test/cts-roles/MANUAL_UI_TESTS.md
```

---

**Boa sorte com os testes! 🚀**

