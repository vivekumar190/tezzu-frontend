import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Edit, 
  Store, 
  MapPin, 
  Phone, 
  Mail,
  Star,
  Clock,
  DollarSign,
  Package,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import clsx from 'clsx'

export default function MerchantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('menu')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const queryClient = useQueryClient()

  const { data: merchant, isLoading: merchantLoading } = useQuery({
    queryKey: ['merchant', id],
    queryFn: async () => {
      const res = await api.get(`/merchants/${id}`)
      return res.data.data.merchant
    }
  })

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['merchant-menu', id],
    queryFn: async () => {
      const res = await api.get(`/merchants/${id}/menu`)
      return res.data.data.menu
    }
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', id],
    queryFn: async () => {
      const res = await api.get(`/categories/merchant/${id}`)
      return res.data.data.categories
    }
  })

  const deleteCategory = useMutation({
    mutationFn: (categoryId) => api.delete(`/categories/${categoryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['merchant-menu', id])
      queryClient.invalidateQueries(['categories', id])
      toast.success('Category deleted')
    }
  })

  const deleteProduct = useMutation({
    mutationFn: (productId) => api.delete(`/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['merchant-menu', id])
      toast.success('Product deleted')
    }
  })

  const toggleAvailability = useMutation({
    mutationFn: (productId) => api.patch(`/products/${productId}/toggle-availability`),
    onSuccess: () => {
      queryClient.invalidateQueries(['merchant-menu', id])
      toast.success('Availability updated')
    }
  })

  if (merchantLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!merchant) {
    return (
      <div className="text-center py-12">
        <Store className="w-16 h-16 mx-auto mb-4 text-surface-300" />
        <h2 className="text-xl font-semibold text-surface-900">Merchant not found</h2>
        <button onClick={() => navigate('/merchants')} className="btn btn-primary mt-4">
          Back to Merchants
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/merchants')}
          className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-2xl font-bold text-white">
              {merchant.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-surface-900">{merchant.name}</h1>
              <p className="text-surface-500">@{merchant.keyword}</p>
            </div>
            <span className={clsx(
              'badge ml-2',
              merchant.isActive ? 'badge-success' : 'badge-gray'
            )}>
              {merchant.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Merchant Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Business Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-surface-500">WhatsApp</p>
                <p className="font-medium">{merchant.whatsappNumber}</p>
              </div>
            </div>
            {merchant.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-surface-400" />
                <div>
                  <p className="text-surface-500">Email</p>
                  <p className="font-medium">{merchant.email}</p>
                </div>
              </div>
            )}
            {merchant.address?.city && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-surface-400" />
                <div>
                  <p className="text-surface-500">Location</p>
                  <p className="font-medium">{merchant.address.city}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-surface-500">Avg. Delivery</p>
                <p className="font-medium">{merchant.averageDeliveryTime || 30} mins</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-surface-500">Rating</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">{merchant.rating?.toFixed(1) || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-500">Total Orders</span>
              <span className="font-semibold">{merchant.totalOrders || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-500">Min. Order</span>
              <span className="font-semibold">₹{merchant.minimumOrderAmount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-500">Delivery Fee</span>
              <span className="font-semibold">₹{merchant.deliveryCharges || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-8">
          {['menu', 'orders', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'pb-4 px-1 text-sm font-medium capitalize transition-colors relative',
                activeTab === tab
                  ? 'text-primary-600'
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Menu Management</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowCategoryModal(true)}
                className="btn btn-secondary btn-sm"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
              <button 
                onClick={() => setShowProductModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>

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
              <p className="text-surface-500 mb-6">Start by adding categories and products</p>
            </div>
          ) : (
            <div className="space-y-6">
              {menuData?.map(({ category, products }) => (
                <div key={category._id} className="card overflow-hidden">
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
                  
                  <div className="p-4">
                    {products.length === 0 ? (
                      <p className="text-center text-surface-500 py-4">No products in this category</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                          <div 
                            key={product._id}
                            className={clsx(
                              'p-4 rounded-xl border transition-all',
                              product.isAvailable 
                                ? 'border-surface-200 hover:border-primary-200 hover:bg-primary-50/50' 
                                : 'border-surface-200 bg-surface-50 opacity-60'
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className={clsx(
                                  'w-3 h-3 rounded-full',
                                  product.isVeg ? 'bg-green-500' : 'bg-red-500'
                                )} />
                                <h5 className="font-medium text-surface-900">{product.name}</h5>
                              </div>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => toggleAvailability.mutate(product._id)}
                                  className={clsx(
                                    'p-1 rounded text-xs',
                                    product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  )}
                                >
                                  {product.isAvailable ? 'In Stock' : 'Out'}
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-surface-500 line-clamp-2 mb-2">{product.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-primary-600">₹{product.price}</span>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => { setEditingProduct(product); setShowProductModal(true) }}
                                  className="p-1.5 hover:bg-surface-100 rounded"
                                >
                                  <Edit className="w-3.5 h-3.5 text-surface-400" />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm('Delete this product?')) {
                                      deleteProduct.mutate(product._id)
                                    }
                                  }}
                                  className="p-1.5 hover:bg-surface-100 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-surface-400 hover:text-red-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="card p-8 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-surface-300" />
          <h3 className="text-lg font-medium text-surface-900 mb-2">Merchant Orders</h3>
          <p className="text-surface-500">View orders from the main Orders page</p>
          <button 
            onClick={() => navigate(`/orders?merchant=${id}`)}
            className="btn btn-primary mt-4"
          >
            View Orders
          </button>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Merchant Settings</h3>
          <p className="text-surface-500">Settings configuration coming soon...</p>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          merchantId={id}
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false)
            setEditingCategory(null)
          }}
        />
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          merchantId={id}
          categories={categoriesData || []}
          product={editingProduct}
          onClose={() => {
            setShowProductModal(false)
            setEditingProduct(null)
          }}
        />
      )}
    </div>
  )
}

function CategoryModal({ merchantId, category, onClose }) {
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (category) {
        await api.put(`/categories/${category._id}`, { name, description })
      } else {
        await api.post('/categories', { merchant: merchantId, name, description })
      }
      queryClient.invalidateQueries(['merchant-menu', merchantId])
      queryClient.invalidateQueries(['categories', merchantId])
      toast.success(category ? 'Category updated' : 'Category created')
      onClose()
    } catch (error) {
      // Handled by interceptor
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="card w-full max-w-md">
        <div className="p-6 border-b border-surface-100">
          <h2 className="text-xl font-semibold">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Category Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProductModal({ merchantId, categories, product, onClose }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category?._id || product?.category || categories[0]?._id || '',
    price: product?.price || '',
    isVeg: product?.isVeg ?? true,
    preparationTime: product?.preparationTime || 15
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        merchant: merchantId,
        price: Number(formData.price)
      }

      if (product) {
        await api.put(`/products/${product._id}`, payload)
      } else {
        await api.post('/products', payload)
      }
      queryClient.invalidateQueries(['merchant-menu', merchantId])
      toast.success(product ? 'Product updated' : 'Product created')
      onClose()
    } catch (error) {
      // Handled by interceptor
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-surface-100">
          <h2 className="text-xl font-semibold">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          
          <div>
            <label className="label">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
              required
            >
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price (₹) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input"
                min={0}
                required
              />
            </div>
            <div>
              <label className="label">Prep Time (mins)</label>
              <input
                type="number"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: Number(e.target.value) })}
                className="input"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="label">Food Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.isVeg}
                  onChange={() => setFormData({ ...formData, isVeg: true })}
                  className="text-green-500"
                />
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500" /> Veg
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!formData.isVeg}
                  onChange={() => setFormData({ ...formData, isVeg: false })}
                  className="text-red-500"
                />
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500" /> Non-Veg
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

