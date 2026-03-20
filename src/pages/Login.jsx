import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(null) // null | 'email' | 'otp' | 'newpass' | 'done'
  const [resetEmail, setResetEmail] = useState('')
  const [resetOtp, setResetOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [resetTimer, setResetTimer] = useState(0)
  const [resetError, setResetError] = useState('')
  const [devResetOtp, setDevResetOtp] = useState(null)
  const resetOtpRefs = useRef([])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (resetTimer > 0) {
      const interval = setInterval(() => setResetTimer(t => t - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [resetTimer])

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

  // Forgot password handlers
  const handleForgotSendOTP = async () => {
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetError('Please enter a valid email address')
      return
    }
    setIsLoading(true)
    setResetError('')
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      })
      const data = await res.json()
      if (data.success) {
        setForgotMode('otp')
        setResetTimer(60)
        if (data.otp) {
          setDevResetOtp(data.otp)
          toast.success(`Reset OTP: ${data.otp}`, { duration: 15000 })
        } else {
          toast.success('If that email exists, a reset code has been sent')
        }
        setTimeout(() => resetOtpRefs.current[0]?.focus(), 100)
      } else {
        setResetError(data.error?.message || 'Failed to send reset code')
      }
    } catch {
      setResetError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetOtpChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1]
    if (value && !/\d/.test(value)) return
    const newOtp = [...resetOtp]
    newOtp[index] = value
    setResetOtp(newOtp)
    if (value && index < 5) resetOtpRefs.current[index + 1]?.focus()
  }

  const handleResetOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !resetOtp[index] && index > 0) {
      resetOtpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyResetOtp = () => {
    if (resetOtp.join('').length !== 6) {
      setResetError('Please enter the complete 6-digit code')
      return
    }
    setResetError('')
    setForgotMode('newpass')
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match')
      return
    }
    setIsLoading(true)
    setResetError('')
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          otp: resetOtp.join(''),
          newPassword,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setForgotMode('done')
        toast.success('Password reset successfully!')
      } else {
        setResetError(data.error?.message || data.message || 'Reset failed')
      }
    } catch {
      setResetError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const exitForgotMode = () => {
    setForgotMode(null)
    setResetEmail('')
    setResetOtp(['', '', '', '', '', ''])
    setNewPassword('')
    setConfirmNewPassword('')
    setResetError('')
    setDevResetOtp(null)
  }

  // Render forgot password flow
  const renderForgotPassword = () => {
    if (forgotMode === 'email') {
      return (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-display font-bold text-surface-900">Reset Password</h2>
            <p className="text-surface-500 mt-1">Enter your email to receive a reset code</p>
          </div>

          <div>
            <label className="label">Email address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="input pl-12"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {resetError && <p className="text-sm text-red-600">{resetError}</p>}

          <button onClick={handleForgotSendOTP} disabled={isLoading} className="btn btn-primary w-full">
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : 'Send Reset Code'}
          </button>

          <button onClick={exitForgotMode} className="w-full text-center text-sm text-surface-500 hover:text-surface-700 flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>
        </div>
      )
    }

    if (forgotMode === 'otp') {
      return (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-display font-bold text-surface-900">Enter Reset Code</h2>
            <p className="text-surface-500 mt-1">
              Enter the 6-digit code sent to <strong className="text-surface-700">{resetEmail}</strong>
            </p>
          </div>

          {devResetOtp && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">Dev Mode — Reset OTP</p>
              <p className="text-3xl font-mono font-bold text-amber-800 tracking-[0.3em]">{devResetOtp}</p>
            </div>
          )}

          <div className="flex justify-center gap-3">
            {resetOtp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (resetOtpRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleResetOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleResetOtpKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-surface-200 rounded-xl
                           focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            ))}
          </div>

          {resetError && <p className="text-sm text-red-600 text-center">{resetError}</p>}

          <button onClick={handleVerifyResetOtp} disabled={isLoading} className="btn btn-primary w-full">
            Continue
          </button>

          <div className="flex items-center justify-between">
            <button onClick={() => setForgotMode('email')} className="text-sm text-surface-500 hover:text-surface-700 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Change email
            </button>
            {resetTimer > 0 ? (
              <p className="text-sm text-surface-500">Resend in {resetTimer}s</p>
            ) : (
              <button onClick={handleForgotSendOTP} disabled={isLoading} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Resend Code
              </button>
            )}
          </div>
        </div>
      )
    }

    if (forgotMode === 'newpass') {
      return (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-display font-bold text-surface-900">Set New Password</h2>
            <p className="text-surface-500 mt-1">Choose a strong password for your account</p>
          </div>

          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input pl-12 pr-12"
                placeholder="Min 6 characters"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="input pl-12"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          {resetError && <p className="text-sm text-red-600">{resetError}</p>}

          <button onClick={handleResetPassword} disabled={isLoading} className="btn btn-primary w-full">
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Resetting...</> : 'Reset Password'}
          </button>
        </div>
      )
    }

    if (forgotMode === 'done') {
      return (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-surface-900">Password Reset!</h2>
            <p className="text-surface-500 mt-2">Your password has been changed successfully.</p>
          </div>
          <button onClick={exitForgotMode} className="btn btn-primary w-full">
            Back to Login
          </button>
        </div>
      )
    }

    return null
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
            {forgotMode ? (
              renderForgotPassword()
            ) : (
              <>
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
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="password" className="label mb-0">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMode('email')
                          setResetEmail(email)
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
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

                {/* Staff login link */}
                <div className="mt-6 pt-6 border-t border-surface-100 text-center">
                  <p className="text-sm text-surface-500 mb-1">Are you a staff member?</p>
                  <a 
                    href="/staff/login" 
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Login to Staff Portal →
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
