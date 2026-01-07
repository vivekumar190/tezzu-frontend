import axios from 'axios'
import toast from 'react-hot-toast'

// Use environment variable for production, proxy for development
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message || 
                    error.message || 
                    'Something went wrong'
    
    // Don't show toast for auth check failures
    if (error.config?.url !== '/auth/me') {
      toast.error(message)
    }

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      // Only redirect if not on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('powermerchant-auth')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api

