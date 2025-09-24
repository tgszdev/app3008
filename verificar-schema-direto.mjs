/**
 * =====================================================
 * VERIFICAÇÃO DIRETA DE SCHEMA
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

async function verificarSchemaDireto() {
  console.log('🔍 VERIFICAÇÃO DIRETA DE SCHEMA');
  console.log('='.repeat(50));
  
  try {
    // 1. Testar inserção em contexts (sem description)
    console.log('\n1. Testando inserção em contexts...');
    try {
      const { data, error } = await supabase
        .from('contexts')
        .insert({
          name: 'Test Context',
          type: 'organization',
          slug: 'test-context',
          sla_hours: 24,
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Erro ao inserir em contexts: ${error.message}`);
      } else {
        console.log('✅ Inserção em contexts funcionou');
        // Limpar
        await supabase.from('contexts').delete().eq('id', data.id);
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
    
    // 2. Testar inserção em users (com password_hash)
    console.log('\n2. Testando inserção em users...');
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          user_type: 'matrix',
          password_hash: 'test-hash',
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Erro ao inserir em users: ${error.message}`);
      } else {
        console.log('✅ Inserção em users funcionou');
        // Limpar
        await supabase.from('users').delete().eq('id', data.id);
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
    
    // 3. Testar inserção em user_contexts (sem is_active)
    console.log('\n3. Testando inserção em user_contexts...');
    try {
      const { data, error } = await supabase
        .from('user_contexts')
        .insert({
          user_id: '2a33241e-ed38-48b5-9c84-e8c354ae9606',
          context_id: '6486088e-72ae-461b-8b03-32ca84918882',
          role: 'user'
        })
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Erro ao inserir em user_contexts: ${error.message}`);
      } else {
        console.log('✅ Inserção em user_contexts funcionou');
        // Limpar
        await supabase.from('user_contexts').delete().eq('id', data.id);
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
    
    // 4. Testar inserção em comments (sem created_by)
    console.log('\n4. Testando inserção em comments...');
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          ticket_id: 'test-ticket-id',
          content: 'Test comment',
          is_internal: false
        })
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Erro ao inserir em comments: ${error.message}`);
      } else {
        console.log('✅ Inserção em comments funcionou');
        // Limpar
        await supabase.from('comments').delete().eq('id', data.id);
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
    
    // 5. Testar inserção em kb_categories (com slug)
    console.log('\n5. Testando inserção em kb_categories...');
    try {
      const { data, error } = await supabase
        .from('kb_categories')
        .insert({
          name: 'Test Category',
          slug: 'test-category',
          description: 'Test category description',
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Erro ao inserir em kb_categories: ${error.message}`);
      } else {
        console.log('✅ Inserção em kb_categories funcionou');
        // Limpar
        await supabase.from('kb_categories').delete().eq('id', data.id);
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
    
    // 6. Testar inserção em kb_articles
    console.log('\n6. Testando inserção em kb_articles...');
    try {
      const { data, error } = await supabase
        .from('kb_articles')
        .insert({
          title: 'Test Article',
          content: 'Test article content',
          category_id: 'test-category-id',
          is_published: true
        })
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Erro ao inserir em kb_articles: ${error.message}`);
      } else {
        console.log('✅ Inserção em kb_articles funcionou');
        // Limpar
        await supabase.from('kb_articles').delete().eq('id', data.id);
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
    
    // 7. Testar inserção em timesheets
    console.log('\n7. Testando inserção em timesheets...');
    try {
      const { data, error } = await supabase
        .from('timesheets')
        .insert({
          user_id: '2a33241e-ed38-48b5-9c84-e8c354ae9606',
          work_date: new Date().toISOString().split('T')[0],
          hours_worked: 8.0,
          description: 'Test timesheet',
          is_approved: false
        })
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Erro ao inserir em timesheets: ${error.message}`);
      } else {
        console.log('✅ Inserção em timesheets funcionou');
        // Limpar
        await supabase.from('timesheets').delete().eq('id', data.id);
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
    
    // 8. Testar tabelas de configurações
    console.log('\n8. Testando tabelas de configurações...');
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela email_settings não existe: ${error.message}`);
      } else {
        console.log('✅ Tabela email_settings existe');
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
    
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela notification_settings não existe: ${error.message}`);
      } else {
        console.log('✅ Tabela notification_settings existe');
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ VERIFICAÇÃO DE SCHEMA CONCLUÍDA');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Erro durante verificação de schema:', error);
  }
}

// Executar verificação
verificarSchemaDireto();
