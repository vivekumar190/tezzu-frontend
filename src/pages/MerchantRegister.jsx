import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MessageCircle, ArrowLeft, ArrowRight, Loader2, Phone, Store, MapPin, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import WhatsAppEmbeddedSignup from '../components/WhatsAppEmbeddedSignup'
import toast from 'react-hot-toast'
import api from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function MerchantRegister() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [step, setStep] = useState(1) // 1=phone, 2=otp, 3=business, 4=whatsapp, 5=done

  // Step 1 & 2: Phone + OTP
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpTimer, setOtpTimer] = useState(0)
  const otpRefs = useRef([])

  // Step 3: Business details
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [keyword, setKeyword] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '' })
  const [cuisineType, setCuisineType] = useState('')
  const [description, setDescription] = useState('')

  // Auth state after registration
  const [merchantData, setMerchantData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [otpTimer])

  // Auto-generate keyword from business name
  useEffect(() => {
    if (businessName && !keyword) {
      setKeyword(businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20))
    }
  }, [businessName])

  const normalizePhone = (p) => {
    let cleaned = p.replace(/\D/g, '')
    if (cleaned.length === 10) cleaned = '+91' + cleaned
    else if (cleaned.startsWith('91') && cleaned.length === 12) cleaned = '+' + cleaned
    else if (!cleaned.startsWith('+')) cleaned = '+91' + cleaned
    return cleaned
  }

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(phone) }),
      })
      const data = await res.json()
      if (data.success) {
        setStep(2)
        setOtpTimer(60)
        if (data.otp) {
          toast.success(`OTP: ${data.otp}`, { duration: 10000 })
        }
        setTimeout(() => otpRefs.current[0]?.focus(), 100)
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // OTP input handling
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1]
    if (value && !/\d/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // Step 2 -> 3: OTP entered, move to business details
  const handleOtpNext = () => {
    if (otp.join('').length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }
    setError('')
    setStep(3)
  }

  // Step 3: Register merchant
  const handleRegister = async () => {
    if (!businessName.trim()) { setError('Business name is required'); return }
    if (!ownerName.trim()) { setError('Your name is required'); return }
    if (!keyword.trim()) { setError('Store URL is required'); return }

    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/merchant-register', {
        phone: normalizePhone(phone),
        otp: otp.join(''),
        name: businessName,
        ownerName,
        keyword: keyword.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        email: email || undefined,
        address,
        cuisineType: cuisineType || undefined,
        description: description || undefined,
      })

      if (res.data.success) {
        const { user, accessToken, merchant } = res.data.data
        setMerchantData(merchant)

        // Log the user in
        useAuthStore.setState({
          user,
          token: accessToken,
          isAuthenticated: true,
          isLoading: false,
          _hasHydrated: true,
        })
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

        toast.success('Merchant registered successfully!')
        setStep(4)
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Step 4 -> 5: WhatsApp connected
  const handleWhatsAppSuccess = () => {
    setStep(5)
  }

  // Step 5: Done
  const handleGoToDashboard = () => {
    navigate('/', { replace: true })
  }

  const stepTitles = ['Phone Number', 'Verify OTP', 'Business Details', 'Connect WhatsApp', 'All Set!']

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-green-500 to-teal-400 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZWMGg2djMwem0tNiAwSDI0VjBoNnYzMHptLTYgMEgxOFYwaDZ2MzB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-white">Tezzu</h1>
              <p className="text-white/80">Start Selling on WhatsApp</p>
            </div>
          </div>

          <div className="space-y-5 text-white/90 max-w-md">
            {[
              { icon: '1', title: 'Register your business', desc: 'Verify your phone and add business details' },
              { icon: '2', title: 'Connect WhatsApp', desc: 'One-click setup with Facebook — your own WhatsApp number' },
              { icon: '3', title: 'Add products & go live', desc: 'Upload your menu, share your link, start receiving orders' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-white/70 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/10" />
      </div>

      {/* Right side - Registration form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-50">
        <div className="w-full max-w-lg">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-surface-900">Tezzu</h1>
              <p className="text-xs text-surface-400">Register your business</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {stepTitles.map((title, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    i + 1 < step ? 'bg-green-500 text-white'
                    : i + 1 === step ? 'bg-primary-500 text-white'
                    : 'bg-surface-200 text-surface-500'
                  }`}>
                    {i + 1 < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-[10px] mt-1 text-surface-500 hidden sm:block">{title}</span>
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="card p-8">
            {/* Step 1: Phone Number */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-surface-900">Get Started</h2>
                  <p className="text-surface-500 mt-1">Enter your phone number to register</p>
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input pl-12 text-lg"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button onClick={handleSendOTP} disabled={loading} className="btn btn-primary w-full">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending OTP...</> : 'Send OTP'}
                </button>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-surface-900">Verify OTP</h2>
                  <p className="text-surface-500 mt-1">Enter the 6-digit code sent to {phone}</p>
                </div>

                <div className="flex justify-center gap-3">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-surface-200 rounded-xl
                                 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                    />
                  ))}
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn btn-secondary flex-1">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={handleOtpNext} className="btn btn-primary flex-1">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {otpTimer > 0 ? (
                  <p className="text-center text-sm text-surface-500">Resend OTP in {otpTimer}s</p>
                ) : (
                  <button onClick={handleSendOTP} className="w-full text-center text-sm text-primary-600 hover:text-primary-700">
                    Resend OTP
                  </button>
                )}
              </div>
            )}

            {/* Step 3: Business Details */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-display font-bold text-surface-900">Business Details</h2>
                  <p className="text-surface-500 mt-1">Tell us about your business</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Business Name *</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="input pl-10"
                        placeholder="e.g. Pizza Paradise"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Your Name *</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="input"
                      placeholder="Owner / Manager name"
                    />
                  </div>

                  <div>
                    <label className="label">Store URL *</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2.5 bg-surface-100 border border-r-0 border-surface-200 rounded-l-lg text-sm text-surface-500">
                        tezzu.in/@
                      </span>
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="input rounded-l-none flex-1"
                        placeholder="pizzaparadise"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Email (optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      placeholder="business@email.com"
                    />
                  </div>

                  <div>
                    <label className="label">Cuisine / Category</label>
                    <select
                      value={cuisineType}
                      onChange={(e) => setCuisineType(e.target.value)}
                      className="input"
                    >
                      <option value="">Select type...</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Cafe">Cafe</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Grocery">Grocery</option>
                      <option value="Sweets">Sweets</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="General">General Store</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="input pl-10"
                        placeholder="e.g. Mumbai"
                      />
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="btn btn-secondary">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={handleRegister} disabled={loading} className="btn btn-primary flex-1">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> : <>Register Business <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Connect WhatsApp */}
            {step === 4 && merchantData && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-surface-900">Connect WhatsApp</h2>
                  <p className="text-surface-500 mt-1">
                    Connect your WhatsApp Business number so customers can order via WhatsApp
                  </p>
                </div>

                <WhatsAppEmbeddedSignup
                  merchantId={merchantData._id}
                  onSuccess={handleWhatsAppSuccess}
                />

                <div className="pt-4 border-t border-surface-100">
                  <button
                    onClick={() => setStep(5)}
                    className="text-sm text-surface-500 hover:text-surface-700"
                  >
                    Skip for now — I'll connect WhatsApp later
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: All Done */}
            {step === 5 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-display font-bold text-surface-900">You're All Set!</h2>
                  <p className="text-surface-500 mt-2">
                    Your business <strong>{merchantData?.name || businessName}</strong> is registered on Tezzu.
                  </p>
                </div>

                <div className="bg-surface-50 rounded-xl p-4 text-left space-y-3">
                  <p className="text-sm text-surface-600">
                    <strong>Store URL:</strong>{' '}
                    <a href={`https://tezzu.in/store/${merchantData?.keyword || keyword}`} target="_blank" rel="noreferrer"
                       className="text-primary-600 font-mono">
                      tezzu.in/store/{merchantData?.keyword || keyword}
                    </a>
                  </p>
                  <div className="text-sm text-surface-600">
                    <strong>Next steps:</strong>
                    <ol className="mt-1 ml-4 list-decimal space-y-1 text-surface-500">
                      <li>Add categories & products from your dashboard</li>
                      <li>Set operating hours and delivery settings</li>
                      <li>Turn on "Accepting Orders" when ready to go live</li>
                    </ol>
                  </div>
                </div>

                <button onClick={handleGoToDashboard} className="btn btn-primary w-full">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Login link */}
          {step < 4 && (
            <p className="text-center mt-6 text-sm text-surface-500">
              Already registered?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
