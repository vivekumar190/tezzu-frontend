import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Search, MapPin, ShoppingBag, TrendingUp, 
  Phone, Calendar, Eye, Tag, MessageSquare,
  UserCheck, IndianRupee, Filter, X, Map, RefreshCw, AlertCircle,
  Package, ChevronRight, CreditCard
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';
import { format } from 'date-fns';

// Stats cards - compact
function StatsCards({ stats }) {
  const totalUnpaid = stats?.totalUnpaid ?? 0;
  const cards = [
    { label: 'Total', value: stats?.totalCustomers ?? 0, icon: Users, color: 'bg-primary-100 text-primary-700' },
    { label: 'With Orders', value: stats?.customersWithOrders ?? 0, icon: ShoppingBag, color: 'bg-green-100 text-green-700' },
    { label: 'With Location', value: stats?.customersWithLocation ?? 0, icon: MapPin, color: 'bg-purple-100 text-purple-700' },
    { label: 'Active Today', value: stats?.activeToday ?? 0, icon: UserCheck, color: 'bg-orange-100 text-orange-700' },
    { label: 'New This Week', value: stats?.newThisWeek ?? 0, icon: TrendingUp, color: 'bg-cyan-100 text-cyan-700' },
    { label: 'Avg. Order', value: `₹${stats?.averageOrderValue ?? 0}`, icon: IndianRupee, color: 'bg-emerald-100 text-emerald-700' },
    ...(totalUnpaid > 0 ? [{ label: 'Unpaid Dues', value: `₹${totalUnpaid}`, icon: AlertCircle, color: 'bg-amber-100 text-amber-700' }] : []),
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
      {cards.map((card, idx) => (
        <div key={idx} className="card p-3">
          <div className="flex items-center gap-2">
            <div className={clsx('p-1.5 rounded-lg', card.color)}>
              <card.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-surface-900">{card.value}</p>
              <p className="text-[10px] text-surface-500">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomerCard({ customer, onView }) {
  const formatPhone = (phone) => {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '').slice(-10);
    return digits ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : phone;
  };

  const totalOrders = customer.stats?.totalOrders ?? 0;
  const totalSpent = customer.stats?.totalSpent ?? 0;
  const unpaid = customer.stats?.unpaidAmount ?? 0;

  return (
    <div 
      className="card p-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onView(customer)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
            {(customer.name || 'C')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-surface-900 truncate">{customer.name || 'Customer'}</h3>
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <Phone className="w-3 h-3 shrink-0" />
              {formatPhone(customer.phone)}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onView(customer); }}
          className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors shrink-0"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="bg-surface-50 rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-surface-900">{totalOrders}</p>
          <p className="text-[10px] text-surface-500">Orders</p>
        </div>
        <div className="bg-surface-50 rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-surface-900">₹{totalSpent}</p>
          <p className="text-[10px] text-surface-500">Spent</p>
        </div>
        <div className={clsx('rounded-lg p-2 text-center', unpaid > 0 ? 'bg-amber-50' : 'bg-surface-50')}>
          <p className={clsx('text-sm font-bold', unpaid > 0 ? 'text-amber-700' : 'text-surface-900')}>₹{unpaid}</p>
          <p className="text-[10px] text-surface-500">Unpaid</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-surface-500 mt-2 pt-2 border-t border-surface-100">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Joined {customer.createdAt ? format(new Date(customer.createdAt), 'MMM d, yyyy') : '—'}
        </span>
        {customer.location?.coordinates?.[0] !== 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <MapPin className="w-3 h-3" /> Location
          </span>
        )}
      </div>

      {customer.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {customer.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderDetailModal({ order, isLoading, onClose }) {
  const formatAddr = (addr) => {
    if (!addr) return '—';
    const parts = [addr.street, addr.landmark, addr.city, addr.pincode].filter(Boolean);
    return parts.join(', ') || '—';
  };

  const statusLabels = {
    pending: '⏳ Pending',
    payment_pending: '💳 Payment Pending',
    confirmed: '✅ Confirmed',
    accepted: '✅ Accepted',
    preparing: '👨‍🍳 Preparing',
    ready: '🍽️ Ready',
    out_for_delivery: '🚴 Out for Delivery',
    delivered: '✓ Delivered',
    undelivered: '❌ Undelivered',
    rejected: '❌ Rejected',
    cancelled: '❌ Cancelled'
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center bg-black/50 overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-surface-900">
            {isLoading ? 'Loading...' : order ? `Order #${order.orderNumber}` : 'Order'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-5 animate-pulse">
              <div className="h-16 bg-surface-200 rounded-xl" />
              <div className="h-8 bg-surface-200 rounded w-1/2" />
              <div className="h-24 bg-surface-200 rounded-xl" />
              <div className="h-32 bg-surface-200 rounded-xl" />
              <div className="h-20 bg-surface-200 rounded-xl" />
            </div>
          ) : !order ? (
            <p className="text-surface-500 text-center py-8">Order not found</p>
          ) : (
            <>
              <div>
                <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Customer</h4>
                <div className="bg-surface-50 rounded-xl p-3 space-y-1">
                  <p className="font-medium text-surface-900">{order.customerName || '—'}</p>
                  <p className="text-sm text-surface-600 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {order.customerPhone || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={clsx(
                  'px-2 py-1 rounded text-xs font-medium',
                  order.source === 'web_storefront' && 'bg-purple-50 text-purple-700',
                  order.source === 'whatsapp' && 'bg-green-50 text-green-700',
                  ['mobile_app', 'dashboard', 'api'].includes(order.source) && 'bg-blue-50 text-blue-700'
                )}>
                  {order.source === 'web_storefront' && '🌐 Website'}
                  {order.source === 'whatsapp' && '💬 WhatsApp'}
                  {order.source === 'mobile_app' && '📱 App'}
                  {order.source === 'dashboard' && '📋 Dashboard'}
                  {order.source === 'api' && '🔗 API'}
                  {!order.source && '💬 WhatsApp'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={clsx(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  ['delivered'].includes(order.status) && 'bg-green-100 text-green-700',
                  ['cancelled', 'rejected'].includes(order.status) && 'bg-red-100 text-red-700',
                  !['delivered', 'cancelled', 'rejected'].includes(order.status) && 'bg-blue-100 text-blue-700'
                )}>
                  {statusLabels[order.status] || order.status}
                </span>
                <span className="text-xl font-bold text-surface-900">₹{order.totalAmount}</span>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> Items
                </h4>
                <div className="bg-surface-50 rounded-xl p-3 space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name || item.product?.name}
                        {item.variants?.length > 0 && (
                          <span className="text-surface-500 text-xs ml-1">
                            ({item.variants.map(v => v.option).join(', ')})
                          </span>
                        )}
                      </span>
                      <span className="font-medium">₹{item.totalPrice || item.price * item.quantity}</span>
                    </div>
                  ))}
                  {order.deliveryCharges > 0 && (
                    <div className="flex justify-between text-sm pt-2 border-t border-surface-200">
                      <span className="text-surface-500">Delivery</span>
                      <span>₹{order.deliveryCharges}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Delivery Address
                </h4>
                <div className="bg-surface-50 rounded-xl p-3 space-y-1.5 text-sm">
                  <p><strong>{order.customerName || 'Customer'}</strong></p>
                  <p className="text-surface-600">{order.customerPhone}</p>
                  <p className="text-surface-600">{formatAddr(order.deliveryAddress)}</p>
                  {order.specialInstructions && (
                    <p className="text-amber-700 text-xs mt-1">Note: {order.specialInstructions}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Payment
                </h4>
                <div className="flex gap-2">
                  <span className={clsx(
                    'px-2 py-1 rounded text-xs font-medium',
                    (order.paymentMethod === 'online' || order.paymentMethod === 'upi')
                      ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                  )}>
                    {(order.paymentMethod === 'online' || order.paymentMethod === 'upi') ? '💳 Online' : '💰 COD'}
                  </span>
                  <span className={clsx(
                    'px-2 py-1 rounded text-xs font-medium',
                    order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                  )}>
                    {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Unpaid'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerDetailModal({ customer, onClose }) {
  const [activeTab, setActiveTab] = useState('details');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');
  const [note, setNote] = useState(customer.notes || '');

  const { data: fullCustomer } = useQuery({
    queryKey: ['customer', customer._id],
    queryFn: () => api.get(`/customers/${customer._id}`).then(r => r.data.data),
    initialData: customer
  });

  const { data: orderDetail, isLoading: loadingOrder } = useQuery({
    queryKey: ['order', selectedOrderId],
    queryFn: () => api.get(`/orders/${selectedOrderId}`).then(r => r.data.data.order),
    enabled: !!selectedOrderId
  });

  const addTagMutation = useMutation({
    mutationFn: (tag) => api.post(`/customers/${customer._id}/tags`, { tag }),
    onSuccess: () => {
      queryClient.invalidateQueries(['customer', customer._id]);
      queryClient.invalidateQueries(['customers']);
      setNewTag('');
    }
  });

  const removeTagMutation = useMutation({
    mutationFn: (tag) => api.delete(`/customers/${customer._id}/tags/${tag}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['customer', customer._id]);
      queryClient.invalidateQueries(['customers']);
    }
  });

  const saveNoteMutation = useMutation({
    mutationFn: (note) => api.post(`/customers/${customer._id}/notes`, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries(['customer', customer._id]);
    }
  });

  const formatPhone = (phone) => {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '').slice(-10);
    return digits ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : phone;
  };

  const hasLocation = fullCustomer?.location?.coordinates?.[0] !== 0;
  const mapsLink = hasLocation && fullCustomer?.location?.coordinates
    ? `https://maps.google.com/?q=${fullCustomer.location.coordinates[1]},${fullCustomer.location.coordinates[0]}`
    : null;
  const unpaid = fullCustomer?.stats?.unpaidAmount ?? 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - compact */}
        <div className="p-4 border-b border-surface-100 bg-surface-50 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-lg font-bold shrink-0">
                {(fullCustomer?.name || 'C')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-surface-900">{fullCustomer?.name || 'Customer'}</h2>
                <p className="text-sm text-surface-500">{formatPhone(fullCustomer?.phone)}</p>
                {hasLocation && fullCustomer?.location?.address && (
                  <p className="text-xs text-surface-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {fullCustomer.location.address}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-200 rounded-lg transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-white rounded-lg p-2 border border-surface-100 text-center">
              <p className="text-lg font-bold text-surface-900">{fullCustomer?.stats?.totalOrders ?? 0}</p>
              <p className="text-[10px] text-surface-500">Orders</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-surface-100 text-center">
              <p className="text-lg font-bold text-surface-900">₹{fullCustomer?.stats?.totalSpent ?? 0}</p>
              <p className="text-[10px] text-surface-500">Spent</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-surface-100 text-center">
              <p className="text-lg font-bold text-surface-900">₹{fullCustomer?.stats?.averageOrderValue ?? 0}</p>
              <p className="text-[10px] text-surface-500">Avg</p>
            </div>
            <div className={clsx('rounded-lg p-2 border text-center', unpaid > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-surface-100')}>
              <p className={clsx('text-lg font-bold', unpaid > 0 ? 'text-amber-700' : 'text-surface-900')}>₹{unpaid}</p>
              <p className="text-[10px] text-surface-500">Unpaid</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-surface-100 flex px-4">
          {['details', 'orders', 'notes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {unpaid > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">Unpaid dues: ₹{unpaid}</p>
                    <p className="text-xs text-amber-700">This customer has pending payments</p>
                  </div>
                </div>
              )}

              {hasLocation && (
                <div>
                  <h4 className="text-xs font-medium text-surface-500 mb-2">Location</h4>
                  <div className="bg-surface-50 rounded-lg p-3">
                    <p className="text-sm text-surface-700">{fullCustomer?.location?.address || 'Location saved'}</p>
                    {mapsLink && (
                      <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mt-2">
                        <Map className="w-4 h-4" /> View on Maps
                      </a>
                    )}
                  </div>
                </div>
              )}

              {fullCustomer?.addresses?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-surface-500 mb-2">Saved Addresses</h4>
                  <div className="space-y-2">
                    {fullCustomer.addresses.map((addr, idx) => (
                      <div key={idx} className="bg-surface-50 rounded-lg p-3">
                        <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{addr.label}</span>
                        <p className="text-sm text-surface-700 mt-1">{addr.street}</p>
                        {addr.landmark && <p className="text-xs text-surface-500">Landmark: {addr.landmark}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-medium text-surface-500 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {fullCustomer?.tags?.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1 text-sm bg-primary-50 text-primary-700 px-2 py-1 rounded-lg">
                      {tag}
                      <button onClick={() => removeTagMutation.mutate(tag)} className="text-primary-400 hover:text-primary-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="input flex-1 py-2 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && newTag.trim() && addTagMutation.mutate(newTag.trim())}
                  />
                  <button onClick={() => newTag.trim() && addTagMutation.mutate(newTag.trim())} disabled={!newTag.trim()} className="btn btn-primary btn-sm">
                    Add
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-surface-500 mb-2">Engagement</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-50 rounded-lg p-2">
                    <p className="text-[10px] text-surface-500">First Interaction</p>
                    <p className="text-sm font-medium">{fullCustomer?.engagement?.firstInteraction ? format(new Date(fullCustomer.engagement.firstInteraction), 'MMM d, h:mm a') : '—'}</p>
                  </div>
                  <div className="bg-surface-50 rounded-lg p-2">
                    <p className="text-[10px] text-surface-500">Last Interaction</p>
                    <p className="text-sm font-medium">{fullCustomer?.engagement?.lastInteraction ? format(new Date(fullCustomer.engagement.lastInteraction), 'MMM d, h:mm a') : '—'}</p>
                  </div>
                  <div className="bg-surface-50 rounded-lg p-2">
                    <p className="text-[10px] text-surface-500">Last Order</p>
                    <p className="text-sm font-medium">{fullCustomer?.stats?.lastOrderAt ? format(new Date(fullCustomer.stats.lastOrderAt), 'MMM d, h:mm a') : '—'}</p>
                  </div>
                  <div className="bg-surface-50 rounded-lg p-2">
                    <p className="text-[10px] text-surface-500">Messages</p>
                    <p className="text-sm font-medium">{fullCustomer?.engagement?.totalMessages ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-2">
              {fullCustomer?.recentOrders?.length > 0 ? (
                fullCustomer.recentOrders.map((order, idx) => (
                  <div
                    key={order._id || idx}
                    onClick={() => setSelectedOrderId(order._id)}
                    className="bg-surface-50 rounded-lg p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-100 transition-colors group"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-surface-900">#{order.orderNumber}</span>
                      <span className={clsx(
                        'ml-2 text-xs px-2 py-0.5 rounded-full',
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        ['cancelled', 'rejected'].includes(order.status) ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      )}>
                        {order.status?.replaceAll('_', ' ')}
                      </span>
                      <p className="text-xs text-surface-500 mt-0.5">{order.merchant?.name}</p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <p className="font-semibold text-surface-900">₹{order.totalAmount}</p>
                        <p className="text-[10px] text-surface-500">{order.createdAt ? format(new Date(order.createdAt), 'MMM d') : ''}</p>
                        {order.paymentStatus !== 'paid' && !['cancelled', 'rejected'].includes(order.status) && (
                          <span className="text-[10px] text-amber-600">Unpaid</span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-primary-600 shrink-0" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                  <p className="text-surface-500 text-sm">No orders yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add notes about this customer..."
                className="input w-full h-32 resize-none"
              />
              <button onClick={() => saveNoteMutation.mutate(note)} disabled={saveNoteMutation.isPending} className="btn btn-primary mt-3">
                {saveNoteMutation.isPending ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedOrderId && createPortal(
        <OrderDetailModal
          order={orderDetail}
          isLoading={loadingOrder}
          onClose={() => setSelectedOrderId(null)}
        />,
        document.body
      )}
    </div>
  );
}

export default function Customers() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showZoneReport, setShowZoneReport] = useState(false);
  const [filters, setFilters] = useState({ hasOrders: false, hasLocation: false, sortBy: 'createdAt', sortOrder: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: () => api.get('/customers/stats').then(r => r.data.data)
  });

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', page, search, filters],
    queryFn: () => api.get('/customers', {
      params: {
        page,
        search,
        hasOrders: filters.hasOrders ? 'true' : undefined,
        hasLocation: filters.hasLocation ? 'true' : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      }
    }).then(r => r.data)
  });

  const { data: topCustomers } = useQuery({
    queryKey: ['top-customers'],
    queryFn: () => api.get('/customers/top?limit=5').then(r => r.data.data)
  });

  const { data: zoneReport, isLoading: zoneLoading, refetch: refetchZones } = useQuery({
    queryKey: ['zone-matching-report'],
    queryFn: () => api.get('/customers/zone-matching/report').then(r => r.data.data),
    enabled: showZoneReport
  });

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900">{isAdmin ? 'All Customers' : 'My Customers'}</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {isAdmin ? 'Manage customer database' : 'Customers who have ordered from your shop'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowZoneReport(!showZoneReport)}
            className={clsx('btn btn-sm', showZoneReport ? 'btn-primary' : 'btn-ghost')}
          >
            <Map className="w-4 h-4" />
            Zone Matching
          </button>
        )}
      </div>

      {isAdmin && showZoneReport && (
        <div className="card p-4 border-purple-200 bg-purple-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-surface-900 flex items-center gap-2">
              <Map className="w-5 h-5 text-purple-500" />
              Zone Matching Report
            </h2>
            <button onClick={() => refetchZones()} className="text-sm text-purple-600 hover:underline">Refresh</button>
          </div>
          {zoneLoading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : zoneReport ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-3"><p className="text-2xl font-bold">{zoneReport.summary?.totalCustomers ?? 0}</p><p className="text-xs text-surface-500">Total</p></div>
              <div className="card p-3"><p className="text-2xl font-bold text-green-600">{zoneReport.summary?.inZone ?? 0}</p><p className="text-xs text-surface-500">In Zone</p></div>
              <div className="card p-3"><p className="text-2xl font-bold text-red-500">{zoneReport.summary?.outOfZone ?? 0}</p><p className="text-xs text-surface-500">Outside</p></div>
              <div className="card p-3"><p className="text-2xl font-bold text-purple-600">{zoneReport.summary?.coverage ?? 0}%</p><p className="text-xs text-surface-500">Coverage</p></div>
            </div>
          ) : (
            <p className="text-surface-500 text-sm">Click Refresh to load</p>
          )}
        </div>
      )}

      <StatsCards stats={stats} />

      {/* Search + Filters - compact */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[140px] max-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or phone..."
            className="input pl-8 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx('btn btn-ghost btn-sm', (filters.hasOrders || filters.hasLocation) && 'text-primary-600')}
        >
          <Filter className="w-4 h-4" />
          {(filters.hasOrders || filters.hasLocation) && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
        </button>
        {showFilters && (
          <>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={filters.hasOrders} onChange={(e) => { setFilters({ ...filters, hasOrders: e.target.checked }); setPage(1); }} className="rounded" />
              Has Orders
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={filters.hasLocation} onChange={(e) => { setFilters({ ...filters, hasLocation: e.target.checked }); setPage(1); }} className="rounded" />
              Has Location
            </label>
            <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })} className="input w-auto py-2 text-sm min-w-[120px]">
              <option value="createdAt">Join Date</option>
              <option value="stats.totalOrders">Orders</option>
              <option value="stats.totalSpent">Spent</option>
            </select>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="flex gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-surface-200" /><div className="flex-1 space-y-2"><div className="h-4 bg-surface-200 rounded w-24" /><div className="h-3 bg-surface-200 rounded w-32" /></div></div>
                  <div className="grid grid-cols-3 gap-2"><div className="h-10 bg-surface-200 rounded" /><div className="h-10 bg-surface-200 rounded" /><div className="h-10 bg-surface-200 rounded" /></div>
                </div>
              ))}
            </div>
          ) : customersData?.data?.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customersData.data.map((customer) => (
                  <CustomerCard key={customer._id} customer={customer} onView={setSelectedCustomer} />
                ))}
              </div>
              {customersData.pagination?.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost btn-sm">Previous</button>
                  <span className="text-sm text-surface-600">Page {page} of {customersData.pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(customersData.pagination.pages, p + 1))} disabled={page === customersData.pagination.pages} className="btn btn-ghost btn-sm">Next</button>
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 text-center">
              <Users className="w-12 h-12 text-surface-300 mx-auto mb-4" />
              <h3 className="font-semibold text-surface-900 mb-1">No customers found</h3>
              <p className="text-sm text-surface-500">{search ? 'Try a different search' : 'Customers appear when they order'}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="card p-4 sticky top-24">
            <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Top Customers
            </h3>
            <div className="space-y-2">
              {topCustomers?.map((customer, idx) => (
                <div
                  key={customer._id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <span className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-surface-200 text-surface-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-surface-100 text-surface-500')}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 truncate text-sm">{customer.name || 'Customer'}</p>
                    <p className="text-[10px] text-surface-500">{customer.stats?.totalOrders ?? 0} orders · ₹{customer.stats?.totalSpent ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedCustomer && (
        <CustomerDetailModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
    </div>
  );
}
