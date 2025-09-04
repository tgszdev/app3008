'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Headphones } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos')
      return
    }
    
    setIsLoading(true)
    
    try {
      console.log('Iniciando login...')
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      console.log('Resultado do login:', result)
      
      if (result?.error) {
        console.error('Erro no login:', result.error)
        toast.error('Email ou senha incorretos')
      } else if (result?.ok) {
        console.log('Login bem-sucedido!')
        toast.success('Login realizado com sucesso!')
        
        // Aguardar um pouco e redirecionar
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 500)
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-xl mb-4 transform hover:scale-105 transition-transform">
              <Headphones className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sistema de Suporte
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Entre com suas credenciais para continuar
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-px bg-gradient-to-r from-cyan-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all pr-12 outline-none"
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-px bg-gradient-to-r from-cyan-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Lembrar de mim</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent flex-1" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Desenvolvido por <span className="font-medium text-gray-700 dark:text-gray-300">Thiago Souza</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div className="hidden lg:block lg:w-1/2 xl:w-3/5 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/login-background.jpg)',
          }}
        >
          {/* Overlay gradient for better visual */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-blue-900/30 to-gray-900/40" />
          
          {/* Content overlay */}
          <div className="relative h-full flex items-center justify-center p-12">
            <div className="text-center text-white max-w-2xl">
              <div className="mb-8">
                {/* Animated circuit lines */}
                <svg className="w-full h-32 opacity-30" viewBox="0 0 400 100">
                  <path 
                    d="M 50 50 L 150 50 L 200 20 L 250 50 L 350 50" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    fill="none"
                    strokeDasharray="5,5"
                    className="animate-pulse"
                  />
                  <circle cx="50" cy="50" r="4" fill="currentColor" className="animate-pulse" />
                  <circle cx="150" cy="50" r="4" fill="currentColor" className="animate-pulse delay-75" />
                  <circle cx="200" cy="20" r="4" fill="currentColor" className="animate-pulse delay-150" />
                  <circle cx="250" cy="50" r="4" fill="currentColor" className="animate-pulse delay-200" />
                  <circle cx="350" cy="50" r="4" fill="currentColor" className="animate-pulse delay-300" />
                </svg>
              </div>
              
              <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
                Suporte Inteligente
              </h2>
              <p className="text-xl text-white/90 drop-shadow mb-8">
                Conectando você às soluções que precisa, quando precisa.
              </p>
              

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}