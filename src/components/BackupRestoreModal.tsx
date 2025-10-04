'use client'

import { useState, useEffect } from 'react'
import { 
  X, Database, Download, Upload, Clock, CheckCircle, 
  AlertTriangle, Save, RefreshCw, Calendar, HardDrive,
  Cloud, Shield, FileText, Archive
} from 'lucide-react'

interface BackupRestoreModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Backup {
  id: string
  name: string
  description: string
  size: string
  created_at: string
  created_by: string
  type: 'manual' | 'scheduled'
  status: 'completed' | 'in_progress' | 'failed'
  includes: {
    database: boolean
    files: boolean
    settings: boolean
    logs: boolean
  }
}

interface BackupSettings {
  autoBackup: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    retention: number // dias
  }
  includes: {
    database: boolean
    files: boolean
    settings: boolean
    logs: boolean
    users: boolean
    tickets: boolean
    categories: boolean
    emailTemplates: boolean
  }
  storage: {
    location: 'local' | 'cloud'
    cloudProvider?: 'aws' | 'google' | 'azure'
    cloudBucket?: string
    encryptBackups: boolean
    compressionLevel: 'none' | 'low' | 'medium' | 'high'
  }
}

export default function BackupRestoreModal({ isOpen, onClose }: BackupRestoreModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'settings'>('backup')
  const [backups, setBackups] = useState<Backup[]>([])
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [backupName, setBackupName] = useState('')
  const [backupDescription, setBackupDescription] = useState('')
  
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: {
      enabled: false,
      frequency: 'daily',
      time: '03:00',
      retention: 30
    },
    includes: {
      database: true,
      files: true,
      settings: true,
      logs: false,
      users: true,
      tickets: true,
      categories: true,
      emailTemplates: true
    },
    storage: {
      location: 'local',
      cloudProvider: 'aws',
      cloudBucket: '',
      encryptBackups: true,
      compressionLevel: 'medium'
    }
  })

  useEffect(() => {
    if (isOpen) {
      fetchBackups()
      fetchSettings()
    }
  }, [isOpen])

  const fetchBackups = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/backups', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setBackups(data)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/backups/settings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data) {
          setSettings(data)
        }
      }
    } catch (error) {
    }
  }

  const createBackup = async () => {
    if (!backupName) {
      setMessage({ type: 'error', text: 'Por favor, forneça um nome para o backup' })
      return
    }

    setCreatingBackup(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: backupName,
          description: backupDescription,
          includes: settings.includes
        })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Backup criado com sucesso!' })
        setBackupName('')
        setBackupDescription('')
        fetchBackups()
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error('Erro ao criar backup')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao criar backup' })
    } finally {
      setCreatingBackup(false)
    }
  }

  const restoreBackup = async () => {
    if (!selectedBackup) {
      setMessage({ type: 'error', text: 'Por favor, selecione um backup para restaurar' })
      return
    }

    if (!confirm('Tem certeza que deseja restaurar este backup? Esta ação substituirá todos os dados atuais.')) {
      return
    }

    setRestoring(true)
    setMessage(null)
    
    try {
      const response = await fetch(`/api/backups/restore/${selectedBackup}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Backup restaurado com sucesso! O sistema será reiniciado...' })
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        throw new Error('Erro ao restaurar backup')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao restaurar backup' })
    } finally {
      setRestoring(false)
    }
  }

  const downloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backups/download/${backupId}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-${backupId}.tar.gz`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao baixar backup' })
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Tem certeza que deseja excluir este backup?')) {
      return
    }

    try {
      const response = await fetch(`/api/backups/${backupId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Backup excluído com sucesso!' })
        fetchBackups()
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao excluir backup' })
    }
  }

  const saveSettings = async () => {
    setMessage(null)
    
    try {
      const response = await fetch('/api/backups/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        throw new Error('Erro ao salvar configurações')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo' 
    }).replace(',', ' às')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'in_progress': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5" />
      case 'in_progress': return <RefreshCw className="w-5 h-5 animate-spin" />
      case 'failed': return <AlertTriangle className="w-5 h-5" />
      default: return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Backup e Restauração</h2>
              </div>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-1 px-6 pt-4">
              {[
                { id: 'backup', label: 'Criar Backup', icon: Download },
                { id: 'restore', label: 'Restaurar', icon: Upload },
                { id: 'settings', label: 'Configurações', icon: Save }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 border-t border-l border-r border-gray-200 dark:border-gray-700 text-green-600 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[65vh] overflow-y-auto bg-white dark:bg-gray-800">
            {loading && activeTab !== 'settings' ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <>
                {/* Create Backup Tab */}
                {activeTab === 'backup' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                      <div className="flex items-start">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                        <div>
                          <h3 className="font-medium text-blue-900 dark:text-blue-200">Criar Novo Backup</h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Crie um backup completo do sistema incluindo banco de dados, arquivos e configurações.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nome do Backup
                        </label>
                        <input
                          type="text"
                          value={backupName}
                          onChange={(e) => setBackupName(e.target.value)}
                          placeholder="Ex: Backup Completo - Janeiro 2025"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Descrição (opcional)
                        </label>
                        <textarea
                          value={backupDescription}
                          onChange={(e) => setBackupDescription(e.target.value)}
                          placeholder="Descreva o conteúdo ou motivo deste backup..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Incluir no Backup:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries({
                            database: 'Banco de Dados',
                            files: 'Arquivos',
                            settings: 'Configurações',
                            logs: 'Logs do Sistema',
                            users: 'Usuários',
                            tickets: 'Tickets',
                            categories: 'Categorias',
                            emailTemplates: 'Templates de E-mail'
                          }).map(([key, label]) => (
                            <label key={key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.includes[key as keyof typeof settings.includes]}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  includes: {
                                    ...settings.includes,
                                    [key]: e.target.checked
                                  }
                                })}
                                className="mr-2"
                              />
                              <span className="text-sm">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={createBackup}
                        disabled={creatingBackup || !backupName}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                      >
                        {creatingBackup ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Criando backup...
                          </>
                        ) : (
                          <>
                            <Archive className="w-4 h-4 mr-2" />
                            Criar Backup Agora
                          </>
                        )}
                      </button>
                    </div>

                    {/* Recent Backups */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3">Backups Recentes</h3>
                      <div className="space-y-2">
                        {backups.slice(0, 3).map((backup) => (
                          <div key={backup.id} className="border rounded-2xl p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`mr-3 ${getStatusColor(backup.status)}`}>
                                  {getStatusIcon(backup.status)}
                                </div>
                                <div>
                                  <h4 className="font-medium">{backup.name}</h4>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(backup.created_at)} • {backup.size} • {backup.type === 'manual' ? 'Manual' : 'Automático'}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => downloadBackup(backup.id)}
                                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Restore Tab */}
                {activeTab === 'restore' && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                        <div>
                          <h3 className="font-medium text-yellow-900">Atenção</h3>
                          <p className="text-sm text-yellow-700 mt-1">
                            A restauração de backup substituirá todos os dados atuais do sistema. 
                            Certifique-se de ter um backup recente antes de prosseguir.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Selecione um Backup para Restaurar</h3>
                      <div className="space-y-2">
                        {backups.map((backup) => (
                          <div
                            key={backup.id}
                            className={`border rounded-2xl p-4 cursor-pointer transition-colors ${
                              selectedBackup === backup.id
                                ? 'border-green-500 bg-green-50'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedBackup(backup.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                <input
                                  type="radio"
                                  checked={selectedBackup === backup.id}
                                  onChange={() => setSelectedBackup(backup.id)}
                                  className="mt-1 mr-3"
                                />
                                <div>
                                  <h4 className="font-medium">{backup.name}</h4>
                                  {backup.description && (
                                    <p className="text-sm text-gray-600 mt-1">{backup.description}</p>
                                  )}
                                  <div className="flex items-center mt-2 text-sm text-gray-500">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {formatDate(backup.created_at)}
                                    <HardDrive className="w-4 h-4 ml-3 mr-1" />
                                    {backup.size}
                                    <span className="ml-3">{backup.type === 'manual' ? 'Manual' : 'Automático'}</span>
                                  </div>
                                  <div className="mt-2">
                                    <span className="text-xs text-gray-500">Inclui: </span>
                                    {Object.entries(backup.includes)
                                      .filter(([_, value]) => value)
                                      .map(([key]) => (
                                        <span key={key} className="inline-block px-2 py-1 text-xs bg-gray-200 rounded mr-1">
                                          {key}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    downloadBackup(backup.id)
                                  }}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                  title="Baixar backup"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteBackup(backup.id)
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Excluir backup"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={restoreBackup}
                      disabled={!selectedBackup || restoring}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      {restoring ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Restaurando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Restaurar Backup Selecionado
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    {/* Auto Backup */}
                    <div className="border rounded-2xl p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-green-600" />
                        Backup Automático
                      </h3>
                      
                      <label className="flex items-center mb-4">
                        <input
                          type="checkbox"
                          checked={settings.autoBackup.enabled}
                          onChange={(e) => setSettings({
                            ...settings,
                            autoBackup: { ...settings.autoBackup, enabled: e.target.checked }
                          })}
                          className="mr-2"
                        />
                        <span className="font-medium">Habilitar backup automático</span>
                      </label>

                      {settings.autoBackup.enabled && (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Frequência
                            </label>
                            <select
                              value={settings.autoBackup.frequency}
                              onChange={(e) => setSettings({
                                ...settings,
                                autoBackup: { ...settings.autoBackup, frequency: e.target.value as any }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-green-500"
                            >
                              <option value="daily">Diário</option>
                              <option value="weekly">Semanal</option>
                              <option value="monthly">Mensal</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Horário
                            </label>
                            <input
                              type="time"
                              value={settings.autoBackup.time}
                              onChange={(e) => setSettings({
                                ...settings,
                                autoBackup: { ...settings.autoBackup, time: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Retenção (dias)
                            </label>
                            <input
                              type="number"
                              min="7"
                              max="365"
                              value={settings.autoBackup.retention}
                              onChange={(e) => setSettings({
                                ...settings,
                                autoBackup: { ...settings.autoBackup, retention: parseInt(e.target.value) }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Backups mais antigos que {settings.autoBackup.retention} dias serão excluídos automaticamente
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Storage Settings */}
                    <div className="border rounded-2xl p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Cloud className="w-5 h-5 mr-2 text-green-600" />
                        Armazenamento
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Local de Armazenamento
                          </label>
                          <select
                            value={settings.storage.location}
                            onChange={(e) => setSettings({
                              ...settings,
                              storage: { ...settings.storage, location: e.target.value as 'local' | 'cloud' }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-green-500"
                          >
                            <option value="local">Armazenamento Local</option>
                            <option value="cloud">Armazenamento na Nuvem</option>
                          </select>
                        </div>

                        {settings.storage.location === 'cloud' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Provedor de Nuvem
                              </label>
                              <select
                                value={settings.storage.cloudProvider}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  storage: { ...settings.storage, cloudProvider: e.target.value as any }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-green-500"
                              >
                                <option value="aws">Amazon S3</option>
                                <option value="google">Google Cloud Storage</option>
                                <option value="azure">Azure Blob Storage</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Bucket/Container
                              </label>
                              <input
                                type="text"
                                value={settings.storage.cloudBucket || ''}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  storage: { ...settings.storage, cloudBucket: e.target.value }
                                })}
                                placeholder="nome-do-bucket"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          </>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Nível de Compressão
                            </label>
                            <select
                              value={settings.storage.compressionLevel}
                              onChange={(e) => setSettings({
                                ...settings,
                                storage: { ...settings.storage, compressionLevel: e.target.value as any }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-green-500"
                            >
                              <option value="none">Sem compressão</option>
                              <option value="low">Baixa</option>
                              <option value="medium">Média</option>
                              <option value="high">Alta</option>
                            </select>
                          </div>
                          
                          <div className="flex items-end">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.storage.encryptBackups}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  storage: { ...settings.storage, encryptBackups: e.target.checked }
                                })}
                                className="mr-2"
                              />
                              <span className="text-sm">Criptografar backups</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={saveSettings}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 flex items-center justify-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Configurações
                    </button>
                  </div>
                )}

                {/* Messages */}
                {message && (
                  <div className={`mt-4 p-3 rounded-2xl ${
                    message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {message.text}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}