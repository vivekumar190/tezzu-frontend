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
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { getSocket } from '../lib/socket'
import clsx from 'clsx'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' }
]

const STATUS_COLORS = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  accepted: 'badge-info',
  preparing: 'badge-info',
  ready: 'badge-success',
  out_for_delivery: 'badge-info',
  delivered: 'badge-success',
  rejected: 'badge-error',
  cancelled: 'badge-error'
}

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('limit', '50')
      const res = await api.get(`/orders?${params}`)
      return res.data.data
    },
    refetchInterval: 30000 // Auto refresh every 30 seconds
  })

  // Real-time updates
  useEffect(() => {
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
        socket.off('order:created', handleOrderUpdate)
        socket.off('order:updated', handleOrderUpdate)
        socket.off('order:accepted', handleOrderUpdate)
        socket.off('order:rejected', handleOrderUpdate)
      }
    }
  }, [queryClient])

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => api.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order status updated')
    }
  })

  const acceptOrderMutation = useMutation({
    mutationFn: (orderId) => api.post(`/orders/${orderId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order accepted')
    }
  })

  const rejectOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }) => api.post(`/orders/${orderId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order rejected')
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
          {isLoading ? (
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
          ) : data?.orders?.length === 0 ? (
            <div className="card p-12 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-surface-300" />
              <h3 className="text-lg font-medium text-surface-900 mb-2">No orders found</h3>
              <p className="text-surface-500">Orders will appear here when customers place them</p>
            </div>
          ) : (
            data?.orders?.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                isSelected={selectedOrder?._id === order._id}
                onClick={() => setSelectedOrder(order)}
                onAccept={() => acceptOrderMutation.mutate(order._id)}
                onReject={(reason) => rejectOrderMutation.mutate({ orderId: order._id, reason })}
                onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: order._id, status })}
              />
            ))
          )}
        </div>

        {/* Order Details Sidebar */}
        <div className="hidden lg:block">
          {selectedOrder ? (
            <OrderDetails 
              order={selectedOrder} 
              onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: selectedOrder._id, status })}
            />
          ) : (
            <div className="card p-8 text-center sticky top-28">
              <Package className="w-12 h-12 mx-auto mb-4 text-surface-300" />
              <p className="text-surface-500">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, isSelected, onClick, onAccept, onReject, onUpdateStatus }) {
  const [showActions, setShowActions] = useState(false)

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'accepted':
      case 'preparing': return <Package className="w-4 h-4" />
      case 'ready': return <CheckCircle className="w-4 h-4" />
      case 'out_for_delivery': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'rejected':
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const nextStatus = {
    accepted: 'preparing',
    preparing: 'ready',
    ready: 'out_for_delivery',
    out_for_delivery: 'delivered'
  }

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

      {/* Quick Actions */}
      {order.status === 'pending' && (
        <div className="flex gap-2 pt-3 border-t border-surface-100" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => onAccept()}
            className="btn btn-primary btn-sm flex-1"
          >
            <CheckCircle className="w-4 h-4" />
            Accept
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

      {nextStatus[order.status] && (
        <div className="pt-3 border-t border-surface-100" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => onUpdateStatus(nextStatus[order.status])}
            className="btn btn-secondary btn-sm w-full"
          >
            Mark as {nextStatus[order.status].replace('_', ' ')}
          </button>
        </div>
      )}
    </div>
  )
}

function OrderDetails({ order, onUpdateStatus }) {
  return (
    <div className="card sticky top-28 overflow-hidden">
      <div className="p-6 border-b border-surface-100 bg-surface-50">
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

      <div className="p-6 space-y-6">
        {/* Customer Info */}
        <div>
          <h4 className="text-sm font-medium text-surface-500 mb-3">Customer</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-surface-400" />
              <span>{order.customerPhone}</span>
            </div>
            {order.customerName && (
              <p className="text-surface-700">{order.customerName}</p>
            )}
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

