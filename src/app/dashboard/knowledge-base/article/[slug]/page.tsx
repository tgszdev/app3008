'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Tag,
  User,
  Edit,
  Trash2,
  Share2,
  Bookmark,
  MessageCircle,
  ChevronRight,
  Loader2,
  FileText,
  Link as LinkIcon,
  Copy,
  CheckCircle
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  category_id: string
  category?: {
    id: string
    name: string
    slug: string
    icon: string
    color: string
  }
  author?: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  status: string
  is_featured: boolean
  is_faq: boolean
  view_count: number
  helpful_count: number
  not_helpful_count: number
  tags?: Array<{
    id: string
    name: string
    slug: string
  }>
  created_at: string
  updated_at: string
  published_at?: string
}

interface RelatedArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  category?: {
    name: string
    color: string
  }
}

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null)
  const [copied, setCopied] = useState(false)

  const slug = params?.slug as string
  const { hasPermission } = usePermissions()
  
  // Verificar permissões do artigo
  const canView = hasPermission('kb_view')
  const canEditPermission = hasPermission('kb_edit')
  
  // Fallback para compatibilidade
  const isAdmin = (session?.user as any)?.role === 'admin'
  const isAnalyst = (session?.user as any)?.role === 'analyst'
  const canEdit = canEditPermission || isAdmin || isAnalyst

  // Buscar artigo
  const fetchArticle = async () => {
    setLoading(true)
    
    try {
      const response = await axios.get(`/api/knowledge-base/article/${slug}`)
      setArticle(response.data.article)
      setRelatedArticles(response.data.related || [])
      
      // Incrementar visualizações
      await axios.post(`/api/knowledge-base/article/${slug}/view`)
      
    } catch (error: any) {
      console.error('Erro ao buscar artigo:', error)
      toast.error('Erro ao carregar artigo')
      router.push('/dashboard/knowledge-base')
    } finally {
      setLoading(false)
    }
  }

  // Carregar artigo ao montar
  useEffect(() => {
    if (slug) {
      fetchArticle()
    }
  }, [slug])

  // Enviar feedback
  const handleFeedback = async (isHelpful: boolean) => {
    if (!session) {
      toast.error('Você precisa estar logado para avaliar')
      return
    }

    try {
      await axios.post(`/api/knowledge-base/article/${slug}/feedback`, {
        is_helpful: isHelpful
      })
      
      setFeedback(isHelpful ? 'helpful' : 'not_helpful')
      toast.success('Obrigado pelo seu feedback!')
      
      // Atualizar contadores localmente
      if (article) {
        if (isHelpful) {
          setArticle({ ...article, helpful_count: article.helpful_count + 1 })
        } else {
          setArticle({ ...article, not_helpful_count: article.not_helpful_count + 1 })
        }
      }
    } catch (error: any) {
      console.error('Erro ao enviar feedback:', error)
      toast.error('Erro ao enviar feedback')
    }
  }

  // Copiar link
  const copyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 3000)
  }

  // Editar artigo
  const editArticle = () => {
    router.push(`/dashboard/knowledge-base/edit/${article?.id}`)
  }

  // Excluir artigo
  const deleteArticle = async () => {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return

    try {
      await axios.delete(`/api/knowledge-base/articles?id=${article?.id}`)
      toast.success('Artigo excluído com sucesso')
      router.push('/dashboard/knowledge-base')
    } catch (error: any) {
      console.error('Erro ao excluir artigo:', error)
      toast.error('Erro ao excluir artigo')
    }
  }

  // Renderizar conteúdo markdown-like
  const renderContent = (content: string) => {
    // Converter markdown básico para HTML
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.*)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank">$1</a>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 dark:text-gray-300">')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-6 mb-2 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 list-decimal">$1</li>')
      // Code blocks
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">$1</code>')

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = `<p class="mb-4 text-gray-700 dark:text-gray-300">${html}</p>`
    }

    return { __html: html }
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
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Artigo não encontrado
        </h3>
        <button
          onClick={() => router.push('/dashboard/knowledge-base')}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Voltar para a Base de Conhecimento
        </button>
      </div>
    )
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

        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <a href="/dashboard/knowledge-base" className="hover:text-gray-700 dark:hover:text-gray-300">
            Base de Conhecimento
          </a>
          <ChevronRight className="h-4 w-4 mx-2" />
          {article.category && (
            <>
              <a 
                href={`/dashboard/knowledge-base?category=${article.category.id}`}
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                {article.category.name}
              </a>
              <ChevronRight className="h-4 w-4 mx-2" />
            </>
          )}
          <span className="text-gray-900 dark:text-white">{article.title}</span>
        </nav>

        {/* Título e Meta */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {article.title}
              </h1>

              {/* Metadados */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {article.author && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {article.author.name}
                  </div>
                )}
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatBrazilDate(article.published_at || article.created_at)}
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {Math.ceil(article.content.split(' ').length / 200)} min de leitura
                </div>
                
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {article.view_count} visualizações
                </div>
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ações */}
            {canEdit && (
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={editArticle}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title="Editar"
                >
                  <Edit className="h-5 w-5" />
                </button>
                {isAdmin && (
                  <button
                    onClick={deleteArticle}
                    className="p-2 text-red-500 hover:text-red-700"
                    title="Excluir"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div 
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={renderContent(article.content)}
            />
          </div>

          {/* Feedback */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Este artigo foi útil?
            </h3>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleFeedback(true)}
                disabled={feedback !== null}
                className={`inline-flex items-center px-4 py-2 rounded-lg border ${
                  feedback === 'helpful'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${feedback !== null ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <ThumbsUp className="h-5 w-5 mr-2" />
                Sim ({article.helpful_count})
              </button>
              
              <button
                onClick={() => handleFeedback(false)}
                disabled={feedback !== null}
                className={`inline-flex items-center px-4 py-2 rounded-lg border ${
                  feedback === 'not_helpful'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${feedback !== null ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <ThumbsDown className="h-5 w-5 mr-2" />
                Não ({article.not_helpful_count})
              </button>
            </div>

            {feedback && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Obrigado pelo seu feedback! Isso nos ajuda a melhorar nosso conteúdo.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ações
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={copyLink}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Link Copiado!
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-5 w-5 mr-2" />
                    Copiar Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Artigos Relacionados */}
          {relatedArticles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Artigos Relacionados
              </h3>
              
              <div className="space-y-3">
                {relatedArticles.map((related) => (
                  <a
                    key={related.id}
                    href={`/dashboard/knowledge-base/article/${related.slug}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      {related.title}
                    </h4>
                    {related.category && (
                      <span 
                        className="text-xs"
                        style={{ color: related.category.color }}
                      >
                        {related.category.name}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Informações da Categoria */}
          {article.category && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Categoria
              </h3>
              
              <a
                href={`/dashboard/knowledge-base?category=${article.category.id}`}
                className="inline-flex items-center px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                style={{ backgroundColor: `${article.category.color}20` }}
              >
                <BookOpen className="h-5 w-5 mr-2" style={{ color: article.category.color }} />
                <span style={{ color: article.category.color }}>
                  {article.category.name}
                </span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}