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
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-2xl shadow-xl mb-4 transform hover:scale-105 transition-transform">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 backdrop-blur-sm dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-px bg-gradient-to-r from-purple-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 backdrop-blur-sm dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12 outline-none"
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
                  <div className="w-5 h-px bg-gradient-to-r from-purple-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Lembrar de mim</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center shadow-lg"
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
            backgroundImage: 'url(/images/login-background.jpg)',
          }}
        >
          {/* Overlay gradient for better visual */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-blue-900/20 to-purple-900/30" />
          
          {/* Content overlay */}
          <div className="relative h-full flex items-center justify-center p-12">
            <div className="text-center text-white max-w-2xl">
              {/* Glowing chat bubble icon matching the image theme */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping">
                    <div className="w-24 h-24 bg-pink-400/30 rounded-2xl blur-xl"></div>
                  </div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-pink-400/20 to-cyan-400/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <h2 className="text-5xl font-bold mb-4 drop-shadow-2xl bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
                Suporte Inteligente
              </h2>
              <p className="text-xl text-white/95 drop-shadow-lg mb-8 font-light">
                Tecnologia e inovação conectando você às melhores soluções
              </p>
              
              <div className="grid grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-200">24/7</div>
                  <div className="text-sm text-white/70 mt-1">Disponível</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-200">IA</div>
                  <div className="text-sm text-white/70 mt-1">Assistida</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-200">100%</div>
                  <div className="text-sm text-white/70 mt-1">Seguro</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}