# 📚 Instruções para Aplicar a Base de Conhecimento no Supabase

## 1. Acesse o Supabase SQL Editor
1. Faça login no Supabase: https://supabase.com
2. Acesse seu projeto
3. No menu lateral, clique em **SQL Editor**

## 2. Execute o Script SQL
Cole e execute TODO o conteúdo do arquivo `/sql/create_kb_tables.sql`

Este script irá criar:
- ✅ 8 tabelas para o sistema KB
- ✅ Índices para performance
- ✅ Triggers para atualização automática
- ✅ 8 categorias padrão
- ✅ 3 artigos de exemplo
- ✅ Tags iniciais

## 3. Verificar a Criação
Execute estas queries para verificar:

```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'kb_%';

-- Verificar categorias
SELECT * FROM kb_categories;

-- Verificar artigos de exemplo
SELECT * FROM kb_articles;

-- Verificar tags
SELECT * FROM kb_tags;
```

## 4. Configurar Storage (Opcional)
Se quiser adicionar anexos aos artigos:

1. Vá em **Storage** no Supabase
2. Crie um bucket chamado `kb-attachments`
3. Configure como público ou privado conforme necessidade

## 5. Testar no Sistema

Após executar o SQL:
1. Acesse: https://app3008-two.vercel.app/dashboard/knowledge-base
2. Você verá:
   - 8 categorias coloridas com ícones
   - 3 artigos de exemplo
   - Sistema de busca funcional
   - Estatísticas em tempo real

## ✅ Pronto!
A Base de Conhecimento está configurada e funcional!

## 🎯 Funcionalidades Disponíveis:
- **Busca**: Digite para buscar em títulos e conteúdo
- **Filtros**: Por categoria ou apenas FAQ
- **Visualização**: Grid ou lista
- **Estatísticas**: Total de artigos, visualizações, taxa de ajuda
- **Categorias**: 8 categorias pré-configuradas com ícones
- **FAQ**: Seção dedicada para perguntas frequentes

## 📝 Para Adicionar Novos Artigos:
Admins e Analysts podem criar artigos clicando em "Novo Artigo" (em desenvolvimento)