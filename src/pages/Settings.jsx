import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings as SettingsIcon, Key, Server, MessageCircle, Bell, Shield, ShoppingBag, Eye, EyeOff, ShoppingCart, RefreshCw, CreditCard, IndianRupee, TrendingUp, Store, CheckCircle, Clock, AlertTriangle, ArrowUpRight, Loader2, Building, BadgeCheck, XCircle, Banknote, Download } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function Settings() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('general')

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings')
      return res.data.data.settings
    }
  })

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'razorpay', label: 'Razorpay Payments', icon: CreditCard },
    { id: 'commerce', label: 'WhatsApp Commerce', icon: ShoppingBag },
    { id: 'wati', label: 'WATI Config', icon: MessageCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-surface-900">Settings</h1>
        <p className="text-surface-500">Manage your platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="card p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-surface-600 hover:bg-surface-50'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'razorpay' && <RazorpayAdminSettings />}
          {activeTab === 'commerce' && <CommerceSettings />}
          {activeTab === 'wati' && <WATISettings settings={settings} />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
        </div>
      </div>
    </div>
  )
}

function GeneralSettings() {
  return (
    <div className="card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">General Settings</h3>
        <p className="text-sm text-surface-500">Configure basic platform settings</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="label">Platform Name</label>
          <input type="text" className="input" defaultValue="PowerMerchant" />
        </div>
        <div>
          <label className="label">Support Email</label>
          <input type="email" className="input" placeholder="support@example.com" />
        </div>
        <div>
          <label className="label">Default Currency</label>
          <select className="input">
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>
      </div>

      <button className="btn btn-primary">Save Changes</button>
    </div>
  )
}

