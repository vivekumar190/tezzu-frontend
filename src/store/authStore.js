import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '../lib/api'

// Use sessionStorage for tab-isolated sessions (prevents cross-tab conflicts)
// Each browser tab gets its own independent session
const storage = createJSONStorage(() => sessionStorage)

// Read initial state from sessionStorage synchronously
function getInitialState() {
  try {
    const stored = sessionStorage.getItem('powermerchant-auth')
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
      storage: storage, // Use sessionStorage for tab-isolated sessions
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
        // Update user data from server
        const userData = res.data.data.user || res.data.data
        useAuthStore.setState({ user: userData })
      })
      .catch((error) => {
        // Only clear auth if it's a 401 (unauthorized) - not for network errors
        if (error.response?.status === 401) {
          console.log('[Auth] Token expired or invalid')
        useAuthStore.setState({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        })
        delete api.defaults.headers.common['Authorization']
          sessionStorage.removeItem('powermerchant-auth')
        } else {
          // For other errors (network, server down), keep the session
          console.log('[Auth] Verification failed (non-401), keeping session:', error.message)
        }
      })
  }, 1000)
}

