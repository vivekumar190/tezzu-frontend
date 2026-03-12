import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Filter,
  Download,
  Search,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  X,
  Package,
  MapPin,
  CreditCard,
  Phone,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../lib/api'
import clsx from 'clsx'
import { useAuthStore } from '../store/authStore'
import { DatePicker } from '../components/DatePicker'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getQuickDateRanges() {
  const today = new Date()
  const ranges = [
    { id: 'today', label: 'Today', getRange: () => ({ from: format(startOfDay(today), 'yyyy-MM-dd'), to: format(endOfDay(today), 'yyyy-MM-dd') }) },
    { id: 'yesterday', label: 'Yesterday', getRange: () => { const d = subDays(today, 1); return { from: format(d, 'yyyy-MM-dd'), to: format(d, 'yyyy-MM-dd') } } },
    { id: 'last7', label: 'Last 7 days', getRange: () => ({ from: format(subDays(today, 6), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') }) },
    { id: 'last30', label: 'Last 30 days', getRange: () => ({ from: format(subDays(today, 29), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') }) },
    { id: 'thisMonth', label: 'This month', getRange: () => ({ from: format(startOfMonth(today), 'yyyy-MM-dd'), to: format(endOfMonth(today), 'yyyy-MM-dd') }) },
    { id: 'lastMonth', label: 'Last month', getRange: () => { const m = subMonths(today, 1); return { from: format(startOfMonth(m), 'yyyy-MM-dd'), to: format(endOfMonth(m), 'yyyy-MM-dd') } } },
    { id: 'prevMonth', label: 'Previous month', getRange: () => { const m = subMonths(today, 2); return { from: format(startOfMonth(m), 'yyyy-MM-dd'), to: format(endOfMonth(m), 'yyyy-MM-dd') } } },
  ]
  return ranges
}

function getMonthOptions() {
  const options = []
  const today = new Date()
  for (let i = 0; i < 12; i++) {
    const d = subMonths(today, i)
    const year = d.getFullYear()
    const month = d.getMonth()
    options.push({
      id: `${year}-${month}`,
      label: `${MONTH_NAMES[month]} ${year}`,
      getRange: () => ({ from: format(startOfMonth(d), 'yyyy-MM-dd'), to: format(endOfMonth(d), 'yyyy-MM-dd') })
    })
  }
  return options
}

export default function Earnings() {
  const { user } = useAuthStore()
  const merchantId = typeof user?.merchant === 'object' ? user.merchant._id : user?.merchant

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [activeQuickRange, setActiveQuickRange] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [sortOrder, setSortOrder] = useState('-date')
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const quickRanges = useMemo(() => getQuickDateRanges(), [])
  const monthOptions = useMemo(() => getMonthOptions(), [])

  const applyQuickRange = (range) => {
    const { from, to } = range.getRange()
    setFromDate(from)
    setToDate(to)
    setActiveQuickRange(range.id)
    setPage(1)
  }

  const applyMonthRange = (opt) => {
    const { from, to } = opt.getRange()
    setFromDate(from)
    setToDate(to)
    setActiveQuickRange(opt.id)
    setPage(1)
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const queryParams = new URLSearchParams()
  if (page > 1) queryParams.set('page', page)
  if (statusFilter) queryParams.set('status', statusFilter)
  if (paymentMethodFilter) queryParams.set('paymentMethod', paymentMethodFilter)
  if (fromDate) queryParams.set('fromDate', fromDate)
  if (toDate) queryParams.set('toDate', toDate)
  if (debouncedSearch) queryParams.set('search', debouncedSearch)
  if (sortOrder) queryParams.set('sort', sortOrder)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['merchant-earnings', page, statusFilter, paymentMethodFilter, fromDate, toDate, debouncedSearch, sortOrder],
    queryFn: async () => {
      const res = await api.get(`/merchants/me/earnings?${queryParams.toString()}`)
      return res.data.data
    },
    enabled: !!merchantId,
    placeholderData: (prev) => prev
  })

  const { data: orderDetail, isLoading: loadingOrder } = useQuery({
    queryKey: ['order', selectedOrderId],
    queryFn: () => api.get(`/orders/${selectedOrderId}`).then(r => r.data.data.order),
    enabled: !!selectedOrderId
  })

  const orders = data?.orders || []
  const summary = data?.summary || {}
  const pagination = data?.pagination || {}

  const exportCsv = () => {
    const headers = ['Date', 'Order #', 'Customer Name', 'Amount (₹)', 'Payment Method', 'Status']
    const rows = orders.map(o => [
      new Date(o.date).toLocaleDateString(),
      o.orderNumber,
      o.customerName,
      o.amount,
      o.paymentMethod,
      o.status
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `earnings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Earnings exported')
  }

  const clearFilters = () => {
    setStatusFilter('')
    setPaymentMethodFilter('')
    setFromDate('')
    setToDate('')
    setActiveQuickRange(null)
    setSearch('')
    setPage(1)
  }

  const hasFilters = statusFilter || paymentMethodFilter || fromDate || toDate || search || debouncedSearch

  const displayDateRange = fromDate && toDate
    ? fromDate === toDate
      ? format(new Date(fromDate), 'd MMM yyyy')
      : `${format(new Date(fromDate), 'd MMM')} – ${format(new Date(toDate), 'd MMM yyyy')}`
    : 'All time'

  const paymentMethodLabel = (m) => {
    const map = { cod: 'COD', online: 'Online', upi: 'UPI' }
    return map[m] || m
  }

  if (!merchantId) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-surface-900 mb-2">No merchant account</h3>
        <p className="text-surface-500">Earnings is only available for merchant accounts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-surface-900">Earnings & Accounting</h1>
        <p className="text-surface-500 mt-1">View revenue, orders, paid and unpaid amounts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 bg-surface-200 rounded" />
                    <div className="h-6 w-24 bg-surface-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Total Revenue</p>
                  <p className="text-lg font-bold text-surface-900">₹{summary.totalRevenue?.toLocaleString('en-IN') || 0}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Paid</p>
                  <p className="text-lg font-bold text-green-600">₹{summary.totalPaid?.toLocaleString('en-IN') || 0}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Unpaid</p>
                  <p className="text-lg font-bold text-amber-600">₹{summary.totalUnpaid?.toLocaleString('en-IN') || 0}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters - Compact */}
      <div className="card p-3 relative">
        {isFetching && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl z-10 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-full shadow border border-surface-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
              <span className="text-xs font-medium text-surface-700">Updating...</span>
            </div>
          </div>
        )}

        {/* Row 1: Search + Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[180px] relative">
            <Search className={clsx('w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2', isFetching ? 'text-primary-500' : 'text-surface-400')} />
            <input
              type="text"
              placeholder="Search order # or customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              disabled={isLoading}
              className="input pl-8 py-2 text-sm h-9 disabled:opacity-60"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowFilters(!showFilters)}
              disabled={isLoading}
              className={clsx(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all',
                showFilters ? 'bg-surface-100 border-surface-200' : 'border-surface-200 hover:bg-surface-50',
                isLoading && 'opacity-60'
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
              <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', showFilters && 'rotate-180')} />
            </button>
            <button
              onClick={exportCsv}
              disabled={isLoading || orders.length === 0}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-surface-200 hover:bg-surface-50 disabled:opacity-60 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            {hasFilters && (
              <button onClick={clearFilters} disabled={isFetching} className="text-xs text-surface-500 hover:text-surface-700 px-2 disabled:opacity-60">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Date pills - compact */}
        <div className="mt-2 pt-2 border-t border-surface-100 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-surface-500 mr-1">Date:</span>
          {quickRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => applyQuickRange(range)}
              disabled={isLoading}
              className={clsx(
                'px-2 py-1 rounded text-xs font-medium transition-all disabled:opacity-50',
                activeQuickRange === range.id ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              )}
            >
              {range.label}
            </button>
          ))}
          <select
            value={monthOptions.some(o => o.id === activeQuickRange) ? activeQuickRange : ''}
            onChange={(e) => {
              const opt = monthOptions.find(o => o.id === e.target.value)
              if (opt) applyMonthRange(opt)
            }}
            disabled={isLoading}
            className="ml-1 px-2 py-1 rounded text-xs border border-surface-200 bg-white text-surface-600 h-7 min-w-0 max-w-[110px]"
          >
            <option value="">Month...</option>
            {monthOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={clsx('px-2 py-1 rounded text-xs font-medium text-surface-500 hover:text-primary-600 hover:bg-primary-50', showDatePicker && 'bg-primary-50 text-primary-600')}
          >
            Custom
          </button>
          {showDatePicker && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-surface-200">
              <DatePicker compact value={fromDate} onChange={(v) => { setFromDate(v); setActiveQuickRange(null); setPage(1) }} placeholder="From" />
              <span className="text-surface-400 text-xs">→</span>
              <DatePicker compact value={toDate} onChange={(v) => { setToDate(v); setActiveQuickRange(null); setPage(1) }} placeholder="To" />
            </div>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-2 pt-2 border-t border-surface-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-surface-500">Status</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input py-1.5 px-2 text-xs h-8 w-24">
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-surface-500">Payment</label>
              <select value={paymentMethodFilter} onChange={(e) => { setPaymentMethodFilter(e.target.value); setPage(1) }} className="input py-1.5 px-2 text-xs h-8 w-24">
                <option value="">All</option>
                <option value="cod">COD</option>
                <option value="online">Online</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-surface-500">Sort</label>
              <select value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setPage(1) }} className="input py-1.5 px-2 text-xs h-8 w-28">
                <option value="-date">Newest</option>
                <option value="date">Oldest</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className={clsx('card overflow-hidden transition-opacity', isFetching && 'opacity-75')}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Order #</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Customer</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Amount (₹)</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Payment</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  {[...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-surface-100 animate-pulse">
                      <td className="py-3 px-4"><div className="h-4 w-20 bg-surface-200 rounded" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-24 bg-surface-200 rounded" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-28 bg-surface-200 rounded" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-16 bg-surface-200 rounded ml-auto" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-12 bg-surface-200 rounded" /></td>
                      <td className="py-3 px-4"><div className="h-5 w-14 bg-surface-200 rounded-full" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-4 bg-surface-200 rounded" /></td>
                    </tr>
                  ))}
                </>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-surface-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                    <p className="font-medium">No orders found</p>
                    <p className="text-sm mt-1">Your order revenue will appear here</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedOrderId(order._id)}
                    className={clsx(
                      'border-b border-surface-100 hover:bg-surface-50 transition-colors cursor-pointer',
                      order.status === 'unpaid' && 'bg-amber-50/50',
                      selectedOrderId === order._id && 'bg-primary-50'
                    )}
                  >
                    <td className="py-3 px-4 text-sm text-surface-700 whitespace-nowrap">
                      {new Date(order.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono font-medium text-surface-900">{order.orderNumber}</td>
                    <td className="py-3 px-4 text-sm text-surface-900">{order.customerName}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-surface-900">
                      ₹{order.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-sm text-surface-600">
                      {paymentMethodLabel(order.paymentMethod)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <ChevronRight className="w-4 h-4 text-surface-400" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
            <p className="text-sm text-surface-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || isFetching}
                className="btn btn-ghost btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-surface-600 flex items-center gap-1">
                {isFetching && <Loader2 className="w-3 h-3 animate-spin" />}
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page >= pagination.pages || isFetching}
                className="btn btn-ghost btn-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && createPortal(
        <OrderDetailModal
          order={orderDetail}
          isLoading={loadingOrder}
          onClose={() => setSelectedOrderId(null)}
        />,
        document.body
      )}
    </div>
  )
}

function OrderDetailModal({ order, isLoading, onClose }) {
  const formatAddr = (addr) => {
    if (!addr) return '—'
    const parts = [addr.street, addr.landmark, addr.city, addr.pincode].filter(Boolean)
    return parts.join(', ') || '—'
  }

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
  }

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
                        {item.quantity}x {item.name}
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

              {order.statusHistory?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Timeline</h4>
                  <div className="space-y-0">
                    {[...order.statusHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((entry, i) => (
                      <div key={i} className="flex gap-3 py-2 border-b border-surface-100 last:border-0">
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-900">
                            {statusLabels[entry.status] || entry.status}
                          </p>
                          <p className="text-xs text-surface-500">
                            {new Date(entry.timestamp).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                            {entry.updatedBy && ` • ${entry.updatedBy}`}
                          </p>
                          {entry.note && (
                            <p className="text-xs text-surface-600 mt-0.5">{entry.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
