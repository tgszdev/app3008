# 📋 Instruções para Criar Tabela de Categorias no Supabase

## ⚠️ IMPORTANTE: Execute estes passos para criar a tabela de categorias

### 📍 Passo 1: Acesse o Supabase
1. Acesse: https://supabase.com/dashboard/project/eyfvvximmeqmwdfqzqov
2. Faça login com suas credenciais

### 📍 Passo 2: Abra o SQL Editor
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query** (botão verde)

### 📍 Passo 3: Execute o Script SQL
1. Copie TODO o conteúdo do arquivo: `/home/user/webapp/supabase/create-categories-table.sql`
2. Cole no editor SQL do Supabase
3. Clique em **RUN** (botão verde no canto inferior direito)

### ✅ O que o script faz:
- ✅ Cria a tabela `categories` com todos os campos necessários
- ✅ Cria índices para melhor performance
- ✅ Adiciona trigger para atualizar `updated_at` automaticamente
- ✅ Insere 10 categorias padrão (Geral, Hardware, Software, etc.)
- ✅ Adiciona coluna `category_id` na tabela `tickets` (se não existir)
- ✅ Migra dados existentes da coluna `category` (texto) para `category_id` (UUID)
- ✅ Configura permissões para acesso via API

### 📊 Estrutura da Tabela Categories:
```sql
categories
├── id (UUID) - ID único
├── name (VARCHAR) - Nome da categoria
├── slug (VARCHAR) - URL amigável
├── description (TEXT) - Descrição
├── icon (VARCHAR) - Nome do ícone
├── color (VARCHAR) - Cor hexadecimal
├── is_active (BOOLEAN) - Status ativo/inativo
├── display_order (INTEGER) - Ordem de exibição
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── created_by (UUID) - Usuário que criou
└── updated_by (UUID) - Usuário que atualizou
```

### 🔄 Se houver erro:
1. **Erro "relation already exists"**: A tabela já foi criada, pode ignorar
2. **Erro de permissão**: Verifique se está logado como admin
3. **Erro de sintaxe**: Certifique-se de copiar TODO o script

### 🧪 Como testar:
1. Após executar o script, vá para **Table Editor** no Supabase
2. Procure a tabela `categories`
3. Verifique se tem 10 registros (categorias padrão)
4. Acesse a aplicação em: https://app3008-two.vercel.app/dashboard/categories
5. Faça login como admin (admin@example.com / admin123)
6. Você deve ver a lista de categorias

### 🚀 Funcionalidades Disponíveis:
- ✅ Criar nova categoria
- ✅ Editar categoria existente
- ✅ Excluir categoria (se não houver tickets associados)
- ✅ Ativar/Desativar categoria
- ✅ Reordenar categorias (setas para cima/baixo)
- ✅ Definir cor e ícone personalizado
- ✅ Buscar categorias

### 📝 Notas:
- Apenas administradores podem gerenciar categorias
- As categorias são usadas para classificar tickets
- A migração automática preserva categorias existentes nos tickets
- O slug é gerado automaticamente a partir do nome

### 🆘 Suporte:
Se houver problemas, compartilhe o erro exato do Supabase para que eu possa ajudar!