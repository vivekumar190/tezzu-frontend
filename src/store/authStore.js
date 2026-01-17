import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      _hasHydrated: false,

      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { user, accessToken } = response.data.data
        
        set({
          user,
          token: accessToken,
          isAuthenticated: true,
          isLoading: false
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

      checkAuth: async () => {
        const { token, user } = get()
        
        if (!token) {
          set({ isLoading: false, _hasHydrated: true })
          return false
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        // If we already have user data from storage, use it immediately
        // but still verify with the server in background
        if (user && user.role) {
          set({ 
            isAuthenticated: true, 
            isLoading: false,
            _hasHydrated: true
          })
        }

        try {
          const response = await api.get('/auth/me')
          set({
            user: response.data.data.user,
            isAuthenticated: true,
            isLoading: false,
            _hasHydrated: true
          })
          return true
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            _hasHydrated: true
          })
          delete api.defaults.headers.common['Authorization']
          return false
        }
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      }
    }),
    {
      name: 'powermerchant-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Immediately set loading false if we have user data
          if (state.token && state.user) {
            state.isAuthenticated = true
            state.isLoading = false
          }
          // Then verify with server
          state.checkAuth()
        } else {
          // No stored state
          useAuthStore.setState({ isLoading: false, _hasHydrated: true })
        }
      }
    }
  )
)

