import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, ArrowRight, MessageCircle, ChefHat, Bike, Users, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

const ROLE_ICONS = {
  cook: ChefHat,
  delivery_boy: Bike,
  cashier: Users,
  manager: Users,
  helper: Users
}

export default function StaffLogin() {
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [staffInfo, setStaffInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    setIsLoading(true)
    try {
      const res = await api.post('/auth/staff/send-otp', { phone })
      setStaffInfo(res.data.data)
      setStep('otp')
      
      // Show OTP in toast for testing (development mode)
      if (res.data.otp) {
        setOtp(res.data.otp)
        toast.success(
          `🔐 Your OTP: ${res.data.otp}`,
          { 
            duration: 10000,
            style: {
              background: '#10B981',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '18px',
              padding: '16px 24px'
            }
          }
        )
      } else {
        toast.success('OTP sent to your WhatsApp!')
      }
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    try {
      const res = await api.post('/auth/staff/verify-otp', { phone, otp })
      const { user, token, refreshToken } = res.data.data
      
      // Store auth data
      useAuthStore.setState({
        user,
        token,
        isAuthenticated: true,
        _hasHydrated: true
      })
      
      // Store in localStorage
      localStorage.setItem('powermerchant-auth', JSON.stringify({
        state: { user, token }
      }))
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      toast.success(`Welcome, ${user.name}!`)
      navigate('/staff/orders')
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsLoading(false)
    }
  }

  const RoleIcon = staffInfo?.role ? (ROLE_ICONS[staffInfo.role] || Users) : Users

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur mb-4">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Tezzu Staff</h1>
          <p className="text-emerald-100 mt-2">Staff Portal Login</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter your phone number</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Use the phone number registered by your manager
                </p>
                
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full pl-14 pr-4 py-4 border border-gray-200 rounded-xl text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || phone.length < 10}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send OTP via WhatsApp
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              {/* Staff Info */}
              {staffInfo && (
                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-emerald-200 flex items-center justify-center">
                    <RoleIcon className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{staffInfo.staffName}</p>
                    <p className="text-sm text-emerald-600 capitalize">{staffInfo.role?.replace('_', ' ')}</p>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter OTP</h2>
                <p className="text-sm text-gray-500 mb-4">
                  We sent a 6-digit code to your WhatsApp
                </p>
                
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl text-2xl text-center tracking-[0.5em] font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  autoFocus
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Login
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change phone number
              </button>
            </form>
          )}
        </div>

        {/* Back to Admin */}
        <p className="text-center mt-6">
          <a href="/login" className="text-emerald-100 hover:text-white text-sm">
            Admin/Merchant Login →
          </a>
        </p>
      </div>
    </div>
  )
}
