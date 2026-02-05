import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChefHat,
  Bike,
  Package,
  Phone,
  MapPin,
  RefreshCw,
  Filter,
  Bell,
  X,
  User,
  Timer,
  Truck,
  AlertTriangle,
  DollarSign,
  CookingPot,
  CheckCircle2
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { getSocket } from '../lib/socket'
import clsx from 'clsx'

// Status filter options by role
const STATUS_OPTIONS_BY_ROLE = {
  cook: [
    { value: '', label: 'All Kitchen' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  ],
  helper: [
    { value: '', label: 'All Kitchen' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
  ],
  delivery_boy: [
    { value: '', label: 'All Deliveries' },
    { value: 'ready', label: 'Ready for Pickup' },
    { value: 'out_for_delivery', label: 'On the Way' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'undelivered', label: 'Undelivered' },
  ],
  cashier: [
    { value: '', label: 'All Payments' },
    { value: 'pending', label: 'Pending' },
    { value: 'payment_pending', label: 'Payment Pending' },
  ],
  manager: [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'payment_pending', label: 'Payment Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'undelivered', label: 'Undelivered' },
  ],
  default: [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'payment_pending', label: 'Payment Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
]
}

// Status flow based on staff role
const STATUS_FLOW_BY_ROLE = {
  cook: {
    pending: ['accepted', 'rejected'],
    payment_pending: [],
    accepted: ['preparing'],
    preparing: ['ready'],
  },
  delivery_boy: {
    ready: ['out_for_delivery'],
    out_for_delivery: ['delivered', 'undelivered'],
    undelivered: ['out_for_delivery'],
  },
  manager: {
    pending: ['payment_pending', 'accepted', 'rejected'],
    payment_pending: ['accepted', 'rejected'],
    accepted: ['preparing'],
    preparing: ['ready'],
    ready: ['out_for_delivery'],
    out_for_delivery: ['delivered', 'undelivered'],
    undelivered: ['out_for_delivery', 'cancelled'],
  },
  cashier: {
    pending: ['payment_pending', 'accepted', 'rejected'],
    payment_pending: ['accepted', 'rejected'],
  },
  helper: {
    accepted: ['preparing'],
    preparing: ['ready'],
  }
}

// Default flow
const STATUS_FLOW = {
  pending: ['payment_pending', 'accepted', 'rejected'],
  payment_pending: ['accepted', 'rejected'],
  accepted: ['preparing'],
  preparing: ['ready'],
  ready: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'undelivered'],
  undelivered: ['out_for_delivery', 'cancelled']
}

const getNextStatuses = (currentStatus, role) => {
  const roleFlow = STATUS_FLOW_BY_ROLE[role]
  if (roleFlow && roleFlow[currentStatus]) {
    return roleFlow[currentStatus]
  }
  return []
}

const STATUS_CONFIG = {
  pending: { 
    color: 'bg-amber-500', 
    lightColor: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    label: 'Pending'
  },
  payment_pending: { 
    color: 'bg-yellow-500', 
    lightColor: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: DollarSign,
    label: 'Payment Pending'
  },
  accepted: { 
    color: 'bg-blue-500', 
    lightColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: CheckCircle,
    label: 'Accepted'
  },
  preparing: { 
    color: 'bg-purple-500', 
    lightColor: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: CookingPot,
    label: 'Preparing'
  },
  ready: { 
    color: 'bg-emerald-500', 
    lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Package,
    label: 'Ready'
  },
  out_for_delivery: { 
    color: 'bg-cyan-500', 
    lightColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: Truck,
    label: 'On the way'
  },
  delivered: { 
    color: 'bg-green-500', 
    lightColor: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle2,
    label: 'Delivered'
  },
  undelivered: { 
    color: 'bg-red-500', 
    lightColor: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertTriangle,
    label: 'Undelivered'
  },
  rejected: { 
    color: 'bg-red-500', 
    lightColor: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
    label: 'Rejected'
  },
  cancelled: { 
    color: 'bg-gray-500', 
    lightColor: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: XCircle,
    label: 'Cancelled'
  },
}

const ACTION_CONFIG = {
  accepted: { label: '✅ Accept Order', color: 'bg-emerald-500 hover:bg-emerald-600' },
  rejected: { label: '❌ Reject', color: 'bg-red-500 hover:bg-red-600' },
  preparing: { label: '👨‍🍳 Start Cooking', color: 'bg-purple-500 hover:bg-purple-600' },
  ready: { label: '✓ Mark Ready', color: 'bg-emerald-500 hover:bg-emerald-600' },
  out_for_delivery: { label: '🚴 Pick Up for Delivery', color: 'bg-cyan-500 hover:bg-cyan-600' },
  delivered: { label: '✅ Mark Delivered', color: 'bg-green-500 hover:bg-green-600' },
  undelivered: { label: '❌ Mark Undelivered', color: 'bg-red-500 hover:bg-red-600' },
  cancelled: { label: '🚫 Cancel Order', color: 'bg-gray-500 hover:bg-gray-600' },
}

export default function StaffOrders() {
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const { playBell } = useOutletContext() || {}

  // Fetch merchant's order flow configuration
  const { data: orderFlowData } = useQuery({
    queryKey: ['staff-order-flow'],
    queryFn: async () => {
      const res = await api.get('/merchants/me/order-flow')
      return res.data.data
    },
    staleTime: 60000
  })

  const merchantFlow = orderFlowData?.flow || orderFlowData?.orderFlow || []
  
  console.log('[StaffOrders] Merchant flow loaded:', merchantFlow.length, 'steps')

  // Generate dynamic filter tabs
  const dynamicStatusOptions = useMemo(() => {
    const userRole = user?.staffRole
    if (!userRole || merchantFlow.length === 0) {
      return STATUS_OPTIONS_BY_ROLE[userRole] || STATUS_OPTIONS_BY_ROLE.default
    }
    
    const visibleStatuses = merchantFlow
      .filter(step => {
        if (!step.visibleToRoles || step.visibleToRoles.length === 0) return true
        return step.visibleToRoles.includes(userRole) || userRole === 'manager'
      })
      .map(step => ({
        value: step.status,
        label: STATUS_CONFIG[step.status]?.label || step.status.replace(/_/g, ' ')
      }))
    
    const allLabel = userRole === 'delivery_boy' ? 'All Deliveries' : 
                     userRole === 'cook' ? 'All Kitchen' : 'All Orders'
    return [{ value: '', label: allLabel }, ...visibleStatuses]
  }, [user?.staffRole, merchantFlow])
  
  // Build next status buttons from merchant's order flow configuration
  // Action buttons only shown to the role assigned to this step (assignTo)
  const getDynamicNextStatuses = (currentStatus, role) => {
    const currentIndex = merchantFlow.findIndex(s => s.status === currentStatus)
    
    // If flow not found, fallback to hardcoded role flow
    if (currentIndex === -1 || merchantFlow.length === 0) {
      return STATUS_FLOW_BY_ROLE[role]?.[currentStatus] || []
    }
    
    const currentStep = merchantFlow[currentIndex]
    
    // Check if this step is assigned to the user's role
    const isAssignedToRole = currentStep.assignTo === role
    const isManager = role === 'manager'
    
    // Only show action buttons if assigned to this role (or manager)
    if (!isAssignedToRole && !isManager) {
      return []
    }
    
    // Use nextStatuses from flow config directly (no filtering!)
    if (currentStep.nextStatuses && currentStep.nextStatuses.length > 0) {
      return [...currentStep.nextStatuses]
    }
    
    // Fallback: if no nextStatuses defined, use the next step in flow sequence
    const nextStep = merchantFlow[currentIndex + 1]
    if (nextStep) {
      return [nextStep.status]
    }
    
    return []
  }

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['staff-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('limit', '50')
      const res = await api.get(`/orders?${params}`)
      return res.data.data
    },
    refetchInterval: 10000
  })

  // Real-time updates
  useEffect(() => {
    try {
      const socket = getSocket()
      if (socket) {
        const handleNewOrder = (order) => {
          queryClient.invalidateQueries(['staff-orders'])
          if (playBell) playBell()
        }
        
        socket.on('order:created', handleNewOrder)
        socket.on('order:updated', () => queryClient.invalidateQueries(['staff-orders']))

        return () => {
          socket.off('order:created', handleNewOrder)
          socket.off('order:updated')
        }
      }
    } catch (e) {
      console.error('Socket error:', e)
    }
  }, [queryClient, playBell])

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => api.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: (response, variables) => {
      setStatusFilter('')
      queryClient.invalidateQueries(['staff-orders'])
      const config = STATUS_CONFIG[variables.status]
      toast.success(`✓ ${config?.label || variables.status}`)
    }
  })

  const acceptOrderMutation = useMutation({
    mutationFn: (orderId) => api.post(`/orders/${orderId}/accept`),
    onSuccess: () => {
      setStatusFilter('')
      queryClient.invalidateQueries(['staff-orders'])
      toast.success('✓ Order accepted!')
    }
  })

  const rejectOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }) => api.post(`/orders/${orderId}/reject`, { reason }),
    onSuccess: () => {
      setStatusFilter('')
      queryClient.invalidateQueries(['staff-orders'])
      toast.success('Order rejected')
    }
  })

  const allOrders = data?.orders || []

  // Filter orders based on staff role
  const getRelevantOrders = () => {
    const role = user?.staffRole
    
    if (merchantFlow.length > 0) {
      const visibleStatuses = merchantFlow
        .filter(step => {
          if (!step.visibleToRoles || step.visibleToRoles.length === 0) return true
          return step.visibleToRoles.includes(role) || role === 'manager'
        })
        .map(step => step.status)
      
      visibleStatuses.push('rejected', 'cancelled')
      
      return allOrders.filter(o => visibleStatuses.includes(o.status))
    }
    
    if (role === 'delivery_boy') {
      return allOrders.filter(o => ['ready', 'out_for_delivery', 'delivered', 'undelivered'].includes(o.status))
    }
    
    if (role === 'cook' || role === 'helper') {
      return allOrders.filter(o => ['pending', 'payment_pending', 'accepted', 'preparing', 'ready', 'rejected'].includes(o.status))
    }
    
    return allOrders
  }
  
  const orders = getRelevantOrders()

  // Group orders
  const pendingOrders = user?.staffRole === 'delivery_boy' 
    ? orders.filter(o => o.status === 'ready')
    : orders.filter(o => o.status === 'pending')
  const activeOrders = user?.staffRole === 'delivery_boy'
    ? orders.filter(o => ['out_for_delivery', 'undelivered'].includes(o.status))
    : orders.filter(o => ['accepted', 'preparing', 'ready', 'out_for_delivery', 'undelivered'].includes(o.status))
  const completedOrders = orders.filter(o => ['delivered', 'rejected', 'cancelled'].includes(o.status))

  const getRoleTitle = () => {
    switch (user?.staffRole) {
      case 'delivery_boy': return '🚴 Deliveries'
      case 'cook': return '👨‍🍳 Kitchen'
      case 'cashier': return '💰 Payments'
      case 'manager': return '📋 All Orders'
      default: return '📦 Orders'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
        <div>
              <h1 className="text-2xl font-bold text-slate-800">{getRoleTitle()}</h1>
              <p className="text-sm text-slate-500">
                {pendingOrders.length > 0 && <span className="text-amber-600 font-medium">{pendingOrders.length} new</span>}
                {pendingOrders.length > 0 && activeOrders.length > 0 && ' • '}
                {activeOrders.length > 0 && <span className="text-blue-600">{activeOrders.length} active</span>}
          </p>
        </div>
        <button
          onClick={() => refetch()}
              className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
              <RefreshCw className={clsx('w-5 h-5 text-slate-600', isLoading && 'animate-spin')} />
        </button>
      </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {dynamicStatusOptions.map((option) => (
          <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
            className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  statusFilter === option.value
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            )}
          >
                {option.label}
          </button>
        ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
      {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
              <p className="text-slate-500">Loading orders...</p>
            </div>
        </div>
      ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-slate-600 mb-4">Failed to load orders</p>
            <button onClick={() => refetch()} className="px-6 py-2 bg-slate-800 text-white rounded-xl">
              Try Again
            </button>
        </div>
      ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-xl font-medium text-slate-600 mb-2">No orders yet</p>
            <p className="text-sm text-slate-400">New orders will appear here</p>
        </div>
      ) : (
          <>
            {/* New/Pending Orders */}
          {pendingOrders.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-amber-600" />
                  </div>
                  <h2 className="font-semibold text-slate-800">
                    {user?.staffRole === 'delivery_boy' ? 'Ready for Pickup' : 'New Orders'}
                  </h2>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                    {pendingOrders.length}
                  </span>
                </div>
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onSelect={() => setSelectedOrder(order)}
                  onAccept={() => acceptOrderMutation.mutate(order._id)}
                  onReject={(reason) => rejectOrderMutation.mutate({ orderId: order._id, reason })}
                  onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: order._id, status })}
                      isNew
                      userRole={user?.staffRole}
                      getNextStatusesFn={getDynamicNextStatuses}
                />
              ))}
            </div>
              </section>
          )}

          {/* Active Orders */}
          {activeOrders.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Timer className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="font-semibold text-slate-800">
                    {user?.staffRole === 'delivery_boy' ? 'On Delivery' : 'In Progress'}
                  </h2>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {activeOrders.length}
                  </span>
                </div>
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onSelect={() => setSelectedOrder(order)}
                  onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: order._id, status })}
                      userRole={user?.staffRole}
                      getNextStatusesFn={getDynamicNextStatuses}
                />
              ))}
            </div>
              </section>
          )}

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-slate-500" />
                  </div>
                  <h2 className="font-semibold text-slate-500">Completed</h2>
                </div>
                <div className="space-y-2">
                  {completedOrders.slice(0, 5).map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onSelect={() => setSelectedOrder(order)}
                  compact
                      userRole={user?.staffRole}
                      getNextStatusesFn={getDynamicNextStatuses}
                />
              ))}
            </div>
              </section>
            )}
          </>
          )}
        </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={(status) => {
            updateStatusMutation.mutate({ orderId: selectedOrder._id, status })
            setSelectedOrder(null)
          }}
          onAccept={() => {
            acceptOrderMutation.mutate(selectedOrder._id)
            setSelectedOrder(null)
          }}
          onReject={(reason) => {
            rejectOrderMutation.mutate({ orderId: selectedOrder._id, reason })
            setSelectedOrder(null)
          }}
          userRole={user?.staffRole}
          getNextStatusesFn={getDynamicNextStatuses}
        />
      )}
    </div>
  )
}

