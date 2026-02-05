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
  Bell
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
    payment_pending: [], // Cashier handles this
    accepted: ['preparing'],
    preparing: ['ready'],
  },
  delivery_boy: {
    ready: ['out_for_delivery'],
    out_for_delivery: ['delivered', 'undelivered'],
  },
  manager: {
    pending: ['payment_pending', 'accepted', 'rejected'],
    payment_pending: ['accepted', 'rejected'],
    accepted: ['preparing'],
    preparing: ['ready'],
    ready: ['out_for_delivery'],
    out_for_delivery: ['delivered', 'undelivered'],
    undelivered: ['out_for_delivery', 'cancelled'], // Can retry or cancel
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

// Default flow (for all roles)
const STATUS_FLOW = {
  pending: ['payment_pending', 'accepted', 'rejected'],
  payment_pending: ['accepted', 'rejected'],
  accepted: ['preparing'],
  preparing: ['ready'],
  ready: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'undelivered'],
  undelivered: ['out_for_delivery', 'cancelled']
}

// Get allowed statuses based on role
const getNextStatuses = (currentStatus, role) => {
  const roleFlow = STATUS_FLOW_BY_ROLE[role]
  if (roleFlow && roleFlow[currentStatus]) {
    return roleFlow[currentStatus]
  }
  // Fallback to empty for roles without permissions
  return []
}

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  payment_pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  preparing: 'bg-purple-100 text-purple-700 border-purple-200',
  ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  out_for_delivery: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  undelivered: 'bg-red-100 text-red-700 border-red-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
}

const STATUS_LABELS = {
  pending: '⏳ Pending',
  payment_pending: '💳 Payment Pending',
  accepted: '✅ Accepted',
  preparing: '👨‍🍳 Preparing',
  ready: '🍽️ Ready',
  out_for_delivery: '🚴 On the way',
  delivered: '✓ Delivered',
  undelivered: '❌ Undelivered',
  rejected: '❌ Rejected',
  cancelled: '🚫 Cancelled',
}

// Friendly action button labels
const ACTION_LABELS = {
  payment_pending: '💳 Request Payment',
  accepted: '✅ Accept Order',
  rejected: '❌ Reject',
  preparing: '👨‍🍳 Start Preparing',
  ready: '🍽️ Mark Ready',
  out_for_delivery: '🚴 Pickup for Delivery',
  delivered: '✓ Mark Delivered',
  undelivered: '❌ Mark Undelivered',
  cancelled: '🚫 Cancel Order',
}

const getActionLabel = (status) => ACTION_LABELS[status] || `Mark ${status.replace('_', ' ')}`

