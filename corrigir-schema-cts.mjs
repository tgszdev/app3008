/**
 * =====================================================
 * CORREÇÃO DE SCHEMA IDENTIFICADOS NA CTS SUPER COMPLETA
 * =====================================================
 * 
 * Problemas identificados:
 * 1. Coluna 'description' não existe em 'contexts'
 * 2. Coluna 'password_hash' é obrigatória em 'users'
 * 3. Coluna 'is_active' não existe em 'user_contexts'
 * 4. Coluna 'created_by' não existe em 'comments'
 * 5. Coluna 'slug' é obrigatória em 'kb_categories'
 * 6. Coluna 'created_by' não existe em 'kb_articles'
 * 7. Coluna 'is_published' não existe em 'kb_articles'
 * 8. Coluna 'date' não existe em 'timesheets'
 * 9. Coluna 'is_approved' não existe em 'timesheets'
 * 10. Método 'group' não existe no Supabase
 * 11. Tabelas 'email_settings' e 'notification_settings' não existem
 * 
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function corrigirSchema() {
  console.log('🔧 INICIANDO CORREÇÃO DE SCHEMA IDENTIFICADOS NA CTS');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar estrutura da tabela 'contexts'
    console.log('\n1. Verificando estrutura da tabela contexts...');
    const { data: contextsColumns, error: contextsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'contexts')
      .eq('table_schema', 'public');
    
    if (contextsError) {
      console.log(`⚠️ Erro ao verificar contexts: ${contextsError.message}`);
    } else {
      console.log('✅ Colunas da tabela contexts:');
      contextsColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // 2. Verificar estrutura da tabela 'users'
    console.log('\n2. Verificando estrutura da tabela users...');
    const { data: usersColumns, error: usersError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');
    
    if (usersError) {
      console.log(`⚠️ Erro ao verificar users: ${usersError.message}`);
    } else {
      console.log('✅ Colunas da tabela users:');
      usersColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // 3. Verificar estrutura da tabela 'user_contexts'
    console.log('\n3. Verificando estrutura da tabela user_contexts...');
    const { data: userContextsColumns, error: userContextsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'user_contexts')
      .eq('table_schema', 'public');
    
    if (userContextsError) {
      console.log(`⚠️ Erro ao verificar user_contexts: ${userContextsError.message}`);
    } else {
      console.log('✅ Colunas da tabela user_contexts:');
      userContextsColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // 4. Verificar estrutura da tabela 'comments'
    console.log('\n4. Verificando estrutura da tabela comments...');
    const { data: commentsColumns, error: commentsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'comments')
      .eq('table_schema', 'public');
    
    if (commentsError) {
      console.log(`⚠️ Erro ao verificar comments: ${commentsError.message}`);
    } else {
      console.log('✅ Colunas da tabela comments:');
      commentsColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // 5. Verificar estrutura da tabela 'kb_categories'
    console.log('\n5. Verificando estrutura da tabela kb_categories...');
    const { data: kbCategoriesColumns, error: kbCategoriesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'kb_categories')
      .eq('table_schema', 'public');
    
    if (kbCategoriesError) {
      console.log(`⚠️ Erro ao verificar kb_categories: ${kbCategoriesError.message}`);
    } else {
      console.log('✅ Colunas da tabela kb_categories:');
      kbCategoriesColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // 6. Verificar estrutura da tabela 'kb_articles'
    console.log('\n6. Verificando estrutura da tabela kb_articles...');
    const { data: kbArticlesColumns, error: kbArticlesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'kb_articles')
      .eq('table_schema', 'public');
    
    if (kbArticlesError) {
      console.log(`⚠️ Erro ao verificar kb_articles: ${kbArticlesError.message}`);
    } else {
      console.log('✅ Colunas da tabela kb_articles:');
      kbArticlesColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // 7. Verificar estrutura da tabela 'timesheets'
    console.log('\n7. Verificando estrutura da tabela timesheets...');
    const { data: timesheetsColumns, error: timesheetsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'timesheets')
      .eq('table_schema', 'public');
    
    if (timesheetsError) {
      console.log(`⚠️ Erro ao verificar timesheets: ${timesheetsError.message}`);
    } else {
      console.log('✅ Colunas da tabela timesheets:');
      timesheetsColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // 8. Verificar tabelas de configurações
    console.log('\n8. Verificando tabelas de configurações...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%settings%');
    
    if (tablesError) {
      console.log(`⚠️ Erro ao verificar tabelas de configurações: ${tablesError.message}`);
    } else {
      console.log('✅ Tabelas de configurações encontradas:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICAÇÃO DE SCHEMA CONCLUÍDA');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Erro durante verificação de schema:', error);
  }
}

// Executar verificação
corrigirSchema();
