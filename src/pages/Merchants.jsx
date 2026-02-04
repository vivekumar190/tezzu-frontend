import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Store,
  MapPin,
  Phone,
  Star,
  MoreVertical,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit,
  ExternalLink,
  Target,
  Circle,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Key,
  Shield
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import clsx from 'clsx'

export default function Merchants() {
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      const res = await api.get('/merchants?limit=100&mode=all&includeInactive=true')
      return res.data.data
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => api.patch(`/merchants/${id}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries(['merchants'])
      toast.success('Merchant status updated')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/merchants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['merchants'])
      toast.success('Merchant deleted')
    }
  })

  const filteredMerchants = data?.merchants?.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.keyword.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Merchants</h1>
          <p className="text-surface-500">Manage your registered merchants</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Merchant
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search merchants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12"
          />
        </div>
      </div>

      {/* Merchants Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-surface-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 bg-surface-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-surface-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-4 bg-surface-200 rounded w-full mb-2" />
              <div className="h-4 bg-surface-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredMerchants.length === 0 ? (
        <div className="card p-12 text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-surface-300" />
          <h3 className="text-lg font-medium text-surface-900 mb-2">No merchants found</h3>
          <p className="text-surface-500 mb-6">Get started by adding your first merchant</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus className="w-5 h-5" />
            Add Merchant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMerchants.map((merchant) => (
            <MerchantCard
              key={merchant._id}
              merchant={merchant}
              onToggleStatus={() => toggleStatusMutation.mutate(merchant._id)}
              onDelete={() => {
                if (confirm('Are you sure you want to delete this merchant?')) {
                  deleteMutation.mutate(merchant._id)
                }
              }}
              onEdit={() => setEditingMerchant(merchant)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingMerchant) && (
        <MerchantModal
          merchant={editingMerchant}
          onClose={() => {
            setShowCreateModal(false)
            setEditingMerchant(null)
          }}
        />
      )}
    </div>
  )
}

function MerchantCard({ merchant, onToggleStatus, onDelete, onEdit }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="card card-hover overflow-hidden">
      {/* Banner */}
      <div className={clsx(
        'h-20 bg-gradient-to-r',
        merchant.isActive 
          ? 'from-primary-500 to-emerald-400' 
          : 'from-surface-400 to-surface-500'
      )} />
      
      <div className="p-6 -mt-10">
        {/* Logo & Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 rounded-xl bg-white shadow-lg flex items-center justify-center text-2xl font-bold text-primary-600 border-2 border-white">
            {merchant.logo ? (
              <img src={merchant.logo} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              merchant.name.charAt(0)
            )}
          </div>
          <div className="flex items-center gap-2 mt-10">
            <span className={clsx(
              'badge',
              merchant.isActive ? 'badge-success' : 'badge-gray'
            )}>
              {merchant.isActive ? 'Active' : 'Inactive'}
            </span>
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-surface-500" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-surface-100 py-1 z-20">
                    <Link
                      to={`/merchants/${merchant._id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Details
                    </Link>
                    <button
                      onClick={() => { onEdit(); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-50"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => { onToggleStatus(); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-50"
                    >
                      {merchant.isActive ? (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Activate
                        </>
                      )}
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => { onDelete(); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <h3 className="font-semibold text-lg text-surface-900 mb-1">{merchant.name}</h3>
        <p className="text-sm text-surface-500 mb-4">@{merchant.keyword}</p>

        <div className="space-y-2 text-sm">
          {merchant.address?.city && (
            <div className="flex items-center gap-2 text-surface-600">
              <MapPin className="w-4 h-4 text-surface-400" />
              {merchant.address.city}
            </div>
          )}
          <div className="flex items-center gap-2 text-surface-600">
            <Phone className="w-4 h-4 text-surface-400" />
            {merchant.whatsappNumber}
          </div>
        </div>

        {/* Delivery Zones Indicator */}
        {merchant.useLocationBasedOrdering && merchant.deliveryZones?.filter(z => z.isActive).length > 0 ? (
          <div className="mt-3 p-2 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-green-700 font-medium">
                {merchant.deliveryZones?.filter(z => z.isActive).length} active zone{merchant.deliveryZones?.filter(z => z.isActive).length !== 1 ? 's' : ''}
              </span>
              {merchant.deliveryZones?.length > merchant.deliveryZones?.filter(z => z.isActive).length && (
                <span className="text-green-500 text-xs">
                  ({merchant.deliveryZones.length} total)
                </span>
              )}
            </div>
          </div>
        ) : merchant.useLocationBasedOrdering ? (
          <div className="mt-3 p-2 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <Target className="w-4 h-4 text-amber-500" />
              <span>Location enabled, no active zones</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 p-2 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-red-600">
              <Circle className="w-4 h-4" />
              <span>No delivery zones - Not visible on app</span>
            </div>
          </div>
        )}

        {/* Standalone Indicator */}
        {merchant.isStandalone && (
          <div className="mt-3 p-2 bg-primary-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MessageCircle className="w-4 h-4 text-primary-500" />
              <span className="text-primary-700 font-medium">Standalone Merchant</span>
              {merchant.whatsappConfig?.isVerified ? (
                <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 ml-auto" />
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-100">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="font-medium">{merchant.rating?.toFixed(1) || 'N/A'}</span>
          </div>
          <div className="text-surface-500 text-sm">
            {merchant.totalOrders || 0} orders
          </div>
          {merchant.acceptingOrders ? (
            <span className="ml-auto badge badge-success">Taking Orders</span>
          ) : (
            <span className="ml-auto badge badge-warning">Not Accepting</span>
          )}
        </div>
      </div>
    </div>
  )
}

function MerchantModal({ merchant, onClose }) {
  const [formData, setFormData] = useState({
    name: merchant?.name || '',
    keyword: merchant?.keyword || '',
    description: merchant?.description || '',
    whatsappNumber: merchant?.whatsappNumber || '',
    email: merchant?.email || '',
    city: merchant?.address?.city || '',
    minimumOrderAmount: merchant?.minimumOrderAmount || 0,
    deliveryCharges: merchant?.deliveryCharges || 0,
    // Standalone merchant fields
    isStandalone: merchant?.isStandalone || false,
    whatsappConfig: {
      phoneNumberId: merchant?.whatsappConfig?.phoneNumberId || '',
      accessToken: merchant?.whatsappConfig?.accessToken || '',
      verifyToken: merchant?.whatsappConfig?.verifyToken || '',
      businessAccountId: merchant?.whatsappConfig?.businessAccountId || ''
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showStandaloneConfig, setShowStandaloneConfig] = useState(merchant?.isStandalone || false)
  const queryClient = useQueryClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        address: { city: formData.city },
        // Only include whatsappConfig if standalone is enabled
        whatsappConfig: formData.isStandalone ? formData.whatsappConfig : undefined
      }

      if (merchant) {
        await api.put(`/merchants/${merchant._id}`, payload)
        toast.success('Merchant updated successfully')
      } else {
        await api.post('/merchants', payload)
        toast.success('Merchant created successfully')
      }
      
      queryClient.invalidateQueries(['merchants'])
      onClose()
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStandaloneToggle = (enabled) => {
    setFormData({ ...formData, isStandalone: enabled })
    setShowStandaloneConfig(enabled)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-surface-100">
          <h2 className="text-xl font-semibold">
            {merchant ? 'Edit Merchant' : 'Add New Merchant'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Business Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Keyword *</label>
              <input
                type="text"
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value.toLowerCase() })}
                className="input"
                placeholder="e.g. pizzahut"
                required
              />
            </div>

            <div>
              <label className="label">WhatsApp Number *</label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="input"
                placeholder="+91..."
                required
              />
              <p className="text-xs text-surface-400 mt-1">For receiving order notifications</p>
            </div>

            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={2}
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Min Order Amount (₹)</label>
              <input
                type="number"
                value={formData.minimumOrderAmount}
                onChange={(e) => setFormData({ ...formData, minimumOrderAmount: Number(e.target.value) })}
                className="input"
                min={0}
              />
            </div>

            <div>
              <label className="label">Delivery Charges (₹)</label>
              <input
                type="number"
                value={formData.deliveryCharges}
                onChange={(e) => setFormData({ ...formData, deliveryCharges: Number(e.target.value) })}
                className="input"
                min={0}
              />
            </div>
          </div>

          {/* Standalone Merchant Section */}
          <div className="border-t border-surface-200 pt-6">
            <div 
              className={clsx(
                'p-4 rounded-xl border-2 cursor-pointer transition-all',
                formData.isStandalone 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-surface-200 hover:border-surface-300'
              )}
              onClick={() => handleStandaloneToggle(!formData.isStandalone)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    formData.isStandalone ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-500'
                  )}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-surface-900">Tezzu Standalone Merchant</h4>
                    <p className="text-sm text-surface-500">
                      Use merchant's own WhatsApp Business number instead of Tezzu's
                    </p>
                  </div>
                </div>
                <div className={clsx(
                  'w-12 h-6 rounded-full transition-all relative',
                  formData.isStandalone ? 'bg-primary-500' : 'bg-surface-300'
                )}>
                  <div className={clsx(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                    formData.isStandalone ? 'left-7' : 'left-1'
                  )} />
                </div>
              </div>
            </div>

            {/* Standalone Config (collapsible) */}
            {formData.isStandalone && (
              <div className="mt-4 space-y-4 animate-fade-in">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">WhatsApp Business API Required</p>
                      <p>
                        The merchant needs their own WhatsApp Business API credentials from Meta. 
                        Customers will message the merchant's WhatsApp number directly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label flex items-center gap-2">
                      <Key className="w-4 h-4 text-surface-400" />
                      Phone Number ID *
                    </label>
                    <input
                      type="text"
                      value={formData.whatsappConfig.phoneNumberId}
                      onChange={(e) => setFormData({
                        ...formData,
                        whatsappConfig: { ...formData.whatsappConfig, phoneNumberId: e.target.value }
                      })}
                      className="input font-mono text-lg"
                      placeholder="e.g. 123456789012345"
                      required={formData.isStandalone}
                    />
                    <p className="text-xs text-surface-400 mt-1">
                      Meta Business Suite → WhatsApp → Phone Numbers → Click number → Phone Number ID
                    </p>
                  </div>
                </div>

                {/* Quick Setup Info */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Simple 2-Step Setup
                  </p>
                  <ol className="text-xs text-green-700 space-y-1 ml-6 list-decimal">
                    <li>Add merchant's phone to your Business Account in Meta Business Suite</li>
                    <li>Enter the Phone Number ID above</li>
                  </ol>
                  <p className="text-xs text-green-600 mt-2">
                    ✨ Webhook and Access Token are automatically handled by Tezzu!
                  </p>
                </div>

                {/* Verification Status */}
                {merchant?.whatsappConfig?.isVerified !== undefined && (
                  <div className={clsx(
                    'p-3 rounded-lg flex items-center gap-2',
                    merchant.whatsappConfig.isVerified 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-amber-50 text-amber-700'
                  )}>
                    {merchant.whatsappConfig.isVerified ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>WhatsApp connected and active</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        <span>
                          Not verified yet - save and verify from Merchant Details page
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : (merchant ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