export default function StaffOrders() {
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const { playBell } = useOutletContext() || {}

  // Fetch merchant's order flow configuration - staff has full access
  const { data: orderFlowData } = useQuery({
    queryKey: ['staff-order-flow'],
    queryFn: async () => {
      const res = await api.get('/merchants/me/order-flow')
      return res.data.data
    },
    staleTime: 60000 // Cache for 1 minute
  })

  // Build dynamic status flow based on merchant config
  // API returns { flow: [...] }, not { orderFlow: [...] }
  const merchantFlow = orderFlowData?.flow || orderFlowData?.orderFlow || []
  
  // Debug: Log the flow data
  console.log('[StaffOrders] Merchant flow loaded:', merchantFlow.length, 'steps')
  
  // Generate dynamic filter tabs based on visibleToRoles from merchant flow
  const dynamicStatusOptions = useMemo(() => {
    const userRole = user?.staffRole
    if (!userRole || merchantFlow.length === 0) {
      // Fallback to static options
      return STATUS_OPTIONS_BY_ROLE[userRole] || STATUS_OPTIONS_BY_ROLE.default
    }
    
    // Get statuses visible to this role
    const visibleStatuses = merchantFlow
      .filter(step => {
        // Show if visibleToRoles includes this role, or if visibleToRoles is empty/undefined
        if (!step.visibleToRoles || step.visibleToRoles.length === 0) return true
        return step.visibleToRoles.includes(userRole) || userRole === 'manager'
      })
      .map(step => ({
        value: step.status,
        label: STATUS_LABELS[step.status] || step.status.replace(/_/g, ' ')
      }))
    
    // Add "All" option at the beginning
    const allLabel = userRole === 'delivery_boy' ? 'All Deliveries' : 
                     userRole === 'cook' ? 'All Kitchen' : 'All Orders'
    return [{ value: '', label: allLabel }, ...visibleStatuses]
  }, [user?.staffRole, merchantFlow])
  
  // Build role-specific flow from merchant config - ONLY uses flow configuration
  const getDynamicNextStatuses = (currentStatus, role) => {
    // Find current step in flow
    const currentIndex = merchantFlow.findIndex(s => s.status === currentStatus)
    if (currentIndex === -1) {
      // Fallback to default flow only if no merchant flow configured
      return STATUS_FLOW_BY_ROLE[role]?.[currentStatus] || []
    }
    
    const currentStep = merchantFlow[currentIndex]
    
    // Check if this role can see/act on this status
    if (currentStep.visibleToRoles && currentStep.visibleToRoles.length > 0) {
      if (!currentStep.visibleToRoles.includes(role) && role !== 'manager') {
        return []
      }
    }
    
    // Get next possible statuses FROM FLOW CONFIG ONLY
    let nextStatuses = []
    
    // Use configured nextStatuses if available
    if (currentStep.nextStatuses && currentStep.nextStatuses.length > 0) {
      nextStatuses = [...currentStep.nextStatuses]
    } else {
      // Fallback: Get next step in flow (linear progression)
      const nextStep = merchantFlow[currentIndex + 1]
      if (nextStep) {
        nextStatuses.push(nextStep.status)
      }
    }
    
    // Apply role restrictions from static config (limits what staff can do)
    const roleFlow = STATUS_FLOW_BY_ROLE[role]
    if (roleFlow && roleFlow[currentStatus]) {
      // Only return statuses that are both in flow config AND allowed for this role
      return nextStatuses.filter(s => roleFlow[currentStatus].includes(s))
    }
    
    // Manager can do everything in the flow
    if (role === 'manager') {
      return nextStatuses
    }
    
    return nextStatuses
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
    refetchInterval: 10000 // Auto refresh every 10 seconds
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
      // Clear filter so user sees the order in its new state
      setStatusFilter('')
      queryClient.invalidateQueries(['staff-orders'])
      const { autoTransitioned, newStatus } = response.data.data
      const statusLabel = STATUS_LABELS[variables.status] || variables.status.replace(/_/g, ' ')
      if (autoTransitioned && newStatus) {
        toast.success(`✅ Done! Auto-assigned to next step: ${newStatus.replace(/_/g, ' ')}`)
      } else {
        toast.success(`✅ ${statusLabel}`)
      }
    }
  })

  const acceptOrderMutation = useMutation({
    mutationFn: (orderId) => api.post(`/orders/${orderId}/accept`),
    onSuccess: () => {
      setStatusFilter('') // Clear filter to show all orders
      queryClient.invalidateQueries(['staff-orders'])
      toast.success('✅ Order accepted!')
    }
  })

  const rejectOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }) => api.post(`/orders/${orderId}/reject`, { reason }),
    onSuccess: () => {
      setStatusFilter('') // Clear filter to show all orders
      queryClient.invalidateQueries(['staff-orders'])
      toast.success('Order rejected')
    }
  })

  const allOrders = data?.orders || []
  
  // Filter orders based on staff role and merchant flow visibleToRoles
  const getRelevantOrders = () => {
    const role = user?.staffRole
    
    // If we have merchant flow, use visibleToRoles
    if (merchantFlow.length > 0) {
      const visibleStatuses = merchantFlow
        .filter(step => {
          if (!step.visibleToRoles || step.visibleToRoles.length === 0) return true
          return step.visibleToRoles.includes(role) || role === 'manager'
        })
        .map(step => step.status)
      
      // Also include rejected/cancelled for context
      visibleStatuses.push('rejected', 'cancelled')
      
      return allOrders.filter(o => visibleStatuses.includes(o.status))
    }
    
    // Fallback: Delivery boys see ready, out_for_delivery, delivered, and undelivered orders
    if (role === 'delivery_boy') {
      return allOrders.filter(o => ['ready', 'out_for_delivery', 'delivered', 'undelivered'].includes(o.status))
    }
    
    // Cooks see pending through ready (kitchen orders)
    if (role === 'cook' || role === 'helper') {
      return allOrders.filter(o => ['pending', 'payment_pending', 'accepted', 'preparing', 'ready', 'rejected'].includes(o.status))
    }
    
    // Managers/cashiers see everything
    return allOrders
  }
  
  const orders = getRelevantOrders()

  // Group orders by status for better visibility
  const pendingOrders = user?.staffRole === 'delivery_boy' 
    ? orders.filter(o => o.status === 'ready') // For delivery boys, "pending" = ready for pickup
    : orders.filter(o => o.status === 'pending')
  const activeOrders = user?.staffRole === 'delivery_boy'
    ? orders.filter(o => ['out_for_delivery', 'undelivered'].includes(o.status)) // Include undelivered for retry
    : orders.filter(o => ['accepted', 'preparing', 'ready', 'out_for_delivery', 'undelivered'].includes(o.status))

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {user?.staffRole === 'delivery_boy' ? '🚴 Deliveries' : 'Orders'}
          </h1>
          <p className="text-sm text-gray-500">
            {user?.staffRole === 'delivery_boy' 
              ? `${pendingOrders.length} ready for pickup • ${activeOrders.length} on the way`
              : `${pendingOrders.length} pending • ${activeOrders.length} active`
            }
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dynamicStatusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              statusFilter === opt.value
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 rounded-2xl p-6 text-center">
          <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Failed to load orders</p>
          <button onClick={() => refetch()} className="mt-3 text-sm underline">Try again</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-900 mb-1">No orders</h3>
          <p className="text-sm text-gray-500">New orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending/Ready Orders - Highlighted */}
          {pendingOrders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {user?.staffRole === 'delivery_boy' ? (
                  <Package className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Bell className="w-5 h-5 text-amber-500" />
                )}
                <h2 className="font-semibold text-gray-900">
                  {user?.staffRole === 'delivery_boy' 
                    ? `🚴 Ready for Pickup (${pendingOrders.length})`
                    : `New Orders (${pendingOrders.length})`
                  }
                </h2>
              </div>
              {pendingOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onSelect={() => setSelectedOrder(order)}
                  onAccept={() => acceptOrderMutation.mutate(order._id)}
                  onReject={(reason) => rejectOrderMutation.mutate({ orderId: order._id, reason })}
                  onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: order._id, status })}
                  isPending
                  userRole={user?.staffRole}
                  getNextStatusesFn={getDynamicNextStatuses}
                />
              ))}
            </div>
          )}

          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900">
                {user?.staffRole === 'delivery_boy' 
                  ? `🛵 Out for Delivery (${activeOrders.length})`
                  : `Active Orders (${activeOrders.length})`
                }
              </h2>
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
          )}

          {/* Completed/Other Orders */}
          {orders.filter(o => ['delivered', 'rejected', 'cancelled'].includes(o.status)).length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-500">Past Orders</h2>
              {orders.filter(o => ['delivered', 'rejected', 'cancelled'].includes(o.status)).map((order) => (
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
          )}
        </div>
      )}

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

