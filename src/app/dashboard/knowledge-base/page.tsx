'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import {
  BookOpen,
  Search,
  HelpCircle,
  FileText,
  TrendingUp,
  Eye,
  ThumbsUp,
  Clock,
  Tag,
  ChevronRight,
  Loader2,
  Plus,
  Star,
  Filter,
  Grid,
  List,
  Rocket,
  Wrench,
  Lightbulb,
  Shield,
  Code,
  RefreshCw,
  BookMarked,
  MessageCircle,
  ArrowRight
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatBrazilDate } from '@/lib/date-utils'
import dynamic from 'next/dynamic'

const KnowledgeBaseSetup = dynamic(() => import('@/components/KnowledgeBaseSetup'), {
  ssr: false
})

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  article_count?: number
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content?: string
  category_id: string
  category?: Category
  author?: {
    id: string
    name: string
    avatar_url?: string
  }
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  is_faq: boolean
  view_count: number
  helpful_count: number
  not_helpful_count: number
  tags?: string[]
  created_at: string
  updated_at: string
  published_at?: string
}

interface Stats {
  total_articles: number
  total_categories: number
  total_views: number
  helpful_percentage: number
  popular_articles: Article[]
  recent_articles: Article[]
}

// Função helper para obter ícone da categoria
const getCategoryIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Rocket,
    BookOpen,
    Wrench,
    Tool: Wrench, // Alias para compatibilidade
    HelpCircle,
    Lightbulb,
    Shield,
    Code,
    TrendingUp,
    FileText,
    BookMarked
  }
  const Icon = icons[iconName] || FileText
  return Icon
}

