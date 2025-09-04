'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://page.gensparksite.com/v1/base64_upload/089f4dbd70e29e67854b198dbca7fa13)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-blue-800/30 to-gray-900/40" />
      </div>
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <Shield className="w-12 h-12 text-white" />
              </div>
              {/* Decorative dots */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-150" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Bem-vindo de volta
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Faça login para acessar o sistema
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-700/80 backdrop-blur text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-white/90 dark:hover:bg-gray-700/90"
                placeholder="seu@email.com"
                disabled={isLoading}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-700/80 backdrop-blur text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 hover:bg-white/90 dark:hover:bg-gray-700/90"
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 px-4 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center shadow-lg"
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

          {/* Decorative bottom element */}
          <div className="mt-8 flex items-center justify-center space-x-2">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent flex-1" />
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-400 rounded-full" />
              <div className="w-1 h-1 bg-blue-500 rounded-full" />
              <div className="w-1 h-1 bg-blue-600 rounded-full" />
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent flex-1" />
          </div>
        </div>
      </div>
    </div>
  )
}