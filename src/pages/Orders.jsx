import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { 
  Search, 
  Filter,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Phone,
  MapPin,
  ChevronDown,
  RefreshCw,
  Bike,
  User,
  X,
  Calendar,
  Plus,
  Pencil,
  Minus,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'
import clsx from 'clsx'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'payment_pending', label: '💳 Payment Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'undelivered', label: 'Undelivered' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' }
]

const STATUS_COLORS = {
  pending: 'badge-warning',
  payment_pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'badge-info',
  accepted: 'badge-info',
  preparing: 'badge-info',
  ready: 'badge-success',
  out_for_delivery: 'badge-info',
  delivered: 'badge-success',
  undelivered: 'badge-error',
  rejected: 'badge-error',
  cancelled: 'badge-error'
}

const DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' }
]

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [mobileDetailOrderId, setMobileDetailOrderId] = useState(null)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [dateFilter, setDateFilter] = useState('today')
  const [searchQuery, setSearchQuery] = useState('')
  const [assignModalOrder, setAssignModalOrder] = useState(null)
  const [rejectModal, setRejectModal] = useState(null) // { orderId, reason }
  const [editOrderModal, setEditOrderModal] = useState(null) // order object
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const merchantId = typeof user?.merchant === 'object' ? user?.merchant?._id : user?.merchant

  // Fetch order flow configuration
  const { data: orderFlowData } = useQuery({
    queryKey: ['order-flow'],
    queryFn: async () => {
      const res = await api.get('/merchants/me/order-flow')
      return res.data.data
    },
    staleTime: 60000
  })

  const orderFlow = orderFlowData?.flow || orderFlowData?.orderFlow || []

  // Build nextStatuses map from flow configuration
  const getNextStatuses = (status) => {
    const stepConfig = orderFlow.find(s => s.status === status)
    if (stepConfig?.nextStatuses && stepConfig.nextStatuses.length > 0) {
      return stepConfig.nextStatuses
    }
    // Fallback to default linear flow
    const defaultNext = {
      pending: ['payment_pending', 'accepted'],
      payment_pending: ['accepted'],
      accepted: ['preparing'],
      preparing: ['ready'],
      ready: ['out_for_delivery'],
      out_for_delivery: ['delivered', 'undelivered'],
      undelivered: ['out_for_delivery']
    }
    return defaultNext[status] || []
  }

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (dateFilter) {
      case 'today':
        return { startDate: today.toISOString() }
      case 'yesterday': {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return { startDate: yesterday.toISOString(), endDate: today.toISOString() }
      }
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { startDate: weekAgo.toISOString() }
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return { startDate: monthAgo.toISOString() }
      default:
        return {}
    }
  }

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', statusFilter, dateFilter, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (debouncedSearch) params.append('search', debouncedSearch)
      const dateRange = getDateRange()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)
      params.append('limit', '200')
      const res = await api.get(`/orders?${params}`)
      return res.data.data
    },
    refetchInterval: 30000,
    retry: 2
  })

  const orders = data?.orders || []
  const selectedOrder = selectedOrderId ? orders.find(o => o._id === selectedOrderId) || null : null
  const mobileDetailOrder = mobileDetailOrderId ? orders.find(o => o._id === mobileDetailOrderId) || null : null

  // Real-time updates
  useEffect(() => {
    try {
      const socket = getSocket()
      if (socket) {
        const handleOrderUpdate = () => {
          queryClient.invalidateQueries(['orders'])
        }
        
        socket.on('order:created', handleOrderUpdate)
        socket.on('order:updated', handleOrderUpdate)
        socket.on('order:accepted', handleOrderUpdate)
        socket.on('order:rejected', handleOrderUpdate)

        return () => {
          try {
            socket.off('order:created', handleOrderUpdate)
            socket.off('order:updated', handleOrderUpdate)
            socket.off('order:accepted', handleOrderUpdate)
            socket.off('order:rejected', handleOrderUpdate)
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    } catch (e) {
      console.error('Socket error in Orders:', e)
    }
  }, [queryClient])

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => api.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order status updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update status')
    }
  })

  const verifyAndAcceptMutation = useMutation({
    mutationFn: (orderId) => api.post(`/orders/${orderId}/payment-proof`, { 
      isVerified: true, 
      acceptOrder: true 
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['orders'])
      toast.success(res.data?.message || 'Payment verified and order accepted!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to verify payment')
    }
  })

  const acceptOrderMutation = useMutation({
    mutationFn: (orderId) => api.post(`/orders/${orderId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order accepted')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to accept order')
    }
  })
  
  // Handle status update with special cases
  const handleStatusUpdate = (orderId, status) => {
    if (status === 'verify_payment') {
      // Single atomic operation: verify payment AND accept order
      verifyAndAcceptMutation.mutate(orderId)
    } else {
      updateStatusMutation.mutate({ orderId, status })
    }
  }

  const rejectOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }) => api.post(`/orders/${orderId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order rejected')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to reject order')
    }
  })

  const assignDeliveryMutation = useMutation({
    mutationFn: ({ orderId, deliveryBoyId }) => 
      api.post(`/orders/${orderId}/assign-delivery`, { deliveryBoyId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['orders'])
      toast.success(`Assigned to ${res.data.data.deliveryBoy.name}`)
      setAssignModalOrder(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to assign')
    }
  })

  const editOrderMutation = useMutation({
    mutationFn: ({ orderId, data }) => api.patch(`/orders/${orderId}/edit`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order updated successfully')
      setEditOrderModal(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update order')
    }
  })

  const createOrderMutation = useMutation({
    mutationFn: (data) => api.post('/orders/dashboard-create', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order created successfully')
      setShowCreateOrder(false)
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create order')
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Orders</h1>
          <p className="text-surface-500">Manage and track customer orders</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCreateOrder(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
          <button 
            onClick={() => refetch()}
            className="btn btn-secondary"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DATE_FILTERS.map(filter => (
          <button
            key={filter.value}
            onClick={() => setDateFilter(filter.value)}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all',
              dateFilter === filter.value
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            )}
          >
            {filter.value === 'today' && <Calendar className="w-4 h-4 inline mr-2" />}
            {filter.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order number or phone..."
                className="input pl-12"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Column */}
        <div className="lg:col-span-2 space-y-4">
          {error ? (
            <div className="card p-12 text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
              <h3 className="text-lg font-medium text-surface-900 mb-2">Failed to load orders</h3>
              <p className="text-surface-500 mb-4">Something went wrong while fetching orders</p>
              <button onClick={() => refetch()} className="btn btn-primary">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-surface-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 bg-surface-200 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-surface-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))
          ) : !data?.orders || data?.orders?.length === 0 ? (
            <div className="card p-12 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-surface-300" />
              <h3 className="text-lg font-medium text-surface-900 mb-2">No orders found</h3>
              <p className="text-surface-500">Orders will appear here when customers place them</p>
            </div>
          ) : (
            <>
            <p className="text-sm text-surface-500 px-1">Showing {data.orders.length}{data.pagination ? ` of ${data.pagination.total}` : ''} orders</p>
            {(Array.isArray(data.orders) ? data.orders : []).map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                isSelected={selectedOrderId === order._id}
                onClick={() => {
                  setSelectedOrderId(order._id)
                  if (window.innerWidth < 1024) setMobileDetailOrderId(order._id)
                }}
                onAccept={() => acceptOrderMutation.mutate(order._id)}
                onReject={() => setRejectModal({ orderId: order._id, reason: '' })}
                onUpdateStatus={(status) => handleStatusUpdate(order._id, status)}
                onAssignDelivery={() => setAssignModalOrder(order)}
                getNextStatuses={getNextStatuses}
              />
            ))}
            </>
          )}
        </div>

        {/* Order Details Sidebar */}
        <div className="hidden lg:block">
          {selectedOrder ? (
            <OrderDetails 
              order={selectedOrder} 
              onUpdateStatus={(status) => handleStatusUpdate(selectedOrderId, status)}
              onAssignDelivery={() => setAssignModalOrder(selectedOrder)}
              onEdit={() => setEditOrderModal(selectedOrder)}
            />
          ) : (
            <div className="card p-8 text-center sticky top-28">
              <Package className="w-12 h-12 mx-auto mb-4 text-surface-300" />
              <p className="text-surface-500">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Order Detail Modal */}
      {mobileDetailOrder && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileDetailOrderId(null)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-2xl overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-surface-100 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-surface-900">Order Details</h3>
              <button onClick={() => setMobileDetailOrderId(null)} className="p-2 rounded-lg hover:bg-surface-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <OrderDetails
                order={mobileDetailOrder}
                onUpdateStatus={(status) => {
                  handleStatusUpdate(mobileDetailOrder._id, status)
                  setMobileDetailOrderId(null)
                }}
                onAssignDelivery={() => {
                  setAssignModalOrder(mobileDetailOrder)
                  setMobileDetailOrderId(null)
                }}
                onEdit={() => {
                  setEditOrderModal(mobileDetailOrder)
                  setMobileDetailOrderId(null)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-surface-900 mb-3">Reject Order</h3>
            <p className="text-sm text-surface-500 mb-4">This will notify the customer. Optionally provide a reason.</p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Reason for rejection (optional)..."
              className="input w-full h-24 resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="btn btn-ghost flex-1">Cancel</button>
              <button
                onClick={() => {
                  rejectOrderMutation.mutate({ orderId: rejectModal.orderId, reason: rejectModal.reason })
                  setRejectModal(null)
                }}
                className="btn btn-danger flex-1"
              >
                Reject Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Delivery Boy Modal */}
      {assignModalOrder && (
        <AssignDeliveryModal
          order={assignModalOrder}
          onClose={() => setAssignModalOrder(null)}
          onAssign={(deliveryBoyId) => assignDeliveryMutation.mutate({ 
            orderId: assignModalOrder._id, 
            deliveryBoyId 
          })}
          isLoading={assignDeliveryMutation.isPending}
        />
      )}

      {/* Edit Order Modal */}
      {editOrderModal && (
        <EditOrderModal
          order={editOrderModal}
          merchantId={merchantId}
          onClose={() => setEditOrderModal(null)}
          onSave={(data) => editOrderMutation.mutate({ orderId: editOrderModal._id, data })}
          isLoading={editOrderMutation.isPending}
        />
      )}

      {/* Create Order Modal */}
      {showCreateOrder && (
        <CreateOrderModal
          merchantId={merchantId}
          onClose={() => setShowCreateOrder(false)}
          onCreate={(data) => createOrderMutation.mutate(data)}
          isLoading={createOrderMutation.isPending}
        />
      )}
    </div>
  )
}

function OrderCard({ order, isSelected, onClick, onAccept, onReject, onUpdateStatus, onAssignDelivery, getNextStatuses }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'accepted':
      case 'preparing': return <Package className="w-4 h-4" />
      case 'ready': return <CheckCircle className="w-4 h-4" />
      case 'out_for_delivery': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'undelivered': return <XCircle className="w-4 h-4" />
      case 'rejected':
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  // Get next status options from flow config
  const nextStatuses = getNextStatuses ? getNextStatuses(order.status) : []

  // Status labels for buttons
  const statusLabels = {
    payment_pending: '💳 Payment Pending',
    accepted: '✅ Accept',
    preparing: '👨‍🍳 Preparing',
    ready: '🍽️ Ready',
    out_for_delivery: '🚴 Out for Delivery',
    delivered: '✓ Delivered',
    undelivered: '❌ Undelivered'
  }

  // Show assign delivery button for ready orders without delivery boy
  const canAssignDelivery = ['accepted', 'preparing', 'ready'].includes(order.status)

  return (
    <div 
      className={clsx(
        'card p-5 cursor-pointer transition-all',
        isSelected ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-surface-900">#{order.orderNumber}</h3>
            <span className={clsx('badge', STATUS_COLORS[order.status])}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status.replaceAll('_', ' ')}</span>
            </span>
          </div>
          <p className="text-sm text-surface-500 mt-1">
            {order.merchant?.name} • {format(new Date(order.createdAt), 'MMM d, h:mm a')}
          </p>
        </div>
        <p className="text-lg font-bold text-surface-900">₹{order.totalAmount}</p>
      </div>

      <div className="flex items-center gap-4 text-sm text-surface-600 mb-2">
        <span className="flex items-center gap-1">
          <Phone className="w-4 h-4 text-surface-400" />
          {order.customerPhone}
        </span>
        <span>{order.items?.length || 0} items</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-surface-500 mb-4">
        <span className={clsx(
          'px-2 py-0.5 rounded-full font-medium',
          order.paymentMethod === 'online' || order.paymentMethod === 'upi'
            ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
        )}>
          {order.paymentMethod === 'online' || order.paymentMethod === 'upi' ? '💳 Online' : '💰 COD'}
        </span>
        <span className={clsx(
          'px-2 py-0.5 rounded-full font-medium',
          order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 
          order.paymentStatus === 'failed' ? 'bg-red-50 text-red-600' :
          order.paymentStatus === 'refunded' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'
        )}>
          {order.paymentStatus === 'paid' ? '✅ Paid' : order.paymentStatus === 'failed' ? '❌ Failed' : order.paymentStatus === 'refunded' ? '↩️ Refunded' : '⏳ Unpaid'}
        </span>
        {order.source === 'web_storefront' && (
          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">🌐 Web</span>
        )}
      </div>

      {/* Show Assigned Delivery Boy */}
      {order.assignedDeliveryBoy && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <Bike className="w-4 h-4" />
          <span>Assigned to: <strong>{order.assignedDeliveryBoy.name || 'Delivery Boy'}</strong></span>
        </div>
      )}

      {/* Scheduled Order Badge */}
      {order.scheduledFor && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-purple-50 rounded-lg text-sm text-purple-700">
          <Calendar className="w-4 h-4" />
          <span>Scheduled: {format(new Date(order.scheduledFor), 'MMM d, h:mm a')}</span>
        </div>
      )}

      {/* Quick Actions - Pending orders */}
      {order.status === 'pending' && (
        <div className="flex gap-2 pt-3 border-t border-surface-100" onClick={e => e.stopPropagation()}>
          {/* Online orders already paid: Accept directly */}
          {(order.paymentMethod === 'online' || order.paymentMethod === 'upi') && order.paymentStatus === 'paid' ? (
            <button 
              onClick={() => onAccept()}
              className="btn btn-success btn-sm flex-1"
            >
              <CheckCircle className="w-4 h-4" />
              ✅ Accept Order (Paid)
            </button>
          ) : (order.paymentMethod === 'cod' || !order.paymentMethod) ? (
            /* COD orders: Accept directly, no payment pending needed */
            <button 
              onClick={() => onAccept()}
              className="btn btn-success btn-sm flex-1"
            >
              <CheckCircle className="w-4 h-4" />
              ✅ Accept (COD)
            </button>
          ) : (
            /* Other payment methods that need verification */
            <button 
              onClick={() => onUpdateStatus('payment_pending')}
              className="btn btn-warning btn-sm flex-1"
            >
              💳 Mark Payment Pending
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onReject() }}
            className="btn btn-danger btn-sm flex-1"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      )}

      {/* Assign Delivery + Next Status */}
      {canAssignDelivery && (
        <div className="flex gap-2 pt-3 border-t border-surface-100" onClick={e => e.stopPropagation()}>
          {!order.assignedDeliveryBoy && (
            <button 
              onClick={onAssignDelivery}
              className="btn btn-ghost btn-sm flex-1"
            >
              <Bike className="w-4 h-4" />
              Assign Rider
            </button>
          )}
          {nextStatuses.length > 0 && nextStatuses.map(status => (
            <button 
              key={status}
              onClick={() => onUpdateStatus(status)}
              className="btn btn-secondary btn-sm flex-1"
            >
              {statusLabels[status] || `Mark ${status.replaceAll('_', ' ')}`}
            </button>
          ))}
        </div>
      )}

      {/* Out for Delivery - Show delivered/undelivered options */}
      {order.status === 'out_for_delivery' && (
        <div className="flex gap-2 pt-3 border-t border-surface-100" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => onUpdateStatus('delivered')}
            className="btn btn-success btn-sm flex-1"
          >
            ✓ Delivered
          </button>
          <button 
            onClick={() => onUpdateStatus('undelivered')}
            className="btn btn-error btn-sm flex-1"
          >
            ❌ Undelivered
          </button>
        </div>
      )}

      {/* Undelivered - Show retry option */}
      {order.status === 'undelivered' && (
        <div className="flex gap-2 pt-3 border-t border-surface-100" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => onUpdateStatus('out_for_delivery')}
            className="btn btn-warning btn-sm flex-1"
          >
            🔄 Retry Delivery
          </button>
        </div>
      )}

      {/* Payment Pending - Show screenshot and verify button */}
      {order.status === 'payment_pending' && (
        <div className="pt-3 border-t border-surface-100 space-y-2" onClick={e => e.stopPropagation()}>
          {order.paymentProof?.imageUrl ? (
            <div className="space-y-2">
              <a href={order.paymentProof.imageUrl} target="_blank" rel="noopener noreferrer">
                <img 
                  src={order.paymentProof.imageUrl} 
                  alt="Payment" 
                  className="w-full h-24 object-cover rounded-lg border border-surface-200 hover:opacity-80"
                />
              </a>
              <button 
                onClick={() => onUpdateStatus('verify_payment')}
                className="btn btn-success btn-sm w-full"
              >
                <CheckCircle className="w-4 h-4" />
                Verify Payment & Accept
              </button>
            </div>
          ) : (
            <div className="text-center text-sm text-yellow-600 py-2 bg-yellow-50 rounded-lg">
              ⏳ Waiting for payment screenshot...
            </div>
          )}
          <button 
            onClick={() => onAccept()}
            className="btn btn-secondary btn-sm w-full"
          >
            Accept Without Payment
          </button>
        </div>
      )}

    </div>
  )
}

