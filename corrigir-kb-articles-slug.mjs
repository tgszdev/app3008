/**
 * =====================================================
 * CORREÇÃO: KB ARTICLES SLUG OBRIGATÓRIO
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Função para gerar slug a partir do título
function gerarSlug(titulo) {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}

async function corrigirKbArticlesSlug() {
  console.log('🔧 CORREÇÃO: KB ARTICLES SLUG OBRIGATÓRIO');
  console.log('='.repeat(50));
  
  try {
    // 1. Verificar estrutura da tabela kb_articles
    console.log('\n1. Verificando estrutura da tabela kb_articles...');
    const { data: articles, error: articlesError } = await supabase
      .from('kb_articles')
      .select('*')
      .limit(5);
    
    if (articlesError) {
      console.log(`❌ Erro ao buscar artigos: ${articlesError.message}`);
    } else {
      console.log('✅ Estrutura da tabela kb_articles:');
      if (articles.length > 0) {
        console.log('  - Colunas disponíveis:', Object.keys(articles[0]));
      } else {
        console.log('  - Tabela vazia');
      }
    }
    
    // 2. Testar criação de artigo com slug
    console.log('\n2. Testando criação de artigo com slug...');
    const testArticle = {
      title: 'CTS - Artigo de Teste',
      content: 'Conteúdo do artigo de teste para CTS',
      slug: gerarSlug('CTS - Artigo de Teste'),
      category_id: 'test-category-id'
    };
    
    const { data: newArticle, error: createError } = await supabase
      .from('kb_articles')
      .insert(testArticle)
      .select()
      .single();
    
    if (createError) {
      console.log(`❌ Erro ao criar artigo: ${createError.message}`);
      
      // Se o erro for por category_id inexistente, tentar sem ele
      if (createError.message.includes('category_id')) {
        console.log('\n3. Tentando criar artigo sem category_id...');
        const testArticle2 = {
          title: 'CTS - Artigo de Teste 2',
          content: 'Conteúdo do artigo de teste para CTS',
          slug: gerarSlug('CTS - Artigo de Teste 2')
        };
        
        const { data: newArticle2, error: createError2 } = await supabase
          .from('kb_articles')
          .insert(testArticle2)
          .select()
          .single();
        
        if (createError2) {
          console.log(`❌ Erro ao criar artigo sem category_id: ${createError2.message}`);
        } else {
          console.log('✅ Artigo criado com sucesso!');
          console.log(`  - ID: ${newArticle2.id}`);
          console.log(`  - Title: ${newArticle2.title}`);
          console.log(`  - Slug: ${newArticle2.slug}`);
          
          // Limpar o artigo de teste
          const { error: deleteError } = await supabase
            .from('kb_articles')
            .delete()
            .eq('id', newArticle2.id);
          
          if (deleteError) {
            console.log(`⚠️ Erro ao limpar artigo de teste: ${deleteError.message}`);
          } else {
            console.log('✅ Artigo de teste removido');
          }
        }
      }
    } else {
      console.log('✅ Artigo criado com sucesso!');
      console.log(`  - ID: ${newArticle.id}`);
      console.log(`  - Title: ${newArticle.title}`);
      console.log(`  - Slug: ${newArticle.slug}`);
      
      // Limpar o artigo de teste
      const { error: deleteError } = await supabase
        .from('kb_articles')
        .delete()
        .eq('id', newArticle.id);
      
      if (deleteError) {
        console.log(`⚠️ Erro ao limpar artigo de teste: ${deleteError.message}`);
      } else {
        console.log('✅ Artigo de teste removido');
      }
    }
    
    // 3. Verificar se existem artigos sem slug
    console.log('\n4. Verificando artigos existentes...');
    const { data: existingArticles, error: existingError } = await supabase
      .from('kb_articles')
      .select('id, title, slug')
      .limit(10);
    
    if (existingError) {
      console.log(`❌ Erro ao buscar artigos existentes: ${existingError.message}`);
    } else {
      console.log('✅ Artigos existentes:');
      existingArticles.forEach(article => {
        console.log(`  - ${article.title} (slug: ${article.slug || 'SEM SLUG'})`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ CORREÇÃO CONCLUÍDA');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

// Executar correção
corrigirKbArticlesSlug();
