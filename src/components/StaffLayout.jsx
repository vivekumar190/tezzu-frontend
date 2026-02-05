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

  // Initialize audio - use the same bell sound as merchant dashboard
  useEffect(() => {
    const audio = new Audio('/mixkit-happy-bell-alert-601.wav')
    audio.volume = 0.7
    audio.preload = 'auto'
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
      // Get merchant ID (could be object or string)
      const merchantId = typeof user?.merchant === 'object' ? user?.merchant?._id : user?.merchant
      console.log('[Staff] Socket init, merchantId:', merchantId)
      
      if (socket) {
        // Join merchant room when connected
        socket.on('connect', () => {
          console.log('[Staff] Socket connected:', socket.id)
          if (merchantId) {
            socket.emit('join:merchant', merchantId)
            console.log('[Staff] Joined merchant room:', merchantId)
          }
        })

        // If already connected, join immediately
        if (socket.connected && merchantId) {
          socket.emit('join:merchant', merchantId)
          console.log('[Staff] Joined merchant room (immediate):', merchantId)
        }

        // Listen for new orders (backend emits 'order:new')
        socket.on('order:new', (order) => {
          console.log('[Staff] 📦 New order received:', order?.orderNumber)
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
        socket.on('order:updated', (order) => {
          console.log('[Staff] 🔄 Order updated:', order?.orderNumber, order?.status)
          setNewOrderCount(prev => prev + 1)
          
          // Play bell sound if enabled
          if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(err => {
              console.log('Audio play failed:', err.message)
            })
          }
        })

        // Listen for order assigned to this staff
        socket.on('order:assigned', (data) => {
          console.log('[Staff] 👤 Order assigned:', data)
          if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {})
          }
        })

        // Listen for accepted orders
        socket.on('order:accepted', (order) => {
          console.log('[Staff] ✅ Order accepted:', order?.orderNumber)
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
        socket?.off('order:new')
        socket?.off('order:created')
        socket?.off('order:updated')
        socket?.off('order:assigned')
        socket?.off('order:accepted')
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }, [soundEnabled, user?.merchant])

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
