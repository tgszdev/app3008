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
            <strong>Pode definir data de vencimento:</strong> 
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
              session?.user?.role === 'admin' 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`}>
              {session?.user?.role === 'admin' ? 'SIM' : 'NÃO'}
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
            → Criar Novo Ticket (deve esconder campos "Atribuir para" e "Data de Vencimento" se role = user)
          </Link>
          <Link href="/dashboard/tickets" className="block text-blue-600 hover:text-blue-800">
            → Lista de Tickets (deve esconder botão excluir se role = user)
          </Link>
          <Link href="/dashboard" className="block text-blue-600 hover:text-blue-800">
            → Dashboard
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Matriz de Permissões</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Ação</th>
              <th className="text-center py-2">Admin</th>
              <th className="text-center py-2">Analyst</th>
              <th className="text-center py-2">User</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">Criar tickets</td>
              <td className="text-center">✅</td>
              <td className="text-center">✅</td>
              <td className="text-center">✅</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Atribuir analistas</td>
              <td className="text-center">✅</td>
              <td className="text-center">✅</td>
              <td className="text-center">❌</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Definir data vencimento</td>
              <td className="text-center">✅</td>
              <td className="text-center">✅</td>
              <td className="text-center">❌</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Alterar status</td>
              <td className="text-center">✅</td>
              <td className="text-center">✅</td>
              <td className="text-center">❌</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Cancelar tickets</td>
              <td className="text-center">✅</td>
              <td className="text-center">❌</td>
              <td className="text-center">❌</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Reativar tickets cancelados</td>
              <td className="text-center">✅</td>
              <td className="text-center">❌</td>
              <td className="text-center">❌</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Excluir tickets</td>
              <td className="text-center">✅</td>
              <td className="text-center">❌</td>
              <td className="text-center">❌</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Gerenciar usuários</td>
              <td className="text-center">✅</td>
              <td className="text-center">❌</td>
              <td className="text-center">❌</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Se os campos "Atribuir para" ou "Data de Vencimento" ainda aparecerem para usuários com role "user", 
          tente limpar o cache do navegador (Ctrl+F5) ou abrir em uma aba anônima.
        </p>
        <p className="text-sm text-yellow-800 mt-2">
          <strong>Novo:</strong> Status "Cancelado" foi adicionado aos tickets. Analysts não podem mais excluir tickets.
        </p>
        <p className="text-sm text-yellow-800 mt-2">
          <strong>Regras de Cancelamento:</strong> Apenas Admin pode cancelar tickets ou reativar tickets cancelados. 
          Motivo obrigatório será registrado nos comentários.
        </p>
      </div>
    </div>
  )
}