import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Store, 
  ShoppingBag, 
  Package, 
  Users, 
  UserPlus,
  MapPin,
  UsersRound,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  MessageCircle,
  BookOpen,
  CalendarClock,
  Volume2,
  VolumeX,
  CreditCard,
  Receipt,
  UserCircle,
  Megaphone,
  FileText,
  MessageSquareText,
  Headphones
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { initSocket, disconnectSocket } from '../lib/socket'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Shop', href: '/my-shop', icon: Store, merchantOnly: true },
  { name: 'Merchants', href: '/merchants', icon: Store, adminOnly: true },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Customers', href: '/customers', icon: UsersRound },
  { name: 'Staff', href: '/staff-management', icon: Users, merchantOnly: true },
  { name: 'WhatsApp Chat', href: '/whatsapp-chat', icon: MessageSquareText, merchantOnly: true },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone, merchantOnly: true },
  { name: 'Profile & Billing', href: '/profile', icon: UserCircle, merchantOnly: true },
  { name: 'Users', href: '/users', icon: Users, adminOnly: true },
  { name: 'Leads', href: '/leads', icon: UserPlus, adminOnly: true },
  { name: 'Demo Settings', href: '/demo-settings', icon: CalendarClock, adminOnly: true },
  { name: 'Live Chat', href: '/live-chat', icon: MessageCircle, adminOnly: true },
  { name: 'Geo Map', href: '/geo-map', icon: MapPin, adminOnly: true },
  { name: 'Razorpay', href: '/razorpay', icon: CreditCard, adminOnly: true },
  { name: 'Billing', href: '/billing', icon: Receipt, adminOnly: true },
  { name: 'Templates', href: '/campaign-templates', icon: FileText, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
  { name: 'How It Works', href: '/how-it-works', icon: BookOpen, adminOnly: true },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [supportRequests, setSupportRequests] = useState([])
  const [showSupportPanel, setShowSupportPanel] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const notificationRef = useRef(null)
  const supportRef = useRef(null)
  const { user, logout, _hasHydrated } = useAuthStore()
  const navigate = useNavigate()

  // Initialize notification sound from public folder
  const audioRef = useRef(null)
  
  useEffect(() => {
    // Create audio element with the bell sound
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

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return
    
    try {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(err => {
        console.log('Audio play failed:', err.message)
      })
    } catch (e) {
      console.log('Audio error:', e)
    }
  }, [soundEnabled])

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev
      // Play test sound when enabling
      if (newValue && audioRef.current) {
        setTimeout(() => {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(() => {})
        }, 50)
      }
      return newValue
    })
  }, [])
  
  // Get user role safely
  const userRole = user?.role || null
  const isAdmin = userRole === 'admin'
  const isMerchantAdmin = userRole === 'merchant_admin'
  
  // Filter navigation items based on role - always return an array
  const filteredNavigation = useMemo(() => {
    // Safety check - navigation should always be an array
    if (!Array.isArray(navigation)) return []
    
    // Wait for hydration and user data
    if (!_hasHydrated || !user) {
      return navigation.filter(item => !item.adminOnly && !item.merchantOnly) || []
    }
    
    return navigation.filter(item => {
      // Admin-only pages
      if (item.adminOnly && !isAdmin) return false
      // Merchant-only pages  
      if (item.merchantOnly && !isMerchantAdmin) return false
      return true
    }) || []
  }, [userRole, isAdmin, isMerchantAdmin, _hasHydrated, user])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (supportRef.current && !supportRef.current.contains(event.target)) {
        setShowSupportPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    try {
      const socket = initSocket()
      // Get merchant ID (could be object or string)
      const merchantId = typeof user?.merchant === 'object' ? user?.merchant?._id : user?.merchant
      console.log('🔌 Socket init result:', socket ? 'created' : 'null', 'merchantId:', merchantId)
      
      if (socket) {
        // Join merchant room when connected
        socket.on('connect', () => {
          console.log('🔌 Socket connected! ID:', socket.id)
          if (merchantId) {
            socket.emit('join:merchant', merchantId)
            console.log('✅ Joined merchant room:', merchantId)
          }
        })

        // If already connected, join immediately
        if (socket.connected && merchantId) {
          socket.emit('join:merchant', merchantId)
          console.log('Joined merchant room (immediate):', merchantId)
        }

        // Listen for new orders (backend emits 'order:new')
        socket.on('order:new', (order) => {
          console.log('📦 New order received:', order)
          if (order?.orderNumber) {
            setNotifications(prev => [{
              id: Date.now(),
              type: 'order',
              message: `New order #${order.orderNumber}`,
              time: new Date(),
              read: false,
              data: order
            }, ...prev].slice(0, 20))
            playNotificationSound()
          }
        })

        // Listen for order status updates
        socket.on('order:updated', (order) => {
          console.log('🔄 Order updated:', order)
          if (order?.orderNumber) {
            setNotifications(prev => [{
              id: Date.now(),
              type: 'status',
              message: `Order #${order.orderNumber} → ${order.status?.replace(/_/g, ' ')}`,
              time: new Date(),
              read: false,
              data: order
            }, ...prev].slice(0, 20))
            playNotificationSound()
          }
        })

        // Listen for accepted orders
        socket.on('order:accepted', (order) => {
          console.log('✅ Order accepted:', order)
          if (order?.orderNumber) {
            setNotifications(prev => [{
              id: Date.now(),
              type: 'accepted',
              message: `Order #${order.orderNumber} accepted`,
              time: new Date(),
              read: false,
              data: order
            }, ...prev].slice(0, 20))
            playNotificationSound()
          }
        })

        // Listen for rejected orders
        socket.on('order:rejected', (order) => {
          console.log('❌ Order rejected:', order)
          if (order?.orderNumber) {
            setNotifications(prev => [{
              id: Date.now(),
              type: 'rejected',
              message: `Order #${order.orderNumber} rejected`,
              time: new Date(),
              read: false,
              data: order
            }, ...prev].slice(0, 20))
            playNotificationSound()
          }
        })

        // Listen for customer support requests
        socket.on('support:request', (data) => {
          console.log('🆘 Support request:', data)
          setSupportRequests(prev => [{
            id: Date.now(),
            phone: data.phone,
            name: data.name || data.phone,
            message: data.message,
            sessionId: data.sessionId,
            time: data.timestamp || new Date(),
            read: false
          }, ...prev].slice(0, 30))
          playNotificationSound()
        })
      }
    } catch (err) {
      console.error('Socket init error:', err)
    }

    return () => {
      try {
        disconnectSocket()
      } catch (err) {
        // Ignore disconnect errors
      }
    }
  }, [playNotificationSound, user?.merchant])

  const unreadCount = notifications.filter(n => !n.read).length
  
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
    setShowNotifications(false)
  }

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ))
    // Show notification details modal
    setSelectedNotification(notification)
    setShowNotifications(false)
  }

  const goToOrder = (orderNumber) => {
    setSelectedNotification(null)
    navigate('/orders')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-surface-100 transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 h-20 border-b border-surface-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl gradient-text">Tezzu</h1>
              <p className="text-xs text-surface-400">WhatsApp Commerce</p>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-surface-400 hover:text-surface-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-surface-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">{user?.name}</p>
                <p className="text-xs text-surface-400 truncate">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-lg border-b border-surface-100">
          <div className="flex items-center justify-between h-full px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-surface-500 hover:text-surface-700"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            {/* Support Requests */}
            <div className="relative" ref={supportRef}>
              <button
                onClick={() => { setShowSupportPanel(!showSupportPanel); setShowNotifications(false) }}
                className="relative p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-50 rounded-xl transition-colors"
                title="Support Requests"
              >
                <Headphones className="w-5 h-5" />
                {supportRequests.filter(s => !s.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                    {supportRequests.filter(s => !s.read).length > 9 ? '9+' : supportRequests.filter(s => !s.read).length}
                  </span>
                )}
              </button>

              {showSupportPanel && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-surface-100 overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 bg-orange-50">
                    <h3 className="font-semibold text-surface-900 flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-orange-600" />
                      Support Requests
                    </h3>
                    <div className="flex gap-2">
                      {supportRequests.filter(s => !s.read).length > 0 && (
                        <button
                          onClick={() => setSupportRequests(prev => prev.map(s => ({ ...s, read: true })))}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                      {supportRequests.length > 0 && (
                        <button
                          onClick={() => { setSupportRequests([]); setShowSupportPanel(false) }}
                          className="text-xs text-surface-500 hover:text-surface-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {supportRequests.length === 0 ? (
                      <div className="p-8 text-center text-surface-400">
                        <Headphones className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No support requests</p>
                        <p className="text-xs mt-1 text-surface-300">When customers type "help", requests appear here</p>
                      </div>
                    ) : (
                      supportRequests.map((req) => (
                        <div
                          key={req.id}
                          className={clsx(
                            'px-4 py-3 border-b border-surface-50 last:border-0',
                            !req.read && 'bg-orange-50/50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                              <Headphones className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={clsx('text-sm', !req.read ? 'text-surface-900 font-medium' : 'text-surface-600')}>
                                {req.name}
                              </p>
                              <p className="text-xs text-surface-500 truncate">{req.message}</p>
                              <p className="text-xs text-surface-400 mt-0.5">
                                {formatDistanceToNow(new Date(req.time), { addSuffix: true })}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setSupportRequests(prev => prev.map(s => s.id === req.id ? { ...s, read: true } : s))
                                setShowSupportPanel(false)
                                navigate('/whatsapp-chat')
                              }}
                              className="text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-shrink-0 font-medium"
                            >
                              Chat
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                toggleSound()
                // Force play on toggle for testing
                if (!soundEnabled && audioRef.current) {
                  audioRef.current.currentTime = 0
                  audioRef.current.play().then(() => {
                    console.log('🔔 Test sound played!')
                  }).catch(err => {
                    console.error('Audio error:', err)
                  })
                }
              }}
              className={clsx(
                'p-2 rounded-xl transition-colors mr-2',
                soundEnabled 
                  ? 'text-emerald-600 hover:bg-emerald-50' 
                  : 'text-surface-400 hover:bg-surface-50'
              )}
              title={soundEnabled ? 'Click to disable sound' : 'Click to enable sound (plays test)'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowSupportPanel(false) }}
                className="relative p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-50 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-surface-100 overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 bg-surface-50">
                    <h3 className="font-semibold text-surface-900">Notifications</h3>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button 
                          onClick={clearNotifications}
                          className="text-xs text-surface-500 hover:text-surface-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-surface-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={clsx(
                            'w-full px-4 py-3 text-left hover:bg-surface-50 transition-colors border-b border-surface-50 last:border-0',
                            !notification.read && 'bg-primary-50/50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={clsx(
                              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                              notification.type === 'order' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                            )}>
                              {notification.type === 'order' ? (
                                <ShoppingBag className="w-4 h-4" />
                              ) : (
                                <Package className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={clsx(
                                'text-sm truncate',
                                notification.read ? 'text-surface-600' : 'text-surface-900 font-medium'
                              )}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-surface-400 mt-0.5">
                                {formatDistanceToNow(new Date(notification.time), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedNotification(null)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={clsx(
              'px-6 py-4 border-b',
              selectedNotification.type === 'order' && 'bg-primary-50 border-primary-100',
              selectedNotification.type === 'status' && 'bg-blue-50 border-blue-100',
              selectedNotification.type === 'accepted' && 'bg-emerald-50 border-emerald-100',
              selectedNotification.type === 'rejected' && 'bg-red-50 border-red-100'
            )}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-surface-900">
                  {selectedNotification.type === 'order' && '📦 New Order'}
                  {selectedNotification.type === 'status' && '🔄 Status Update'}
                  {selectedNotification.type === 'accepted' && '✅ Order Accepted'}
                  {selectedNotification.type === 'rejected' && '❌ Order Rejected'}
                </h3>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="p-1 hover:bg-surface-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-surface-400" />
                </button>
              </div>
              <p className="text-sm text-surface-500 mt-1">
                {formatDistanceToNow(new Date(selectedNotification.time), { addSuffix: true })}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[50vh]">
              {selectedNotification.data && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-500">Order Number</span>
                    <span className="font-semibold text-surface-900">#{selectedNotification.data.orderNumber}</span>
                  </div>
                  
                  {selectedNotification.data.customerName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-500">Customer</span>
                      <span className="text-surface-900">{selectedNotification.data.customerName}</span>
                    </div>
                  )}
                  
                  {selectedNotification.data.totalAmount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-500">Amount</span>
                      <span className="font-semibold text-emerald-600">₹{selectedNotification.data.totalAmount}</span>
                    </div>
                  )}
                  
                  {selectedNotification.data.status && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-500">Status</span>
                      <span className={clsx(
                        'px-3 py-1 rounded-full text-sm font-medium',
                        selectedNotification.data.status === 'pending' && 'bg-amber-100 text-amber-700',
                        selectedNotification.data.status === 'accepted' && 'bg-emerald-100 text-emerald-700',
                        selectedNotification.data.status === 'preparing' && 'bg-blue-100 text-blue-700',
                        selectedNotification.data.status === 'ready' && 'bg-purple-100 text-purple-700',
                        selectedNotification.data.status === 'out_for_delivery' && 'bg-indigo-100 text-indigo-700',
                        selectedNotification.data.status === 'delivered' && 'bg-green-100 text-green-700',
                        selectedNotification.data.status === 'rejected' && 'bg-red-100 text-red-700',
                        selectedNotification.data.status === 'cancelled' && 'bg-gray-100 text-gray-700'
                      )}>
                        {selectedNotification.data.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  )}

                  {selectedNotification.data.items?.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-surface-500 mb-2">Items</p>
                      <div className="space-y-2">
                        {selectedNotification.data.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="text-surface-600">₹{item.totalPrice || item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {!selectedNotification.data && (
                <p className="text-surface-600">{selectedNotification.message}</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-surface-50 border-t flex gap-3">
              <button
                onClick={() => setSelectedNotification(null)}
                className="flex-1 px-4 py-2.5 text-surface-600 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => goToOrder(selectedNotification.data?.orderNumber)}
                className="flex-1 px-4 py-2.5 text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
              >
                View Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

