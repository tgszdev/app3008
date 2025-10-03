'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import { useOrganization } from '@/contexts/OrganizationContext'
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
  Paperclip,
  Upload,
  File,
  Trash2,
  Building2,
} from 'lucide-react'
import { getIcon } from '@/lib/icons'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import axios from 'axios'
import toast from 'react-hot-toast'
import RichTextEditor from '@/components/RichTextEditor'

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
  const { isMatrixUser, availableContexts } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [analysts, setAnalysts] = useState<UserData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [permissionsError, setPermissionsError] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category_id: '',
    assigned_to: '',
    due_date: '',
    is_internal: false,
    context_id: '', // Adicionar campo para selecionar cliente
  })
  
  // Estados para upload de arquivos
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Use the permissions hook
  const { hasPermission } = usePermissions()
  
  // Check permissions
  const canAssignTickets = hasPermission('tickets_assign')
  const canEditAllTickets = hasPermission('tickets_edit_all')
  const canCreateTickets = hasPermission('tickets_create')

  // Buscar lista de analistas e categorias
  useEffect(() => {
    fetchAnalysts()
    fetchCategories()
  }, [session])

  const fetchAnalysts = async () => {
    try {
      const response = await axios.get('/api/users')
      const analystUsers = response.data.filter((user: UserData) => 
        user.role === 'analyst' || user.role === 'admin'
      )
      setAnalysts(analystUsers)
    } catch (error) {
    }
  }

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await axios.get('/api/categories/dynamic?active_only=true')
      setCategories(response.data)
      
      if (response.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: response.data[0].id }))
      }
    } catch (error) {
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const maxSize = 10 * 1024 * 1024
    const validFiles: File[] = []
    
    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        toast.error(`Arquivo "${file.name}" muito grande. Máximo permitido: 10MB`)
      } else {
        validFiles.push(file)
      }
    })

    const totalFiles = selectedFiles.length + validFiles.length
    if (totalFiles > 5) {
      toast.error('Máximo de 5 arquivos permitidos')
      return
    }

    setSelectedFiles([...selectedFiles, ...validFiles])
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
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

    // Validar seleção de cliente para usuários matriz
    if (isMatrixUser && availableContexts.length > 0 && !formData.context_id) {
      toast.error('Por favor, selecione o cliente para este chamado!')
      return
    }

    if (!session?.user?.id) {
      toast.error('Você precisa estar logado para criar um chamado')
      return
    }

    setLoading(true)

    try {
      const selectedCategory = categories.find(c => c.id === formData.category_id)
      
      const ticketData = {
        ...formData,
        category: selectedCategory?.slug || 'general',
        created_by: session.user.id,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
        context_id: formData.context_id || null, // Incluir context_id selecionado
      }

      const response = await axios.post('/api/tickets', ticketData)
      const ticketId = response.data.id
      
      if (selectedFiles.length > 0) {
        setUploadingFiles(true)
        toast(`Enviando ${selectedFiles.length} arquivo(s)...`, {
          icon: '📎',
        })
        
        try {
          const uploadPromises = selectedFiles.map(async (file) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('ticketId', ticketId)
            formData.append('userId', session.user.id || '')
            
            return axios.post('/api/tickets/upload', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            })
          })
          
          const results = await Promise.allSettled(uploadPromises)
          
          const successCount = results.filter(r => r.status === 'fulfilled').length
          const failCount = results.filter(r => r.status === 'rejected').length
          
          if (successCount > 0) {
            toast.success(`${successCount} arquivo(s) anexado(s) com sucesso!`)
          }
          if (failCount > 0) {
            toast.error(`${failCount} arquivo(s) falharam no upload`)
          }
        } catch (uploadError) {
          toast.error('Alguns arquivos não puderam ser anexados, mas o ticket foi criado')
        }
      }
      
      toast.success('Chamado criado com sucesso!')
      router.push(`/dashboard/tickets/${ticketId}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar chamado')
    } finally {
      setLoading(false)
      setUploadingFiles(false)
    }
  }

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

  if (permissionsError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            Aviso de Permissões
          </h2>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            O sistema de permissões está sendo carregado. Por favor, aguarde ou recarregue a página.
          </p>
        </div>
      </div>
    )
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva brevemente o problema ou solicitação"
              required
            />
          </div>

          {/* Description - Rich Text Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição Detalhada *
            </label>
            <RichTextEditor
              content={formData.description}
              onChange={(content) => setFormData({ ...formData, description: content })}
              placeholder="Forneça o máximo de detalhes possível sobre o problema ou solicitação... Você pode adicionar imagens, links e formatação!"
              minHeight="300px"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <FileText className="w-3 h-3" />
              Você pode adicionar imagens, usar formatação e incluir links para melhor descrever o problema
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="ml-2 text-sm text-gray-500">Carregando categorias...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="w-full px-4 py-2 border border-red-300 dark:border-red-600 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  Nenhuma categoria disponível. Contate o administrador.
                </div>
              ) : (
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Client Selector - Only for matrix users with multi-client access */}
            {isMatrixUser && availableContexts && availableContexts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Cliente *
                </label>
                <select
                  value={formData.context_id}
                  onChange={(e) => setFormData({ ...formData, context_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione o cliente...</option>
                  {availableContexts
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((context) => (
                      <option key={context.id} value={context.id}>
                        {context.name} {context.type === 'organization' ? '(Cliente)' : '(Dept)'}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Assigned To - Only visible for users with permission */}
            {canAssignTickets && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Atribuir para (opcional)
                </label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um responsável...</option>
                  {analysts.map((analyst) => (
                    <option key={analyst.id} value={analyst.id}>
                      {analyst.name} ({analyst.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Due Date - Only visible for users with permission */}
            {canAssignTickets && (
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
          
          {/* Internal Ticket Checkbox */}
          {canEditAllTickets && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
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
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* File Upload Section */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Paperclip className="inline h-4 w-4 mr-1" />
              Anexar Arquivos (opcional)
            </label>
            
            {/* Upload Area */}
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.zip"
                disabled={loading || selectedFiles.length >= 5}
              />
              <label
                htmlFor="file-upload"
                className={cn(
                  "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors",
                  selectedFiles.length >= 5 
                    ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className={cn(
                    "w-8 h-8 mb-2",
                    selectedFiles.length >= 5 
                      ? "text-gray-400 dark:text-gray-600" 
                      : "text-gray-400 dark:text-gray-500"
                  )} />
                  <p className={cn(
                    "mb-2 text-sm",
                    selectedFiles.length >= 5 
                      ? "text-gray-400 dark:text-gray-600" 
                      : "text-gray-500 dark:text-gray-400"
                  )}>
                    {selectedFiles.length >= 5 
                      ? "Limite máximo de arquivos atingido" 
                      : (
                        <>
                          <span className="font-semibold">Clique para anexar</span> ou arraste arquivos aqui
                        </>
                      )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedFiles.length >= 5 
                      ? "Remova arquivos para adicionar novos" 
                      : `Máximo 10MB por arquivo • ${5 - selectedFiles.length} arquivo(s) restante(s)`}
                  </p>
                </div>
              </label>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Arquivos selecionados ({selectedFiles.length}/5):
                </p>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Formatos aceitos: Imagens, PDF, DOC, DOCX, TXT, XLS, XLSX, ZIP
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/tickets"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="inline h-4 w-4 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || loadingCategories || uploadingFiles}
            className={cn(
              "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-colors flex items-center",
              (loading || loadingCategories || uploadingFiles) && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading || uploadingFiles ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadingFiles ? 'Enviando arquivos...' : 'Criando...'}
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
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
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