export default function KnowledgeBasePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFaqOnly, setShowFaqOnly] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [faqArticles, setFaqArticles] = useState<Article[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [setupNeeded, setSetupNeeded] = useState(false)

  const { hasPermission } = usePermissions()
  
  // Usar permissões específicas ao invés de roles
  const canView = hasPermission('kb_view')
  const canCreate = hasPermission('kb_create')
  const canEdit = hasPermission('kb_edit')
  const canDelete = hasPermission('kb_delete')
  const canManageCategories = hasPermission('kb_manage_categories')
  
  // Fallback para compatibilidade
  const isAdmin = (session?.user as any)?.role === 'admin'
  const isAnalyst = (session?.user as any)?.role === 'analyst'

  // Buscar dados da base de conhecimento
  const fetchKnowledgeBase = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    
    try {
      // Buscar estatísticas
      const statsResponse = await axios.get('/api/knowledge-base/stats')
      setStats(statsResponse.data)

      // Buscar categorias
      const categoriesResponse = await axios.get('/api/knowledge-base/categories')
      setCategories(categoriesResponse.data.categories || [])

      // Buscar artigos
      const articlesParams = new URLSearchParams({
        ...(selectedCategory && { category: selectedCategory }),
        ...(showFaqOnly && { faq_only: 'true' }),
        ...(searchTerm && { search: searchTerm })
      })
      
      const articlesResponse = await axios.get(`/api/knowledge-base/articles?${articlesParams}`)
      setArticles(articlesResponse.data.articles || [])

      // Filtrar artigos em destaque e FAQ
      setFeaturedArticles(articlesResponse.data.articles?.filter((a: Article) => a.is_featured) || [])
      setFaqArticles(articlesResponse.data.articles?.filter((a: Article) => a.is_faq) || [])

      // Se chegou aqui sem erro, as tabelas existem
      setSetupNeeded(false)

    } catch (error: any) {
      // Não mostrar toast de erro, pois pode ser apenas tabelas não criadas
      setSetupNeeded(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchKnowledgeBase()
  }, [selectedCategory, showFaqOnly])

  // Busca com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchKnowledgeBase()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Função para navegar para o artigo
  const navigateToArticle = (slug: string) => {
    router.push(`/dashboard/knowledge-base/article/${slug}`)
  }

  // Função para criar novo artigo
  const createNewArticle = () => {
    router.push('/dashboard/knowledge-base/new')
  }

  // Função para atualizar
  const handleRefresh = () => {
    setRefreshing(true)
    fetchKnowledgeBase(false)
  }

  // Se precisa configurar, mostrar instruções
  if (setupNeeded && !loading) {
    return <KnowledgeBaseSetup />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-2xl shadow-lg p-4 md:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-start md:items-center space-x-3">
            <BookOpen className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0 mt-1 md:mt-0" />
            <div>
              <h1 className="text-xl md:text-3xl font-bold">Base de Conhecimento</h1>
              <p className="text-sm md:text-base text-blue-100 mt-1">
                Encontre soluções, tutoriais e respostas para suas dúvidas
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {(canManageCategories || isAdmin) && (
              <button
                onClick={() => router.push('/dashboard/knowledge-base/categories')}
                className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-sm md:text-base text-white hover:bg-white/30 transition-colors"
              >
                <Grid className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Nova Categoria</span>
                <span className="sm:hidden">Categoria</span>
              </button>
            )}
            
            {(canCreate || canEdit || isAdmin) && (
              <button
                onClick={createNewArticle}
                className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-sm md:text-base text-white hover:bg-white/30 transition-colors"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Novo Artigo</span>
                <span className="sm:hidden">Artigo</span>
              </button>
            )}
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-sm md:text-base text-white hover:bg-white/30 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-200" />
          <input
            type="text"
            placeholder="Buscar artigos, tutoriais, soluções..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>

        {/* Estatísticas Rápidas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-2 md:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs md:text-sm">Artigos</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.total_articles}</p>
                </div>
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-2xl p-2 md:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs md:text-sm">Categorias</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.total_categories}</p>
                </div>
                <Grid className="h-6 w-6 md:h-8 md:w-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-2xl p-2 md:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs md:text-sm">Visualizações</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.total_views.toLocaleString('pt-BR')}</p>
                </div>
                <Eye className="h-6 w-6 md:h-8 md:w-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-2xl p-2 md:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs md:text-sm">Taxa de Ajuda</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.helpful_percentage}%</p>
                </div>
                <ThumbsUp className="h-6 w-6 md:h-8 md:w-8 text-blue-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros e Controles */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Filtro de Categoria */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showFaqOnly}
                onChange={(e) => setShowFaqOnly(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Apenas FAQ
              </span>
            </label>
          </div>

          {/* Modo de Visualização */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Categorias Rápidas */}
      {!searchTerm && !selectedCategory && !showFaqOnly && categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {categories.slice(0, 8).map((category) => {
            const Icon = getCategoryIcon(category.icon)
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 md:p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className="p-1.5 md:p-2 rounded-2xl flex-shrink-0"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: category.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm md:text-base truncate">
                      {category.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {category.article_count || 0} artigos
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Artigos em Destaque */}
      {featuredArticles.length > 0 && !searchTerm && !selectedCategory && !showFaqOnly && (
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 flex items-center">
            <Star className="h-4 w-4 md:h-5 md:w-5 mr-2 text-yellow-500" />
            Artigos em Destaque
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {featuredArticles.slice(0, 3).map((article) => (
              <div
                key={article.id}
                onClick={() => navigateToArticle(article.slug)}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                    Em Destaque
                  </span>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Eye className="h-4 w-4 mr-1" />
                    {article.view_count}
                  </div>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                  Ler mais
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Artigos */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {showFaqOnly ? 'Perguntas Frequentes' : 'Todos os Artigos'}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Nenhum artigo encontrado
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Ainda não há artigos publicados nesta categoria'}
            </p>
            {canEdit && (
              <button
                onClick={createNewArticle}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Artigo
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {articles.map((article) => {
              const categoryIcon = article.category ? getCategoryIcon(article.category.icon) : FileText
              const CategoryIcon = categoryIcon
              
              return (
                <div
                  key={article.id}
                  onClick={() => navigateToArticle(article.slug)}
                  className="border border-gray-200 dark:border-gray-700 rounded-2xl p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3 md:space-x-4">
                    {article.category && (
                      <div
                        className="p-1.5 md:p-2 rounded-2xl flex-shrink-0"
                        style={{ backgroundColor: `${article.category.color}20` }}
                      >
                        <CategoryIcon 
                          className="h-4 w-4 md:h-5 md:w-5" 
                          style={{ color: article.category.color }} 
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm md:text-base font-medium text-gray-900 dark:text-white line-clamp-2">
                          {article.title}
                        </h3>
                        {article.is_faq && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            FAQ
                          </span>
                        )}
                      </div>
                      
                      <p className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {article.excerpt}
                      </p>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {article.view_count}
                          </span>
                          <span className="flex items-center">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {article.helpful_count}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatBrazilDate(article.updated_at)}
                          </span>
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {articles.map((article) => (
              <div
                key={article.id}
                onClick={() => navigateToArticle(article.slug)}
                className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
                        {article.title}
                      </h3>
                      {article.is_featured && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                      {article.is_faq && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          FAQ
                        </span>
                      )}
                    </div>
                    
                    <p className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {article.excerpt}
                    </p>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {article.category && (
                        <span className="flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {article.category.name}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {article.view_count} visualizações
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {article.helpful_count} útil
                      </span>
                      <span>
                        Atualizado {formatDistanceToNow(new Date(article.updated_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQ Rápido */}
      {faqArticles.length > 0 && !showFaqOnly && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <HelpCircle className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-500" />
              Perguntas Frequentes
            </h2>
            <button
              onClick={() => setShowFaqOnly(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todas
            </button>
          </div>
          
          <div className="space-y-3">
            {faqArticles.slice(0, 5).map((article) => (
              <div
                key={article.id}
                onClick={() => navigateToArticle(article.slug)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {article.title}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Função helper para formatDistanceToNow (caso não esteja importada)
function formatDistanceToNow(date: Date, options: any) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `há ${days} dia${days > 1 ? 's' : ''}`
  } else if (hours > 0) {
    return `há ${hours} hora${hours > 1 ? 's' : ''}`
  } else if (minutes > 0) {
    return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`
  } else {
    return 'agora mesmo'
  }
}