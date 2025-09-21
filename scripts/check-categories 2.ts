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

async function checkCategories() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
  
  if (error) {
    console.error('Erro:', error)
    return
  }
  
  console.log('Categorias existentes no banco:')
  categories?.forEach(cat => {
    console.log(`- ID: ${cat.id}`)
    console.log(`  Nome: ${cat.name}`)
    console.log(`  Ícone: ${cat.icon}`)
    console.log(`  Cor: ${cat.color}`)
    console.log('---')
  })
  
  // Adicionar categorias faltantes se necessário
  const requiredCategories = [
    { name: 'Hardware', slug: 'hardware', icon: 'cpu', color: '#3B82F6', description: 'Problemas com equipamentos físicos' },
    { name: 'Software', slug: 'software', icon: 'code', color: '#10B981', description: 'Problemas com programas e sistemas' },
    { name: 'Rede', slug: 'rede', icon: 'wifi', color: '#F59E0B', description: 'Problemas de conectividade e rede' },
    { name: 'Impressora', slug: 'impressora', icon: 'printer', color: '#8B5CF6', description: 'Problemas com impressoras e scanners' },
    { name: 'E-mail', slug: 'e-mail', icon: 'mail', color: '#EF4444', description: 'Problemas com correio eletrônico' },
    { name: 'Telefonia', slug: 'telefonia', icon: 'phone', color: '#14B8A6', description: 'Problemas com telefones e ramais' },
    { name: 'Segurança', slug: 'seguranca', icon: 'shield', color: '#F97316', description: 'Problemas de segurança e acesso' },
    { name: 'Outros', slug: 'outros', icon: 'folder', color: '#6B7280', description: 'Outros tipos de problemas' }
  ]
  
  const existingNames = categories?.map(c => c.name) || []
  const missingCategories = requiredCategories.filter(c => !existingNames.includes(c.name))
  
  if (missingCategories.length > 0) {
    console.log('\nCategorias faltantes que serão criadas:')
    for (const cat of missingCategories) {
      console.log(`- ${cat.name}`)
      const { error } = await supabase
        .from('categories')
        .insert(cat)
      
      if (error) {
        console.error(`Erro ao criar categoria ${cat.name}:`, error)
      } else {
        console.log(`✅ Categoria ${cat.name} criada com sucesso`)
      }
    }
  } else {
    console.log('\n✅ Todas as categorias necessárias já existem')
  }
}

checkCategories()
  .then(() => process.exit(0))
  .catch(console.error)