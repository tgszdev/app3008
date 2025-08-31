'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function TestRolePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Permissões</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Informações do Usuário</h2>
        {session?.user ? (
          <div className="space-y-2">
            <p><strong>Nome:</strong> {session.user.name}</p>
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>Role:</strong> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{session.user.role || 'Não definido'}</span></p>
            <p><strong>ID:</strong> {session.user.id}</p>
          </div>
        ) : (
          <p>Não autenticado</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Permissões</h2>
        <div className="space-y-2">
          <p>
            <strong>Pode atribuir analistas:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-white ${
              session?.user?.role === 'admin' || session?.user?.role === 'analyst' 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`}>
              {session?.user?.role === 'admin' || session?.user?.role === 'analyst' ? 'SIM' : 'NÃO'}
            </span>
          </p>
          <p>
            <strong>Pode excluir tickets:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-white ${
              session?.user?.role === 'admin' || session?.user?.role === 'analyst' 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`}>
              {session?.user?.role === 'admin' || session?.user?.role === 'analyst' ? 'SIM' : 'NÃO'}
            </span>
          </p>
          <p>
            <strong>Pode alterar status:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-white ${
              session?.user?.role === 'admin' || session?.user?.role === 'analyst' 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`}>
              {session?.user?.role === 'admin' || session?.user?.role === 'analyst' ? 'SIM' : 'NÃO'}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Testar Páginas</h2>
        <div className="space-y-2">
          <Link href="/dashboard/tickets/new" className="block text-blue-600 hover:text-blue-800">
            → Criar Novo Ticket (deve esconder campo "Atribuir para" se role = user)
          </Link>
          <Link href="/dashboard/tickets" className="block text-blue-600 hover:text-blue-800">
            → Lista de Tickets (deve esconder botão excluir se role = user)
          </Link>
          <Link href="/dashboard" className="block text-blue-600 hover:text-blue-800">
            → Dashboard
          </Link>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Se o campo "Atribuir para" ainda aparecer para usuários com role "user", 
          tente limpar o cache do navegador (Ctrl+F5) ou abrir em uma aba anônima.
        </p>
      </div>
    </div>
  )
}