import { useState, useEffect } from 'react'
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
  CalendarClock
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useMemo } from 'react'
import { initSocket, disconnectSocket } from '../lib/socket'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Shop', href: '/my-shop', icon: Store, merchantOnly: true },
  { name: 'Merchants', href: '/merchants', icon: Store, adminOnly: true },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Customers', href: '/customers', icon: UsersRound, adminOnly: true },
  { name: 'Staff', href: '/staff', icon: Users, merchantOnly: true },
  { name: 'Users', href: '/users', icon: Users, adminOnly: true },
  { name: 'Leads', href: '/leads', icon: UserPlus, adminOnly: true },
  { name: 'Demo Settings', href: '/demo-settings', icon: CalendarClock, adminOnly: true },
  { name: 'Live Chat', href: '/live-chat', icon: MessageCircle, adminOnly: true },
  { name: 'Geo Map', href: '/geo-map', icon: MapPin, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'How It Works', href: '/how-it-works', icon: BookOpen },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const { user, logout, _hasHydrated } = useAuthStore()
  const navigate = useNavigate()
  
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

  useEffect(() => {
    try {
      const socket = initSocket()
      
      if (socket) {
        socket.on('order:created', (order) => {
          if (order?.orderNumber) {
            setNotifications(prev => [{
              id: Date.now(),
              type: 'order',
              message: `New order #${order.orderNumber}`,
              time: new Date()
            }, ...prev].slice(0, 10))
          }
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
  }, [])

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

            {/* Notifications */}
            <div className="relative">
              <button className="relative p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-50 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