function OrderDetails({ order, onUpdateStatus, onAssignDelivery, onEdit }) {
  const canAssignDelivery = ['accepted', 'preparing', 'ready'].includes(order.status)
  const canEdit = ['pending', 'payment_pending', 'accepted', 'preparing'].includes(order.status)

  return (
    <div className="card sticky top-28 max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      <div className="p-6 border-b border-surface-100 bg-surface-50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-surface-200 text-surface-500 hover:text-primary-600 transition-colors"
                title="Edit order"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <span className={clsx('badge', STATUS_COLORS[order.status])}>
              {order.status.replaceAll('_', ' ')}
            </span>
          </div>
        </div>
        <p className="text-sm text-surface-500">
          {format(new Date(order.createdAt), 'MMMM d, yyyy h:mm a')}
        </p>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Scheduled Delivery */}
        {order.scheduledFor && (
          <div className="p-3 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-2 text-purple-700">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Scheduled Delivery</span>
            </div>
            <p className="mt-1 text-purple-800 font-semibold">
              {format(new Date(order.scheduledFor), 'EEEE, MMM d • h:mm a')}
            </p>
          </div>
        )}

        {/* Payment Status & Screenshot */}
        {(order.status === 'payment_pending' || order.paymentProof?.imageUrl) && (
          <div className={clsx(
            "p-4 rounded-xl border-2",
            order.paymentProof?.isVerified 
              ? "bg-green-50 border-green-200" 
              : "bg-yellow-50 border-yellow-200"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">💳</span>
                <span className="font-medium text-surface-900">Payment Proof</span>
              </div>
              {order.paymentProof?.isVerified ? (
                <span className="badge bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </span>
              ) : (
                <span className="badge bg-yellow-100 text-yellow-700">
                  Pending Verification
                </span>
              )}
            </div>
            
            {order.paymentProof?.imageUrl ? (
              <div className="space-y-3">
                <a 
                  href={order.paymentProof.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img 
                    src={order.paymentProof.imageUrl} 
                    alt="Payment Screenshot" 
                    className="w-full max-h-64 object-contain rounded-lg border border-surface-200 cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </a>
                <div className="text-xs text-surface-500">
                  {order.paymentProof.uploadedAt && (
                    <p>Uploaded: {format(new Date(order.paymentProof.uploadedAt), 'MMM d, h:mm a')}</p>
                  )}
                  {order.paymentProof.verifiedBy && (
                    <p>Verified by: {order.paymentProof.verifiedBy}</p>
                  )}
                </div>
                
                {!order.paymentProof.isVerified && (
                  <button
                    onClick={() => onUpdateStatus('verify_payment')}
                    className="w-full btn btn-primary btn-sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verify Payment & Accept Order
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-surface-500 text-sm">Waiting for customer to send payment screenshot...</p>
                <p className="text-xs text-surface-400 mt-1">Customer will reply with screenshot via WhatsApp</p>
              </div>
            )}
          </div>
        )}

        {/* Undelivered Reason */}
        {order.status === 'undelivered' && order.undeliveredReason && (
          <div className="p-3 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Delivery Failed</span>
            </div>
            <p className="text-red-800 text-sm">{order.undeliveredReason}</p>
          </div>
        )}

        {/* Assigned Delivery Boy */}
        {order.assignedDeliveryBoy ? (
          <div className="p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Bike className="w-4 h-4" />
              <span className="text-sm font-medium">Delivery Assigned</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="font-semibold text-surface-900">
                  {order.assignedDeliveryBoy.name || 'Delivery Boy'}
                </p>
                {order.assignedDeliveryBoy.phone && (
                  <p className="text-sm text-surface-500">{order.assignedDeliveryBoy.phone}</p>
                )}
              </div>
            </div>
          </div>
        ) : canAssignDelivery && (
          <button 
            onClick={onAssignDelivery}
            className="w-full p-3 border-2 border-dashed border-surface-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="flex items-center justify-center gap-2 text-surface-500">
              <Bike className="w-5 h-5" />
              <span className="font-medium">Assign Delivery Boy</span>
            </div>
          </button>
        )}

        {/* Customer Info */}
        <div>
          <h4 className="text-sm font-medium text-surface-500 mb-3">Customer</h4>
          <div className="space-y-2">
            {order.customerName && (
              <p className="font-medium text-surface-900">{order.customerName}</p>
            )}
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-surface-400" />
              <a href={`tel:${order.customerPhone}`} className="text-primary-600 hover:underline">
                {order.customerPhone}
              </a>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {(order.deliveryAddress?.street || order.deliveryAddress?.city) && (
          <div>
            <h4 className="text-sm font-medium text-surface-500 mb-3">Delivery Address</h4>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-surface-400 mt-0.5" />
              <div>
                <p className="text-surface-700">{order.deliveryAddress.street || 'N/A'}</p>
                {order.deliveryAddress.landmark && <p className="text-surface-500 text-sm">{order.deliveryAddress.landmark}</p>}
                {order.deliveryAddress.city && <p className="text-surface-500 text-sm">{order.deliveryAddress.city} {order.deliveryAddress.pincode}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Type */}
        {order.deliveryType && (
          <div className="p-2 rounded-lg bg-surface-50">
            <span className="text-sm font-medium">
              {order.deliveryType === 'pickup' ? '🏪 Pickup Order' : '🚚 Home Delivery'}
            </span>
          </div>
        )}

        {/* Order Items */}
        <div>
          <h4 className="text-sm font-medium text-surface-500 mb-3">Items</h4>
          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <p className="font-medium text-surface-900">{item.name}</p>
                  <p className="text-sm text-surface-500">x{item.quantity}</p>
                  {item.specialInstructions && (
                    <p className="text-xs text-orange-600 italic mt-0.5">📝 {item.specialInstructions}</p>
                  )}
                </div>
                <p className="font-medium">₹{item.totalPrice || item.price * item.quantity}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
            <p className="text-sm font-medium text-orange-700">📝 Special Instructions</p>
            <p className="text-sm text-orange-800 mt-1">{order.specialInstructions}</p>
          </div>
        )}

        {/* Payment Info */}
        <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{order.paymentMethod === 'online' || order.paymentMethod === 'upi' ? '💳' : '💰'}</span>
              <div>
                <p className="font-medium text-surface-900">
                  {order.paymentMethod === 'online' || order.paymentMethod === 'upi' ? 'Online Payment' : 'Cash on Delivery'}
                </p>
                <p className="text-xs text-surface-500">
                  {order.source === 'web_storefront' ? '🌐 Web Order' : '💬 WhatsApp Order'}
                </p>
              </div>
            </div>
            <span className={clsx('badge text-xs', 
              order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 
              order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
              order.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            )}>
              {order.paymentStatus === 'paid' ? '✅ Paid' : 
               order.paymentStatus === 'failed' ? '❌ Failed' :
               order.paymentStatus === 'refunded' ? '↩️ Refunded' :
               '⏳ Pending'}
            </span>
          </div>
        </div>

        {/* Order Total */}
        <div className="pt-4 border-t border-surface-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-surface-500">Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
          {order.deliveryCharges > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Delivery</span>
              <span>₹{order.deliveryCharges}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-₹{order.discount}</span>
            </div>
          )}
          {order.taxes > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Taxes</span>
              <span>₹{order.taxes}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-2 border-t border-surface-100">
            <span>Total</span>
            <span className="text-primary-600">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Status Timeline */}
        {order.statusHistory?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-surface-500 mb-3">Timeline</h4>
            <div className="space-y-3">
              {order.statusHistory.slice().reverse().map((history, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium capitalize">{history.status.replaceAll('_', ' ')}</p>
                    <p className="text-xs text-surface-500">
                      {format(new Date(history.timestamp), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Assign Delivery Boy Modal
function AssignDeliveryModal({ order, onClose, onAssign, isLoading }) {
  const [selectedBoy, setSelectedBoy] = useState(null)

  const { data: deliveryBoys, isLoading: loadingBoys } = useQuery({
    queryKey: ['available-delivery-boys', order._id],
    queryFn: async () => {
      const res = await api.get(`/orders/${order._id}/available-delivery-boys`)
      return res.data.data.deliveryBoys
    }
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Assign Delivery Boy</h2>
              <p className="text-sm text-surface-500">Order #{order.orderNumber}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {loadingBoys ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto" />
                <p className="mt-3 text-surface-500">Loading delivery boys...</p>
              </div>
            ) : deliveryBoys?.length === 0 ? (
              <div className="py-8 text-center">
                <Bike className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                <p className="text-surface-700 font-medium">No delivery boys available</p>
                <p className="text-sm text-surface-500 mt-1">
                  Add delivery boys from the Staff page
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryBoys?.map((boy) => (
                  <div
                    key={boy._id}
                    onClick={() => setSelectedBoy(boy._id)}
                    className={clsx(
                      'p-4 rounded-xl border-2 cursor-pointer transition-all',
                      selectedBoy === boy._id 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-surface-200 hover:border-surface-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        selectedBoy === boy._id ? 'bg-primary-200' : 'bg-surface-100'
                      )}>
                        <Bike className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-surface-900">{boy.name}</p>
                        <p className="text-sm text-surface-500">{boy.phone}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-3">
                          {boy.activeOrders > 0 && (
                            <div className="text-center">
                              <p className="text-xs text-surface-500">Active</p>
                              <p className="font-semibold text-orange-600">{boy.activeOrders}</p>
                            </div>
                          )}
                          <div className="text-center">
                            <p className="text-xs text-surface-500">Total</p>
                            <p className="font-semibold text-surface-900">{boy.totalDeliveries || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Order Summary */}
            <div className="mt-6 p-4 bg-surface-50 rounded-xl">
              <h4 className="text-sm font-medium text-surface-500 mb-2">Delivery Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-600">Customer</span>
                  <span className="font-medium">{order.customerName || order.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600">Address</span>
                  <span className="font-medium truncate max-w-[180px]">
                    {order.deliveryAddress?.street || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600">Amount</span>
                  <span className="font-semibold text-primary-600">₹{order.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-surface-100">
            <button onClick={onClose} className="btn btn-ghost flex-1">
              Cancel
            </button>
            <button 
              onClick={() => selectedBoy && onAssign(selectedBoy)}
              disabled={!selectedBoy || isLoading}
              className="btn btn-primary flex-1"
            >
              {isLoading ? 'Assigning...' : 'Assign & Notify'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductSearchSelect({ merchantId, onAdd }) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: products } = useQuery({
    queryKey: ['products-for-order', merchantId, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      params.append('available', 'true')
      params.append('active', 'true')
      params.append('limit', '50')
      const res = await api.get(`/products/merchant/${merchantId}?${params}`)
      return res.data.data?.products || res.data.data || []
    },
    enabled: !!merchantId
  })

  return (
    <div>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to add..."
          className="input pl-9 text-sm"
        />
      </div>
      {products && products.length > 0 && (
        <div className="max-h-40 overflow-y-auto border border-surface-200 rounded-lg divide-y divide-surface-100">
          {products.map(product => (
            <button
              key={product._id}
              onClick={() => {
                onAdd({
                  product: product._id,
                  name: product.name,
                  price: product.price,
                  quantity: 1
                })
                setSearch('')
              }}
              className="w-full px-3 py-2 text-left hover:bg-surface-50 flex items-center justify-between text-sm transition-colors"
            >
              <span className="font-medium text-surface-800">{product.name}</span>
              <span className="text-surface-500">₹{product.price}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function OrderItemsEditor({ items, onChange }) {
  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'quantity' || field === 'price') {
      updated[index].totalPrice = (updated[index].price || 0) * (updated[index].quantity || 0)
    }
    onChange(updated)
  }

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 p-2 bg-surface-50 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-surface-900 truncate">{item.name}</p>
            <p className="text-xs text-surface-500">₹{item.price} each</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
              className="w-7 h-7 flex items-center justify-center rounded bg-surface-200 hover:bg-surface-300 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center text-sm font-medium border border-surface-200 rounded py-1"
              min="1"
            />
            <button
              type="button"
              onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center rounded bg-surface-200 hover:bg-surface-300 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <p className="w-16 text-right font-semibold text-sm">₹{item.price * item.quantity}</p>
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-surface-400 text-center py-4">No items added yet</p>
      )}
    </div>
  )
}

function EditOrderModal({ order, merchantId, onClose, onSave, isLoading }) {
  const [items, setItems] = useState(
    order.items.map(item => ({
      product: item.product?._id || item.product,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      totalPrice: item.totalPrice || item.price * item.quantity,
      variants: item.variants || [],
      addons: item.addons || [],
      specialInstructions: item.specialInstructions || ''
    }))
  )
  const [deliveryCharges, setDeliveryCharges] = useState(order.deliveryCharges || 0)
  const [discount, setDiscount] = useState(order.discount || 0)
  const [specialInstructions, setSpecialInstructions] = useState(order.specialInstructions || '')
  const [customerName, setCustomerName] = useState(order.customerName || '')
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || '')

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])
  const total = subtotal + deliveryCharges - discount

  const addItem = (product) => {
    const existing = items.findIndex(i => i.product === product.product)
    if (existing >= 0) {
      const updated = [...items]
      updated[existing].quantity += 1
      updated[existing].totalPrice = updated[existing].price * updated[existing].quantity
      setItems(updated)
    } else {
      setItems([...items, { ...product, totalPrice: product.price * product.quantity }])
    }
  }

  const handleSave = () => {
    if (items.length === 0) {
      toast.error('Order must have at least one item')
      return
    }
    onSave({
      items: items.map(i => ({
        product: i.product,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        variants: i.variants,
        addons: i.addons,
        specialInstructions: i.specialInstructions
      })),
      deliveryCharges,
      discount,
      specialInstructions,
      customerName,
      customerPhone
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Edit Order</h2>
              <p className="text-sm text-surface-500">#{order.orderNumber}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Customer Name</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input text-sm"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Phone</label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="input text-sm"
                  placeholder="+91..."
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-surface-500 mb-2 block">Items</label>
              <OrderItemsEditor items={items} onChange={setItems} />
              <div className="mt-3">
                <ProductSearchSelect merchantId={merchantId} onAdd={addItem} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Delivery Charges</label>
                <input
                  type="number"
                  value={deliveryCharges}
                  onChange={(e) => setDeliveryCharges(parseFloat(e.target.value) || 0)}
                  className="input text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Discount</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="input text-sm"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">Special Instructions</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="input text-sm h-16 resize-none"
                placeholder="Any special instructions..."
              />
            </div>

            <div className="p-3 bg-surface-50 rounded-xl space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-surface-500">Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Delivery</span><span>₹{deliveryCharges}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discount}</span></div>}
              <div className="flex justify-between font-semibold text-base pt-1 border-t border-surface-200">
                <span>Total</span><span className="text-primary-600">₹{total}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-surface-100 flex-shrink-0">
            <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button
              onClick={handleSave}
              disabled={isLoading || items.length === 0}
              className="btn btn-primary flex-1"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateOrderModal({ merchantId, onClose, onCreate, isLoading }) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [items, setItems] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [deliveryType, setDeliveryType] = useState('delivery')
  const [deliveryCharges, setDeliveryCharges] = useState(0)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])
  const total = subtotal + deliveryCharges

  const addItem = (product) => {
    const existing = items.findIndex(i => i.product === product.product)
    if (existing >= 0) {
      const updated = [...items]
      updated[existing].quantity += 1
      updated[existing].totalPrice = updated[existing].price * updated[existing].quantity
      setItems(updated)
    } else {
      setItems([...items, { ...product, totalPrice: product.price * product.quantity }])
    }
  }

  const handleCreate = () => {
    if (!customerPhone.trim()) {
      toast.error('Customer phone is required')
      return
    }
    if (items.length === 0) {
      toast.error('Add at least one item')
      return
    }
    onCreate({
      customerName,
      customerPhone: customerPhone.trim(),
      items: items.map(i => ({
        product: i.product,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      })),
      paymentMethod,
      deliveryType,
      deliveryCharges,
      deliveryAddress: deliveryAddress ? { street: deliveryAddress } : undefined,
      specialInstructions
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Create New Order</h2>
              <p className="text-sm text-surface-500">Create an order on behalf of a customer</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Customer Name</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input text-sm"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Phone *</label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="input text-sm"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-surface-500 mb-2 block">Items *</label>
              <ProductSearchSelect merchantId={merchantId} onAdd={addItem} />
              <div className="mt-3">
                <OrderItemsEditor items={items} onChange={setItems} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input text-sm"
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="online">Online Payment</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Delivery Type</label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="input text-sm"
                >
                  <option value="delivery">Home Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-surface-500 mb-1 block">Delivery Address</label>
                  <input
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="input text-sm"
                    placeholder="123 Main St..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-500 mb-1 block">Delivery Charges</label>
                  <input
                    type="number"
                    value={deliveryCharges}
                    onChange={(e) => setDeliveryCharges(parseFloat(e.target.value) || 0)}
                    className="input text-sm"
                    min="0"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">Special Instructions</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="input text-sm h-16 resize-none"
                placeholder="Any special instructions..."
              />
            </div>

            <div className="p-3 bg-surface-50 rounded-xl space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-surface-500">Subtotal</span><span>₹{subtotal}</span></div>
              {deliveryCharges > 0 && <div className="flex justify-between"><span className="text-surface-500">Delivery</span><span>₹{deliveryCharges}</span></div>}
              <div className="flex justify-between font-semibold text-base pt-1 border-t border-surface-200">
                <span>Total</span><span className="text-primary-600">₹{total}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-surface-100 flex-shrink-0">
            <button onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={isLoading || items.length === 0 || !customerPhone.trim()}
              className="btn btn-primary flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
