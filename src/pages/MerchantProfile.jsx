import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  User, 
  Store, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Receipt,
  Clock,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  ExternalLink,
  Loader2,
  FileText,
  Eye,
  ChevronRight,
  Shield,
  XCircle,
  Building,
  Zap,
  Crown,
  Key,
  Copy,
  Plus,
  Trash2,
  RefreshCw,
  Package,
  Users,
  Map,
  ArrowUpRight,
  Sparkles,
  Check
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { useAuthStore } from '../store/authStore'

export default function MerchantProfile() {
  const [activeTab, setActiveTab] = useState('subscription')
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch merchant profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['merchant-profile'],
    queryFn: async () => {
      const res = await api.get('/merchants/me/profile')
      return res.data.data
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          <p className="text-surface-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  const merchant = profile?.merchant
  const stats = profile?.stats
  const billing = profile?.billing

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="card overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 relative">
          {merchant?.coverImage && (
            <img 
              src={merchant.coverImage} 
              alt="" 
              className="w-full h-full object-cover opacity-50"
            />
          )}
        </div>
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl bg-white shadow-lg border-4 border-white overflow-hidden flex-shrink-0">
              {merchant?.logo ? (
                <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <Store className="w-10 h-10 text-primary-600" />
                </div>
              )}
            </div>
            
            {/* Name & Status */}
            <div className="flex-1 pt-4 sm:pt-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-display font-bold text-surface-900">{merchant?.name}</h1>
                <span className={clsx(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  merchant?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                )}>
                  {merchant?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-surface-500 mt-1">{merchant?.description || 'No description added'}</p>
            </div>

            {/* Account Type Badge */}
            <div className="flex items-center gap-2">
              {billing?.usesOnlinePayments ? (
                <span className="px-4 py-2 rounded-xl bg-green-100 text-green-700 text-sm font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Online Payments Active
                </span>
              ) : (
                <span className="px-4 py-2 rounded-xl bg-amber-100 text-amber-700 text-sm font-medium flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Monthly Billing
                </span>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-surface-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-surface-400" />
              {merchant?.whatsappNumber}
            </div>
            {merchant?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-surface-400" />
                {merchant.email}
              </div>
            )}
            {merchant?.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-surface-400" />
                {typeof merchant.address === 'string' 
                  ? merchant.address 
                  : [merchant.address.street, merchant.address.city].filter(Boolean).join(', ')}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-surface-400" />
              Member since {new Date(merchant?.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Total Orders</p>
              <p className="text-2xl font-bold text-surface-900">{stats?.totalOrders?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{stats?.totalRevenue?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">This Month</p>
              <p className="text-2xl font-bold text-surface-900">{stats?.thisMonthOrders || 0}</p>
              <p className="text-xs text-surface-400">orders</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-12 h-12 rounded-2xl flex items-center justify-center',
              billing?.pendingCount > 0 
                ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                : 'bg-gradient-to-br from-surface-300 to-surface-400'
            )}>
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Pending Dues</p>
              <p className={clsx(
                'text-2xl font-bold',
                billing?.pendingCount > 0 ? 'text-amber-600' : 'text-surface-400'
              )}>
                ₹{billing?.pendingAmount?.toLocaleString() || 0}
              </p>
              {billing?.pendingCount > 0 && (
                <p className="text-xs text-amber-600">{billing.pendingCount} invoice(s)</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Billing Alert */}
      {billing?.pendingCount > 0 && !billing?.usesOnlinePayments && (
        <div className="card p-4 border-l-4 border-l-amber-500 bg-amber-50">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                You have {billing.pendingCount} pending invoice(s) totaling ₹{billing.pendingAmount}
              </p>
              <p className="text-sm text-amber-700">
                Please pay your platform fees to avoid service interruption.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('invoices')} 
              className="btn btn-primary btn-sm whitespace-nowrap"
            >
              View Invoices
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-1 overflow-x-auto pb-px">
          {[
            { id: 'subscription', label: 'Plan & Usage', icon: Crown },
            { id: 'overview', label: 'Razorpay Status', icon: CreditCard },
            { id: 'invoices', label: 'Invoices & Billing', icon: Receipt, badge: billing?.pendingCount },
            { id: 'apikeys', label: 'API Keys', icon: Key }
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
              {tab.badge > 0 && (
                <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'subscription' && <SubscriptionTab />}
        {activeTab === 'overview' && <RazorpayStatusTab merchant={merchant} />}
        {activeTab === 'invoices' && <InvoicesTab queryClient={queryClient} />}
        {activeTab === 'apikeys' && <ApiKeysTab />}
      </div>
    </div>
  )
}

// Razorpay Status Tab
function RazorpayStatusTab({ merchant }) {
  const getStatusInfo = (status) => {
    const statusMap = {
      'activated': { label: 'Active', dotClass: 'bg-green-500', textClass: 'text-green-700', icon: CheckCircle },
      'created': { label: 'Pending Verification', dotClass: 'bg-amber-500', textClass: 'text-amber-700', icon: Clock },
      'under_review': { label: 'Under Review', dotClass: 'bg-blue-500', textClass: 'text-blue-700', icon: Eye },
      'needs_clarification': { label: 'Needs Clarification', dotClass: 'bg-amber-500', textClass: 'text-amber-700', icon: AlertTriangle },
      'suspended': { label: 'Suspended', dotClass: 'bg-red-500', textClass: 'text-red-700', icon: XCircle },
      'verified': { label: 'Verified', dotClass: 'bg-green-500', textClass: 'text-green-700', icon: CheckCircle },
      'submitted': { label: 'Submitted', dotClass: 'bg-blue-500', textClass: 'text-blue-700', icon: Clock },
      'pending': { label: 'Pending', dotClass: 'bg-amber-500', textClass: 'text-amber-700', icon: Clock }
    }
    return statusMap[status] || { label: status || 'Not Set Up', dotClass: 'bg-surface-400', textClass: 'text-surface-600', icon: CreditCard }
  }

  const accountStatus = getStatusInfo(merchant?.razorpayAccountStatus)
  const kycStatus = getStatusInfo(merchant?.razorpayKycStatus)
  const StatusIcon = accountStatus.icon

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={clsx(
            'w-16 h-16 rounded-2xl flex items-center justify-center',
            merchant?.razorpayEnabled 
              ? 'bg-gradient-to-br from-green-400 to-green-600' 
              : 'bg-gradient-to-br from-surface-300 to-surface-400'
          )}>
            <StatusIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-surface-900">
              {merchant?.razorpayEnabled ? 'Online Payments Active' : 'Online Payments Not Set Up'}
            </h3>
            <p className="text-surface-500">
              {merchant?.razorpayEnabled 
                ? 'You can receive payments directly to your bank account' 
                : 'Set up Razorpay to receive online payments from customers'}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-surface-50 rounded-xl">
            <p className="text-sm text-surface-500 mb-1">Account Status</p>
            <div className="flex items-center gap-2">
              <span className={clsx('w-2 h-2 rounded-full', accountStatus.dotClass)} />
              <span className={clsx('font-medium', accountStatus.textClass)}>
                {accountStatus.label}
              </span>
            </div>
          </div>
          <div className="p-4 bg-surface-50 rounded-xl">
            <p className="text-sm text-surface-500 mb-1">KYC Status</p>
            <div className="flex items-center gap-2">
              <span className={clsx('w-2 h-2 rounded-full', kycStatus.dotClass)} />
              <span className={clsx('font-medium', kycStatus.textClass)}>
                {kycStatus.label}
              </span>
            </div>
          </div>
        </div>

        {!merchant?.razorpayEnabled && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>Want to receive online payments?</strong><br />
              Go to <span className="font-medium">My Shop → Settings</span> to set up your Razorpay account and start accepting UPI, cards, and net banking payments.
            </p>
          </div>
        )}
      </div>

      {/* Benefits of Online Payments */}
      {!merchant?.razorpayEnabled && (
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Benefits of Online Payments</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: IndianRupee, title: 'Instant Settlements', desc: 'Get paid directly to your bank in T+2 days' },
              { icon: Shield, title: 'Secure Payments', desc: 'All transactions are encrypted and secure' },
              { icon: Receipt, title: 'No Monthly Invoices', desc: 'Platform fee auto-deducted, no manual billing' },
              { icon: CreditCard, title: 'Multiple Options', desc: 'Accept UPI, cards, net banking, wallets' }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-surface-900">{item.title}</p>
                  <p className="text-sm text-surface-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Invoices Tab
function InvoicesTab({ queryClient }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['merchant-invoices'],
    queryFn: async () => {
      const res = await api.get('/merchants/me/invoices')
      return res.data.data
    }
  })

  const payMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const res = await api.post(`/merchants/me/invoices/${invoiceId}/pay`)
      return res.data
    },
    onSuccess: (data) => {
      if (data.data?.paymentUrl) {
        window.open(data.data.paymentUrl, '_blank')
        toast.success('Payment page opened in new tab')
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to get payment link')
  })

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-surface-100 text-surface-500',
      waived: 'bg-purple-100 text-purple-700'
    }
    return styles[status] || 'bg-surface-100 text-surface-500'
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const invoices = data?.invoices || []

  if (invoices.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-8 h-8 text-surface-400" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 mb-2">No Invoices Yet</h3>
        <p className="text-surface-500 max-w-md mx-auto">
          Platform fee invoices will appear here at the end of each month. 
          If you use online payments, fees are automatically deducted from each transaction.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Invoice Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-sm text-surface-500">Total Invoices</p>
          <p className="text-2xl font-bold text-surface-900">{invoices.length}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm text-surface-500">Pending Amount</p>
          <p className="text-2xl font-bold text-amber-600">
            ₹{invoices.filter(i => ['pending', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.totalAmountRupees, 0).toLocaleString()}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm text-surface-500">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmountRupees, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {invoices.map(invoice => (
          <div 
            key={invoice._id} 
            className={clsx(
              'card p-4 hover:shadow-md transition-shadow',
              ['pending', 'overdue'].includes(invoice.status) && 'border-l-4 border-l-amber-500'
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  invoice.status === 'paid' ? 'bg-green-100' : 'bg-amber-100'
                )}>
                  {invoice.status === 'paid' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Receipt className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium text-surface-900">{invoice.invoiceNumber}</p>
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium capitalize', getStatusBadge(invoice.status))}>
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-sm text-surface-500">
                    {monthNames[invoice.billingPeriod?.month - 1]} {invoice.billingPeriod?.year} • {invoice.orderCount} orders
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-surface-900">₹{invoice.totalAmountRupees}</p>
                  <p className="text-xs text-surface-500">
                    Due: {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>

                {['pending', 'overdue'].includes(invoice.status) && (
                  <button
                    onClick={() => payMutation.mutate(invoice._id)}
                    disabled={payMutation.isPending}
                    className="btn btn-primary btn-sm"
                  >
                    {payMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Pay Now</>
                    )}
                  </button>
                )}

                {invoice.status === 'paid' && (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Paid
                  </span>
                )}
              </div>
            </div>

            {/* Invoice Details (expandable) */}
            {invoice.status === 'paid' && invoice.paidAt && (
              <div className="mt-3 pt-3 border-t border-surface-100 text-sm text-surface-500">
                Paid on {new Date(invoice.paidAt).toLocaleDateString()} via {invoice.paymentMethod?.replace('_', ' ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="card p-4 bg-surface-50">
        <p className="text-sm text-surface-600">
          <strong>How billing works:</strong> At the end of each month, we calculate the platform fee (₹5 per order) 
          for all your COD/offline orders. You'll receive an invoice which can be paid online via UPI or card.
        </p>
      </div>
    </div>
  )
}

// Subscription Tab
function SubscriptionTab() {
  const queryClient = useQueryClient()

  // Fetch subscription details
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-subscription'],
    queryFn: async () => {
      const res = await api.get('/subscriptions/me')
      return res.data.data
    }
  })

  // Fetch available plans
  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await api.get('/subscriptions/plans')
      return res.data.data
    }
  })

  // Fetch usage
  const { data: usageData } = useQuery({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      const res = await api.get('/subscriptions/usage')
      return res.data.data
    }
  })

  const upgradeMutation = useMutation({
    mutationFn: async ({ plan, billingCycle }) => {
      const res = await api.post('/subscriptions/upgrade', { plan, billingCycle })
      return res.data
    },
    onSuccess: (data) => {
      if (data.data?.shortUrl) {
        window.open(data.data.shortUrl, '_blank')
        toast.success('Payment page opened. Complete payment to activate your plan.')
      }
      queryClient.invalidateQueries({ queryKey: ['merchant-subscription'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to initiate upgrade')
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const subscription = data?.subscription
  const plans = plansData?.plans || []
  const usage = usageData?.usage

  const getPlanBadgeColor = (plan) => {
    const colors = {
      free: 'bg-surface-100 text-surface-700',
      starter: 'bg-blue-100 text-blue-700',
      growth: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-amber-100 text-amber-700'
    }
    return colors[plan] || colors.free
  }

  const planFeatureIcons = {
    products: Package,
    staff: Users,
    zones: Map,
    ordersPerMonth: ShoppingBag
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-14 h-14 rounded-2xl flex items-center justify-center',
              subscription?.plan === 'enterprise' 
                ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                : subscription?.plan === 'growth'
                ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                : subscription?.plan === 'starter'
                ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                : 'bg-gradient-to-br from-surface-300 to-surface-400'
            )}>
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-surface-900">{subscription?.planName || 'Free'} Plan</h3>
                <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium capitalize', getPlanBadgeColor(subscription?.plan))}>
                  {subscription?.status}
                </span>
              </div>
              <p className="text-surface-500">
                {subscription?.billingCycle === 'yearly' ? 'Billed annually' : 'Billed monthly'}
                {subscription?.price > 0 && ` • ₹${subscription.price}/month`}
              </p>
            </div>
          </div>
          {subscription?.plan !== 'enterprise' && (
            <button
              onClick={() => upgradeMutation.mutate({ plan: subscription?.plan === 'free' ? 'starter' : subscription?.plan === 'starter' ? 'growth' : 'enterprise', billingCycle: 'monthly' })}
              disabled={upgradeMutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              {upgradeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Upgrade Plan
                </>
              )}
            </button>
          )}
        </div>

        {/* Billing Period */}
        {subscription?.currentPeriodEnd && subscription?.plan !== 'free' && (
          <div className="p-4 bg-surface-50 rounded-xl mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500">Current billing period</p>
                <p className="font-medium text-surface-900">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              {subscription?.cancelAtPeriodEnd && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  Cancels at period end
                </span>
              )}
            </div>
          </div>
        )}

        {/* Plan Features */}
        <div className="grid sm:grid-cols-2 gap-4">
          {subscription?.features && Object.entries(subscription.features).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
              <Check className={clsx('w-5 h-5', value ? 'text-green-500' : 'text-surface-300')} />
              <span className="text-surface-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Stats */}
      {usage && (
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Usage This Month</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(usage).map(([key, data]) => {
              const IconComponent = planFeatureIcons[key] || ShoppingBag
              const percentage = data.unlimited ? 0 : (data.current / data.limit) * 100
              return (
                <div key={key} className="p-4 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <IconComponent className="w-5 h-5 text-surface-500" />
                    <span className="font-medium text-surface-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-surface-900">{data.current}</span>
                    <span className="text-sm text-surface-500">
                      / {data.unlimited ? 'Unlimited' : data.limit}
                    </span>
                  </div>
                  {!data.unlimited && (
                    <div className="mt-2 h-2 bg-surface-200 rounded-full overflow-hidden">
                      <div 
                        className={clsx(
                          'h-full rounded-full transition-all',
                          percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-green-500'
                        )}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="card p-6">
        <h3 className="font-semibold text-surface-900 mb-4">Available Plans</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => (
            <div 
              key={plan.key} 
              className={clsx(
                'p-4 rounded-xl border-2 transition-all',
                subscription?.plan === plan.key 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-surface-200 hover:border-surface-300'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-surface-900">{plan.name}</h4>
                {subscription?.plan === plan.key && (
                  <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">Current</span>
                )}
              </div>
              <p className="text-2xl font-bold text-surface-900 mb-1">
                {plan.monthlyPrice === 0 ? 'Free' : `₹${plan.monthlyPrice}`}
                {plan.monthlyPrice > 0 && <span className="text-sm font-normal text-surface-500">/mo</span>}
              </p>
              {plan.yearlySavings > 0 && (
                <p className="text-xs text-green-600 mb-3">Save ₹{plan.yearlySavings}/yr with annual</p>
              )}
              <ul className="space-y-1.5 text-sm text-surface-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {plan.limits?.ordersPerMonth === -1 ? 'Unlimited orders' : `${plan.limits?.ordersPerMonth} orders/mo`}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {plan.limits?.products === -1 ? 'Unlimited products' : `${plan.limits?.products} products`}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {plan.limits?.staff === -1 ? 'Unlimited staff' : `${plan.limits?.staff} staff members`}
                </li>
              </ul>
              {subscription?.plan !== plan.key && plan.key !== 'free' && (
                <button
                  onClick={() => upgradeMutation.mutate({ plan: plan.key, billingCycle: 'monthly' })}
                  disabled={upgradeMutation.isPending}
                  className="btn btn-outline btn-sm w-full mt-4"
                >
                  {plan.key === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// API Keys Tab
function ApiKeysTab() {
  const [showNewKey, setShowNewKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState(null)
  const queryClient = useQueryClient()

  // Fetch subscription to check if API access is available
  const { data: subData } = useQuery({
    queryKey: ['merchant-subscription'],
    queryFn: async () => {
      const res = await api.get('/subscriptions/me')
      return res.data.data
    }
  })

  // Fetch API keys
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-api-keys'],
    queryFn: async () => {
      const res = await api.get('/merchants/me/api-keys')
      return res.data.data
    },
    enabled: subData?.subscription?.features?.apiAccess
  })

  const createMutation = useMutation({
    mutationFn: async (name) => {
      const res = await api.post('/merchants/me/api-keys', { name })
      return res.data
    },
    onSuccess: (data) => {
      setCreatedKey(data.data.apiKey)
      setNewKeyName('')
      setShowNewKey(false)
      queryClient.invalidateQueries({ queryKey: ['merchant-api-keys'] })
      toast.success('API key created successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create API key')
  })

  const deleteMutation = useMutation({
    mutationFn: async (keyId) => {
      const res = await api.delete(`/merchants/me/api-keys/${keyId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-api-keys'] })
      toast.success('API key deleted')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete API key')
  })

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // Check if API access is available
  if (!subData?.subscription?.features?.apiAccess) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Key className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 mb-2">API Access Not Available</h3>
        <p className="text-surface-500 max-w-md mx-auto mb-6">
          REST API access is only available on the Enterprise plan. Upgrade to integrate Tezzu with your own systems.
        </p>
        <button className="btn btn-primary">
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Enterprise
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const apiKeys = data?.apiKeys || []

  return (
    <div className="space-y-6">
      {/* Newly Created Key Alert */}
      {createdKey && (
        <div className="card p-4 border-l-4 border-l-green-500 bg-green-50">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-medium text-green-900 mb-2">
                API Key Created Successfully!
              </p>
              <p className="text-sm text-green-700 mb-3">
                Copy this key now. You won't be able to see it again!
              </p>
              <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-green-200">
                <code className="flex-1 text-sm font-mono text-surface-900 break-all">{createdKey}</code>
                <button
                  onClick={() => copyToClipboard(createdKey)}
                  className="btn btn-ghost btn-sm"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                className="text-sm text-green-600 hover:underline mt-2"
              >
                I've copied my key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-surface-900">API Keys</h3>
          <p className="text-sm text-surface-500">Manage your REST API keys for integration</p>
        </div>
        <button
          onClick={() => setShowNewKey(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Key
        </button>
      </div>

      {/* Create Key Modal */}
      {showNewKey && (
        <div className="card p-4 border-2 border-primary-200 bg-primary-50">
          <h4 className="font-medium text-surface-900 mb-3">Create New API Key</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Key name (e.g., 'Production', 'Development')"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="input flex-1"
            />
            <button
              onClick={() => createMutation.mutate(newKeyName)}
              disabled={!newKeyName.trim() || createMutation.isPending}
              className="btn btn-primary"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
            <button
              onClick={() => setShowNewKey(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keys List */}
      {apiKeys.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 mb-2">No API Keys</h3>
          <p className="text-surface-500 max-w-md mx-auto">
            Create your first API key to start integrating with Tezzu's REST API.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map(key => (
            <div key={key._id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    key.isActive ? 'bg-green-100' : 'bg-surface-100'
                  )}>
                    <Key className={clsx('w-5 h-5', key.isActive ? 'text-green-600' : 'text-surface-400')} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-surface-900">{key.name}</p>
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        key.isActive ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'
                      )}>
                        {key.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-surface-500">
                      <code className="bg-surface-100 px-1.5 py-0.5 rounded text-xs">{key.keyPrefix}...</code>
                      {' '}&bull;{' '}
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && (
                        <> &bull; Last used {new Date(key.lastUsedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-surface-500">
                    {key.usage?.totalRequests?.toLocaleString() || 0} requests
                  </span>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
                        deleteMutation.mutate(key._id)
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Permissions */}
              <div className="mt-3 pt-3 border-t border-surface-100">
                <p className="text-xs text-surface-500 mb-2">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {key.permissions?.map(perm => (
                    <span key={perm} className="px-2 py-0.5 bg-surface-100 text-surface-600 rounded text-xs">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API Documentation Link */}
      <div className="card p-4 bg-surface-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-surface-900">API Documentation</p>
            <p className="text-sm text-surface-500">Learn how to integrate with Tezzu's REST API</p>
          </div>
          <a href="/api-docs" target="_blank" className="btn btn-outline btn-sm">
            View Docs
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      </div>
    </div>
  )
}
