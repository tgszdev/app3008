'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  Send,
  X,
  Calendar,
  Flag,
  Tag,
  User,
  FileText,
  Loader2,
  Lock,
  Eye,
} from 'lucide-react'
import { getIcon } from '@/lib/icons'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import axios from 'axios'
import toast from 'react-hot-toast'

interface UserData {
  id: string
  name: string
  email: string
  role: string
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  is_active: boolean
}

export default function NewTicketPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [analysts, setAnalysts] = useState<UserData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category_id: '', // Mudando de category para category_id
    assigned_to: '',
    due_date: '',
    is_internal: false, // Novo campo para tickets internos
  })

  // Buscar lista de analistas e categorias
  useEffect(() => {
    fetchAnalysts()
    fetchCategories()
  }, [])

  const fetchAnalysts = async () => {
    try {
      const response = await axios.get('/api/users')
      const analystUsers = response.data.filter((user: UserData) => 
        user.role === 'analyst' || user.role === 'admin'
      )
      setAnalysts(analystUsers)
    } catch (error) {
      console.error('Erro ao buscar analistas:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await axios.get('/api/categories?active_only=true')
      setCategories(response.data)
      
      // Selecionar a primeira categoria ativa como padrão
      if (response.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: response.data[0].id }))
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description) {
      toast.error('Título e descrição são obrigatórios!')
      return
    }

    if (!formData.category_id) {
      toast.error('Por favor, selecione uma categoria!')
      return
    }

    if (!session?.user?.id) {
      toast.error('Você precisa estar logado para criar um chamado')
      return
    }

    setLoading(true)

    try {
      // Encontrar a categoria selecionada para enviar o slug também (compatibilidade)
      const selectedCategory = categories.find(c => c.id === formData.category_id)
      
      const ticketData = {
        ...formData,
        category: selectedCategory?.slug || 'general', // Manter compatibilidade
        created_by: session.user.id,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
      }

      const response = await axios.post('/api/tickets', ticketData)
      
      console.log('=== DEBUG CRIAÇÃO DE TICKET ===')
      console.log('Resposta da API:', response.data)
      console.log('ID do ticket criado:', response.data.id)
      console.log('Categoria ID:', formData.category_id)
      console.log('Categoria slug:', selectedCategory?.slug)
      console.log('Redirecionando para:', `/dashboard/tickets/${response.data.id}`)
      
      toast.success('Chamado criado com sucesso!')
      router.push(`/dashboard/tickets/${response.data.id}`)
    } catch (error: any) {
      console.error('Erro ao criar chamado:', error)
      toast.error(error.response?.data?.error || 'Erro ao criar chamado')
    } finally {
      setLoading(false)
    }
  }

  // Função para obter o ícone da categoria selecionada
  const getSelectedCategoryIcon = () => {
    const category = categories.find(c => c.id === formData.category_id)
    if (category) {
      const Icon = getIcon(category.icon)
      return (
        <div
          className="inline-flex items-center justify-center w-5 h-5 rounded"
          style={{ backgroundColor: category.color + '20', color: category.color }}
        >
          <Icon size={14} />
        </div>
      )
    }
    return <Tag className="inline h-4 w-4" />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Chamados
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Novo Chamado
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Preencha as informações abaixo para criar um novo chamado de suporte
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Título do Chamado *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva brevemente o problema ou solicitação"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição Detalhada *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Forneça o máximo de detalhes possível sobre o problema ou solicitação..."
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Quanto mais detalhes você fornecer, mais rápido poderemos ajudar
            </p>
          </div>

          {/* Grid for other fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Flag className="inline h-4 w-4 mr-1" />
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Baixa - Pode esperar</option>
                <option value="medium">Média - Importante mas não urgente</option>
                <option value="high">Alta - Precisa de atenção rápida</option>
                <option value="critical">Crítica - Urgente, impacta operações</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="inline-flex items-center gap-1">
                  {getSelectedCategoryIcon()}
                  <span className="ml-1">Categoria *</span>
                </span>
              </label>
              {loadingCategories ? (
                <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="ml-2 text-sm text-gray-500">Carregando categorias...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="w-full px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  Nenhuma categoria disponível. Contate o administrador.
                </div>
              ) : (
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} {category.description && `- ${category.description.substring(0, 50)}...`}
                    </option>
                  ))}
                </select>
              )}
              {formData.category_id && (
                <div className="mt-2 flex items-center gap-2">
                  {(() => {
                    const selectedCategory = categories.find(c => c.id === formData.category_id)
                    return selectedCategory ? (
                      <>
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: selectedCategory.color }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {selectedCategory.description}
                        </span>
                      </>
                    ) : null
                  })()}
                </div>
              )}
            </div>

            {/* Assigned To - Only visible for admin and analyst */}
            {(session?.user?.role === 'admin' || session?.user?.role === 'analyst') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Atribuir para (opcional)
                </label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um analista...</option>
                  {analysts.map((analyst) => (
                    <option key={analyst.id} value={analyst.id}>
                      {analyst.name} ({analyst.role === 'admin' ? 'Admin' : 'Analista'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Due Date - Only visible for admin and analyst */}
            {(session?.user?.role === 'admin' || session?.user?.role === 'analyst') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Data de Vencimento (opcional)
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
          
          {/* Internal Ticket Checkbox - Only visible for admin and analyst */}
          {(session?.user?.role === 'admin' || session?.user?.role === 'analyst') && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_internal}
                  onChange={(e) => setFormData({ ...formData, is_internal: e.target.checked })}
                  className="mt-1 rounded border-gray-300 text-amber-600 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Ticket Interno
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Marque esta opção para tornar o ticket visível apenas para administradores e analistas. 
                    Usuários comuns não poderão ver este ticket.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/tickets"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="inline h-4 w-4 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || loadingCategories}
            className={cn(
              "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center",
              (loading || loadingCategories) && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Criar Chamado
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 Dicas para um atendimento mais rápido:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Seja específico no título do chamado</li>
          <li>• Inclua mensagens de erro exatas, se houver</li>
          <li>• Informe quando o problema começou</li>
          <li>• Descreva o que você estava tentando fazer</li>
          <li>• Selecione a categoria apropriada</li>
          <li>• Defina a prioridade adequada</li>
        </ul>
      </div>
    </div>
  )
}