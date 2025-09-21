import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedTestTickets() {
  console.log('🚀 Iniciando criação de tickets de teste...')

  try {
    // 1. Buscar categorias existentes
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
    
    if (catError) {
      console.error('Erro ao buscar categorias:', catError)
      return
    }

    console.log(`✅ ${categories.length} categorias encontradas`)

    // 2. Buscar usuários existentes
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    if (userError) {
      console.error('Erro ao buscar usuários:', userError)
      return
    }

    console.log(`✅ ${users.length} usuários encontrados`)

    // 3. Definir tickets de teste com datas variadas
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Helper para criar data
    const createDate = (daysAgo: number) => {
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      return date.toISOString()
    }

    // Tickets para diferentes períodos
    const testTickets = [
      // === MÊS ATUAL (Dezembro 2024) - 30 tickets ===
      // Hardware - 8 tickets (26.7%)
      {
        title: 'PC não liga após queda de energia',
        description: 'Computador desktop não liga depois da queda de energia ontem à tarde.',
        category_name: 'Hardware',
        priority: 'high',
        status: 'open',
        created_at: createDate(2)
      },
      {
        title: 'Monitor com linhas verticais',
        description: 'Monitor apresentando linhas verticais coloridas na tela.',
        category_name: 'Hardware',
        priority: 'medium',
        status: 'in_progress',
        created_at: createDate(3)
      },
      {
        title: 'Teclado mecânico com teclas travando',
        description: 'Várias teclas do teclado mecânico estão travando ou não respondendo.',
        category_name: 'Hardware',
        priority: 'low',
        status: 'resolved',
        created_at: createDate(5)
      },
      {
        title: 'HD fazendo ruído estranho',
        description: 'HD externo fazendo barulho de click repetidamente.',
        category_name: 'Hardware',
        priority: 'critical',
        status: 'in_progress',
        created_at: createDate(1)
      },
      {
        title: 'Memória RAM com defeito',
        description: 'Computador reiniciando sozinho, suspeita de problema na memória.',
        category_name: 'Hardware',
        priority: 'high',
        status: 'open',
        created_at: createDate(4)
      },
      {
        title: 'Mouse sem fio não conecta',
        description: 'Mouse wireless não está sendo reconhecido pelo sistema.',
        category_name: 'Hardware',
        priority: 'low',
        status: 'resolved',
        created_at: createDate(7)
      },
      {
        title: 'Cooler do processador com ruído',
        description: 'Cooler fazendo muito barulho e PC esquentando.',
        category_name: 'Hardware',
        priority: 'high',
        status: 'open',
        created_at: createDate(0)
      },
      {
        title: 'Placa de vídeo com artefatos',
        description: 'Tela apresentando artefatos gráficos em jogos e vídeos.',
        category_name: 'Hardware',
        priority: 'critical',
        status: 'open',
        created_at: createDate(2)
      },

      // Rede - 6 tickets (20%)
      {
        title: 'WiFi caindo constantemente',
        description: 'Conexão WiFi desconectando a cada 10 minutos.',
        category_name: 'Rede',
        priority: 'high',
        status: 'open',
        created_at: createDate(1)
      },
      {
        title: 'Internet muito lenta no setor financeiro',
        description: 'Velocidade de internet extremamente baixa apenas no financeiro.',
        category_name: 'Rede',
        priority: 'medium',
        status: 'in_progress',
        created_at: createDate(2)
      },
      {
        title: 'Sem acesso à rede interna',
        description: 'Não consigo acessar os arquivos compartilhados na rede.',
        category_name: 'Rede',
        priority: 'high',
        status: 'resolved',
        created_at: createDate(6)
      },
      {
        title: 'VPN não conecta',
        description: 'Erro ao tentar conectar na VPN corporativa.',
        category_name: 'Rede',
        priority: 'critical',
        status: 'open',
        created_at: createDate(0)
      },
      {
        title: 'Switch com portas queimadas',
        description: 'Switch do departamento com 3 portas sem funcionar.',
        category_name: 'Rede',
        priority: 'high',
        status: 'in_progress',
        created_at: createDate(3)
      },
      {
        title: 'Cabo de rede danificado',
        description: 'Cabo de rede da estação 42 está rompido.',
        category_name: 'Rede',
        priority: 'low',
        status: 'resolved',
        created_at: createDate(8)
      },

      // Impressora - 5 tickets (16.7%)
      {
        title: 'Impressora não puxa papel',
        description: 'Impressora HP não está puxando papel da bandeja.',
        category_name: 'Impressora',
        priority: 'medium',
        status: 'open',
        created_at: createDate(1)
      },
      {
        title: 'Impressão saindo borrada',
        description: 'Todas as impressões estão saindo com manchas.',
        category_name: 'Impressora',
        priority: 'low',
        status: 'in_progress',
        created_at: createDate(4)
      },
      {
        title: 'Toner acabando',
        description: 'Toner da impressora do RH está no fim.',
        category_name: 'Impressora',
        priority: 'low',
        status: 'resolved',
        created_at: createDate(5)
      },
      {
        title: 'Impressora em rede não encontrada',
        description: 'Não consigo encontrar a impressora de rede no meu computador.',
        category_name: 'Impressora',
        priority: 'medium',
        status: 'open',
        created_at: createDate(2)
      },
      {
        title: 'Scanner não funciona',
        description: 'Função de scanner da multifuncional parou de funcionar.',
        category_name: 'Impressora',
        priority: 'medium',
        status: 'resolved',
        created_at: createDate(7)
      },

      // Software - 7 tickets (23.3%)
      {
        title: 'Excel travando ao abrir planilhas grandes',
        description: 'Excel trava sempre que tento abrir arquivos maiores que 10MB.',
        category_name: 'Software',
        priority: 'high',
        status: 'open',
        created_at: createDate(0)
      },
      {
        title: 'Sistema ERP com erro de login',
        description: 'Não consigo fazer login no sistema ERP desde ontem.',
        category_name: 'Software',
        priority: 'critical',
        status: 'in_progress',
        created_at: createDate(1)
      },
      {
        title: 'Windows Update falhando',
        description: 'Atualização do Windows falha com erro 0x80070002.',
        category_name: 'Software',
        priority: 'medium',
        status: 'resolved',
        created_at: createDate(6)
      },
      {
        title: 'Antivírus bloqueando aplicativo',
        description: 'Antivírus está bloqueando o sistema de vendas.',
        category_name: 'Software',
        priority: 'high',
        status: 'open',
        created_at: createDate(2)
      },
      {
        title: 'Chrome não abre',
        description: 'Google Chrome fecha imediatamente após abrir.',
        category_name: 'Software',
        priority: 'medium',
        status: 'resolved',
        created_at: createDate(8)
      },
      {
        title: 'Licença Office expirada',
        description: 'Licença do Microsoft Office expirou e não consigo trabalhar.',
        category_name: 'Software',
        priority: 'high',
        status: 'in_progress',
        created_at: createDate(3)
      },
      {
        title: 'Sistema lento após atualização',
        description: 'Computador ficou muito lento após última atualização.',
        category_name: 'Software',
        priority: 'medium',
        status: 'open',
        created_at: createDate(4)
      },

      // E-mail - 4 tickets (13.3%)
      {
        title: 'Não recebo e-mails externos',
        description: 'E-mails de clientes não estão chegando na minha caixa.',
        category_name: 'E-mail',
        priority: 'critical',
        status: 'open',
        created_at: createDate(0)
      },
      {
        title: 'Caixa de entrada cheia',
        description: 'Mensagem de caixa de entrada cheia ao enviar e-mails.',
        category_name: 'E-mail',
        priority: 'medium',
        status: 'resolved',
        created_at: createDate(5)
      },
      {
        title: 'E-mails indo para spam',
        description: 'Todos os e-mails que envio estão indo para spam dos destinatários.',
        category_name: 'E-mail',
        priority: 'high',
        status: 'in_progress',
        created_at: createDate(2)
      },
      {
        title: 'Outlook não sincroniza',
        description: 'Outlook não está sincronizando com o servidor.',
        category_name: 'E-mail',
        priority: 'high',
        status: 'open',
        created_at: createDate(1)
      },

      // === MÊS ANTERIOR (Novembro 2024) - 15 tickets ===
      {
        title: 'Servidor de arquivos inacessível',
        description: 'Não consigo acessar o servidor de arquivos há 2 dias.',
        category_name: 'Rede',
        priority: 'critical',
        status: 'resolved',
        created_at: createDate(35)
      },
      {
        title: 'Backup não está rodando',
        description: 'Sistema de backup automático parou de funcionar.',
        category_name: 'Software',
        priority: 'critical',
        status: 'resolved',
        created_at: createDate(40)
      },
      {
        title: 'Telefone IP sem áudio',
        description: 'Telefone IP não transmite áudio nas ligações.',
        category_name: 'Telefonia',
        priority: 'high',
        status: 'resolved',
        created_at: createDate(38)
      },
      {
        title: 'Câmera de segurança offline',
        description: 'Câmera da entrada principal está offline.',
        category_name: 'Segurança',
        priority: 'high',
        status: 'resolved',
        created_at: createDate(42)
      },
      {
        title: 'Notebook com tela azul',
        description: 'Notebook apresentando tela azul da morte frequentemente.',
        category_name: 'Hardware',
        priority: 'critical',
        status: 'resolved',
        created_at: createDate(45)
      },
      {
        title: 'Impressora travando papel',
        description: 'Impressora travando todas as folhas.',
        category_name: 'Impressora',
        priority: 'medium',
        status: 'resolved',
        created_at: createDate(37)
      },
      {
        title: 'Sistema de ponto não registra',
        description: 'Sistema de ponto eletrônico não está registrando entradas.',
        category_name: 'Software',
        priority: 'critical',
        status: 'resolved',
        created_at: createDate(36)
      },
      {
        title: 'Firewall bloqueando sites',
        description: 'Firewall bloqueando sites necessários para trabalho.',
        category_name: 'Segurança',
        priority: 'medium',
        status: 'resolved',
        created_at: createDate(41)
      },
      {
        title: 'Ramal não recebe ligações',
        description: 'Ramal 2045 não recebe ligações externas.',
        category_name: 'Telefonia',
        priority: 'high',
        status: 'resolved',
        created_at: createDate(39)
      },
      {
        title: 'Pasta compartilhada sem permissão',
        description: 'Sem permissão para acessar pasta do departamento.',
        category_name: 'Outros',
        priority: 'medium',
        status: 'resolved',
        created_at: createDate(43)
      },
      {
        title: 'Monitor não liga',
        description: 'Monitor Dell não liga mesmo com cabo ok.',
        category_name: 'Hardware',
        priority: 'high',
        status: 'resolved',
        created_at: createDate(44)
      },
      {
        title: 'WiFi sem sinal no 3º andar',
        description: 'Sinal de WiFi muito fraco ou inexistente no terceiro andar.',
        category_name: 'Rede',
        priority: 'high',
        status: 'resolved',
        created_at: createDate(46)
      },
      {
        title: 'Toner da impressora vazando',
        description: 'Toner vazando e sujando as impressões.',
        category_name: 'Impressora',
        priority: 'high',
        status: 'cancelled',
        created_at: createDate(47)
      },
      {
        title: 'E-mail com anexos não envia',
        description: 'E-mails com anexos maiores que 5MB não são enviados.',
        category_name: 'E-mail',
        priority: 'medium',
        status: 'resolved',
        created_at: createDate(48)
      },
      {
        title: 'Computador reiniciando sozinho',
        description: 'PC reinicia aleatoriamente durante o uso.',
        category_name: 'Hardware',
        priority: 'critical',
        status: 'resolved',
        created_at: createDate(50)
      },

      // === DOIS MESES ATRÁS (Outubro 2024) - 10 tickets ===
      {
        title: 'Sistema de vendas fora do ar',
        description: 'Sistema de vendas completamente inacessível.',
        category_name: 'Software',
        priority: 'critical',
        status: 'resolved',
        created_at: createDate(65)
      },
      {
        title: 'Acesso remoto não funciona',
        description: 'TeamViewer não conecta para acesso remoto.',
        category_name: 'Software',
        priority: 'high',
        status: 'resolved',
        created_at: createDate(70)
      },
      {
        title: 'Alarme disparando sozinho',
        description: 'Alarme de segurança disparando sem motivo.',
        category_name: 'Segurança',
        priority: 'high',
        status: 'cancelled',
        created_at: createDate(68)
      },
      {
        title: 'Central telefônica com problemas',
        description: 'Central telefônica derrubando ligações.',
        category_name: 'Telefonia',
        priority: 'critical',
        status: 'resolved',
        created_at: createDate(72)
      },
      {
        title: 'Ar condicionado do servidor',
        description: 'Ar condicionado da sala de servidores parou.',
        category_name: 'Outros',
        priority: 'critical',
        status: 'resolved',
        created_at: createDate(75)
      },
      {
        title: 'Porta USB não reconhece dispositivos',
        description: 'Nenhuma porta USB do computador funciona.',
        category_name: 'Hardware',
        priority: 'high',
        status: 'resolved',
        created_at: createDate(66)
      },
      {
        title: 'Roteador travando',
        description: 'Roteador principal trava e precisa ser reiniciado várias vezes.',
        category_name: 'Rede',
        priority: 'critical',
        status: 'resolved',
        created_at: createDate(69)
      },
      {
        title: 'Multifuncional não escaneia',
        description: 'Função scanner da multifuncional com erro.',
        category_name: 'Impressora',
        priority: 'medium',
        status: 'resolved',
        created_at: createDate(71)
      },
      {
        title: 'Conta de e-mail hackeada',
        description: 'Conta de e-mail enviando spam automaticamente.',
        category_name: 'E-mail',
        priority: 'critical',
        status: 'resolved',
        created_at: createDate(73)
      },
      {
        title: 'Webcam não funciona',
        description: 'Webcam não é reconhecida em videoconferências.',
        category_name: 'Hardware',
        priority: 'low',
        status: 'resolved',
        created_at: createDate(74)
      }
    ]

    // 4. Criar tickets no banco
    let successCount = 0
    let errorCount = 0

    for (const ticketData of testTickets) {
      // Encontrar categoria
      const category = categories.find(c => c.name === ticketData.category_name)
      if (!category) {
        console.warn(`⚠️ Categoria não encontrada: ${ticketData.category_name}`)
        continue
      }

      // Selecionar usuário aleatório
      const randomUser = users[Math.floor(Math.random() * users.length)]

      // Gerar número do ticket (menor para caber no integer)
      const ticketNumber = `${Math.floor(Math.random() * 999999) + 100000}`

      // Criar ticket
      const { error } = await supabase
        .from('tickets')
        .insert({
          ticket_number: ticketNumber,
          title: ticketData.title,
          description: ticketData.description,
          status: ticketData.status,
          priority: ticketData.priority,
          category_id: category.id,
          created_by: randomUser.id,
          assigned_to: ticketData.status === 'in_progress' ? randomUser.id : null,
          created_at: ticketData.created_at,
          updated_at: ticketData.status === 'resolved' ? 
            new Date(new Date(ticketData.created_at).getTime() + Math.random() * 48 * 60 * 60 * 1000).toISOString() : 
            ticketData.created_at
        })

      if (error) {
        console.error(`❌ Erro ao criar ticket: ${ticketData.title}`, error)
        errorCount++
      } else {
        console.log(`✅ Ticket criado: ${ticketData.title} (${ticketData.category_name} - ${ticketData.status})`)
        successCount++
      }
    }

    console.log('\n📊 Resumo da criação de tickets:')
    console.log(`✅ Tickets criados com sucesso: ${successCount}`)
    console.log(`❌ Erros ao criar tickets: ${errorCount}`)
    console.log(`📝 Total de tickets processados: ${testTickets.length}`)
    
    // 5. Mostrar estatísticas
    console.log('\n📈 Distribuição esperada para o mês atual:')
    console.log('- Hardware: 8 tickets (26.7%)')
    console.log('- Software: 7 tickets (23.3%)')
    console.log('- Rede: 6 tickets (20%)')
    console.log('- Impressora: 5 tickets (16.7%)')
    console.log('- E-mail: 4 tickets (13.3%)')
    console.log('Total mês atual: 30 tickets')
    
    console.log('\n📅 Distribuição por período:')
    console.log('- Mês atual (Dezembro): 30 tickets')
    console.log('- Mês anterior (Novembro): 15 tickets')
    console.log('- Dois meses atrás (Outubro): 10 tickets')
    console.log('Total geral: 55 tickets')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar seed
seedTestTickets()
  .then(() => {
    console.log('\n✨ Processo de seed concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })