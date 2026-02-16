import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, CheckCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

/**
 * WhatsApp Embedded Signup Component
 * 
 * Loads the Facebook JavaScript SDK and provides a "Connect WhatsApp" button
 * that launches Meta's Embedded Signup flow. After the merchant completes the
 * Facebook popup (login, WABA creation, phone verification), this component
 * sends the OAuth code to the backend which auto-configures everything.
 */
export default function WhatsAppEmbeddedSignup({ merchantId, onSuccess, onError }) {
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [sdkError, setSdkError] = useState(null)
  const [config, setConfig] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [setupProgress, setSetupProgress] = useState(null)

  // Fetch Embedded Signup config from backend
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await api.get('/embedded-signup/config')
        if (res.data.success) {
          setConfig(res.data.data)
        }
      } catch (err) {
        setSdkError('Embedded Signup is not configured on this server.')
      }
    }
    fetchConfig()
  }, [])

  // Load Facebook SDK
  useEffect(() => {
    if (!config?.appId) return

    // Check if already loaded
    if (window.FB) {
      window.FB.init({
        appId: config.appId,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      })
      setSdkLoaded(true)
      return
    }

    // Define the callback for when SDK loads
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: config.appId,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      })
      setSdkLoaded(true)
    }

    // Inject the SDK script
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      script.async = true
      script.defer = true
      script.onerror = () => setSdkError('Failed to load Facebook SDK')
      const firstScript = document.getElementsByTagName('script')[0]
      firstScript.parentNode.insertBefore(script, firstScript)
    }
  }, [config])

  // Handle the Embedded Signup flow
  const launchSignup = useCallback(() => {
    if (!sdkLoaded || !window.FB || !config) {
      toast.error('Facebook SDK not ready. Please wait and try again.')
      return
    }

    setConnecting(true)
    setSetupProgress(null)

    // Capture session info from ES v3 postMessage events
    let capturedSessionInfo = null

    const sessionHandler = (event) => {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          // ES v3 sends: { type, data: { phone_number_id, waba_id } }
          if (data.data) {
            capturedSessionInfo = data.data
            console.log('[EmbeddedSignup] Session info received:', data.data)
          }
          if (data.event === 'CANCEL') {
            setConnecting(false)
          }
        }
      } catch {
        // Not a JSON message or not relevant
      }
    }
    window.addEventListener('message', sessionHandler)

    window.FB.login(
      function (response) {
        window.removeEventListener('message', sessionHandler)
        if (response.authResponse) {
          const code = response.authResponse.code
          if (code) {
            completeSignup(code, capturedSessionInfo)
          } else {
            setConnecting(false)
            toast.error('No authorization code received from Facebook.')
            onError?.('No authorization code received')
          }
        } else {
          setConnecting(false)
          // User closed the popup or cancelled
        }
      },
      {
        config_id: config.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
          version: 'v3',
        },
      }
    )
  }, [sdkLoaded, config, merchantId])

  // Send the code to backend for exchange and auto-setup
  const completeSignup = async (code, sessionInfo = null) => {
    setSetupProgress('Exchanging credentials...')

    try {
      const res = await api.post('/embedded-signup/complete', {
        code,
        merchantId,
        sessionInfo, // ES v3: { waba_id, phone_number_id } from postMessage
      })

      if (res.data.success) {
        setSetupProgress('complete')
        toast.success('WhatsApp Business Account connected!')
        onSuccess?.(res.data.data)
      } else {
        throw new Error(res.data.error || 'Setup failed')
      }
    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message
      setSetupProgress(null)
      setConnecting(false)
      toast.error(`Setup failed: ${msg}`)
      onError?.(msg)
    }
  }

  // Error state
  if (sdkError) {
    return (
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div className="flex items-center gap-3 text-amber-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Embedded Signup Not Ready</p>
            <p className="text-sm text-amber-600 mt-1">{sdkError}</p>
            <p className="text-xs text-amber-500 mt-2">
              Complete Meta App setup: Business Verification, App Review, and create a Login Configuration
              at developers.facebook.com to enable one-click WhatsApp onboarding.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Completed state
  if (setupProgress === 'complete') {
    return (
      <div className="p-6 bg-green-50 rounded-xl border border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">WhatsApp Connected</p>
            <p className="text-sm text-green-600">
              Account configured, templates provisioned, and webhooks subscribed.
              Your merchant is now live on WhatsApp.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Connecting / processing state
  if (connecting) {
    return (
      <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-800">Setting up WhatsApp...</p>
            <p className="text-sm text-blue-600 mt-1">
              {setupProgress || 'Waiting for Facebook popup to complete...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Ready state — show the connect button
  return (
    <div className="space-y-4">
      <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-900">Connect WhatsApp Business</h4>
            <p className="text-sm text-green-700 mt-1 leading-relaxed">
              Click the button below to connect a WhatsApp Business Account.
              A Facebook popup will guide you through creating or selecting your
              business account and verifying your phone number.
            </p>
            <ul className="text-xs text-green-600 mt-3 space-y-1">
              <li>- Creates a WhatsApp Business Account under your Meta Business</li>
              <li>- Verifies your phone number via OTP (handled by Meta)</li>
              <li>- Auto-provisions all message templates (OTP, order updates)</li>
              <li>- Subscribes webhooks so Tezzu receives messages</li>
            </ul>
          </div>
        </div>

        <button
          onClick={launchSignup}
          disabled={!sdkLoaded}
          className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 
                     bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold rounded-xl 
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!sdkLoaded ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading Facebook SDK...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Connect with Facebook
              <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
