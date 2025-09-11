'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink } from 'lucide-react'

export default function SetupPage() {
  const [config, setConfig] = useState({
    supabaseUrl: false,
    supabaseAnonKey: false,
    supabaseServiceKey: false,
    nextAuthUrl: false,
    nextAuthSecret: false,
    nodeEnv: '',
  })

  useEffect(() => {
    // Check configuration on client side
    setConfig({
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: false, // Can't check server-only vars from client
      nextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthSecret: false, // Can't check server-only vars from client
      nodeEnv: process.env.NODE_ENV || 'development',
    })
  }, [])

  const envExample = `# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth Configuration (REQUIRED)
NEXTAUTH_URL=https://www.ithostbr.tech
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copiado para a área de transferência!')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configuração do Sistema
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Verifique e configure as variáveis de ambiente necessárias
            </p>
          </div>

          <div className="p-6">
            {/* Status Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Status da Configuração
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {config.supabaseUrl ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">
                      NEXT_PUBLIC_SUPABASE_URL
                    </span>
                  </div>
                  <span className={`text-sm ${config.supabaseUrl ? 'text-green-600' : 'text-red-600'}`}>
                    {config.supabaseUrl ? 'Configurado' : 'Não configurado'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {config.supabaseAnonKey ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">
                      NEXT_PUBLIC_SUPABASE_ANON_KEY
                    </span>
                  </div>
                  <span className={`text-sm ${config.supabaseAnonKey ? 'text-green-600' : 'text-red-600'}`}>
                    {config.supabaseAnonKey ? 'Configurado' : 'Não configurado'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Ambiente
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {config.nodeEnv}
                  </span>
                </div>
              </div>
            </div>

            {/* Alert Box */}
            {(!config.supabaseUrl || !config.supabaseAnonKey) && (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex">
                  <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Configuração Incompleta
                    </h3>
                    <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                      As variáveis de ambiente do Supabase são obrigatórias para o funcionamento do sistema.
                      Configure-as no seu servidor ou plataforma de hospedagem.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Como Configurar
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    1. Obtenha suas credenciais do Supabase
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>Acesse seu projeto no <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">Supabase <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                    <li>Vá em Settings → API</li>
                    <li>Copie a URL do projeto e as chaves anon/service_role</li>
                  </ol>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    2. Configure no Vercel/Netlify
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-green-800 dark:text-green-200">
                    <li>Acesse o painel do seu projeto</li>
                    <li>Vá em Settings → Environment Variables</li>
                    <li>Adicione cada variável com seu valor correspondente</li>
                    <li>Faça o redeploy do projeto</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Environment Variables Template */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Template de Variáveis de Ambiente
              </h2>
              
              <div className="relative">
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                  <code>{envExample}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(envExample)}
                  className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Generate Secret Command */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Gerar NEXTAUTH_SECRET:
              </p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-gray-900 text-green-400 rounded text-xs">
                  openssl rand -base64 32
                </code>
                <button
                  onClick={() => copyToClipboard('openssl rand -base64 32')}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                >
                  <Copy className="h-4 w-4 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Links */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Links Úteis
              </h3>
              <div className="space-y-2">
                <a
                  href="https://supabase.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  Documentação do Supabase <ExternalLink className="h-3 w-3 ml-1" />
                </a>
                <br />
                <a
                  href="https://vercel.com/docs/environment-variables"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  Variáveis de Ambiente no Vercel <ExternalLink className="h-3 w-3 ml-1" />
                </a>
                <br />
                <a
                  href="https://github.com/tgszdev/app3008"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  Repositório do Projeto <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}