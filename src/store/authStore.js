import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

// Read initial state from localStorage synchronously
function getInitialState() {
  try {
    const stored = localStorage.getItem('powermerchant-auth')
    if (stored) {
      const { state } = JSON.parse(stored)
      if (state?.token && state?.user) {
        // Set auth header immediately
        api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        return {
          user: state.user,
          token: state.token,
          isAuthenticated: true,
          isLoading: false,
          _hasHydrated: true
        }
      }
    }
  } catch (e) {
    console.error('[Auth] Error reading initial state:', e)
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    _hasHydrated: true
  }
}

const initialState = getInitialState()

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { user, accessToken } = response.data.data
        
        set({
          user,
          token: accessToken,
          isAuthenticated: true,
          isLoading: false,
          _hasHydrated: true
        })
        
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        return user
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          // Ignore logout errors
        }
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
        
        delete api.defaults.headers.common['Authorization']
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      }
    }),
    {
      name: 'powermerchant-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user
      })
    }
  )
)

// Verify token in background (once, after initial render)
let hasVerified = false
if (initialState.token && !hasVerified) {
  hasVerified = true
  // Delay verification to avoid immediate API call on every HMR reload
  setTimeout(() => {
    api.get('/auth/me')
      .then(res => {
        useAuthStore.setState({ user: res.data.data.user })
      })
      .catch(() => {
        console.log('[Auth] Token verification failed')
        useAuthStore.setState({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        })
        delete api.defaults.headers.common['Authorization']
      })
  }, 1000)
}

