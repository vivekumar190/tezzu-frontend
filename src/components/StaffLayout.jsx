import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { 
  ShoppingBag, 
  User,
  LogOut,
  Bell,
  Volume2,
  VolumeX,
  MessageCircle,
  ChefHat,
  Bike,
  Users
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { getSocket, initSocket, disconnectSocket } from '../lib/socket'
import clsx from 'clsx'

const ROLE_ICONS = {
  cook: ChefHat,
  delivery_boy: Bike,
  cashier: Users,
  manager: Users,
  helper: Users
}

export default function StaffLayout() {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [newOrderCount, setNewOrderCount] = useState(0)
  const audioRef = useRef(null)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  // Initialize audio - create bell sound using Web Audio API
  useEffect(() => {
    // Try to load external sound first, fallback to generated tone
    const audio = new Audio()
    audio.volume = 0.7
    
    // Use data URL for a simple notification sound (or external URL)
    // This is a base64-encoded notification beep sound
    const soundDataUrl = 'data:audio/wav;base64,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'
    
    audio.src = soundDataUrl
    audioRef.current = audio
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Socket connection for real-time order updates
  useEffect(() => {
    try {
      const socket = initSocket()
      
      if (socket) {
        // Listen for new orders
        socket.on('order:created', (order) => {
          console.log('[Staff] New order received:', order?.orderNumber)
          setNewOrderCount(prev => prev + 1)
          
          // Play bell sound if enabled
          if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(err => {
              console.log('Audio play failed:', err.message)
            })
          }
          
          // Show browser notification if supported
          if (Notification.permission === 'granted') {
            new Notification('🔔 New Order!', {
              body: `Order #${order?.orderNumber} - ₹${order?.totalAmount}`,
              icon: '/favicon.ico',
              tag: 'new-order'
            })
          }
        })

        // Listen for order updates
        socket.on('order:updated', () => {
          // Refresh orders list
        })

        // Listen for order assigned to this staff
        socket.on('order:assigned', (data) => {
          if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {})
          }
        })
      }
    } catch (err) {
      console.error('Socket error in StaffLayout:', err)
    }

    return () => {
      try {
        const socket = getSocket()
        socket?.off('order:created')
        socket?.off('order:updated')
        socket?.off('order:assigned')
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }, [soundEnabled])

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleLogout = async () => {
    disconnectSocket()
    await logout()
    navigate('/staff/login')
  }

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
    if (!soundEnabled && audioRef.current) {
      // Play a test sound
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }

  const RoleIcon = user?.staffRole ? (ROLE_ICONS[user.staffRole] || Users) : Users

  const navigation = [
    { name: 'Orders', href: '/staff/orders', icon: ShoppingBag, badge: newOrderCount },
    { name: 'Profile', href: '/staff/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-emerald-600 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo & Merchant */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold leading-tight">Tezzu Staff</p>
              <p className="text-xs text-emerald-100">{user?.merchant?.name || 'Restaurant'}</p>
            </div>
          </div>

          {/* Staff Info */}
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                soundEnabled ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-emerald-700 hover:bg-emerald-600'
              )}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* User Info */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center">
                <RoleIcon className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight">{user?.name}</p>
                <p className="text-xs text-emerald-200 capitalize">{user?.staffRole?.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-emerald-500 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        <Outlet context={{ playBell: () => {
          if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {})
          }
        }}} />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => {
                if (item.href === '/staff/orders') {
                  setNewOrderCount(0)
                }
              }}
              className={({ isActive }) => clsx(
                'flex flex-col items-center justify-center w-full h-full relative transition-colors',
                isActive ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
