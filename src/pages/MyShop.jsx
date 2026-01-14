import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail,
  Star,
  Clock,
  Package,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  RefreshCw,
  Settings,
  Users,
  ToggleLeft,
  ToggleRight,
  Image,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  GripVertical,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import clsx from 'clsx'
import { useAuthStore } from '../store/authStore'
import CatalogSync from '../components/CatalogSync'

export default function MyShop() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('menu')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const queryClient = useQueryClient()

  // Get merchant ID from user
  const merchantId = typeof user?.merchant === 'object' 
    ? user.merchant._id 
    : user?.merchant

  // Fetch merchant details
  const { data: merchant, isLoading: merchantLoading } = useQuery({
    queryKey: ['my-merchant', merchantId],
    queryFn: async () => {
      const res = await api.get(`/merchants/${merchantId}`)
      return res.data.data.merchant
    },
    enabled: !!merchantId
  })

  // Fetch menu
  const { data: menuData, isLoading: menuLoading, refetch: refetchMenu } = useQuery({
    queryKey: ['my-merchant-menu', merchantId],
    queryFn: async () => {
      const res = await api.get(`/merchants/${merchantId}/menu`)
      return res.data.data.menu
    },
    enabled: !!merchantId
  })

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['my-categories', merchantId],
    queryFn: async () => {
      const res = await api.get(`/categories/merchant/${merchantId}`)
      return res.data.data.categories
    },
    enabled: !!merchantId
  })

  // Fetch recent orders
  const { data: ordersData } = useQuery({
    queryKey: ['my-orders', merchantId],
    queryFn: async () => {
      const res = await api.get(`/orders?merchant=${merchantId}&limit=5`)
      return res.data.data
    },
    enabled: !!merchantId
  })

  // Mutations
  const toggleStatus = useMutation({
    mutationFn: () => api.patch(`/merchants/${merchantId}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-merchant', merchantId])
      toast.success('Shop status updated')
    }
  })

  const toggleAcceptingOrders = useMutation({
    mutationFn: () => api.patch(`/merchants/${merchantId}/toggle-orders`),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-merchant', merchantId])
      toast.success('Order acceptance updated')
    }
  })

  const deleteCategory = useMutation({
    mutationFn: (categoryId) => api.delete(`/categories/${categoryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-merchant-menu', merchantId])
      queryClient.invalidateQueries(['my-categories', merchantId])
      toast.success('Category deleted')
    }
  })

  const deleteProduct = useMutation({
    mutationFn: (productId) => api.delete(`/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-merchant-menu', merchantId])
      toast.success('Product deleted')
    }
  })

  const toggleAvailability = useMutation({
    mutationFn: (productId) => api.patch(`/products/${productId}/toggle-availability`),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-merchant-menu', merchantId])
      toast.success('Availability updated')
    }
  })

  const syncProduct = useMutation({
    mutationFn: (productId) => api.post(`/catalog/sync/product/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-merchant-menu', merchantId])
      toast.success('Product synced to catalog!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Sync failed')
    }
  })

  if (!merchantId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-surface-300" />
          <h2 className="text-xl font-semibold text-surface-900">No Shop Assigned</h2>
          <p className="text-surface-500 mt-2">Contact admin to assign you to a shop</p>
        </div>
      </div>
    )
  }

  if (merchantLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalProducts = menuData?.reduce((sum, cat) => sum + cat.products.length, 0) || 0
  const totalCategories = menuData?.length || 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">My Shop</h1>
          <p className="text-surface-500">Manage your shop profile, menu, and settings</p>
        </div>
        <button 
          onClick={() => setShowEditModal(true)}
          className="btn btn-secondary"
        >
          <Edit className="w-4 h-4" />
          Edit Shop
        </button>
      </div>

      {/* Shop Card (Similar to Merchants page) */}
      <div className="card overflow-hidden">
        {/* Banner */}
        <div className={clsx(
          'h-28 bg-gradient-to-r',
          merchant?.isActive 
            ? 'from-primary-500 via-primary-600 to-emerald-500' 
            : 'from-surface-400 to-surface-500'
        )} />
        
        <div className="px-6 pb-6">
          {/* Top row: Logo + Name/Badges + Actions */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-4 -mt-10">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center text-3xl font-bold text-primary-600 border-4 border-white flex-shrink-0">
              {merchant?.logo ? (
                <img src={merchant.logo} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                merchant?.name?.charAt(0) || 'S'
              )}
            </div>
            
            {/* Info Section */}
            <div className="flex-1 pt-2 lg:pt-12">
              {/* Name Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h2 className="text-2xl font-display font-bold text-surface-900">
                  {merchant?.name}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <span className={clsx(
                    'badge',
                    merchant?.isActive ? 'badge-success' : 'badge-gray'
                  )}>
                    {merchant?.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {merchant?.acceptingOrders ? (
                    <span className="badge badge-success">Taking Orders</span>
                  ) : (
                    <span className="badge badge-warning">Not Accepting</span>
                  )}
                </div>
              </div>

              {/* Keyword */}
              <p className="text-surface-500 mt-1">@{merchant?.keyword}</p>

              {/* Description */}
              {merchant?.description && (
                <p className="text-surface-600 mt-3">{merchant.description}</p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {merchant?.address?.city && (
                  <div className="flex items-center gap-2 text-surface-600">
                    <MapPin className="w-4 h-4 text-surface-400" />
                    {merchant.address.street && `${merchant.address.street}, `}
                    {merchant.address.city}
                  </div>
                )}
                <div className="flex items-center gap-2 text-surface-600">
                  <Phone className="w-4 h-4 text-surface-400" />
                  {merchant?.whatsappNumber || merchant?.phone || 'N/A'}
                </div>
                {merchant?.email && (
                  <div className="flex items-center gap-2 text-surface-600">
                    <Mail className="w-4 h-4 text-surface-400" />
                    {merchant.email}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-row lg:flex-col gap-2 pt-2 lg:pt-12 flex-shrink-0">
              <button
                onClick={() => toggleStatus.mutate()}
                disabled={toggleStatus.isPending}
                className={clsx(
                  'btn btn-sm whitespace-nowrap',
                  merchant?.isActive ? 'btn-secondary' : 'btn-primary'
                )}
              >
                {merchant?.isActive ? (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    Go Offline
                  </>
                ) : (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    Go Online
                  </>
                )}
              </button>
              <button
                onClick={() => toggleAcceptingOrders.mutate()}
                disabled={toggleAcceptingOrders.isPending}
                className={clsx(
                  'btn btn-sm whitespace-nowrap',
                  merchant?.acceptingOrders ? 'btn-secondary' : 'btn-primary'
                )}
              >
                {merchant?.acceptingOrders ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Pause Orders
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Accept Orders
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Rating</p>
              <p className="text-xl font-bold text-surface-900">{merchant?.rating?.toFixed(1) || '4.0'}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Total Orders</p>
              <p className="text-xl font-bold text-surface-900">{merchant?.totalOrders || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Products</p>
              <p className="text-xl font-bold text-surface-900">{totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Min Order</p>
              <p className="text-xl font-bold text-surface-900">₹{merchant?.minimumOrderAmount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Business Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-surface-500">Operating Hours</p>
                <p className="font-medium">
                  {merchant?.operatingHours?.open || '09:00'} - {merchant?.operatingHours?.close || '22:00'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-surface-500">Delivery Fee</p>
                <p className="font-medium">₹{merchant?.deliveryCharges || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-surface-500">Avg. Delivery</p>
                <p className="font-medium">{merchant?.averageDeliveryTime || 30} mins</p>
              </div>
            </div>
            {merchant?.cuisineType?.length > 0 && (
              <div className="col-span-2 md:col-span-3">
                <p className="text-surface-500 mb-2">Cuisine Types</p>
                <div className="flex flex-wrap gap-2">
                  {merchant.cuisineType.map((c, i) => (
                    <span key={i} className="badge badge-gray">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">Recent Orders</h3>
            <a href="/orders" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          {ordersData?.orders?.length === 0 ? (
            <p className="text-surface-500 text-sm">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {ordersData?.orders?.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-surface-900">#{order.orderNumber}</p>
                    <p className="text-surface-500 text-xs">{order.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{order.totalAmount}</p>
                    <span className={clsx(
                      'text-xs',
                      order.status === 'delivered' && 'text-green-600',
                      order.status === 'cancelled' && 'text-red-600',
                      order.status === 'pending' && 'text-yellow-600'
                    )}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-8 overflow-x-auto">
          {[
            { id: 'menu', label: 'Menu & Products', icon: Package },
            { id: 'catalog', label: 'Catalog Sync', icon: Image },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'pb-4 px-1 text-sm font-medium whitespace-nowrap transition-colors relative flex items-center gap-2',
                activeTab === tab.id
                  ? 'text-primary-600'
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
              className="btn btn-secondary"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
            <button 
              onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
            <button 
              onClick={() => refetchMenu()}
              className="btn btn-ghost"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Menu Summary */}
          <div className="flex items-center gap-4 text-sm text-surface-600">
            <span>{totalCategories} categories</span>
            <span>•</span>
            <span>{totalProducts} products</span>
          </div>

          {/* Menu List */}
          {menuLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-6 bg-surface-200 rounded w-1/4 mb-4" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-surface-200 rounded" />
                    <div className="h-24 bg-surface-200 rounded" />
                    <div className="h-24 bg-surface-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : menuData?.length === 0 ? (
            <div className="card p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-surface-300" />
              <h3 className="text-lg font-medium text-surface-900 mb-2">No menu items yet</h3>
              <p className="text-surface-500 mb-6">Start by adding categories and products to your menu</p>
              <button onClick={() => setShowCategoryModal(true)} className="btn btn-primary">
                <Plus className="w-4 h-4" />
                Add First Category
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {menuData?.map(({ category, products }) => (
                <div key={category._id} className="card overflow-hidden">
                  {/* Category Header */}
                  <div className="flex items-center justify-between p-4 bg-surface-50 border-b border-surface-100">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-surface-400 cursor-grab" />
                      <h4 className="font-semibold text-surface-900">{category.name}</h4>
                      <span className="badge badge-gray">{products.length} items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditingCategory(category); setShowCategoryModal(true) }}
                        className="p-1.5 hover:bg-white rounded transition-colors"
                      >
                        <Edit className="w-4 h-4 text-surface-500" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Delete this category? Products will not be deleted.')) {
                            deleteCategory.mutate(category._id)
                          }
                        }}
                        className="p-1.5 hover:bg-white rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-surface-500 hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div key={product._id} className="flex gap-3 p-3 rounded-xl border border-surface-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
                        {/* Product Image */}
                        <div className="w-16 h-16 rounded-lg bg-surface-100 flex-shrink-0 overflow-hidden">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-surface-400">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={clsx(
                                'w-3 h-3 rounded-full flex-shrink-0',
                                product.isVeg ? 'bg-green-500' : 'bg-red-500'
                              )} />
                              <p className="font-medium text-surface-900 truncate">{product.name}</p>
                            </div>
                            {product.catalogProductId && (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" title="Synced to catalog" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-semibold text-primary-600">₹{product.price}</span>
                            {!product.isAvailable && (
                              <span className="text-xs text-red-500">Unavailable</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => toggleAvailability.mutate(product._id)}
                              className="p-1 hover:bg-white rounded"
                              title={product.isAvailable ? 'Mark unavailable' : 'Mark available'}
                            >
                              {product.isAvailable ? (
                                <ToggleRight className="w-4 h-4 text-green-500" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-surface-400" />
                              )}
                            </button>
                            <button
                              onClick={() => syncProduct.mutate(product._id)}
                              className="p-1 hover:bg-white rounded"
                              title="Sync to catalog"
                              disabled={syncProduct.isPending}
                            >
                              <RefreshCw className={clsx(
                                "w-4 h-4 text-surface-500",
                                syncProduct.isPending && syncProduct.variables === product._id && "animate-spin"
                              )} />
                            </button>
                            <button
                              onClick={() => { setEditingProduct(product); setShowProductModal(true) }}
                              className="p-1 hover:bg-white rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-surface-500" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this product?')) {
                                  deleteProduct.mutate(product._id)
                                }
                              }}
                              className="p-1 hover:bg-white rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-surface-500 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'catalog' && (
        <CatalogSync 
          merchantId={merchantId} 
          merchantName={merchant?.name}
          compact={false}
        />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* General Settings */}
          <div className="card p-6 space-y-6">
            <h3 className="text-lg font-semibold text-surface-900">Shop Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Minimum Order Amount</label>
                <p className="text-2xl font-bold text-surface-900">₹{merchant?.minimumOrderAmount || 0}</p>
                <p className="text-sm text-surface-500 mt-1">Customers must order at least this amount</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Delivery Charges</label>
                <p className="text-2xl font-bold text-surface-900">₹{merchant?.deliveryCharges || 0}</p>
                <p className="text-sm text-surface-500 mt-1">Added to each order</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Average Delivery Time</label>
                <p className="text-2xl font-bold text-surface-900">{merchant?.averageDeliveryTime || 30} mins</p>
                <p className="text-sm text-surface-500 mt-1">Shown to customers</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Operating Hours</label>
                <p className="text-2xl font-bold text-surface-900">
                  {merchant?.operatingHours?.open || '09:00'} - {merchant?.operatingHours?.close || '22:00'}
                </p>
                <p className="text-sm text-surface-500 mt-1">When you accept orders</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <button onClick={() => setShowEditModal(true)} className="btn btn-primary">
                <Edit className="w-4 h-4" />
                Edit Settings
              </button>
            </div>
          </div>

          {/* Catalog Settings */}
          <MerchantCatalogSettings merchantId={merchantId} catalog={merchant?.catalog} />
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          merchantId={merchantId}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
          onSuccess={() => {
            queryClient.invalidateQueries(['my-merchant-menu', merchantId])
            queryClient.invalidateQueries(['my-categories', merchantId])
            setShowCategoryModal(false)
            setEditingCategory(null)
          }}
        />
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          merchantId={merchantId}
          categories={categoriesData || []}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          onSuccess={() => {
            queryClient.invalidateQueries(['my-merchant-menu', merchantId])
            setShowProductModal(false)
            setEditingProduct(null)
          }}
        />
      )}

      {/* Edit Shop Modal */}
      {showEditModal && (
        <EditShopModal
          merchant={merchant}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['my-merchant', merchantId])
            setShowEditModal(false)
          }}
        />
      )}
    </div>
  )
}

// Category Modal Component
function CategoryModal({ category, merchantId, onClose, onSuccess }) {
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (category) {
        await api.put(`/categories/${category._id}`, { name, description })
        toast.success('Category updated')
      } else {
        await api.post('/categories', { name, description, merchant: merchantId })
        toast.success('Category created')
      }
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">
            {category ? 'Edit Category' : 'Add Category'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
              placeholder="e.g., Starters, Main Course"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={3}
              placeholder="Optional description"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Product Modal Component
function ProductModal({ product, merchantId, categories, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category?._id || product?.category || '',
    isVeg: product?.isVeg ?? true,
    isAvailable: product?.isAvailable ?? true,
    preparationTime: product?.preparationTime || 15,
    imageUrl: product?.imageUrl || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = {
        ...formData,
        price: Number(formData.price),
        preparationTime: Number(formData.preparationTime),
        merchant: merchantId
      }

      if (product) {
        await api.put(`/products/${product._id}`, data)
        toast.success('Product updated')
      } else {
        await api.post('/products', data)
        toast.success('Product created')
      }
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save product')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">
            {product ? 'Edit Product' : 'Add Product'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Prep Time (min)</label>
              <input
                type="number"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                className="input"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="input"
              placeholder="https://..."
            />
            {formData.imageUrl && (
              <img 
                src={formData.imageUrl} 
                alt="Preview" 
                className="mt-2 w-20 h-20 object-cover rounded-lg"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVeg}
                onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                className="w-4 h-4 rounded border-surface-300"
              />
              <span className="text-sm">🟢 Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="w-4 h-4 rounded border-surface-300"
              />
              <span className="text-sm">Available</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Shop Modal
function EditShopModal({ merchant, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: merchant?.name || '',
    description: merchant?.description || '',
    whatsappNumber: merchant?.whatsappNumber || '',
    email: merchant?.email || '',
    street: merchant?.address?.street || '',
    city: merchant?.address?.city || '',
    minimumOrderAmount: merchant?.minimumOrderAmount || 0,
    deliveryCharges: merchant?.deliveryCharges || 0,
    averageDeliveryTime: merchant?.averageDeliveryTime || 30,
    openTime: merchant?.operatingHours?.open || '09:00',
    closeTime: merchant?.operatingHours?.close || '22:00'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await api.put(`/merchants/${merchant._id}`, {
        name: formData.name,
        description: formData.description,
        whatsappNumber: formData.whatsappNumber,
        email: formData.email,
        address: {
          street: formData.street,
          city: formData.city
        },
        minimumOrderAmount: Number(formData.minimumOrderAmount),
        deliveryCharges: Number(formData.deliveryCharges),
        averageDeliveryTime: Number(formData.averageDeliveryTime),
        operatingHours: {
          open: formData.openTime,
          close: formData.closeTime
        }
      })
      toast.success('Shop updated successfully')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update shop')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Edit Shop Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Shop Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Minimum Order (₹)</label>
              <input
                type="number"
                value={formData.minimumOrderAmount}
                onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Delivery Fee (₹)</label>
              <input
                type="number"
                value={formData.deliveryCharges}
                onChange={(e) => setFormData({ ...formData, deliveryCharges: e.target.value })}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Avg. Delivery Time (min)</label>
              <input
                type="number"
                value={formData.averageDeliveryTime}
                onChange={(e) => setFormData({ ...formData, averageDeliveryTime: e.target.value })}
                className="input"
                min="1"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-surface-700 mb-1">Open Time</label>
                <input
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-surface-700 mb-1">Close Time</label>
                <input
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Merchant Catalog Settings Component
function MerchantCatalogSettings({ merchantId, catalog }) {
  const [catalogId, setCatalogId] = useState(catalog?.catalogId || '')
  const [isEnabled, setIsEnabled] = useState(catalog?.isEnabled || false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  // Fetch catalog status
  const { data: catalogStatus, isLoading } = useQuery({
    queryKey: ['merchant-catalog', merchantId],
    queryFn: async () => {
      const res = await api.get(`/merchants/${merchantId}/catalog`)
      return res.data.data
    },
    enabled: !!merchantId
  })

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await api.patch(`/merchants/${merchantId}/catalog`, {
        catalogId: catalogId || null,
        isEnabled
      })
      queryClient.invalidateQueries(['merchant-catalog', merchantId])
      queryClient.invalidateQueries(['my-merchant', merchantId])
      toast.success('Catalog settings saved!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save catalog settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-200 rounded w-1/3"></div>
          <div className="h-10 bg-surface-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-surface-900">WhatsApp Catalog</h3>
          <p className="text-sm text-surface-500">
            Configure your Meta Commerce Catalog for WhatsApp shopping
          </p>
        </div>
        <div className={clsx(
          'px-3 py-1 rounded-full text-sm font-medium',
          catalogStatus?.catalog?.isEnabled
            ? 'bg-green-100 text-green-700'
            : 'bg-surface-100 text-surface-600'
        )}>
          {catalogStatus?.catalog?.isEnabled ? '✓ Enabled' : 'Disabled'}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">
            Meta Catalog ID
          </label>
          <input
            type="text"
            value={catalogId}
            onChange={(e) => setCatalogId(e.target.value)}
            placeholder="e.g., 1501528984260687"
            className="input"
          />
          <p className="text-xs text-surface-500 mt-1">
            Find this in Meta Business Suite → Commerce Manager → Catalog
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-surface-50 rounded-lg">
          <div>
            <p className="font-medium text-surface-900">Enable Catalog</p>
            <p className="text-sm text-surface-500">
              Show products with images in WhatsApp
            </p>
          </div>
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={clsx(
              'relative w-12 h-6 rounded-full transition-colors',
              isEnabled ? 'bg-primary-500' : 'bg-surface-300'
            )}
          >
            <span className={clsx(
              'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
              isEnabled ? 'translate-x-7' : 'translate-x-1'
            )} />
          </button>
        </div>

        {catalogStatus?.products && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-surface-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-surface-900">
                {catalogStatus.products.total}
              </p>
              <p className="text-xs text-surface-500">Total Products</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {catalogStatus.products.synced}
              </p>
              <p className="text-xs text-surface-500">Synced</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {catalogStatus.products.pending}
              </p>
              <p className="text-xs text-surface-500">Pending</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
        {catalogId && (
          <a
            href={`https://business.facebook.com/commerce/catalogs/${catalogId}/products`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            View in Meta
            <ChevronRight className="w-4 h-4" />
          </a>
        )}
      </div>

      {!catalogId && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Need a catalog?</strong> You can use the global catalog or create your own in{' '}
            <a 
              href="https://business.facebook.com/commerce/catalogs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline"
            >
              Meta Commerce Manager
            </a>
          </p>
        </div>
      )}
    </div>
  )
}

