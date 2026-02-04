import { useState, useEffect } from 'react'
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
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { getSocket } from '../lib/socket'
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

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [assignModalOrder, setAssignModalOrder] = useState(null)
  const queryClient = useQueryClient()

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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('limit', '50')
      const res = await api.get(`/orders?${params}`)
      return res.data.data
    },
    refetchInterval: 30000, // Auto refresh every 30 seconds
    retry: 2
  })

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
    }
  })

  const verifyPaymentMutation = useMutation({
    mutationFn: (orderId) => api.post(`/orders/${orderId}/payment-proof`, { isVerified: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Payment verified!')
    }
  })

  const acceptOrderMutation = useMutation({
    mutationFn: (orderId) => api.post(`/orders/${orderId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order accepted')
    }
  })
  
  // Handle status update with special cases
  const handleStatusUpdate = (orderId, status) => {
    if (status === 'verify_payment') {
      // First verify payment, then accept order
      verifyPaymentMutation.mutate(orderId, {
        onSuccess: () => {
          acceptOrderMutation.mutate(orderId)
        }
      })
    } else {
      updateStatusMutation.mutate({ orderId, status })
    }
  }

  const rejectOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }) => api.post(`/orders/${orderId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order rejected')
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Orders</h1>
          <p className="text-surface-500">Manage and track customer orders</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="btn btn-secondary"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
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
            (Array.isArray(data.orders) ? data.orders : []).map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                isSelected={selectedOrder?._id === order._id}
                onClick={() => setSelectedOrder(order)}
                onAccept={() => acceptOrderMutation.mutate(order._id)}
                onReject={(reason) => rejectOrderMutation.mutate({ orderId: order._id, reason })}
                onUpdateStatus={(status) => handleStatusUpdate(order._id, status)}
                onAssignDelivery={() => setAssignModalOrder(order)}
                getNextStatuses={getNextStatuses}
              />
            ))
          )}
        </div>

        {/* Order Details Sidebar */}
        <div className="hidden lg:block">
          {selectedOrder ? (
            <OrderDetails 
              order={selectedOrder} 
              onUpdateStatus={(status) => handleStatusUpdate(selectedOrder._id, status)}
              onAssignDelivery={() => setAssignModalOrder(selectedOrder)}
            />
          ) : (
            <div className="card p-8 text-center sticky top-28">
              <Package className="w-12 h-12 mx-auto mb-4 text-surface-300" />
              <p className="text-surface-500">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>

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
    payment_pending: '💳 Request Payment',
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
              <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
            </span>
          </div>
          <p className="text-sm text-surface-500 mt-1">
            {order.merchant?.name} • {format(new Date(order.createdAt), 'MMM d, h:mm a')}
          </p>
        </div>
        <p className="text-lg font-bold text-surface-900">₹{order.totalAmount}</p>
      </div>

      <div className="flex items-center gap-4 text-sm text-surface-600 mb-4">
        <span className="flex items-center gap-1">
          <Phone className="w-4 h-4 text-surface-400" />
          {order.customerPhone}
        </span>
        <span>{order.items?.length || 0} items</span>
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

      {/* Quick Actions */}
      {order.status === 'pending' && (
        <div className="flex gap-2 pt-3 border-t border-surface-100" onClick={e => e.stopPropagation()}>
          {/* Show "Request Payment" first if payment flow is configured */}
          <button 
            onClick={() => onUpdateStatus('payment_pending')}
            className="btn btn-warning btn-sm flex-1"
          >
            💳 Request Payment
          </button>
          <button 
            onClick={() => onAccept()}
            className="btn btn-primary btn-sm flex-1"
            title="Skip payment and accept directly"
          >
            <CheckCircle className="w-4 h-4" />
            Accept (COD)
          </button>
          <button 
            onClick={() => {
              const reason = prompt('Reason for rejection (optional):')
              onReject(reason)
            }}
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
              {statusLabels[status] || `Mark ${status.replace('_', ' ')}`}
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

      {/* Payment Pending - Show accept after payment verified */}
      {order.status === 'payment_pending' && (
        <div className="pt-3 border-t border-surface-100 space-y-2" onClick={e => e.stopPropagation()}>
          {order.paymentProof?.imageUrl ? (
            <button 
              onClick={() => onUpdateStatus('verify_payment')}
              className="btn btn-success btn-sm w-full"
            >
              <CheckCircle className="w-4 h-4" />
              Verify Payment & Accept
            </button>
          ) : (
            <div className="text-center text-sm text-yellow-600 py-2">
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

      {order.status === 'out_for_delivery' && (
        <div className="pt-3 border-t border-surface-100" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => onUpdateStatus('delivered')}
            className="btn btn-success btn-sm w-full"
          >
            <CheckCircle className="w-4 h-4" />
            Mark as Delivered
          </button>
        </div>
      )}
    </div>
  )
}

function OrderDetails({ order, onUpdateStatus, onAssignDelivery }) {
  const canAssignDelivery = ['accepted', 'preparing', 'ready'].includes(order.status)

  return (
    <div className="card sticky top-28 max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      <div className="p-6 border-b border-surface-100 bg-surface-50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
          <span className={clsx('badge', STATUS_COLORS[order.status])}>
            {order.status.replace('_', ' ')}
          </span>
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
        {order.deliveryAddress && (
          <div>
            <h4 className="text-sm font-medium text-surface-500 mb-3">Delivery Address</h4>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-surface-400 mt-0.5" />
              <p className="text-surface-700">{order.deliveryAddress.street}</p>
            </div>
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
                </div>
                <p className="font-medium">₹{item.totalPrice || item.price * item.quantity}</p>
              </div>
            ))}
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
                    <p className="text-sm font-medium capitalize">{history.status.replace('_', ' ')}</p>
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

