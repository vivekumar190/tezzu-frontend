import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/', { replace: true })
    } catch (error) {
      // Error is handled by axios interceptor
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-400 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZWMGg2djMwem0tNiAwSDI0VjBoNnYzMHptLTYgMEgxOFYwaDZ2MzB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-white">Tezzu</h1>
              <p className="text-white/80">WhatsApp Commerce Platform</p>
            </div>
          </div>
          
          <div className="space-y-6 text-white/90 max-w-md">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-lg">🛒</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">WhatsApp-First Commerce</h3>
                <p className="text-white/70 text-sm">Accept orders directly through WhatsApp with seamless customer experience</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-lg">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Real-Time Dashboard</h3>
                <p className="text-white/70 text-sm">Monitor orders, manage menus, and track performance in real-time</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-lg">🚀</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Multi-Merchant Support</h3>
                <p className="text-white/70 text-sm">Manage multiple merchants from a single WhatsApp number</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl gradient-text">Tezzu</h1>
              <p className="text-xs text-surface-400">WhatsApp Commerce</p>
            </div>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-surface-900">Welcome back</h2>
              <p className="text-surface-500 mt-1">Sign in to your admin account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-12"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}

