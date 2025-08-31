'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Verificar se já está autenticado e redirecionar
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard'
      console.log('Usuário autenticado, redirecionando para:', callbackUrl)
      
      // Usar replace para evitar voltar para a página de login
      window.location.replace(callbackUrl)
    }
  }, [status, session, searchParams])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    
    try {
      // Obter callbackUrl
      const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard'
      console.log('Tentando login, callbackUrl:', callbackUrl)
      
      // Fazer login com redirect: false para capturar erros
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false, // Importante: false para podermos tratar erros
      })
      
      console.log('Resultado do login:', result)
      
      if (result?.error) {
        // Login falhou
        console.error('Erro de login:', result.error)
        toast.error('Email ou senha incorretos')
        setIsLoading(false)
        return
      }
      
      if (result?.ok) {
        // Login bem-sucedido
        console.log('Login bem-sucedido!')
        toast.success('Login realizado com sucesso!')
        
        // Aguardar um momento para a sessão ser estabelecida
        setTimeout(() => {
          console.log('Redirecionando para:', callbackUrl)
          
          // Usar window.location.replace para garantir redirecionamento
          window.location.replace(callbackUrl)
        }, 100)
      }
      
    } catch (error: any) {
      console.error('Erro inesperado:', error)
      toast.error('Erro ao fazer login. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Bem-vindo de volta
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Faça login para acessar o sistema
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="seu@email.com"
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
              <strong>Demo:</strong> admin@example.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}