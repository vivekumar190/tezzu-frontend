import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  CreditCard, 
  IndianRupee, 
  TrendingUp, 
  Store, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  Loader2, 
  Building, 
  XCircle, 
  Banknote,
  RefreshCw,
  Download,
  BarChart3,
  Users,
  Zap,
  Settings,
  Shield,
  FileText,
  Search,
  Filter,
  MoreVertical,
  Eye,
  RotateCcw,
  Trash2
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function RazorpayAdmin() {
  const [activeTab, setActiveTab] = useState('overview')
  const queryClient = useQueryClient()

  // Fetch admin Razorpay overview
  const { data: overview, isLoading: overviewLoading, refetch } = useQuery({
    queryKey: ['admin-razorpay-overview'],
    queryFn: async () => {
      const res = await api.get('/admin/razorpay/overview')
      return res.data.data
    }
  })

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          <p className="text-surface-500">Loading Razorpay data...</p>
        </div>
      </div>
    )
  }

  const stats = overview?.stats || {}

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            Razorpay Payments
          </h1>
          <p className="text-surface-500 mt-1">Monitor payments, settlements, and merchant accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'px-3 py-1.5 rounded-full text-sm font-medium',
            overview?.razorpayConfigured 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          )}>
            {overview?.razorpayConfigured ? '● API Connected' : '○ Not Configured'}
          </span>
          <button onClick={() => refetch()} className="btn btn-ghost">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Configuration Warning */}
      {!overview?.razorpayConfigured && (
        <div className="card p-6 border-l-4 border-l-amber-500 bg-amber-50">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800">Razorpay API Not Configured</h3>
              <p className="text-sm text-amber-700 mt-1">
                Add the following environment variables to enable payment processing:
              </p>
              <code className="block mt-2 p-3 bg-amber-100 rounded-lg text-xs font-mono text-amber-900">
                RAZORPAY_KEY_ID=rzp_live_xxxxx{'\n'}
                RAZORPAY_KEY_SECRET=xxxxx{'\n'}
                RAZORPAY_WEBHOOK_SECRET=xxxxx{'\n'}
                TEZZU_PLATFORM_FEE=500
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Total Collected</p>
              <p className="text-2xl font-bold text-surface-900">₹{stats.totalCollected?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Total Settled</p>
              <p className="text-2xl font-bold text-surface-900">₹{stats.totalSettled?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Platform Revenue</p>
              <p className="text-2xl font-bold text-purple-600">₹{stats.platformRevenue?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Active Merchants</p>
              <p className="text-2xl font-bold text-surface-900">{stats.activeMerchants || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Fee Card */}
      <div className="card p-6 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center">
              <Zap className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">Platform Fee Structure</h3>
              <p className="text-sm text-surface-600">Automatic deduction per order</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-purple-600">₹{overview?.platformFee || 5}</p>
            <p className="text-sm text-surface-500">per order</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-white rounded-xl text-center">
            <p className="text-2xl font-bold text-surface-900">{stats.totalOrders || 0}</p>
            <p className="text-xs text-surface-500">Total Orders</p>
          </div>
          <div className="p-4 bg-white rounded-xl text-center">
            <p className="text-2xl font-bold text-green-600">T+2</p>
            <p className="text-xs text-surface-500">Settlement Days</p>
          </div>
          <div className="p-4 bg-white rounded-xl text-center">
            <p className="text-2xl font-bold text-blue-600">₹6+</p>
            <p className="text-xs text-surface-500">Min Order Amount</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-1 overflow-x-auto pb-px">
          {[
            { id: 'overview', label: 'Recent Payments', icon: CreditCard },
            { id: 'payments', label: 'All Payments', icon: FileText },
            { id: 'merchants', label: 'Merchant Accounts', icon: Store },
            { id: 'issues', label: 'Issues & Actions', icon: AlertTriangle },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && <RecentPaymentsTab recentPayments={overview?.recentPayments || []} />}
        {activeTab === 'payments' && <AllPaymentsTab />}
        {activeTab === 'merchants' && <MerchantAccountsTab />}
        {activeTab === 'issues' && <IssuesTab queryClient={queryClient} />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  )
}

// Recent Payments Tab
function RecentPaymentsTab({ recentPayments }) {
  if (recentPayments.length === 0) {
    return (
      <div className="card p-12 text-center">
        <CreditCard className="w-16 h-16 mx-auto text-surface-300 mb-4" />
        <h3 className="text-lg font-semibold text-surface-900">No payments yet</h3>
        <p className="text-surface-500 mt-2">Payments will appear here once merchants start receiving orders</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-surface-600">Order</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-surface-600">Merchant</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-surface-600">Amount</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-surface-600">Platform Fee</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-surface-600">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-surface-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {recentPayments.map((payment, i) => (
              <tr key={i} className="hover:bg-surface-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-medium">#{payment.orderNumber}</span>
                </td>
                <td className="px-6 py-4 text-surface-700">{payment.merchantName}</td>
                <td className="px-6 py-4 font-semibold">₹{payment.amount}</td>
                <td className="px-6 py-4 text-purple-600 font-medium">₹{payment.platformFee}</td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    payment.status === 'paid' && 'bg-green-100 text-green-700',
                    payment.status === 'settled' && 'bg-blue-100 text-blue-700',
                    payment.status === 'failed' && 'bg-red-100 text-red-700',
                    payment.status === 'pending' && 'bg-amber-100 text-amber-700'
                  )}>
                    {payment.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                    {payment.status === 'settled' && <Banknote className="w-3 h-3" />}
                    {payment.status === 'failed' && <XCircle className="w-3 h-3" />}
                    {payment.status === 'pending' && <Clock className="w-3 h-3" />}
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-surface-500 text-sm">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// All Payments Tab
function AllPaymentsTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-razorpay-payments'],
    queryFn: async () => {
      const res = await api.get('/admin/razorpay/payments')
      return res.data.data
    }
  })

  const handleExportCSV = () => {
    window.open('/api/admin/razorpay/export', '_blank')
  }

  const filteredPayments = data?.payments?.filter(p => {
    const matchesSearch = !searchTerm || 
      p.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.merchantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerPhone?.includes(searchTerm)
    const matchesStatus = !statusFilter || p.transferStatus === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order, merchant, phone..."
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
            <option value="settled">Settled</option>
            <option value="failed">Failed</option>
          </select>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-surface-300 mb-3" />
            <p className="text-surface-500">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase">Merchant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase">Merchant Gets</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase">Platform Fee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredPayments.map((payment, i) => (
                  <tr key={i} className="hover:bg-surface-50">
                    <td className="px-4 py-3 font-mono text-sm">#{payment.orderNumber}</td>
                    <td className="px-4 py-3 text-sm">{payment.merchantName}</td>
                    <td className="px-4 py-3 text-sm text-surface-600">{payment.customerPhone}</td>
                    <td className="px-4 py-3 font-semibold">₹{payment.amount}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">₹{payment.merchantAmount}</td>
                    <td className="px-4 py-3 text-purple-600">₹{payment.platformFee}</td>
                    <td className="px-4 py-3 text-sm capitalize">{payment.method || 'upi'}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        payment.transferStatus === 'settled' && 'bg-green-100 text-green-700',
                        payment.transferStatus === 'processed' && 'bg-blue-100 text-blue-700',
                        payment.transferStatus === 'failed' && 'bg-red-100 text-red-700',
                        payment.transferStatus === 'pending' && 'bg-amber-100 text-amber-700'
                      )}>
                        {payment.transferStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Merchant Accounts Tab
function MerchantAccountsTab() {
  const queryClient = useQueryClient()
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-razorpay-merchants'],
    queryFn: async () => {
      const res = await api.get('/admin/razorpay/merchants')
      return res.data.data
    }
  })

  const syncMerchant = useMutation({
    mutationFn: async (merchantId) => {
      const res = await api.post(`/admin/razorpay/sync-merchant/${merchantId}`)
      return res.data
    },
    onSuccess: () => {
      toast.success('Merchant account synced')
      refetch()
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Sync failed')
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (data?.merchants?.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Store className="w-16 h-16 mx-auto text-surface-300 mb-4" />
        <h3 className="text-lg font-semibold text-surface-900">No Razorpay Accounts</h3>
        <p className="text-surface-500 mt-2">Merchants haven't set up Razorpay yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {data?.merchants?.filter(m => m.razorpayEnabled).length || 0}
          </p>
          <p className="text-xs text-surface-500">Active Accounts</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {data?.merchants?.filter(m => m.razorpayAccountId && !m.razorpayEnabled).length || 0}
          </p>
          <p className="text-xs text-surface-500">KYC Pending</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-surface-600">{data?.pendingSetup || 0}</p>
          <p className="text-xs text-surface-500">Not Set Up</p>
        </div>
      </div>

      {/* Merchant Cards */}
      <div className="grid gap-4">
        {data?.merchants?.map((merchant, i) => (
          <div key={i} className={clsx(
            'card p-5 border-l-4 hover:shadow-md transition-shadow',
            merchant.razorpayEnabled ? 'border-l-green-500' :
            merchant.razorpayAccountStatus === 'activated' ? 'border-l-blue-500' :
            merchant.razorpayAccountId ? 'border-l-amber-500' :
            'border-l-surface-300'
          )}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  'w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold',
                  merchant.razorpayEnabled ? 'bg-green-100 text-green-600' :
                  'bg-surface-100 text-surface-500'
                )}>
                  {merchant.name?.charAt(0) || 'M'}
                </div>
                <div>
                  <h4 className="font-semibold text-surface-900">{merchant.name}</h4>
                  <p className="text-sm text-surface-500">{merchant.whatsappNumber}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      merchant.razorpayEnabled ? 'bg-green-100 text-green-700' :
                      merchant.razorpayAccountStatus === 'activated' ? 'bg-blue-100 text-blue-700' :
                      merchant.razorpayAccountId ? 'bg-amber-100 text-amber-700' :
                      'bg-surface-100 text-surface-600'
                    )}>
                      {merchant.razorpayEnabled ? '✓ Active' :
                       merchant.razorpayAccountStatus === 'activated' ? 'Ready to Enable' :
                       merchant.razorpayAccountId ? 'KYC Pending' :
                       'Not Set Up'}
                    </span>
                    {merchant.razorpayKycStatus && (
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs',
                        merchant.razorpayKycStatus === 'verified' ? 'bg-green-50 text-green-600' :
                        merchant.razorpayKycStatus === 'submitted' ? 'bg-amber-50 text-amber-600' :
                        'bg-surface-50 text-surface-500'
                      )}>
                        KYC: {merchant.razorpayKycStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">₹{merchant.totalCollected?.toLocaleString() || 0}</p>
                <p className="text-xs text-surface-500">{merchant.orderCount || 0} orders</p>
                {merchant.razorpayAccountId && (
                  <button
                    onClick={() => syncMerchant.mutate(merchant._id)}
                    disabled={syncMerchant.isPending}
                    className="mt-2 text-xs text-primary-600 hover:underline flex items-center gap-1 ml-auto"
                  >
                    {syncMerchant.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Sync Status
                  </button>
                )}
              </div>
            </div>
            {merchant.razorpayBankDetails && (
              <div className="mt-4 pt-4 border-t border-surface-100 flex items-center gap-3 text-sm">
                <Building className="w-4 h-4 text-surface-400" />
                <span className="text-surface-600">{merchant.razorpayBankDetails.beneficiaryName}</span>
                <span className="text-surface-300">|</span>
                <span className="font-mono text-surface-500">
                  ****{merchant.razorpayBankDetails.accountNumber?.slice(-4)}
                </span>
                <span className="text-surface-300">|</span>
                <span className="text-surface-500">{merchant.razorpayBankDetails.ifscCode}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Issues & Actions Tab
function IssuesTab({ queryClient }) {
  const [refundingOrder, setRefundingOrder] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  // Fetch failed transfers
  const { data: failedData, isLoading: failedLoading, refetch: refetchFailed } = useQuery({
    queryKey: ['admin-razorpay-failed'],
    queryFn: async () => {
      const res = await api.get('/admin/razorpay/failed-transfers')
      return res.data.data
    }
  })

  // Fetch expired links
  const { data: expiredData, isLoading: expiredLoading, refetch: refetchExpired } = useQuery({
    queryKey: ['admin-razorpay-expired'],
    queryFn: async () => {
      const res = await api.get('/admin/razorpay/expired-links')
      return res.data.data
    }
  })

  // Retry transfer mutation
  const retryTransfer = useMutation({
    mutationFn: async (orderId) => {
      const res = await api.post(`/admin/razorpay/retry-transfer/${orderId}`)
      return res.data
    },
    onSuccess: () => {
      toast.success('Transfer retry initiated')
      refetchFailed()
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Retry failed')
    }
  })

  // Cancel expired mutation
  const cancelExpired = useMutation({
    mutationFn: async (orderId) => {
      const res = await api.post(`/admin/razorpay/cancel-expired/${orderId}`)
      return res.data
    },
    onSuccess: () => {
      toast.success('Order cancelled')
      refetchExpired()
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Cancel failed')
    }
  })

  // Process refund mutation
  const processRefund = useMutation({
    mutationFn: async ({ orderId, amount, reason }) => {
      const res = await api.post(`/admin/razorpay/refund/${orderId}`, { amount, reason })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message)
      setRefundingOrder('')
      setRefundAmount('')
      setRefundReason('')
      queryClient.invalidateQueries(['admin-razorpay-payments'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Refund failed')
    }
  })

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-surface-900">Quick Actions</h3>
          <button 
            onClick={() => { refetchFailed(); refetchExpired(); }} 
            className="btn btn-ghost btn-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/api/admin/razorpay/export" target="_blank" className="btn btn-secondary">
            <Download className="w-4 h-4" />
            Export All Payments
          </a>
        </div>
      </div>

      {/* Failed Transfers */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900">Failed Transfers</h3>
            <p className="text-sm text-surface-500">{failedData?.count || 0} transfers need attention</p>
          </div>
        </div>
        
        {failedLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
          </div>
        ) : failedData?.failedTransfers?.length === 0 ? (
          <div className="py-8 text-center bg-green-50 rounded-xl">
            <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
            <p className="text-green-700 font-medium">All transfers successful</p>
          </div>
        ) : (
          <div className="space-y-3">
            {failedData?.failedTransfers?.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                <div>
                  <p className="font-medium text-surface-900">Order #{item.orderNumber}</p>
                  <p className="text-sm text-surface-600">{item.merchantName} • ₹{item.amount}</p>
                  <p className="text-xs text-surface-400 mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => retryTransfer.mutate(item.orderId)}
                  disabled={retryTransfer.isPending}
                  className="btn btn-primary btn-sm"
                >
                  {retryTransfer.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Retry
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expired Payment Links */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900">Expired Payment Links</h3>
            <p className="text-sm text-surface-500">{expiredData?.count || 0} orders with expired links</p>
          </div>
        </div>
        
        {expiredLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
          </div>
        ) : expiredData?.expiredOrders?.length === 0 ? (
          <div className="py-8 text-center bg-green-50 rounded-xl">
            <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
            <p className="text-green-700 font-medium">No expired payment links</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expiredData?.expiredOrders?.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div>
                  <p className="font-medium text-surface-900">Order #{item.orderNumber}</p>
                  <p className="text-sm text-surface-600">{item.merchantName} • ₹{item.amount}</p>
                  <p className="text-xs text-surface-400 mt-1">
                    Customer: {item.customerPhone} • Expired: {new Date(item.expiredAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => cancelExpired.mutate(item.orderId)}
                  disabled={cancelExpired.isPending}
                  className="btn btn-secondary btn-sm"
                >
                  {cancelExpired.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Refund */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-900">Process Refund</h3>
            <p className="text-sm text-surface-500">Manually refund a Razorpay payment</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Order ID (MongoDB)</label>
            <input
              type="text"
              value={refundingOrder}
              onChange={(e) => setRefundingOrder(e.target.value)}
              className="input font-mono text-sm"
              placeholder="64a7b8c9d0e1f2..."
            />
          </div>
          <div>
            <label className="label">Amount (optional)</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="input"
              placeholder="Full refund if empty"
            />
          </div>
          <div>
            <label className="label">Reason</label>
            <input
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="input"
              placeholder="Refund reason"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                if (!refundingOrder) {
                  toast.error('Enter Order ID')
                  return
                }
                processRefund.mutate({
                  orderId: refundingOrder,
                  amount: refundAmount ? parseFloat(refundAmount) : null,
                  reason: refundReason
                })
              }}
              disabled={processRefund.isPending || !refundingOrder}
              className="btn btn-danger w-full"
            >
              {processRefund.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process Refund'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Analytics Tab
function AnalyticsTab() {
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['admin-razorpay-analytics', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from)
      if (dateRange.to) params.append('to', dateRange.to)
      const res = await api.get(`/admin/razorpay/analytics?${params}`)
      return res.data.data
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="card p-6">
        <h3 className="font-semibold text-surface-900 mb-4">Filter by Date Range</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="input"
            />
          </div>
          <button onClick={() => refetch()} className="btn btn-primary">
            Apply
          </button>
          <button onClick={() => setDateRange({ from: '', to: '' })} className="btn btn-ghost">
            Clear
          </button>
        </div>
      </div>

      {/* Daily Revenue */}
      <div className="card p-6">
        <h3 className="font-semibold text-surface-900 mb-4">Daily Revenue (Last 30 Days)</h3>
        {analytics?.dailyRevenue?.length === 0 ? (
          <p className="text-surface-500 text-center py-8">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Orders</th>
                  <th className="text-left px-4 py-3 font-semibold">Total Amount</th>
                  <th className="text-left px-4 py-3 font-semibold">Platform Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {analytics?.dailyRevenue?.map((day, i) => (
                  <tr key={i} className="hover:bg-surface-50">
                    <td className="px-4 py-3">{day._id}</td>
                    <td className="px-4 py-3">{day.orders}</td>
                    <td className="px-4 py-3 font-medium">₹{day.totalAmount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-purple-600 font-medium">₹{day.platformRevenue?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Merchants */}
      <div className="card p-6">
        <h3 className="font-semibold text-surface-900 mb-4">Top Merchants by Volume</h3>
        {analytics?.topMerchants?.length === 0 ? (
          <p className="text-surface-500 text-center py-8">No data available</p>
        ) : (
          <div className="space-y-3">
            {analytics?.topMerchants?.map((merchant, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-surface-900">{merchant.merchantName}</p>
                    <p className="text-sm text-surface-500">{merchant.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">₹{merchant.totalAmount?.toLocaleString()}</p>
                  <p className="text-sm text-purple-600">₹{merchant.platformRevenue} fee</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="card p-6">
        <h3 className="font-semibold text-surface-900 mb-4">Payment Methods Breakdown</h3>
        {analytics?.paymentMethods?.length === 0 ? (
          <p className="text-surface-500 text-center py-8">No data available</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics?.paymentMethods?.map((method, i) => (
              <div key={i} className="p-4 bg-gradient-to-br from-surface-50 to-surface-100 rounded-xl text-center">
                <p className="text-3xl font-bold text-surface-900">{method.count}</p>
                <p className="text-sm font-medium text-surface-600 capitalize mt-1">{method._id || 'Unknown'}</p>
                <p className="text-xs text-surface-400">₹{method.amount?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
