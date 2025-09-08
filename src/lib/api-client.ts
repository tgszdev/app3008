import axios from 'axios'

// Configurar axios para incluir cookies nas requisições
const apiClient = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar tokens se necessário
apiClient.interceptors.request.use(
  (config) => {
    // Cookies são enviados automaticamente com withCredentials: true
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login se não autenticado
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient