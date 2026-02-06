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
    // Get token from sessionStorage on every request (tab-isolated)
    try {
      const authData = sessionStorage.getItem('powermerchant-auth')
      if (authData) {
        const { state } = JSON.parse(authData)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Safely extract error message as a string
    let message = 'Something went wrong'
    
    if (error.response?.data?.error?.message) {
      const errorMsg = error.response.data.error.message
      // Ensure message is a string
      message = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
    } else if (error.response?.data?.message) {
      // Handle flat error structure (e.g., plan limit errors)
      message = error.response.data.message
    } else if (typeof error.message === 'string') {
      message = error.message
    }
    
    // Don't show toast for auth check failures, network errors, or plan limit errors
    // Plan limit errors should be handled by the component for better UX
    const isAuthCheck = error.config?.url === '/auth/me'
    const isNetworkError = !error.response
    const isPlanLimitError = error.response?.data?.error === 'PLAN_LIMIT_REACHED'
    
    if (!isAuthCheck && !isNetworkError && !isPlanLimitError) {
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

