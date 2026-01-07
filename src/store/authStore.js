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
        const { token } = get()
        
        if (!token) {
          set({ isLoading: false })
          return false
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        try {
          const response = await api.get('/auth/me')
          set({
            user: response.data.data.user,
            isAuthenticated: true,
            isLoading: false
          })
          return true
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          })
          delete api.defaults.headers.common['Authorization']
          return false
        }
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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.checkAuth()
        }
      }
    }
  )
)

