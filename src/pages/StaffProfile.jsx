import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Clock, 
  ChefHat,
  Bike,
  Users,
  Calendar,
  Package,
  CheckCircle,
  DollarSign,
  Bell,
  Volume2
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import clsx from 'clsx'

const ROLE_ICONS = {
  cook: ChefHat,
  delivery_boy: Bike,
  cashier: DollarSign,
  manager: Users,
  helper: Users
}

const ROLE_COLORS = {
  cook: 'bg-orange-100 text-orange-700',
  delivery_boy: 'bg-blue-100 text-blue-700',
  cashier: 'bg-green-100 text-green-700',
  manager: 'bg-purple-100 text-purple-700',
  helper: 'bg-gray-100 text-gray-700'
}

export default function StaffProfile() {
  const { user, logout } = useAuthStore()
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    Notification.permission === 'granted'
  )

  // Get staff stats
  const { data: statsData } = useQuery({
    queryKey: ['staff-stats'],
    queryFn: async () => {
      // Get order stats for this staff member
      const res = await api.get('/orders?limit=100&assignedToMe=true')
      return res.data.data
    },
    enabled: user?.staffRole === 'delivery_boy'
  })

  const RoleIcon = user?.staffRole ? (ROLE_ICONS[user.staffRole] || Users) : Users
  const roleColor = user?.staffRole ? (ROLE_COLORS[user.staffRole] || ROLE_COLORS.helper) : ROLE_COLORS.helper

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission()
    setNotificationsEnabled(permission === 'granted')
    
    if (permission === 'granted') {
      new Notification('Notifications Enabled!', {
        body: 'You will now receive alerts for new orders.',
        icon: '/favicon.ico'
      })
    }
  }

  // Stats for delivery boys
  const deliveredCount = statsData?.orders?.filter(o => o.status === 'delivered').length || 0
  const activeCount = statsData?.orders?.filter(o => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)).length || 0

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={clsx('w-20 h-20 rounded-2xl flex items-center justify-center', roleColor)}>
            <RoleIcon className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
            <span className={clsx('inline-block px-3 py-1 text-sm font-medium rounded-full mt-1', roleColor)}>
              {user?.staffRole?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 text-gray-600">
            <Phone className="w-5 h-5 text-gray-400" />
            <span>{user?.phone}</span>
          </div>
          {user?.merchant?.name && (
            <div className="flex items-center gap-3 text-gray-600">
              <Building2 className="w-5 h-5 text-gray-400" />
              <span>{user.merchant.name}</span>
            </div>
          )}
          {user?.lastLogin && (
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-5 h-5 text-gray-400" />
              <span>Last login: {format(new Date(user.lastLogin), 'MMM d, h:mm a')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats for Delivery Boys */}
      {user?.staffRole === 'delivery_boy' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{deliveredCount}</p>
                <p className="text-xs text-gray-500">Delivered</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <h2 className="px-6 py-4 font-semibold text-gray-900 border-b border-gray-100">
          Settings
        </h2>
        
        {/* Notifications */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">Get alerts for new orders</p>
            </div>
          </div>
          <button
            onClick={requestNotificationPermission}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              notificationsEnabled
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {notificationsEnabled ? 'Enabled ✓' : 'Enable'}
          </button>
        </div>

        {/* Sound */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Order Bell Sound</p>
              <p className="text-sm text-gray-500">Plays when new order arrives</p>
            </div>
          </div>
          <span className="text-sm text-emerald-600 font-medium">On</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <a
          href={`https://wa.me/${user?.merchant?.supportPhone || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Contact Support</p>
              <p className="text-sm text-gray-500">Get help via WhatsApp</p>
            </div>
          </div>
        </a>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-gray-400">
        <p>Tezzu Staff Portal v1.0</p>
        <p className="mt-1">© 2026 Tezzu. All rights reserved.</p>
      </div>
    </div>
  )
}
