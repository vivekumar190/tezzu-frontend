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

// Request interceptor - always get fresh token from sessionStorage
api.interceptors.request.use(
  (config) => {
    // Get token from sessionStorage (zustand persist format: { state: { token, user }, version })
    try {
      const authData = sessionStorage.getItem('powermerchant-auth')
      if (authData) {
        const parsed = JSON.parse(authData)
        const token = parsed?.state?.token ?? parsed?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      // Fallback: use axios default header (set by auth store on login)
      if (!config.headers.Authorization && api.defaults.headers?.common?.Authorization) {
        config.headers.Authorization = api.defaults.headers.common.Authorization
      }
    } catch (e) {
      // Ignore parse errors
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Errors that are expected/normal - don't show full error toast
const SILENT_ERRORS = [
  'No custom domain configured',
  'No custom domain'
]

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Safely extract error message as a string
    let message = 'Something went wrong'
    const dataError = error.response?.data?.error

    if (dataError?.message) {
      message = typeof dataError.message === 'string' ? dataError.message : JSON.stringify(dataError.message)
    } else if (typeof dataError === 'string') {
      message = dataError
    } else if (error.response?.data?.message) {
      message = error.response.data.message
    } else if (typeof error.message === 'string') {
      message = error.message
    }

    // Don't show toast for auth check, network errors, plan limit, or expected/silent errors
    const isAuthCheck = error.config?.url === '/auth/me'
    const isNetworkError = !error.response
    const isPlanLimitError = dataError === 'PLAN_LIMIT_REACHED'
    const isSilentError = SILENT_ERRORS.some(s => message?.includes?.(s))

    if (!isAuthCheck && !isNetworkError && !isPlanLimitError && !isSilentError) {
      toast.error(message)
    }

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      // Don't clear auth for /auth/me - let the auth store handle it
      const isAuthCheck = error.config?.url === '/auth/me'
      
      // Only redirect if not on login page and not an auth check
      if (!window.location.pathname.includes('/login') && !isAuthCheck) {
        sessionStorage.removeItem('powermerchant-auth')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api

