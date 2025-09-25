import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function solucaoAlternativaCategorias() {
  console.log('🔧 SOLUÇÃO ALTERNATIVA - CATEGORIAS')
  console.log('=' .repeat(50))

  try {
    // 1. Verificar usuário agro
    console.log('\n1️⃣ VERIFICANDO USUÁRIO AGRO...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }

    console.log('✅ Usuário encontrado:', user.email)

    // 2. Criar categorias globais temporárias
    console.log('\n2️⃣ CRIANDO CATEGORIAS GLOBAIS TEMPORÁRIAS...')
    
    const categoriasGlobais = [
      {
        name: 'Suporte Agro',
        slug: 'suporte-agro-global',
        description: 'Categoria global para suporte agro',
        is_global: true,
        is_active: true,
        display_order: 1
      },
      {
        name: 'Agro Financeiro',
        slug: 'agro-financeiro-global',
        description: 'Categoria global para agro financeiro',
        is_global: true,
        is_active: true,
        display_order: 2
      }
    ]

    for (const categoria of categoriasGlobais) {
      const { data: existing, error: existingError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categoria.slug)
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        console.log('⚠️ Erro ao verificar categoria existente:', existingError.message)
        continue
      }

      if (existing) {
        console.log(`✅ Categoria ${categoria.name} já existe`)
        continue
      }

      const { data: newCategory, error: createError } = await supabase
        .from('categories')
        .insert(categoria)
        .select()
        .single()

      if (createError) {
        console.error(`❌ Erro ao criar categoria ${categoria.name}:`, createError.message)
        continue
      }

      console.log(`✅ Categoria ${categoria.name} criada com sucesso`)
    }

    // 3. Verificar categorias globais criadas
    console.log('\n3️⃣ VERIFICANDO CATEGORIAS GLOBAIS CRIADAS...')
    const { data: globalCategories, error: globalError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)

    if (globalError) {
      console.error('❌ Erro ao buscar categorias globais:', globalError)
      return
    }

    console.log('✅ Categorias globais encontradas:', globalCategories.length)
    globalCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`)
    })

    // 4. Testar autenticação com JWT
    console.log('\n4️⃣ TESTANDO AUTENTICAÇÃO COM JWT...')
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    // Testar categorias globais com JWT
    const { data: authCategories, error: authError } = await supabaseAuth
      .from('categories')
      .select('*')
      .eq('is_global', true)

    if (authError) {
      console.error('❌ Erro na autenticação JWT para categorias:', authError)
    } else {
      console.log('✅ Categorias encontradas com JWT:', authCategories.length)
      authCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`)
      })
    }

    console.log('\n🎯 SOLUÇÃO ALTERNATIVA CONCLUÍDA!')
    console.log('=' .repeat(50))
    console.log('📋 RESULTADO:')
    console.log(`- Categorias globais criadas: ${globalCategories.length}`)
    console.log(`- Categorias acessíveis com JWT: ${authCategories?.length || 0}`)
    
    if (authCategories && authCategories.length > 0) {
      console.log('✅ SOLUÇÃO FUNCIONANDO - Categorias globais devem aparecer no frontend')
    } else {
      console.log('❌ SOLUÇÃO NÃO FUNCIONOU - Ainda há problemas de RLS')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

solucaoAlternativaCategorias()
