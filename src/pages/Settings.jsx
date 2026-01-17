import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings as SettingsIcon, Key, Server, MessageCircle, Bell, Shield, ShoppingBag, Eye, EyeOff, ShoppingCart, RefreshCw } from 'lucide-react'
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

