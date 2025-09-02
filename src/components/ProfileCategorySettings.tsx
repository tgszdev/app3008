'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Users, Tag, AlertCircle, Settings, X } from 'lucide-react'
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [permissions, setPermissions] = useState<ProfilePermission[]>([
    { role: 'admin', categories: [] },
    { role: 'analyst', categories: [] },
    { role: 'user', categories: [] }
  ])

  // Buscar categorias e permissões quando o modal abrir
  useEffect(() => {
    if (isModalOpen) {
      fetchData()
    }
  }, [isModalOpen])

  const fetchData = async () => {
    setLoading(true)
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
  const toggleAllCategories = (role: string) => {
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

  // Salvar permissões
  const savePermissions = async () => {
    setSaving(true)
    try {
      const response = await axios.post('/api/settings/kb-permissions', {
        permissions
      })

      if (response.data.success) {
        toast.success('Permissões salvas com sucesso!')
        setIsModalOpen(false)
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
      admin: 'Administrador',
      analyst: 'Analista',
      user: 'Usuário'
    }
    return names[role] || role
  }

  // Obter cor do perfil
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      analyst: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      user: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    }
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  return (
    <>
      {/* Botão para abrir o modal */}
      <>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Defina quais categorias cada perfil de usuário pode visualizar na Base de Conhecimento
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
        >
          <Settings className="h-5 w-5 mr-2" />
          Configurar Permissões
        </button>
      </>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Configuração de Perfis - Base de Conhecimento
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                      Nenhuma categoria encontrada
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Crie categorias na Base de Conhecimento primeiro
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Configuração de Visibilidade
                          </h3>
                          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                            Marque as categorias que cada perfil pode visualizar na Base de Conhecimento.
                            Por padrão, todos os perfis podem ver todas as categorias.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tabela de Permissões */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Categoria
                            </th>
                            {permissions.map(permission => (
                              <th key={permission.role} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <div className="flex flex-col items-center space-y-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(permission.role)}`}>
                                    {getRoleName(permission.role)}
                                  </span>
                                  <button
                                    onClick={() => toggleAllCategories(permission.role)}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    {permission.categories.length === categories.length ? 'Desmarcar' : 'Marcar'} Todas
                                  </button>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {categories.map(category => (
                            <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div
                                    className="h-8 w-8 rounded-lg flex items-center justify-center mr-3"
                                    style={{ backgroundColor: `${category.color}20` }}
                                  >
                                    <Tag className="h-4 w-4" style={{ color: category.color }} />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {category.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {category.slug}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {permissions.map(permission => (
                                <td key={`${category.id}-${permission.role}`} className="px-6 py-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={permission.categories.includes(category.id)}
                                    onChange={() => toggleCategoryPermission(permission.role, category.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {categories.length > 0 && !loading && (
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={savePermissions}
                    disabled={saving}
                    className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    Salvar Permissões
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}