function CommerceSettings() {
  const queryClient = useQueryClient()
  
  const { data: commerceSettings, isLoading, refetch } = useQuery({
    queryKey: ['commerce-settings'],
    queryFn: async () => {
      const res = await api.get('/catalog/commerce-settings')
      return res.data.data
    },
    retry: false
  })

  const updateSettings = useMutation({
    mutationFn: async (settings) => {
      const res = await api.patch('/catalog/commerce-settings', settings)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['commerce-settings'])
      toast.success('Commerce settings updated!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update settings')
    }
  })

  const toggleCatalogVisibility = () => {
    updateSettings.mutate({
      is_catalog_visible: !commerceSettings?.is_catalog_visible
    })
  }

  const toggleCart = () => {
    updateSettings.mutate({
      is_cart_enabled: !commerceSettings?.is_cart_enabled
    })
  }

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-200 rounded w-1/3"></div>
          <div className="h-4 bg-surface-200 rounded w-2/3"></div>
          <div className="h-20 bg-surface-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">WhatsApp Commerce Settings</h3>
          <p className="text-sm text-surface-500">Control catalog visibility and cart settings</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="btn btn-ghost btn-sm"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {!commerceSettings ? (
        <div className="p-4 rounded-xl bg-amber-50 text-amber-700">
          <p className="font-medium">⚠️ Commerce settings not available</p>
          <p className="text-sm mt-1">
            Make sure WHATSAPP_PHONE_NUMBER_ID is configured in your backend .env file.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Catalog Visibility Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 border border-surface-200">
            <div className="flex items-center gap-4">
              {commerceSettings.is_catalog_visible ? (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-surface-500" />
                </div>
              )}
              <div>
                <p className="font-medium text-surface-900">Catalog Visibility on Profile</p>
                <p className="text-sm text-surface-500">
                  {commerceSettings.is_catalog_visible 
                    ? 'Catalog is visible on your WhatsApp Business profile'
                    : 'Catalog is hidden from your WhatsApp Business profile'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer">
              <input 
                type="checkbox" 
                checked={commerceSettings.is_catalog_visible || false}
                onChange={toggleCatalogVisibility}
                disabled={updateSettings.isPending}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-surface-300 peer-checked:bg-primary-500 rounded-full peer-focus:ring-2 peer-focus:ring-primary-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>

          {/* Cart Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 border border-surface-200">
            <div className="flex items-center gap-4">
              <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center",
                commerceSettings.is_cart_enabled ? "bg-green-100" : "bg-surface-200"
              )}>
                <ShoppingCart className={clsx(
                  "w-5 h-5",
                  commerceSettings.is_cart_enabled ? "text-green-600" : "text-surface-500"
                )} />
              </div>
              <div>
                <p className="font-medium text-surface-900">Shopping Cart</p>
                <p className="text-sm text-surface-500">
                  {commerceSettings.is_cart_enabled 
                    ? 'Customers can add items to cart in chat'
                    : 'Cart functionality is disabled'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer">
              <input 
                type="checkbox" 
                checked={commerceSettings.is_cart_enabled || false}
                onChange={toggleCart}
                disabled={updateSettings.isPending}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-surface-300 peer-checked:bg-primary-500 rounded-full peer-focus:ring-2 peer-focus:ring-primary-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-blue-50 text-blue-700 text-sm">
            <p className="font-medium mb-2">💡 How it works</p>
            <ul className="space-y-1 text-blue-600">
              <li>• <strong>Catalog Hidden:</strong> Products won't show on your WhatsApp profile, but you can still send product messages via chat</li>
              <li>• <strong>Cart Enabled:</strong> Customers can add multiple items before checkout</li>
              <li>• Product Messages (SPM) and Multi-Product Messages (MPM) work regardless of these settings</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function WATISettings({ settings }) {
  return (
    <div className="card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">WATI Configuration</h3>
        <p className="text-sm text-surface-500">Connect your WATI WhatsApp Business account</p>
      </div>

      <div className="p-4 rounded-xl bg-surface-50 flex items-center gap-3">
        <div className={clsx(
          'w-3 h-3 rounded-full',
          settings?.watiConfigured ? 'bg-green-500' : 'bg-red-500'
        )} />
        <span className="text-sm">
          {settings?.watiConfigured ? 'WATI is connected' : 'WATI is not configured'}
        </span>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="label">WATI API URL</label>
          <input 
            type="url" 
            className="input" 
            placeholder="https://live-server-xxxxx.wati.io" 
          />
        </div>
        <div>
          <label className="label">API Key</label>
          <input type="password" className="input" placeholder="••••••••••••" />
        </div>
        <div>
          <label className="label">Webhook Secret</label>
          <input type="password" className="input" placeholder="••••••••••••" />
          <p className="text-xs text-surface-500 mt-1">
            Set this in your WATI webhook configuration
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-blue-50 text-blue-700 text-sm">
        <p className="font-medium mb-1">Webhook URL</p>
        <code className="text-xs bg-blue-100 px-2 py-1 rounded">
          {window.location.origin}/webhooks/wati/incoming
        </code>
      </div>

      <button className="btn btn-primary">Update WATI Settings</button>
    </div>
  )
}

function NotificationSettings() {
  return (
    <div className="card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Notification Settings</h3>
        <p className="text-sm text-surface-500">Configure how you receive notifications</p>
      </div>

      <div className="space-y-4">
        {[
          { label: 'New order notifications', desc: 'Get notified when a new order is placed' },
          { label: 'Order status updates', desc: 'Receive updates when order status changes' },
          { label: 'Daily summary', desc: 'Receive a daily summary of orders and revenue' },
          { label: 'Low stock alerts', desc: 'Get notified when products are out of stock' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface-50">
            <div>
              <p className="font-medium text-surface-900">{item.label}</p>
              <p className="text-sm text-surface-500">{item.desc}</p>
            </div>
            <label className="relative inline-flex cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-surface-300 peer-checked:bg-primary-500 rounded-full peer-focus:ring-2 peer-focus:ring-primary-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>
        ))}
      </div>

      <button className="btn btn-primary">Save Preferences</button>
    </div>
  )
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      // Handled by interceptor
    }
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Security Settings</h3>
        <p className="text-sm text-surface-500">Manage your account security</p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <h4 className="font-medium">Change Password</h4>
        <div>
          <label className="label">Current Password</label>
          <input 
            type="password" 
            className="input" 
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">New Password</label>
          <input 
            type="password" 
            className="input" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input 
            type="password" 
            className="input" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Update Password</button>
      </form>
    </div>
  )
}

// Razorpay Admin Settings - Monitor all merchants' payments
function RazorpayAdminSettings() {
  const [activeView, setActiveView] = useState('overview')
  const queryClient = useQueryClient()

  // Fetch admin Razorpay overview
  const { data: overview, isLoading: overviewLoading, refetch } = useQuery({
    queryKey: ['admin-razorpay-overview'],
    queryFn: async () => {
      const res = await api.get('/admin/razorpay/overview')
      return res.data.data
    }
  })

  // Fetch all payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-razorpay-payments'],
    queryFn: async () => {
      const res = await api.get('/admin/razorpay/payments')
      return res.data.data
    },
    enabled: activeView === 'payments'
  })

  // Fetch merchant accounts
  const { data: merchantsData, isLoading: merchantsLoading } = useQuery({
    queryKey: ['admin-razorpay-merchants'],
    queryFn: async () => {
      const res = await api.get('/admin/razorpay/merchants')
      return res.data.data
    },
    enabled: activeView === 'merchants'
  })

  if (overviewLoading) {
    return (
      <div className="card p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const stats = overview?.stats || {}
  const recentPayments = overview?.recentPayments || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Razorpay Payments Dashboard</h3>
            <p className="text-sm text-surface-500">Monitor all merchant payments and settlements</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={clsx(
              'badge',
              overview?.razorpayConfigured ? 'badge-success' : 'badge-danger'
            )}>
              {overview?.razorpayConfigured ? 'API Connected' : 'Not Configured'}
            </span>
            <button onClick={() => refetch()} className="btn btn-ghost btn-sm">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!overview?.razorpayConfigured && (
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Razorpay not configured</p>
                <p className="text-sm text-amber-700 mt-1">
                  Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file to enable payment processing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">Total Collected</p>
              <p className="text-xl font-bold text-surface-900">₹{stats.totalCollected?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">Total Settled</p>
              <p className="text-xl font-bold text-surface-900">₹{stats.totalSettled?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">Platform Revenue</p>
              <p className="text-xl font-bold text-surface-900">₹{stats.platformRevenue?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Store className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">Active Merchants</p>
              <p className="text-xl font-bold text-surface-900">{stats.activeMerchants || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-1 bg-surface-100 inline-flex rounded-xl flex-wrap gap-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'payments', label: 'All Payments' },
          { id: 'merchants', label: 'Merchant Accounts' },
          { id: 'issues', label: 'Issues & Actions' },
          { id: 'analytics', label: 'Analytics' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeView === tab.id
                ? 'bg-white shadow text-primary-600'
                : 'text-surface-600 hover:text-surface-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Recent Payments */}
          <div className="card p-6">
            <h4 className="font-semibold text-surface-900 mb-4">Recent Payments</h4>
            {recentPayments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 mx-auto text-surface-300 mb-3" />
                <p className="text-surface-500">No payments yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50">
                    <tr>
                      <th className="text-left p-3 font-medium">Order</th>
                      <th className="text-left p-3 font-medium">Merchant</th>
                      <th className="text-left p-3 font-medium">Amount</th>
                      <th className="text-left p-3 font-medium">Platform Fee</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentPayments.map((payment, i) => (
                      <tr key={i} className="hover:bg-surface-50">
                        <td className="p-3 font-mono">#{payment.orderNumber}</td>
                        <td className="p-3">{payment.merchantName}</td>
                        <td className="p-3">₹{payment.amount}</td>
                        <td className="p-3 text-purple-600">₹{payment.platformFee}</td>
                        <td className="p-3">
                          <span className={clsx(
                            'badge text-xs',
                            payment.status === 'paid' ? 'badge-success' :
                            payment.status === 'settled' ? 'badge-info' :
                            payment.status === 'failed' ? 'badge-danger' :
                            'badge-warning'
                          )}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="p-3 text-surface-500">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Platform Fee Info */}
          <div className="card p-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <h4 className="font-semibold text-surface-900 mb-3">Platform Fee Structure</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-xl">
                <p className="text-2xl font-bold text-purple-600">₹{overview?.platformFee || 5}</p>
                <p className="text-sm text-surface-600">Per Order Fee</p>
              </div>
              <div className="p-4 bg-white rounded-xl">
                <p className="text-2xl font-bold text-green-600">{stats.totalOrders || 0}</p>
                <p className="text-sm text-surface-600">Total Orders</p>
              </div>
              <div className="p-4 bg-white rounded-xl">
                <p className="text-2xl font-bold text-blue-600">T+2 Days</p>
                <p className="text-sm text-surface-600">Settlement Cycle</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Payments Tab */}
      {activeView === 'payments' && (
        <div className="card p-6">
          <h4 className="font-semibold text-surface-900 mb-4">All Razorpay Payments</h4>
          {paymentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : paymentsData?.payments?.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 mx-auto text-surface-300 mb-3" />
              <p className="text-surface-500">No payments recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50">
                  <tr>
                    <th className="text-left p-3 font-medium">Order</th>
                    <th className="text-left p-3 font-medium">Merchant</th>
                    <th className="text-left p-3 font-medium">Customer</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Merchant Gets</th>
                    <th className="text-left p-3 font-medium">Platform Fee</th>
                    <th className="text-left p-3 font-medium">Method</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paymentsData?.payments?.map((payment, i) => (
                    <tr key={i} className="hover:bg-surface-50">
                      <td className="p-3 font-mono">#{payment.orderNumber}</td>
                      <td className="p-3">{payment.merchantName}</td>
                      <td className="p-3">{payment.customerPhone}</td>
                      <td className="p-3 font-medium">₹{payment.amount}</td>
                      <td className="p-3 text-green-600">₹{payment.merchantAmount}</td>
                      <td className="p-3 text-purple-600">₹{payment.platformFee}</td>
                      <td className="p-3 capitalize">{payment.method || 'upi'}</td>
                      <td className="p-3">
                        <span className={clsx(
                          'badge text-xs',
                          payment.transferStatus === 'settled' ? 'badge-success' :
                          payment.transferStatus === 'processed' ? 'badge-info' :
                          payment.transferStatus === 'failed' ? 'badge-danger' :
                          'badge-warning'
                        )}>
                          {payment.transferStatus || 'pending'}
                        </span>
                      </td>
                      <td className="p-3 text-surface-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Merchant Accounts Tab */}
      {activeView === 'merchants' && (
        <div className="card p-6">
          <h4 className="font-semibold text-surface-900 mb-4">Merchant Razorpay Accounts</h4>
          {merchantsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : merchantsData?.merchants?.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 mx-auto text-surface-300 mb-3" />
              <p className="text-surface-500">No merchants have set up Razorpay yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {merchantsData?.merchants?.map((merchant, i) => (
                <div key={i} className={clsx(
                  'p-4 rounded-xl border-l-4',
                  merchant.razorpayEnabled ? 'border-l-green-500 bg-green-50/50' :
                  merchant.razorpayAccountStatus === 'activated' ? 'border-l-blue-500 bg-blue-50/50' :
                  merchant.razorpayAccountId ? 'border-l-amber-500 bg-amber-50/50' :
                  'border-l-surface-300 bg-surface-50'
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold',
                        merchant.razorpayEnabled ? 'bg-green-100 text-green-600' :
                        'bg-surface-200 text-surface-500'
                      )}>
                        {merchant.name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <h5 className="font-semibold text-surface-900">{merchant.name}</h5>
                        <p className="text-sm text-surface-500">{merchant.whatsappNumber}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={clsx(
                            'badge text-xs',
                            merchant.razorpayEnabled ? 'badge-success' :
                            merchant.razorpayAccountStatus === 'activated' ? 'badge-info' :
                            merchant.razorpayAccountId ? 'badge-warning' :
                            'badge-gray'
                          )}>
                            {merchant.razorpayEnabled ? 'Active' :
                             merchant.razorpayAccountStatus === 'activated' ? 'Ready' :
                             merchant.razorpayAccountId ? 'KYC Pending' :
                             'Not Set Up'}
                          </span>
                          {merchant.razorpayKycStatus && (
                            <span className={clsx(
                              'badge text-xs',
                              merchant.razorpayKycStatus === 'verified' ? 'badge-success' :
                              merchant.razorpayKycStatus === 'submitted' ? 'badge-warning' :
                              'badge-gray'
                            )}>
                              KYC: {merchant.razorpayKycStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-surface-500">Total Collected</p>
                      <p className="text-lg font-bold text-green-600">₹{merchant.totalCollected?.toLocaleString() || 0}</p>
                      <p className="text-xs text-surface-400">{merchant.orderCount || 0} orders</p>
                    </div>
                  </div>
                  {merchant.razorpayBankDetails && (
                    <div className="mt-3 pt-3 border-t border-surface-200 flex items-center gap-4 text-sm">
                      <Building className="w-4 h-4 text-surface-400" />
                      <span className="text-surface-600">Bank: {merchant.razorpayBankDetails.beneficiaryName}</span>
                      <span className="text-surface-400">|</span>
                      <span className="font-mono text-surface-600">{merchant.razorpayBankDetails.accountNumber?.slice(-4).padStart(merchant.razorpayBankDetails.accountNumber?.length, '*')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Issues & Actions Tab */}
      {activeView === 'issues' && (
        <RazorpayIssuesTab queryClient={queryClient} />
      )}

      {/* Analytics Tab */}
      {activeView === 'analytics' && (
        <RazorpayAnalyticsTab />
      )}
    </div>
  )
}

// Issues & Actions Tab Component
function RazorpayIssuesTab({ queryClient }) {
  const [refundingOrder, setRefundingOrder] = useState(null)
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
      setRefundingOrder(null)
      setRefundAmount('')
      setRefundReason('')
      queryClient.invalidateQueries(['admin-razorpay-payments'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Refund failed')
    }
  })

  // Export CSV
  const handleExportCSV = () => {
    window.open('/api/admin/razorpay/export', '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="card p-6">
        <h4 className="font-semibold text-surface-900 mb-4">Quick Actions</h4>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <ArrowUpRight className="w-4 h-4" />
            Export Payments CSV
          </button>
          <button onClick={() => { refetchFailed(); refetchExpired(); }} className="btn btn-ghost">
            <RefreshCw className="w-4 h-4" />
            Refresh All
          </button>
        </div>
      </div>

      {/* Failed Transfers */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-surface-900 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Failed Transfers ({failedData?.count || 0})
          </h4>
        </div>
        
        {failedLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : failedData?.failedTransfers?.length === 0 ? (
          <div className="text-center py-8 text-surface-500">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
            <p>No failed transfers</p>
          </div>
        ) : (
          <div className="space-y-3">
            {failedData?.failedTransfers?.map((item, i) => (
              <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Order #{item.orderNumber}</p>
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
                    {retryTransfer.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Retry Transfer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expired Payment Links */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-surface-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Expired Payment Links ({expiredData?.count || 0})
          </h4>
        </div>
        
        {expiredLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : expiredData?.expiredOrders?.length === 0 ? (
          <div className="text-center py-8 text-surface-500">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
            <p>No expired payment links</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expiredData?.expiredOrders?.map((item, i) => (
              <div key={i} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Order #{item.orderNumber}</p>
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
                    {cancelExpired.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Order'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Refund Section */}
      <div className="card p-6">
        <h4 className="font-semibold text-surface-900 mb-4">Process Refund</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Order ID</label>
              <input
                type="text"
                value={refundingOrder || ''}
                onChange={(e) => setRefundingOrder(e.target.value)}
                className="input font-mono"
                placeholder="MongoDB Order ID"
              />
            </div>
            <div>
              <label className="label">Amount (leave empty for full refund)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="input"
                placeholder="₹ Amount"
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
          </div>
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
            className="btn btn-danger"
          >
            {processRefund.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process Refund'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Analytics Tab Component
function RazorpayAnalyticsTab() {
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
      <div className="card p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="card p-6">
        <h4 className="font-semibold text-surface-900 mb-4">Filter by Date Range</h4>
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
            Apply Filter
          </button>
          <button 
            onClick={() => setDateRange({ from: '', to: '' })} 
            className="btn btn-ghost"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Daily Revenue Chart (Simple Table) */}
      <div className="card p-6">
        <h4 className="font-semibold text-surface-900 mb-4">Daily Revenue (Last 30 Days)</h4>
        {analytics?.dailyRevenue?.length === 0 ? (
          <p className="text-surface-500 text-center py-8">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Orders</th>
                  <th className="text-left p-3 font-medium">Total Amount</th>
                  <th className="text-left p-3 font-medium">Platform Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analytics?.dailyRevenue?.map((day, i) => (
                  <tr key={i} className="hover:bg-surface-50">
                    <td className="p-3">{day._id}</td>
                    <td className="p-3">{day.orders}</td>
                    <td className="p-3">₹{day.totalAmount?.toLocaleString()}</td>
                    <td className="p-3 text-purple-600">₹{day.platformRevenue?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Merchants */}
      <div className="card p-6">
        <h4 className="font-semibold text-surface-900 mb-4">Top Merchants by Volume</h4>
        {analytics?.topMerchants?.length === 0 ? (
          <p className="text-surface-500 text-center py-8">No data available</p>
        ) : (
          <div className="space-y-3">
            {analytics?.topMerchants?.map((merchant, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{merchant.merchantName}</p>
                    <p className="text-xs text-surface-500">{merchant.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">₹{merchant.totalAmount?.toLocaleString()}</p>
                  <p className="text-xs text-purple-600">₹{merchant.platformRevenue} platform fee</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Methods Breakdown */}
      <div className="card p-6">
        <h4 className="font-semibold text-surface-900 mb-4">Payment Methods</h4>
        {analytics?.paymentMethods?.length === 0 ? (
          <p className="text-surface-500 text-center py-8">No data available</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics?.paymentMethods?.map((method, i) => (
              <div key={i} className="p-4 bg-surface-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-surface-900">{method.count}</p>
                <p className="text-sm text-surface-600 capitalize">{method._id || 'Unknown'}</p>
                <p className="text-xs text-surface-400">₹{method.amount?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

