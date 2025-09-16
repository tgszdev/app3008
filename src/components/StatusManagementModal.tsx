"use client"

import { useEffect, useMemo, useState } from 'react'
import { X, Plus, GripVertical, CheckCircle, FlagTriangleRight, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

type StatusItem = {
  id: string
  name: string
  slug: string
  color?: string | null
  description?: string | null
  is_default: boolean
  is_final: boolean
  is_internal: boolean
  order_index: number
}

export default function StatusManagementModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<StatusItem[]>([])
  const [form, setForm] = useState<Partial<StatusItem>>({ name: '', slug: '', color: '#2563eb', is_default: false, is_final: false, is_internal: false })
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const ordered = useMemo(() => [...items].sort((a, b) => a.order_index - b.order_index), [items])

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch('/api/statuses').then(r => r.json()).then(data => setItems(data || [])).catch(() => toast.error('Erro ao carregar status')).finally(() => setLoading(false))
  }, [isOpen])

  const resetForm = () => setForm({ name: '', slug: '', color: '#2563eb', is_default: false, is_final: false, is_internal: false })

  const handleCreate = async () => {
    if (!form.name || !form.slug) return toast.error('Nome e slug são obrigatórios')
    setLoading(true)
    const res = await fetch('/api/statuses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return toast.error(data?.error || 'Erro ao criar')
    toast.success('Status criado')
    setItems(prev => [...prev, data])
    resetForm()
  }

  const handleUpdate = async (id: string, patch: Partial<StatusItem>) => {
    const res = await fetch(`/api/statuses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    const data = await res.json()
    if (!res.ok) return toast.error(data?.error || 'Erro ao atualizar')
    setItems(prev => prev.map(i => (i.id === id ? data : i)))
  }

  const handleDelete = async (id: string) => {
    const ok = confirm('Tem certeza que deseja excluir este status?')
    if (!ok) return
    const res = await fetch(`/api/statuses/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) return toast.error(data?.error || 'Erro ao excluir')
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Status excluído')
  }

  const handleDragStart = (id: string) => setDraggingId(id)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, overId: string) => {
    e.preventDefault()
    if (!draggingId || draggingId === overId) return
    const current = ordered.find(s => s.id === draggingId)
    const over = ordered.find(s => s.id === overId)
    if (!current || !over) return
    const newOrder = ordered.map(s => ({ ...s }))
    const from = newOrder.findIndex(s => s.id === draggingId)
    const to = newOrder.findIndex(s => s.id === overId)
    const [moved] = newOrder.splice(from, 1)
    newOrder.splice(to, 0, moved)
    // reindex
    newOrder.forEach((s, idx) => (s.order_index = idx + 1))
    setItems(newOrder)
  }
  const handleDrop = async () => {
    if (!draggingId) return
    setDraggingId(null)
    const payload = ordered.map(s => ({ id: s.id, order_index: s.order_index }))
    const res = await fetch('/api/statuses/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: payload }) })
    if (!res.ok) {
      toast.error('Erro ao salvar ordenação')
    } else {
      toast.success('Ordenação salva')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gerenciar Status dos Chamados</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Nome</label>
                <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800" />
              </div>
              <div>
                <label className="block text-sm mb-1">Slug</label>
                <input value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800" />
              </div>
              <div>
                <label className="block text-sm mb-1">Cor</label>
                <input type="color" value={(form.color as string) || '#2563eb'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-10 w-16 p-0 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm mb-1">Descrição</label>
                <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800" rows={3} />
              </div>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />
                  <span>Padrão</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.is_final} onChange={e => setForm(f => ({ ...f, is_final: e.target.checked }))} />
                  <span>Final</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.is_internal} onChange={e => setForm(f => ({ ...f, is_internal: e.target.checked }))} />
                  <span>Interno</span>
                </label>
              </div>
            </div>

            <button onClick={handleCreate} disabled={loading} className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Status
            </button>
          </div>

          {/* Lista com reorder */}
          <div className="space-y-2">
            {ordered.map(s => (
              <div key={s.id} draggable onDragStart={() => handleDragStart(s.id)} onDragOver={e => handleDragOver(e, s.id)} onDrop={handleDrop}
                className="flex items-center gap-3 p-3 border rounded-md bg-white dark:bg-gray-800">
                <GripVertical className="h-5 w-5 text-gray-400" />
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color || '#64748b' }} />
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.description}</div>
                </div>
                {s.is_default && <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" /> Default</span>}
                {s.is_final && <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-green-100 text-green-700"><FlagTriangleRight className="h-3 w-3 mr-1" /> Final</span>}
                {s.is_internal && <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-gray-100 text-gray-700"><EyeOff className="h-3 w-3 mr-1" /> Interno</span>}
                <button onClick={() => handleUpdate(s.id, { is_default: !s.is_default })} className="text-xs px-2 py-1 border rounded">Default</button>
                <button onClick={() => handleUpdate(s.id, { is_final: !s.is_final })} className="text-xs px-2 py-1 border rounded">Final</button>
                <button onClick={() => handleDelete(s.id)} className="text-xs px-2 py-1 border rounded text-red-600">Excluir</button>
              </div>
            ))}
            {ordered.length === 0 && <div className="text-sm text-gray-500">Nenhum status cadastrado.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}