function OrderCard({ order, onSelect, onAccept, onReject, onUpdateStatus, isNew, compact, userRole, getNextStatusesFn }) {
  const nextStatuses = getNextStatusesFn ? getNextStatusesFn(order.status, userRole) : getNextStatuses(order.status, userRole)
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const StatusIcon = config.icon
  const timeSince = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })

  if (compact) {
    return (
      <div 
        onClick={onSelect}
        className="bg-white rounded-xl p-3 flex items-center gap-3 opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', config.color)}>
          <StatusIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-700 text-sm">#{order.orderNumber}</p>
          <p className="text-xs text-slate-400">{timeSince}</p>
        </div>
        <p className="font-semibold text-slate-600">₹{order.totalAmount}</p>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl overflow-hidden shadow-sm border transition-all',
        isNew ? 'border-amber-300 shadow-amber-100' : 'border-slate-100'
      )}
    >
      {/* Header */}
      <div onClick={onSelect} className="p-4 cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', config.color)}>
              <StatusIcon className="w-6 h-6 text-white" />
            </div>
          <div>
              <p className="font-bold text-lg text-slate-800">#{order.orderNumber}</p>
              <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', config.lightColor)}>
                {config.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800">₹{order.totalAmount}</p>
            <p className="text-xs text-slate-400">{timeSince}</p>
          </div>
        </div>

        {/* Customer & Items */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShoppingBag className="w-4 h-4 text-slate-400" />
            <span>{order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</span>
        </div>
          {order.deliveryAddress?.street && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{order.deliveryAddress.street}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {nextStatuses.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-col gap-2">
            {nextStatuses.map((status) => {
              const actionConfig = ACTION_CONFIG[status] || { label: status.replace(/_/g, ' '), color: 'bg-slate-500 hover:bg-slate-600' }
              return (
              <button
                  key={status}
                onClick={(e) => {
                  e.stopPropagation()
                    if (status === 'accepted') {
                      onAccept?.()
                    } else {
                      onUpdateStatus(status)
                    }
                  }}
                className={clsx(
                    'w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95',
                    actionConfig.color
                )}
              >
                  {actionConfig.label}
              </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function OrderDetailModal({ order, onClose, onUpdateStatus, onAccept, onReject, userRole, getNextStatusesFn }) {
  const nextStatuses = getNextStatusesFn ? getNextStatusesFn(order.status, userRole) : getNextStatuses(order.status, userRole)
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const StatusIcon = config.icon

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', config.color)}>
                <StatusIcon className="w-6 h-6 text-white" />
              </div>
          <div>
                <h2 className="text-xl font-bold text-slate-800">#{order.orderNumber}</h2>
                <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', config.lightColor)}>
                  {config.label}
            </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Amount */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80 mb-1">Total Amount</p>
            <p className="text-3xl font-bold">₹{order.totalAmount}</p>
            <p className="text-sm opacity-60 mt-1">{order.paymentMethod?.toUpperCase() || 'COD'}</p>
          </div>

          {/* Customer */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-500 mb-3">Customer</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-700">{order.customerName}</span>
              </div>
              <a href={`tel:${order.customerPhone}`} className="flex items-center gap-3 text-blue-600">
                <Phone className="w-5 h-5" />
                <span>{order.customerPhone}</span>
              </a>
              {order.deliveryAddress?.street && (
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <span>{order.deliveryAddress.street}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-3">Items ({order.items?.length})</h3>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  {item.product?.image ? (
                    <img src={item.product.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-slate-700">{item.name}</p>
                    <p className="text-sm text-slate-500">₹{item.price} × {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-slate-800">₹{item.totalPrice}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Proof */}
          {order.paymentProof?.imageUrl && (
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-700 mb-3">💳 Payment Screenshot</h3>
              <img 
                src={order.paymentProof.imageUrl} 
                alt="Payment proof" 
                className="w-full rounded-lg"
              />
              {order.paymentProof.isVerified && (
                <div className="mt-2 flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="text-xs text-slate-400 text-center">
            Ordered {format(new Date(order.createdAt), 'MMM d, h:mm a')}
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 space-y-2">
          {nextStatuses.length > 0 && (
            <div className="flex flex-col gap-2">
              {nextStatuses.map((status) => {
                const actionConfig = ACTION_CONFIG[status] || { label: status.replace(/_/g, ' '), color: 'bg-slate-500 hover:bg-slate-600' }
                return (
                <button
                  key={status}
                    onClick={() => {
                      if (status === 'accepted') {
                        onAccept()
                      } else {
                        onUpdateStatus(status)
                      }
                    }}
                  className={clsx(
                      'w-full py-3.5 rounded-xl font-semibold text-white transition-all active:scale-95',
                      actionConfig.color
                  )}
                >
                    {actionConfig.label}
                </button>
                )
              })}
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
