import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabase() {
  console.log('🔍 Verificando banco de dados...\n')
  
  // 1. Verificar tabela categories
  console.log('=== TABELA: categories ===')
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  if (catError) {
    console.error('Erro ao buscar categories:', catError)
  } else {
    console.log(`Total: ${categories.length} categorias\n`)
    categories.forEach(cat => {
      console.log(`📁 ${cat.name}`)
      console.log(`   ID: ${cat.id}`)
      console.log(`   Slug: ${cat.slug}`)
      console.log(`   Ícone: ${cat.icon}`)
      console.log(`   Cor: ${cat.color}`)
      console.log(`   Criado: ${new Date(cat.created_at).toLocaleDateString('pt-BR')}`)
      console.log('')
    })
  }
  
  // 2. Verificar quantidade de tickets por categoria
  console.log('\n=== TICKETS POR CATEGORIA ===')
  const { data: tickets, error: ticketError } = await supabase
    .from('tickets')
    .select('category_id, categories(name)')
  
  if (ticketError) {
    console.error('Erro ao buscar tickets:', ticketError)
  } else {
    const categoryCount: Record<string, number> = {}
    
    tickets.forEach((ticket: any) => {
      const categoryName = ticket.categories?.name || 'Sem Categoria'
      categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1
    })
    
    console.log(`Total de tickets: ${tickets.length}\n`)
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, count]) => {
        const percentage = ((count / tickets.length) * 100).toFixed(1)
        console.log(`${name}: ${count} tickets (${percentage}%)`)
      })
  }
  
  // 3. Verificar tickets por período
  console.log('\n=== TICKETS POR PERÍODO ===')
  
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  
  const { data: currentMonthTickets } = await supabase
    .from('tickets')
    .select('id')
    .gte('created_at', currentMonth.toISOString())
  
  const { data: lastMonthTickets } = await supabase
    .from('tickets')
    .select('id')
    .gte('created_at', lastMonth.toISOString())
    .lt('created_at', currentMonth.toISOString())
  
  const { data: twoMonthsAgoTickets } = await supabase
    .from('tickets')
    .select('id')
    .gte('created_at', twoMonthsAgo.toISOString())
    .lt('created_at', lastMonth.toISOString())
  
  console.log(`Mês atual (${currentMonth.toLocaleDateString('pt-BR')}): ${currentMonthTickets?.length || 0} tickets`)
  console.log(`Mês passado (${lastMonth.toLocaleDateString('pt-BR')}): ${lastMonthTickets?.length || 0} tickets`)
  console.log(`Dois meses atrás (${twoMonthsAgo.toLocaleDateString('pt-BR')}): ${twoMonthsAgoTickets?.length || 0} tickets`)
  
  // 4. Verificar estrutura da tabela
  console.log('\n=== ESTRUTURA DA TABELA categories ===')
  const { data: sampleCategory } = await supabase
    .from('categories')
    .select('*')
    .limit(1)
    .single()
  
  if (sampleCategory) {
    console.log('Campos disponíveis:')
    Object.keys(sampleCategory).forEach(key => {
      console.log(`- ${key}: ${typeof sampleCategory[key]}`)
    })
  }
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Verificação concluída!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error)
    process.exit(1)
  })