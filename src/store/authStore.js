import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

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
      }),
      onRehydrateStorage: () => {
        return () => {
          // Get the current state AFTER hydration (includes data from localStorage)
          const { token, user } = useAuthStore.getState()
          
          console.log('[Auth] Hydration complete, token:', !!token, 'user:', !!user)
          
          // If we have token and user from storage, set authenticated
          if (token && user) {
            useAuthStore.setState({ 
              isAuthenticated: true,
              _hasHydrated: true 
            })
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            
            // Verify in background (don't block)
            api.get('/auth/me')
              .then(res => {
                useAuthStore.setState({ user: res.data.data.user })
              })
              .catch(() => {
                console.log('[Auth] Token verification failed, clearing auth')
                useAuthStore.setState({ 
                  user: null, 
                  token: null, 
                  isAuthenticated: false 
                })
                delete api.defaults.headers.common['Authorization']
              })
          } else {
            // No stored credentials
            useAuthStore.setState({ _hasHydrated: true })
          }
        }
      }
    }
  )
)

// Fallback: Ensure hydration flag is set even if callback doesn't fire
setTimeout(() => {
  const state = useAuthStore.getState()
  if (!state._hasHydrated) {
    console.log('[Auth] Fallback: Setting hydrated flag')
    // Also check localStorage directly
    try {
      const stored = localStorage.getItem('powermerchant-auth')
      if (stored) {
        const { state: storedState } = JSON.parse(stored)
        if (storedState?.token && storedState?.user) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedState.token}`
          useAuthStore.setState({
            token: storedState.token,
            user: storedState.user,
            isAuthenticated: true,
            _hasHydrated: true
          })
          return
        }
      }
    } catch (e) {
      console.error('[Auth] Error reading from localStorage:', e)
    }
    useAuthStore.setState({ _hasHydrated: true })
  }
}, 150)

