'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import {
  ArrowLeft,
  Save,
  Eye,
  FileText,
  Tag,
  Loader2,
  Plus,
  X,
  Info,
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Code,
  Heading,
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  slug: string
}

export default function NewArticlePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [preview, setPreview] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category_id: '',
    status: 'draft',
    is_featured: false,
    is_faq: false,
    meta_keywords: [] as string[],
    meta_description: ''
  })

  const { hasPermission } = usePermissions()
  
  // Verificar permissão para criar artigos
  const canCreatePermission = hasPermission('kb_create')
  
  // Fallback para compatibilidade
  const isAdmin = (session?.user as any)?.role === 'admin'
  const isAnalyst = (session?.user as any)?.role === 'analyst'
  const canCreate = canCreatePermission || isAdmin || isAnalyst

  // Verificar permissão
  useEffect(() => {
    if (session && !canCreate) {
      toast.error('Você não tem permissão para criar artigos')
      router.push('/dashboard/knowledge-base')
    }
  }, [session, canCreate])

  // Buscar categorias
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/knowledge-base/categories')
      setCategories(response.data.categories || [])
    } catch (error) {
      toast.error('Erro ao carregar categorias')
    }
  }

  // Gerar slug automaticamente
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.title])

  // Adicionar tag
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  // Remover tag
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  // Inserir formatação no conteúdo
  const insertFormatting = (format: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = formData.content.substring(start, end)
    let newText = ''

    switch (format) {
      case 'bold':
        newText = `**${selectedText || 'texto em negrito'}**`
        break
      case 'italic':
        newText = `*${selectedText || 'texto em itálico'}*`
        break
      case 'link':
        newText = `[${selectedText || 'texto do link'}](url)`
        break
      case 'h1':
        newText = `\n# ${selectedText || 'Título'}\n`
        break
      case 'h2':
        newText = `\n## ${selectedText || 'Subtítulo'}\n`
        break
      case 'h3':
        newText = `\n### ${selectedText || 'Seção'}\n`
        break
      case 'ul':
        newText = `\n- ${selectedText || 'Item da lista'}\n`
        break
      case 'ol':
        newText = `\n1. ${selectedText || 'Item numerado'}\n`
        break
      case 'code':
        if (selectedText.includes('\n')) {
          newText = `\n\`\`\`\n${selectedText || 'código'}\n\`\`\`\n`
        } else {
          newText = `\`${selectedText || 'código'}\``
        }
        break
    }

    const newContent = 
      formData.content.substring(0, start) +
      newText +
      formData.content.substring(end)

    setFormData({ ...formData, content: newContent })

    // Reposicionar cursor
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = start + newText.length
      textarea.selectionEnd = start + newText.length
    }, 0)
  }

  // Salvar artigo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/knowledge-base/articles', {
        ...formData,
        tags,
        meta_keywords: tags
      })

      toast.success('Artigo criado com sucesso!')
      router.push(`/dashboard/knowledge-base/article/${response.data.slug}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar artigo')
    } finally {
      setLoading(false)
    }
  }

  // Renderizar preview
  const renderPreview = (content: string) => {
    let html = content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^\- (.*$)/gim, '<li class="ml-6 mb-2 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 list-decimal">$1</li>')
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')

    if (!html.startsWith('<')) {
      html = `<p class="mb-4">${html}</p>`
    }

    return { __html: html }
  }

  if (!canCreate) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/knowledge-base')}
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Base de Conhecimento
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Novo Artigo
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Crie um novo artigo para a base de conhecimento
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Como criar um ticket de suporte"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="como-criar-ticket-suporte"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                URL amigável do artigo (gerada automaticamente)
              </p>
            </div>

            {/* Resumo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resumo
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Breve descrição do artigo"
              />
            </div>

            {/* Categoria e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                </select>
              </div>
            </div>

            {/* Opções */}
            <div className="flex items-center space-x-6">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Artigo em Destaque
                </span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_faq}
                  onChange={(e) => setFormData({ ...formData, is_faq: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Pergunta Frequente (FAQ)
                </span>
              </label>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite uma tag e pressione Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Editor de Conteúdo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Conteúdo *
                </label>
                <button
                  type="button"
                  onClick={() => setPreview(!preview)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {preview ? 'Editar' : 'Preview'}
                </button>
              </div>

              {/* Toolbar */}
              {!preview && (
                <div className="flex items-center space-x-1 p-2 border border-gray-300 dark:border-gray-600 border-b-0 rounded-t-lg bg-gray-50 dark:bg-gray-700">
                  <button
                    type="button"
                    onClick={() => insertFormatting('bold')}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Negrito"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('italic')}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Itálico"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('link')}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Link"
                  >
                    <Link className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('h1')}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Título 1"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('h2')}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Título 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('h3')}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Título 3"
                  >
                    H3
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('ul')}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('ol')}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Lista Numerada"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('code')}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Código"
                  >
                    <Code className="h-4 w-4" />
                  </button>
                </div>
              )}

              {preview ? (
                <div className="p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 min-h-[400px]">
                  <div 
                    className="prose prose-lg max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={renderPreview(formData.content)}
                  />
                </div>
              ) : (
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={20}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Escreva o conteúdo do artigo usando Markdown..."
                  required
                />
              )}

              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Formatação Markdown:</p>
                    <p>**negrito** | *itálico* | [link](url) | # Título | ## Subtítulo | - Lista | 1. Lista numerada | `código`</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/dashboard/knowledge-base')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Salvar Artigo
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}