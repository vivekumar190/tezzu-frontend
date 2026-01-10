import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Store, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Package
} from 'lucide-react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import api from '../lib/api'
import { getSocket, joinMerchantRoom } from '../lib/socket'
import { useAuthStore } from '../store/authStore'
import clsx from 'clsx'

const mockChartData = [
  { name: 'Mon', orders: 12, revenue: 4800 },
  { name: 'Tue', orders: 19, revenue: 7600 },
  { name: 'Wed', orders: 15, revenue: 6000 },
  { name: 'Thu', orders: 25, revenue: 10000 },
  { name: 'Fri', orders: 32, revenue: 12800 },
  { name: 'Sat', orders: 45, revenue: 18000 },
  { name: 'Sun', orders: 38, revenue: 15200 },
]

export default function Dashboard() {
  const { user } = useAuthStore()
  const [liveOrders, setLiveOrders] = useState([])

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard')
      return res.data.data
    }
  })

  useEffect(() => {
    const socket = getSocket()
    
    if (socket) {
      socket.on('order:created', (order) => {
        setLiveOrders(prev => [order, ...prev].slice(0, 5))
      })

      // Join merchant room if merchant admin
      if (user?.merchant) {
        const merchantId = typeof user.merchant === 'object' 
          ? user.merchant._id 
          : user.merchant
        if (merchantId) {
          joinMerchantRoom(merchantId)
        }
      }
    }

    return () => {
      socket?.off('order:created')
    }
  }, [user])

  const stats = [
    {
      name: 'Total Merchants',
      value: dashboardData?.stats?.totalMerchants || 0,
      icon: Store,
      change: '+2 this week',
      changeType: 'positive',
      color: 'bg-blue-500'
    },
    {
      name: "Today's Orders",
      value: dashboardData?.stats?.todayOrders || 0,
      icon: ShoppingBag,
      change: '+12% vs yesterday',
      changeType: 'positive',
      color: 'bg-primary-500'
    },
    {
      name: "Today's Revenue",
      value: `₹${(dashboardData?.stats?.todayRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      change: '+8% vs yesterday',
      changeType: 'positive',
      color: 'bg-amber-500'
    },
    {
      name: 'Pending Orders',
      value: dashboardData?.stats?.pendingOrders || 0,
      icon: Clock,
      change: 'Needs attention',
      changeType: dashboardData?.stats?.pendingOrders > 5 ? 'negative' : 'neutral',
      color: 'bg-purple-500'
    }
  ]

  const getStatusColor = (status) => {
    const colors = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      accepted: 'badge-info',
      preparing: 'badge-info',
      ready: 'badge-success',
      delivered: 'badge-success',
      rejected: 'badge-error',
      cancelled: 'badge-error'
    }
    return colors[status] || 'badge-gray'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-surface-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-surface-500 mt-1">Here's what's happening with your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card card-hover p-6">
            <div className="flex items-start justify-between">
              <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={clsx(
                'flex items-center gap-1 text-xs font-medium',
                stat.changeType === 'positive' && 'text-green-600',
                stat.changeType === 'negative' && 'text-red-600',
                stat.changeType === 'neutral' && 'text-surface-500'
              )}>
                {stat.changeType === 'positive' && <ArrowUpRight className="w-3 h-3" />}
                {stat.changeType === 'negative' && <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
              <p className="text-sm text-surface-500">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-surface-900">Orders Overview</h3>
              <p className="text-sm text-surface-500">Last 7 days</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                Orders
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#18181b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#25D366" 
                  strokeWidth={2}
                  fill="url(#colorOrders)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-surface-900">Revenue Trend</h3>
              <p className="text-sm text-surface-500">Last 7 days</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Revenue
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#18181b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-surface-100">
            <h3 className="font-semibold text-surface-900">Recent Orders</h3>
            <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-surface-100">
            {dashboardData?.recentOrders?.slice(0, 5).map((order) => (
              <div key={order._id} className="flex items-center gap-4 p-4 hover:bg-surface-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-surface-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900">#{order.orderNumber}</p>
                  <p className="text-xs text-surface-500">{order.merchant?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-surface-900">₹{order.totalAmount}</p>
                  <span className={clsx('badge', getStatusColor(order.status))}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {(!dashboardData?.recentOrders || dashboardData.recentOrders.length === 0) && (
              <div className="p-8 text-center text-surface-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Merchants */}
        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-surface-100">
            <h3 className="font-semibold text-surface-900">Top Merchants</h3>
            <Link to="/merchants" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-surface-100">
            {dashboardData?.topMerchants?.map((merchant, index) => (
              <div key={merchant._id} className="flex items-center gap-4 p-4 hover:bg-surface-50 transition-colors">
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white',
                  index === 0 && 'bg-amber-500',
                  index === 1 && 'bg-surface-400',
                  index === 2 && 'bg-amber-700',
                  index > 2 && 'bg-surface-200 text-surface-600'
                )}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900">{merchant.name}</p>
                  <p className="text-xs text-surface-500">{merchant.totalOrders} orders</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-500">★</span>
                  <span className="text-sm font-medium">{merchant.rating?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
            ))}
            {(!dashboardData?.topMerchants || dashboardData.topMerchants.length === 0) && (
              <div className="p-8 text-center text-surface-500">
                <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No merchants yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Orders Ticker */}
      {liveOrders.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 space-y-2">
          {liveOrders.map((order) => (
            <div 
              key={order._id}
              className="card p-4 animate-slide-in shadow-lg border-l-4 border-l-primary-500"
            >
              <p className="text-sm font-medium">🆕 New Order #{order.orderNumber}</p>
              <p className="text-xs text-surface-500">₹{order.totalAmount}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

