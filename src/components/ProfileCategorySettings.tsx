'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, AlertCircle, CheckSquare, Square, Minus } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
}

interface ProfilePermission {
  role: string
  categories: string[]
}

export default function ProfileCategorySettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [permissions, setPermissions] = useState<ProfilePermission[]>([
    { role: 'admin', categories: [] },
    { role: 'analyst', categories: [] },
    { role: 'user', categories: [] }
  ])

  // Buscar categorias e permissões
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar categorias
      const categoriesResponse = await axios.get('/api/knowledge-base/categories')
      setCategories(categoriesResponse.data.categories || [])

      // Buscar permissões salvas
      const permissionsResponse = await axios.get('/api/settings/kb-permissions')
      if (permissionsResponse.data.permissions) {
        setPermissions(permissionsResponse.data.permissions)
      } else {
        // Se não houver permissões salvas, todas as categorias são permitidas para todos
        const allCategoryIds = categoriesResponse.data.categories?.map((c: Category) => c.id) || []
        setPermissions([
          { role: 'admin', categories: allCategoryIds },
          { role: 'analyst', categories: allCategoryIds },
          { role: 'user', categories: allCategoryIds }
        ])
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error)
      // Se a API não existir ainda, permitir todas as categorias
      if (error.response?.status === 404) {
        const allCategoryIds = categories.map(c => c.id)
        setPermissions([
          { role: 'admin', categories: allCategoryIds },
          { role: 'analyst', categories: allCategoryIds },
          { role: 'user', categories: allCategoryIds }
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  // Alternar permissão de categoria para um perfil
  const toggleCategoryPermission = (role: string, categoryId: string) => {
    setPermissions(prev => 
      prev.map(p => {
        if (p.role === role) {
          const hasCategory = p.categories.includes(categoryId)
          return {
            ...p,
            categories: hasCategory
              ? p.categories.filter(id => id !== categoryId)
              : [...p.categories, categoryId]
          }
        }
        return p
      })
    )
  }

  // Selecionar/Desselecionar todas as categorias para um perfil
  const toggleAllForRole = (role: string) => {
    const permission = permissions.find(p => p.role === role)
    const allCategoryIds = categories.map(c => c.id)
    const hasAll = permission?.categories.length === categories.length

    setPermissions(prev =>
      prev.map(p => {
        if (p.role === role) {
          return {
            ...p,
            categories: hasAll ? [] : allCategoryIds
          }
        }
        return p
      })
    )
  }

  // Selecionar/Desselecionar uma categoria para todos os perfis
  const toggleCategoryForAll = (categoryId: string) => {
    const allRolesHaveCategory = permissions.every(p => p.categories.includes(categoryId))
    
    setPermissions(prev =>
      prev.map(p => ({
        ...p,
        categories: allRolesHaveCategory
          ? p.categories.filter(id => id !== categoryId)
          : [...new Set([...p.categories, categoryId])]
      }))
    )
  }

  // Salvar permissões
  const savePermissions = async () => {
    setSaving(true)
    try {
      const response = await axios.post('/api/settings/kb-permissions', {
        permissions
      })

      if (response.data.success) {
        toast.success('Permissões salvas com sucesso!')
      } else {
        toast.error('Erro ao salvar permissões')
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast.error(error.response?.data?.error || 'Erro ao salvar permissões')
    } finally {
      setSaving(false)
    }
  }

  // Obter nome amigável do perfil
  const getRoleName = (role: string) => {
    const names: Record<string, string> = {
      admin: 'Admin',
      analyst: 'Analista',
      user: 'Usuário'
    }
    return names[role] || role
  }

  // Verificar o estado de seleção de uma categoria
  const getCategorySelectionState = (categoryId: string) => {
    const rolesWithCategory = permissions.filter(p => p.categories.includes(categoryId)).length
    if (rolesWithCategory === 0) return 'none'
    if (rolesWithCategory === permissions.length) return 'all'
    return 'partial'
  }

  // Verificar o estado de seleção de um perfil
  const getRoleSelectionState = (role: string) => {
    const permission = permissions.find(p => p.role === role)
    if (!permission) return 'none'
    if (permission.categories.length === 0) return 'none'
    if (permission.categories.length === categories.length) return 'all'
    return 'partial'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-10 w-10 text-yellow-500" />
        <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
          Nenhuma categoria encontrada
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Crie categorias na Base de Conhecimento primeiro
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Info compacta */}
      <div className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <strong>Configuração de Visibilidade:</strong> Marque as categorias que cada perfil pode visualizar na Base de Conhecimento. Por padrão, todos os perfis podem ver todas as categorias.
        </p>
      </div>

      {/* Tabela compacta */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-2 text-left">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Categoria
                </span>
              </th>
              {permissions.map(permission => (
                <th key={permission.role} className="px-4 py-2 text-center min-w-[100px]">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      {getRoleName(permission.role)}
                    </div>
                    <button
                      onClick={() => toggleAllForRole(permission.role)}
                      className="w-full flex items-center justify-center"
                      title={getRoleSelectionState(permission.role) === 'all' ? 'Desmarcar todas' : 'Marcar todas'}
                    >
                      {getRoleSelectionState(permission.role) === 'all' ? (
                        <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : getRoleSelectionState(permission.role) === 'none' ? (
                        <Square className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Minus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-4 py-2 text-center min-w-[100px]">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Todos
                  </div>
                  <div className="w-full flex items-center justify-center">
                    <Square className="h-4 w-4 text-gray-300" />
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((category, idx) => {
              const selectionState = getCategorySelectionState(category.id)
              return (
                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <span className="text-xs font-semibold" style={{ color: category.color }}>
                          {category.icon || category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {category.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {category.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  {permissions.map(permission => (
                    <td key={`${category.id}-${permission.role}`} className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={permission.categories.includes(category.id)}
                        onChange={() => toggleCategoryPermission(permission.role, category.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-1 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => toggleCategoryForAll(category.id)}
                      className="flex items-center justify-center w-full"
                      title={selectionState === 'all' ? 'Desmarcar para todos' : 'Marcar para todos'}
                    >
                      {selectionState === 'all' ? (
                        <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : selectionState === 'none' ? (
                        <Square className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Minus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end pt-2">
        <button
          onClick={savePermissions}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Permissões
        </button>
      </div>
    </div>
  )
}