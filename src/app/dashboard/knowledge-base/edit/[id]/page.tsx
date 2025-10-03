'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import {
  ArrowLeft,
  Save,
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Code,
  Quote,
  Heading2,
  Heading3,
  Eye,
  EyeOff,
  Tag,
  FileText,
  Calendar,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatBrazilDate } from '@/lib/date-utils'

interface Category {
  id: string
  name: string
  slug: string
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category_id: string
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  is_faq: boolean
  tags?: string[]
  meta_title?: string
  meta_description?: string
  created_at: string
  updated_at: string
  published_at?: string
  author?: {
    id: string
    name: string
    email: string
  }
}

export default function EditArticlePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const articleId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [article, setArticle] = useState<Article | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  
  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isFaq, setIsFaq] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const { hasPermission } = usePermissions()
  
  // Verificar permissão para editar artigos
  const canEditPermission = hasPermission('kb_edit')
  
  // Fallback para compatibilidade
  const isAdmin = (session?.user as any)?.role === 'admin'
  const isAnalyst = (session?.user as any)?.role === 'analyst'
  const canEdit = canEditPermission || isAdmin || isAnalyst

  // Buscar artigo e categorias
  useEffect(() => {
    if (!canEdit) {
      toast.error('Você não tem permissão para editar artigos')
      router.push('/dashboard/knowledge-base')
      return
    }

    fetchData()
  }, [articleId, canEdit])

  const fetchData = async () => {
    try {
      // Buscar categorias
      const categoriesResponse = await axios.get('/api/knowledge-base/categories')
      setCategories(categoriesResponse.data.categories || [])

      // Buscar artigo
      const articleResponse = await axios.get(`/api/knowledge-base/articles/${articleId}`)
      const articleData = articleResponse.data

      if (!articleData) {
        toast.error('Artigo não encontrado')
        router.push('/dashboard/knowledge-base')
        return
      }

      setArticle(articleData)
      setTitle(articleData.title)
      setSlug(articleData.slug)
      setExcerpt(articleData.excerpt)
      setContent(articleData.content)
      setCategoryId(articleData.category_id)
      setStatus(articleData.status)
      setIsFeatured(articleData.is_featured)
      setIsFaq(articleData.is_faq)
      setTags(articleData.tags || [])
      setMetaTitle(articleData.meta_title || '')
      setMetaDescription(articleData.meta_description || '')
    } catch (error: any) {
      toast.error('Erro ao carregar artigo')
      router.push('/dashboard/knowledge-base')
    } finally {
      setLoading(false)
    }
  }

  // Gerar slug a partir do título
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Atualizar slug quando o título mudar
  useEffect(() => {
    if (title && !slug) {
      setSlug(generateSlug(title))
    }
  }, [title])

  // Adicionar tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  // Remover tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // Inserir formatação no conteúdo
  const insertFormatting = (type: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    let newText = ''

    switch (type) {
      case 'bold':
        newText = `**${selectedText || 'texto em negrito'}**`
        break
      case 'italic':
        newText = `*${selectedText || 'texto em itálico'}*`
        break
      case 'h2':
        newText = `\n## ${selectedText || 'Título 2'}\n`
        break
      case 'h3':
        newText = `\n### ${selectedText || 'Título 3'}\n`
        break
      case 'ul':
        newText = `\n- ${selectedText || 'Item da lista'}\n`
        break
      case 'ol':
        newText = `\n1. ${selectedText || 'Item numerado'}\n`
        break
      case 'quote':
        newText = `\n> ${selectedText || 'Citação'}\n`
        break
      case 'code':
        newText = `\`${selectedText || 'código'}\``
        break
      case 'link':
        newText = `[${selectedText || 'texto do link'}](url)`
        break
    }

    const newContent = content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)
    
    // Reposicionar cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 0)
  }

  // Renderizar conteúdo em markdown
  const renderContent = (text: string) => {
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">$1</h2>')
      // Bold
      .replace(/\*\*(.*)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.*)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      // Quotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4">$1</blockquote>')
      // Code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-4">')
    
    return `<p class="mb-4">${html}</p>`
  }

  // Salvar artigo
  const handleSave = async () => {
    if (!title || !slug || !excerpt || !content || !categoryId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const response = await axios.put(`/api/knowledge-base/articles/${articleId}`, {
        title,
        slug,
        excerpt,
        content,
        category_id: categoryId,
        status,
        is_featured: isFeatured,
        is_faq: isFaq,
        tags,
        meta_title: metaTitle || title,
        meta_description: metaDescription || excerpt
      })

      toast.success('Artigo atualizado com sucesso!')
      router.push(`/dashboard/knowledge-base/article/${slug}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar artigo')
    } finally {
      setSaving(false)
    }
  }

  // Deletar artigo
  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      await axios.delete(`/api/knowledge-base/articles/${articleId}`)
      toast.success('Artigo excluído com sucesso!')
      router.push('/dashboard/knowledge-base')
    } catch (error: any) {
      toast.error('Erro ao excluir artigo')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
          Artigo não encontrado
        </h2>
        <button
          onClick={() => router.push('/dashboard/knowledge-base')}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Voltar para Base de Conhecimento
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/knowledge-base')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Editar Artigo
              </h1>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {article.author?.name}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Criado em {formatBrazilDate(article.created_at)}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Atualizado em {formatBrazilDate(article.updated_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-5 w-5 mr-2" />
                  Editar
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 mr-2" />
                  Visualizar
                </>
              )}
            </button>
            
            {isAdmin && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="h-5 w-5 mr-2" />
                Excluir
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Principal */}
        <div className="lg:col-span-2 space-y-6">
          {showPreview ? (
            // Preview Mode
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {title || 'Título do Artigo'}
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                {excerpt || 'Resumo do artigo...'}
              </p>
              
              <div 
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderContent(content || 'Conteúdo do artigo...') }}
              />
              
              {tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Edit Mode
            <>
              {/* Título e Slug */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o título do artigo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Slug (URL) *
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="url-do-artigo"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      URL: /dashboard/knowledge-base/article/{slug || 'slug-do-artigo'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Resumo *
                    </label>
                    <textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Breve descrição do artigo"
                    />
                  </div>
                </div>
              </div>

              {/* Editor de Conteúdo */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conteúdo *
                </label>
                
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 mb-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <button
                    type="button"
                    onClick={() => insertFormatting('bold')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Negrito"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('italic')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Itálico"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('h2')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Título 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('h3')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Título 3"
                  >
                    <Heading3 className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('ul')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('ol')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Lista Numerada"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('quote')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Citação"
                  >
                    <Quote className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('code')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Código"
                  >
                    <Code className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('link')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Link"
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                </div>
                
                <textarea
                  id="content-editor"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Escreva o conteúdo do artigo usando Markdown..."
                />
                
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Use Markdown para formatar: **negrito**, *itálico*, ## Título, - lista, [link](url)
                </p>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Configurações */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Configurações
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Artigo em Destaque
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isFaq}
                    onChange={(e) => setIsFaq(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Pergunta Frequente (FAQ)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tags
            </h3>
            
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Adicionar tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Adicionar
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              SEO
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meta Título
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Título para SEO"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meta Descrição
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Descrição para SEO"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}