function OrderCard({ order, onSelect, onAccept, onReject, onUpdateStatus, isPending, compact, userRole, getNextStatusesFn }) {
  // Use passed function or fallback to static
  const nextStatuses = getNextStatusesFn ? getNextStatusesFn(order.status, userRole) : getNextStatuses(order.status, userRole)
  
  // Debug log
  console.log(`[OrderCard] Order ${order.orderNumber} | Status: ${order.status} | Role: ${userRole} | Next: [${nextStatuses.join(', ')}]`)
  const timeSince = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl shadow-sm overflow-hidden transition-all',
        isPending && 'ring-2 ring-amber-400 animate-pulse-subtle',
        compact && 'opacity-75'
      )}
    >
      {/* Header */}
      <div className="p-4 cursor-pointer" onClick={onSelect}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">#{order.orderNumber}</h3>
              <span className={clsx(
                'px-2 py-0.5 text-xs font-medium rounded-full border',
                STATUS_COLORS[order.status]
              )}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{timeSince}</p>
          </div>
          <p className="text-lg font-bold text-emerald-600">₹{order.totalAmount}</p>
        </div>

        {/* Items Preview */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Package className="w-4 h-4 text-gray-400" />
          <span>{order.items?.length || 0} items</span>
          <span className="text-gray-400">•</span>
          <span className="truncate">{order.items?.map(i => i.name).join(', ')}</span>
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-4 text-sm">
          <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1 text-blue-600" onClick={e => e.stopPropagation()}>
            <Phone className="w-4 h-4" />
            {order.customerPhone}
          </a>
          {order.deliveryAddress?.street && (
            <span className="flex items-center gap-1 text-gray-500 truncate">
              <MapPin className="w-4 h-4" />
              {order.deliveryAddress.street}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions - ALWAYS use flow-configured nextStatuses */}
      {!compact && nextStatuses.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            {nextStatuses.map((status) => (
              <button
                key={status}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  // For 'accepted' status, use onAccept handler
                  if (status === 'accepted') {
                    onAccept();
                  } else {
                    onUpdateStatus(status);
                  }
                }}
                className={clsx(
                  'flex-1 py-3 rounded-xl font-semibold transition-colors',
                  status === 'delivered' && 'bg-green-600 text-white hover:bg-green-700',
                  status === 'undelivered' && 'bg-red-500 text-white hover:bg-red-600',
                  status === 'out_for_delivery' && 'bg-yellow-500 text-white hover:bg-yellow-600',
                  status === 'payment_pending' && 'bg-yellow-500 text-white hover:bg-yellow-600',
                  status === 'accepted' && 'bg-emerald-600 text-white hover:bg-emerald-700',
                  status === 'rejected' && 'bg-red-500 text-white hover:bg-red-600',
                  status === 'preparing' && 'bg-purple-500 text-white hover:bg-purple-600',
                  status === 'ready' && 'bg-blue-500 text-white hover:bg-blue-600',
                  !['delivered', 'undelivered', 'out_for_delivery', 'payment_pending', 'accepted', 'rejected', 'preparing', 'ready'].includes(status) && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                )}
              >
                {getActionLabel(status)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OrderDetailModal({ order, onClose, onUpdateStatus, onAccept, onReject, userRole, getNextStatusesFn }) {
  // Use passed function or fallback to static
  const nextStatuses = getNextStatusesFn ? getNextStatusesFn(order.status, userRole) : getNextStatuses(order.status, userRole)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Order #{order.orderNumber}</h2>
            <span className={clsx(
              'px-2 py-0.5 text-xs font-medium rounded-full border',
              STATUS_COLORS[order.status]
            )}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Customer</h3>
            <div className="space-y-2">
              {order.customerName && (
                <p className="font-medium text-gray-900">{order.customerName}</p>
              )}
              <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 text-blue-600">
                <Phone className="w-4 h-4" />
                {order.customerPhone}
              </a>
            </div>
          </div>

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Delivery Address</h3>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-900">{order.deliveryAddress.street}</p>
                  {order.deliveryAddress.landmark && (
                    <p className="text-sm text-gray-500">{order.deliveryAddress.landmark}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Items ({order.items?.length})</h3>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                    {item.specialInstructions && (
                      <p className="text-xs text-amber-600 mt-1">📝 {item.specialInstructions}</p>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">₹{item.totalPrice || item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="p-3 bg-amber-50 rounded-xl">
              <p className="text-sm font-medium text-amber-800">📝 Special Instructions</p>
              <p className="text-sm text-amber-700 mt-1">{order.specialInstructions}</p>
            </div>
          )}

          {/* Payment Proof Screenshot */}
          {(order.status === 'payment_pending' || order.paymentProof?.imageUrl) && (
            <div className={`p-4 rounded-xl border-2 ${
              order.paymentProof?.isVerified 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">💳 Payment Screenshot</h3>
                {order.paymentProof?.isVerified ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Verified</span>
                ) : order.paymentProof?.imageUrl ? (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Pending Verification</span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Awaiting Screenshot</span>
                )}
              </div>
              
              {order.paymentProof?.imageUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-video bg-white rounded-lg overflow-hidden border">
                    <img 
                      src={order.paymentProof.imageUrl} 
                      alt="Payment Proof"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Received {order.paymentProof.uploadedAt && format(new Date(order.paymentProof.uploadedAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">Waiting for customer to send payment screenshot...</p>
                </div>
              )}
            </div>
          )}

          {/* Total */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">₹{order.subtotal}</span>
            </div>
            {order.deliveryCharges > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-500">Delivery</span>
                <span className="font-medium">₹{order.deliveryCharges}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-emerald-600">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Time Info */}
          <div className="text-xs text-gray-500 text-center">
            Ordered {format(new Date(order.createdAt), 'MMM d, h:mm a')}
          </div>
        </div>

        {/* Actions - ALWAYS use flow-configured nextStatuses */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 space-y-2">
          {nextStatuses.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    // For 'accepted' status, use onAccept handler
                    if (status === 'accepted') {
                      onAccept();
                    } else {
                      onUpdateStatus(status);
                    }
                  }}
                  className={clsx(
                    'flex-1 min-w-[120px] py-3 rounded-xl font-semibold transition-colors',
                    status === 'delivered' && 'bg-green-600 text-white hover:bg-green-700',
                    status === 'undelivered' && 'bg-red-500 text-white hover:bg-red-600',
                    status === 'out_for_delivery' && 'bg-yellow-500 text-white hover:bg-yellow-600',
                    status === 'payment_pending' && 'bg-yellow-500 text-white hover:bg-yellow-600',
                    status === 'accepted' && 'bg-emerald-600 text-white hover:bg-emerald-700',
                    status === 'rejected' && 'bg-red-500 text-white hover:bg-red-600',
                    status === 'preparing' && 'bg-purple-500 text-white hover:bg-purple-600',
                    status === 'ready' && 'bg-blue-500 text-white hover:bg-blue-600',
                    !['delivered', 'undelivered', 'out_for_delivery', 'payment_pending', 'accepted', 'rejected', 'preparing', 'ready'].includes(status) && 'bg-emerald-600 text-white hover:bg-emerald-700'
                  )}
                >
                  {getActionLabel(status)}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
