import { useState, useEffect } from 'react'
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
  GripVertical,
  Navigation,
  Target,
  Layers,
  Save,
  RefreshCw,
  Image,
  X,
  Circle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  AlertTriangle,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Key,
  Shield,
  Link2,
  Unlink,
  Database,
  ShoppingBag,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import clsx from 'clsx'
import WhatsAppEmbeddedSignup from '../components/WhatsAppEmbeddedSignup'

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
            {merchant.isStandalone && (
              <span className="badge ml-2 bg-primary-100 text-primary-700 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                Standalone
              </span>
            )}
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
        <nav className="flex gap-6 overflow-x-auto">
          {[
            { id: 'menu', label: 'Menu', icon: null },
            { id: 'orders', label: 'Orders', icon: null },
            { id: 'location', label: 'Location', icon: MapPin },
            { id: 'settings', label: 'WhatsApp & Catalog', icon: MessageCircle }
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
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.id === 'settings' && merchant?.isStandalone && (
                <span className="w-2 h-2 rounded-full bg-green-500" />
              )}
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

      {activeTab === 'location' && (
        <LocationSettings merchant={merchant} merchantId={id} />
      )}

      {activeTab === 'settings' && (
        <StandaloneSettings merchant={merchant} merchantId={id} />
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
    preparationTime: product?.preparationTime || 15,
    imageUrl: product?.imageUrl || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const queryClient = useQueryClient()

  const handleImageUpload = async (file) => {
    if (!file) return
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF, or WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('image', file)

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await api.post('/uploads/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.data.success) {
        setFormData(prev => ({ ...prev, imageUrl: response.data.data.url }))
        toast.success('Image uploaded successfully!')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.error?.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0])
    }
  }

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

          {/* Image Upload Section */}
          <div>
            <label className="label">Product Image</label>
            
            {formData.imageUrl && (
              <div className="relative mb-3 inline-block">
                <img 
                  src={formData.imageUrl} 
                  alt="Product preview" 
                  className="w-24 h-24 object-cover rounded-xl border-2 border-surface-200"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/96?text=Error' }}
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: '' })}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {!formData.imageUrl && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={clsx(
                  'relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all',
                  dragActive 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-surface-300 hover:border-primary-400 hover:bg-surface-50',
                  isUploading && 'pointer-events-none opacity-60'
                )}
                onClick={() => document.getElementById('product-image-input-detail').click()}
              >
                <input
                  id="product-image-input-detail"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {isUploading ? (
                  <div className="space-y-2">
                    <RefreshCw className="w-6 h-6 mx-auto text-primary-500 animate-spin" />
                    <p className="text-xs text-surface-600">Uploading...</p>
                    <div className="w-full bg-surface-200 rounded-full h-1.5">
                      <div 
                        className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Image className="w-8 h-8 mx-auto text-surface-400" />
                    <p className="text-xs text-surface-600">
                      {dragActive ? 'Drop here' : 'Click or drag to upload'}
                    </p>
                    <p className="text-xs text-surface-400">Max 5MB</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-2">
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="input text-sm"
                placeholder="Or enter image URL..."
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
            <button type="submit" disabled={isSubmitting || isUploading} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ========================================
// STANDALONE MERCHANT SETTINGS COMPONENT
// ========================================
function StandaloneSettings({ merchant, merchantId }) {
  const [isStandalone, setIsStandalone] = useState(merchant?.isStandalone || false)
  const [showManualConfig, setShowManualConfig] = useState(false)
  const [config, setConfig] = useState({
    phoneNumberId: merchant?.whatsappConfig?.phoneNumberId || '',
    accessToken: merchant?.whatsappConfig?.accessToken || '',
    verifyToken: merchant?.whatsappConfig?.verifyToken || '',
    businessAccountId: merchant?.whatsappConfig?.businessAccountId || '',
    metaBusinessId: merchant?.whatsappConfig?.metaBusinessId || ''
  })
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingCatalog, setIsCreatingCatalog] = useState(false)
  const [isSyncingProducts, setIsSyncingProducts] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState(30)
  const queryClient = useQueryClient()

  // Get WhatsApp status
  const { data: whatsappStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['merchant-whatsapp-status', merchantId],
    queryFn: async () => {
      const res = await api.get(`/merchants/${merchantId}/whatsapp-status`)
      return res.data.data
    },
    enabled: !!merchantId
  })

  // Get catalog status
  const { data: catalogStatus, refetch: refetchCatalog } = useQuery({
    queryKey: ['merchant-catalog', merchantId],
    queryFn: async () => {
      const res = await api.get(`/merchants/${merchantId}/catalog`)
      return res.data.data
    },
    enabled: !!merchantId
  })

  // Get billing/analytics data
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['merchant-whatsapp-analytics', merchantId, billingPeriod],
    queryFn: async () => {
      const res = await api.get(`/merchants/${merchantId}/whatsapp-analytics?days=${billingPeriod}`)
      return res.data.data
    },
    enabled: !!merchantId && isStandalone && !!whatsappStatus?.whatsappConfig?.isVerified
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.put(`/merchants/${merchantId}`, {
        isStandalone,
        whatsappConfig: isStandalone ? config : undefined
      })
      toast.success('Settings saved successfully')
      queryClient.invalidateQueries(['merchant', merchantId])
      refetchStatus()
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      const res = await api.post(`/merchants/${merchantId}/verify-whatsapp`)
      const data = res.data.data
      const steps = data.setupSteps || []
      const successCount = steps.filter(s => s.status === 'success').length
      const failedSteps = steps.filter(s => s.status === 'failed')
      const skippedSteps = steps.filter(s => s.status === 'skipped')
      
      if (failedSteps.length > 0) {
        toast.success(`Connected! ${successCount}/${steps.length} steps OK.`, { duration: 5000 })
        failedSteps.forEach(s => toast.error(`${s.step}: ${s.detail}`, { duration: 8000 }))
      } else {
        toast.success(`Fully connected! Phone: ${data.phoneNumber}`, { duration: 5000 })
      }
      // Show skipped steps as info, not errors
      skippedSteps.forEach(s => toast(`${s.detail}`, { icon: 'ℹ️', duration: 5000 }))
      
      // Auto-fill config from detected values
      if (data.wabaId && !config.businessAccountId) {
        setConfig(prev => ({ ...prev, businessAccountId: data.wabaId }))
      }
      if (data.metaBusinessId && !config.metaBusinessId) {
        setConfig(prev => ({ ...prev, metaBusinessId: data.metaBusinessId }))
      }
      
      refetchStatus()
      refetchCatalog()
      queryClient.invalidateQueries(['merchant', merchantId])
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCreateCatalog = async () => {
    setIsCreatingCatalog(true)
    try {
      const res = await api.post(`/catalog/create-for-merchant/${merchantId}`)
      toast.success(`Catalog created: ${res.data.data.catalogId}`)
      refetchCatalog()
      queryClient.invalidateQueries(['merchant', merchantId])
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create catalog')
    } finally {
      setIsCreatingCatalog(false)
    }
  }

  const handleSyncProducts = async () => {
    setIsSyncingProducts(true)
    try {
      const res = await api.post(`/catalog/sync-merchant-catalog/${merchantId}`)
      toast.success(`Synced ${res.data.data.synced} products to catalog`)
      refetchCatalog()
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to sync products')
    } finally {
      setIsSyncingProducts(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Standalone Toggle Card */}
      <div className={clsx(
        'card p-6 border-2 transition-all',
        isStandalone ? 'border-primary-500 bg-primary-50/30' : 'border-surface-200'
      )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={clsx(
              'w-14 h-14 rounded-xl flex items-center justify-center',
              isStandalone ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-400'
            )}>
              <MessageCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-surface-900">Tezzu Standalone Merchant</h3>
              <p className="text-surface-500 mt-1">
                {isStandalone 
                  ? 'Customers will message this merchant\'s WhatsApp number directly'
                  : 'Customers message the central Tezzu WhatsApp number'}
              </p>
              {isStandalone && whatsappStatus?.whatsappConfig?.isVerified && (
                <div className="flex items-center gap-2 mt-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Connected & Active</span>
                </div>
              )}
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isStandalone}
              onChange={(e) => setIsStandalone(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-surface-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      {isStandalone && (
        <>
          {/* Connection Status */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* WhatsApp Connection */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-surface-900 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary-500" />
                  WhatsApp Connection
                </h4>
                {whatsappStatus?.whatsappConfig?.isVerified ? (
                  <span className="badge badge-success flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="badge badge-warning flex items-center gap-1">
                    <Unlink className="w-3 h-3" /> Not Connected
                  </span>
                )}
              </div>

              {whatsappStatus?.whatsappConfig?.isVerified ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">WhatsApp Business Connected</p>
                        <p className="text-sm text-green-600">
                          Phone ID: ***{whatsappStatus.whatsappConfig.phoneNumberId}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-surface-500">
                    Last verified: {whatsappStatus.whatsappConfig.verifiedAt 
                      ? new Date(whatsappStatus.whatsappConfig.verifiedAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              ) : (
                <WhatsAppEmbeddedSignup
                  merchantId={merchantId}
                  onSuccess={() => {
                    refetchStatus()
                    refetchCatalog()
                    queryClient.invalidateQueries(['merchant', merchantId])
                  }}
                />
              )}
            </div>

            {/* Catalog Status */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-surface-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary-500" />
                  Product Catalog
                </h4>
                {catalogStatus?.catalog?.catalogId ? (
                  <span className="badge badge-success flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="badge badge-gray flex items-center gap-1">
                    <Circle className="w-3 h-3" /> Not Created
                  </span>
                )}
              </div>

              {catalogStatus?.catalog?.catalogId ? (
                <div className="space-y-4">
                  <div className="p-4 bg-surface-50 rounded-xl">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-surface-500">Catalog ID</p>
                        <p className="font-mono font-medium">{catalogStatus.catalog.catalogId}</p>
                      </div>
                      <div>
                        <p className="text-surface-500">Status</p>
                        <p className="font-medium capitalize">{catalogStatus.catalog.syncStatus}</p>
                      </div>
                      <div>
                        <p className="text-surface-500">Products Synced</p>
                        <p className="font-medium">{catalogStatus.products?.synced || 0} / {catalogStatus.products?.total || 0}</p>
                      </div>
                      <div>
                        <p className="text-surface-500">Last Sync</p>
                        <p className="font-medium">
                          {catalogStatus.catalog.lastSyncedAt 
                            ? new Date(catalogStatus.catalog.lastSyncedAt).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSyncProducts}
                    disabled={isSyncingProducts}
                    className="w-full btn btn-secondary flex items-center justify-center gap-2"
                  >
                    {isSyncingProducts ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Syncing Products...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Sync Products to Catalog
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-2">
                      <ShoppingBag className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">No Catalog</p>
                        <p className="mt-1">
                          Create a catalog to enable product images and multi-product messages on WhatsApp
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCreateCatalog}
                    disabled={isCreatingCatalog || !whatsappStatus?.whatsappConfig?.isVerified}
                    className="w-full btn btn-primary flex items-center justify-center gap-2"
                  >
                    {isCreatingCatalog ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating Catalog...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Catalog
                      </>
                    )}
                  </button>
                  {!whatsappStatus?.whatsappConfig?.isVerified && (
                    <p className="text-xs text-surface-400 text-center">
                      Connect WhatsApp first to create a catalog
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Manual WhatsApp Configuration (Advanced) */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-surface-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-primary-500" />
                Manual Configuration
                <span className="text-xs font-normal text-surface-400">(Advanced)</span>
              </h4>
              <button
                onClick={() => setShowManualConfig(!showManualConfig)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {showManualConfig ? 'Hide' : 'Show'}
              </button>
            </div>

            {!showManualConfig ? (
              <p className="text-sm text-surface-500">
                Use the "Connect with Facebook" button above for automatic setup.
                Click "Show" if you need to enter credentials manually.
              </p>
            ) : (
            <>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <label className="label">Phone Number ID *</label>
                <input
                  type="text"
                  value={config.phoneNumberId}
                  onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                  className="input font-mono text-lg"
                  placeholder="e.g. 123456789012345"
                />
                <p className="text-xs text-surface-400 mt-1">
                  Find it: Meta Business Suite → WhatsApp → Phone Numbers → Click number → Phone Number ID
                </p>
              </div>

              <div>
                <label className="label">
                  WhatsApp Business Account ID (WABA)
                  <span className="text-surface-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="text"
                  value={config.businessAccountId}
                  onChange={(e) => setConfig({ ...config, businessAccountId: e.target.value })}
                  className="input font-mono"
                  placeholder="WABA ID for messaging"
                />
                <p className="text-xs text-surface-400 mt-1">
                  WhatsApp Business Account ID — used for messaging APIs
                </p>
              </div>

              <div>
                <label className="label">
                  Meta Business Manager ID
                  <span className="text-amber-500 font-normal ml-1">(required for catalog)</span>
                </label>
                <input
                  type="text"
                  value={config.metaBusinessId}
                  onChange={(e) => setConfig({ ...config, metaBusinessId: e.target.value })}
                  className="input font-mono"
                  placeholder="e.g. 806822202369208"
                />
                <p className="text-xs text-surface-400 mt-1">
                  Find it: business.facebook.com → Settings → Business Info → Business ID.
                  <span className="text-amber-600 font-medium"> This is NOT the WABA ID.</span>
                </p>
              </div>

              <div>
                <label className="label">
                  Custom Access Token
                  <span className="text-surface-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="password"
                  value={config.accessToken}
                  onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                  className="input font-mono"
                  placeholder="Leave empty to use global Tezzu token"
                />
                <p className="text-xs text-green-600 mt-1">
                  ✓ Leave empty - will use your existing Tezzu access token automatically
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={isSaving || !config.phoneNumberId}
                className="btn btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Enable
                  </>
                )}
              </button>

              <button
                onClick={handleVerify}
                disabled={isVerifying || !config.phoneNumberId}
                className="btn btn-secondary flex items-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Test Connection
                  </>
                )}
              </button>
            </div>
            </>
            )}
          </div>

          {/* Setup Instructions */}
          <div className="card p-6 bg-green-50 border-green-200">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Quick Setup (2 Steps)
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <div>
                  <p className="text-sm font-medium text-green-900">Add merchant's phone to your Business Account</p>
                  <p className="text-xs text-green-700 mt-1">
                    Meta Business Suite → WhatsApp → Phone Numbers → Add Phone Number
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <div>
                  <p className="text-sm font-medium text-green-900">Enter the Phone Number ID above</p>
                  <p className="text-xs text-green-700 mt-1">
                    Find it in: Phone Numbers → Click number → Copy Phone Number ID
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-xs text-green-700">
                <strong>✨ That's it!</strong> Webhook is already configured. Access Token will use your global Tezzu token automatically.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="card p-6">
            <h4 className="font-semibold text-surface-900 mb-4">How Standalone Mode Works</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-surface-50 rounded-xl">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary-600 font-bold">1</span>
                </div>
                <h5 className="font-medium text-surface-900 mb-1">Customer Messages</h5>
                <p className="text-sm text-surface-500">
                  Customers message the merchant's WhatsApp number directly, not Tezzu's
                </p>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary-600 font-bold">2</span>
                </div>
                <h5 className="font-medium text-surface-900 mb-1">Same Flow</h5>
                <p className="text-sm text-surface-500">
                  The ordering flow is identical - menu browsing, cart, checkout - all branded for this merchant
                </p>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-primary-600 font-bold">3</span>
                </div>
                <h5 className="font-medium text-surface-900 mb-1">Their Catalog</h5>
                <p className="text-sm text-surface-500">
                  Products are synced to the merchant's own Meta Commerce catalog with images
                </p>
              </div>
            </div>
          </div>

          {/* Billing & Analytics */}
          {whatsappStatus?.whatsappConfig?.isVerified && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-surface-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Usage & Billing
                </h4>
                <div className="flex items-center gap-2">
                  <select
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(parseInt(e.target.value))}
                    className="input py-1 px-2 text-sm w-auto"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                  <button
                    onClick={() => refetchAnalytics()}
                    className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={clsx("w-4 h-4 text-surface-400", analyticsLoading && "animate-spin")} />
                  </button>
                </div>
              </div>

              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : analyticsData ? (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-xs text-green-600 font-medium">Total Conversations</p>
                      <p className="text-2xl font-bold text-green-700">{analyticsData.conversations?.total || 0}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium">Estimated Cost</p>
                      <p className="text-2xl font-bold text-blue-700">₹{analyticsData.billing?.estimatedCost || 0}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <p className="text-xs text-purple-600 font-medium">Quality Rating</p>
                      <p className="text-2xl font-bold text-purple-700 capitalize">{analyticsData.merchant?.qualityRating || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-xs text-amber-600 font-medium">Messaging Tier</p>
                      <p className="text-lg font-bold text-amber-700">{analyticsData.merchant?.messagingTier || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Conversation Breakdown */}
                  {analyticsData.conversations?.total > 0 && analyticsData.conversations?.breakdown && (
                    <div className="p-4 bg-surface-50 rounded-xl">
                      <h5 className="text-sm font-medium text-surface-700 mb-3">Conversation Breakdown</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-surface-500">Marketing</p>
                          <p className="font-semibold">{analyticsData.conversations.breakdown.marketing || 0}</p>
                          <p className="text-xs text-surface-400">₹{analyticsData.billing?.breakdown?.marketing || 0}</p>
                        </div>
                        <div>
                          <p className="text-surface-500">Utility</p>
                          <p className="font-semibold">{analyticsData.conversations.breakdown.utility || 0}</p>
                          <p className="text-xs text-surface-400">₹{analyticsData.billing?.breakdown?.utility || 0}</p>
                        </div>
                        <div>
                          <p className="text-surface-500">Authentication</p>
                          <p className="font-semibold">{analyticsData.conversations.breakdown.authentication || 0}</p>
                          <p className="text-xs text-surface-400">₹{analyticsData.billing?.breakdown?.authentication || 0}</p>
                        </div>
                        <div>
                          <p className="text-surface-500">Service</p>
                          <p className="font-semibold">{analyticsData.conversations.breakdown.service || 0}</p>
                          <p className="text-xs text-surface-400">₹{analyticsData.billing?.breakdown?.service || 0}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Verification Status */}
                  <div className="p-4 bg-surface-50 rounded-xl">
                    <h5 className="text-sm font-medium text-surface-700 mb-3">Verification Status</h5>
                    <div className="flex flex-wrap gap-3">
                      {/* Official Business Account Badge */}
                      <div className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border",
                        analyticsData.merchant?.isOfficialBusinessAccount 
                          ? "bg-green-50 border-green-200" 
                          : "bg-surface-100 border-surface-200"
                      )}>
                        {analyticsData.merchant?.isOfficialBusinessAccount ? (
                          <>
                            <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </span>
                            <span className="text-sm font-medium text-green-700">Official Business ✓</span>
                          </>
                        ) : (
                          <>
                            <span className="w-5 h-5 bg-surface-300 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </span>
                            <span className="text-sm font-medium text-surface-600">Standard Business</span>
                          </>
                        )}
                      </div>
                      
                      {/* Account Mode */}
                      <div className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border",
                        analyticsData.merchant?.accountMode === 'LIVE' 
                          ? "bg-green-50 border-green-200" 
                          : "bg-amber-50 border-amber-200"
                      )}>
                        <span className={clsx(
                          "w-2 h-2 rounded-full",
                          analyticsData.merchant?.accountMode === 'LIVE' ? "bg-green-500" : "bg-amber-500"
                        )} />
                        <span className={clsx(
                          "text-sm font-medium",
                          analyticsData.merchant?.accountMode === 'LIVE' ? "text-green-700" : "text-amber-700"
                        )}>
                          {analyticsData.merchant?.accountMode || 'N/A'}
                        </span>
                      </div>

                      {/* Name Status */}
                      {analyticsData.merchant?.verifiedName && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-blue-50 border-blue-200">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700">
                            {analyticsData.merchant.verifiedName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Verified Tick Info */}
                    {!analyticsData.merchant?.isOfficialBusinessAccount && (
                      <div className="mt-3 p-2 bg-surface-100 rounded-lg">
                        <p className="text-xs text-surface-500">
                          💡 <strong>Want the green tick?</strong> Apply for Official Business Account status in Meta Business Suite → WhatsApp Manager → Phone Numbers → Request Official Business Account
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rate Info */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-700">
                      <strong>WhatsApp Pricing (India):</strong> Marketing ₹0.80 | Utility ₹0.35 | Authentication ₹0.35 | Service ₹0.35 per conversation
                    </p>
                  </div>

                  {/* Phone Info */}
                  {analyticsData.merchant?.phoneNumber && (
                    <div className="text-sm text-surface-500">
                      Phone: <span className="font-medium">{analyticsData.merchant.phoneNumber}</span>
                      {analyticsData.merchant.verifiedName && (
                        <span className="ml-2">• {analyticsData.merchant.verifiedName}</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-surface-50 rounded-xl text-center">
                  <p className="text-sm text-surface-500">No usage data available yet</p>
                  <p className="text-xs text-surface-400 mt-1">Data will appear once conversations start</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!isStandalone && (
        <div className="card p-6 bg-surface-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-surface-200 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-surface-400" />
            </div>
            <div>
              <h4 className="font-medium text-surface-900">Using Central Tezzu Number</h4>
              <p className="text-sm text-surface-500 mt-1">
                Customers message the Tezzu WhatsApp number and select this merchant from the list.
                Enable standalone mode to let customers message this merchant's own WhatsApp number.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Location Settings Component
function LocationSettings({ merchant, merchantId }) {
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [radius, setRadius] = useState(5)
  const [zoneName, setZoneName] = useState('')
  const [deliveryCharge, setDeliveryCharge] = useState(30)
  const [estimatedTime, setEstimatedTime] = useState(30)
  const [minimumOrder, setMinimumOrder] = useState(100)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const queryClient = useQueryClient()

  // Initialize from merchant data
  useEffect(() => {
    if (merchant) {
      if (merchant.location?.coordinates) {
        setLongitude(merchant.location.coordinates[0]?.toString() || '')
        setLatitude(merchant.location.coordinates[1]?.toString() || '')
      }
      setLocationEnabled(merchant.useLocationBasedOrdering || false)
      
      if (merchant.deliveryZones?.length > 0) {
        const zone = merchant.deliveryZones[0]
        setZoneName(zone.name || '')
        setDeliveryCharge(zone.deliveryCharge || 30)
        setEstimatedTime(zone.estimatedTime || 30)
        setMinimumOrder(zone.minimumOrder || 100)
      }
    }
  }, [merchant])

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6))
        setLongitude(position.coords.longitude.toFixed(6))
        setGettingLocation(false)
        toast.success('Location detected!')
      },
      (error) => {
        setGettingLocation(false)
        toast.error('Failed to get location: ' + error.message)
      },
      { enableHighAccuracy: true }
    )
  }

  // Generate circular zone polygon
  const generateCircularZone = (centerLng, centerLat, radiusKm) => {
    const points = 32
    const coordinates = []
    const earthRadius = 6371

    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI
      const dLat = (radiusKm / earthRadius) * (180 / Math.PI)
      const dLng = dLat / Math.cos(centerLat * Math.PI / 180)
      const lat = centerLat + dLat * Math.sin(angle)
      const lng = centerLng + dLng * Math.cos(angle)
      coordinates.push([lng, lat])
    }

    if (coordinates.length > 0) {
      coordinates.push(coordinates[0])
    }

    return {
      type: 'Polygon',
      coordinates: [coordinates]
    }
  }

  // Save location settings
  const handleSave = async () => {
    if (!latitude || !longitude) {
      toast.error('Please enter location coordinates')
      return
    }

    setIsSubmitting(true)

    try {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)

      // Generate zone polygon
      const zonePolygon = generateCircularZone(lng, lat, radius)

      // Update merchant location
      await api.put(`/zones/${merchantId}/location`, {
        latitude: lat,
        longitude: lng
      })

      // Create/update delivery zone
      const zoneData = {
        name: zoneName || `${radius}km Delivery Zone`,
        area: zonePolygon,
        deliveryCharge,
        estimatedTime,
        minimumOrder,
        isActive: true
      }

      // First, try to get existing zones to check if we need to create or update
      let existingZones = []
      try {
        const zonesRes = await api.get(`/zones/${merchantId}`)
        existingZones = zonesRes.data?.data?.zones || []
      } catch (e) {
        // No zones yet
      }

      // Check if auto-generated zone exists (ends with "km Delivery Zone")
      const existingAutoZone = existingZones.find(z => z.name?.includes('km Delivery Zone'))

      if (existingAutoZone) {
        // Update existing zone
        await api.put(`/zones/${merchantId}/${existingAutoZone._id}`, zoneData)
      } else {
        // Create new zone
        await api.post(`/zones/${merchantId}`, zoneData)
      }

      // Toggle location-based ordering if needed
      // Only call toggle if the state is different from what we want
      const currentRes = await api.get(`/zones/${merchantId}`)
      const currentEnabled = currentRes.data?.data?.useLocationBasedOrdering || false
      
      if (locationEnabled !== currentEnabled) {
        await api.put(`/zones/${merchantId}/toggle`)
      }

      queryClient.invalidateQueries(['merchant', merchantId])
      toast.success('Location settings saved!')
    } catch (error) {
      console.error('Error saving location:', error)
      const errorMsg = error.response?.data?.error?.message || 'Failed to save location settings'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasLocation = latitude && longitude

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={clsx(
        'card p-6 border-l-4',
        locationEnabled && hasLocation ? 'border-l-green-500 bg-green-50/50' : 'border-l-amber-500 bg-amber-50/50'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              locationEnabled && hasLocation ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
            )}>
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">Location-Based Ordering</h3>
              <p className="text-sm text-surface-500">
                {locationEnabled && hasLocation 
                  ? 'Customers in your delivery zone can find you' 
                  : 'Set up location to enable zone-based delivery'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={locationEnabled}
              onChange={(e) => setLocationEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Location Input */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-500" />
            Restaurant Location
          </h3>

          <div className="space-y-4">
            <button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              {gettingLocation ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Use Current Location
                </>
              )}
            </button>

            <div className="text-center text-sm text-surface-400">or enter manually</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="input"
                  placeholder="28.6139"
                />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="input"
                  placeholder="77.2090"
                />
              </div>
            </div>

            {hasLocation && (
              <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location set: {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
              </div>
            )}
          </div>
        </div>

        {/* Delivery Radius */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            Delivery Radius
          </h3>

          <div className="space-y-4">
            <div>
              <label className="label">Select Radius</label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 5, 10, 15].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={clsx(
                      'py-3 px-4 rounded-xl font-medium transition-all text-sm',
                      radius === r
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    )}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Zone Name (optional)</label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="input"
                placeholder={`${radius}km Delivery Zone`}
              />
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-500" />
            Delivery Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="label">Delivery Charge (₹)</label>
              <input
                type="number"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(parseInt(e.target.value) || 0)}
                className="input"
                min={0}
              />
            </div>
            <div>
              <label className="label">Estimated Delivery Time (mins)</label>
              <input
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 30)}
                className="input"
                min={10}
              />
            </div>
            <div>
              <label className="label">Minimum Order Amount (₹)</label>
              <input
                type="number"
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(parseInt(e.target.value) || 0)}
                className="input"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Preview</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-surface-100">
              <span className="text-surface-500">Location</span>
              <span className="font-medium">
                {hasLocation ? `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}` : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-100">
              <span className="text-surface-500">Delivery Radius</span>
              <span className="font-medium">{radius} km</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-100">
              <span className="text-surface-500">Delivery Charge</span>
              <span className="font-medium">₹{deliveryCharge}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-100">
              <span className="text-surface-500">Est. Time</span>
              <span className="font-medium">{estimatedTime} mins</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-100">
              <span className="text-surface-500">Min Order</span>
              <span className="font-medium">₹{minimumOrder}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-surface-500">Status</span>
              <span className={clsx(
                'font-medium',
                locationEnabled ? 'text-green-600' : 'text-amber-600'
              )}>
                {locationEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Delivery Zones */}
      <DeliveryZonesDisplay 
        merchant={merchant} 
        merchantId={merchantId}
        onZoneDeleted={() => queryClient.invalidateQueries(['merchant', merchantId])}
      />

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSubmitting || !hasLocation}
          className="btn btn-primary flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Location Settings
            </>
          )}
        </button>
      </div>

      {/* WhatsApp Tip */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            💡
          </div>
          <div>
            <p className="font-medium text-blue-900">Tip: Update via WhatsApp</p>
            <p className="text-sm text-blue-700 mt-1">
              Merchants can also update their location by sending "location" or "settings" 
              on WhatsApp, then sharing their live location and selecting a delivery radius.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Delivery Zones Display Component
function DeliveryZonesDisplay({ merchant, merchantId, onZoneDeleted }) {
  const [deletingZone, setDeletingZone] = useState(null)

  const zones = merchant?.deliveryZones || []

  // Calculate zone coverage area from polygon coordinates
  const getZoneCoverage = (zone) => {
    if (!zone.area?.coordinates?.[0]) return null
    
    const coords = zone.area.coordinates[0]
    const lngs = coords.map(c => c[0])
    const lats = coords.map(c => c[1])
    
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    
    // Calculate approximate radius and area
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const avgLat = (maxLat + minLat) / 2
    
    // Convert to km (approximate)
    const latKm = latDiff * 111
    const lngKm = lngDiff * 111 * Math.cos(avgLat * Math.PI / 180)
    
    // Calculate radius (average of lat/lng span divided by 2)
    const radiusKm = (latKm + lngKm) / 4  // diameter / 2, averaged
    
    // Calculate circular area: π × r²
    const areaKm2 = Math.round(Math.PI * radiusKm * radiusKm)
    
    // Center point
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    
    return {
      area: areaKm2,
      radius: Math.round(radiusKm),
      center: { lat: centerLat, lng: centerLng },
      bounds: { minLat, maxLat, minLng, maxLng }
    }
  }

  const handleDeleteZone = async (zoneId) => {
    if (!confirm('Are you sure you want to delete this delivery zone?')) return
    
    setDeletingZone(zoneId)
    try {
      await api.delete(`/zones/${merchantId}/${zoneId}`)
      toast.success('Zone deleted successfully')
      onZoneDeleted?.()
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete zone')
    } finally {
      setDeletingZone(null)
    }
  }

  const handleToggleZone = async (zoneId, currentStatus) => {
    try {
      await api.patch(`/zones/${merchantId}/${zoneId}/toggle`)
      toast.success(`Zone ${currentStatus ? 'deactivated' : 'activated'}`)
      onZoneDeleted?.() // Refresh merchant data
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to toggle zone')
    }
  }

  if (zones.length === 0) {
    return (
      <div className="card p-6 text-center">
        <Circle className="w-12 h-12 mx-auto mb-3 text-surface-300" />
        <h3 className="font-medium text-surface-900 mb-1">No Delivery Zones</h3>
        <p className="text-sm text-surface-500">
          Set your location and radius above to create a delivery zone
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-500" />
          Delivery Zones ({zones.length})
        </h3>
      </div>

      <div className="grid gap-4">
        {zones.map((zone, index) => {
          const coverage = getZoneCoverage(zone)
          
          return (
            <div 
              key={zone._id || index}
              className={clsx(
                'card p-4 border-l-4 transition-all',
                zone.isActive 
                  ? 'border-l-green-500 bg-green-50/30' 
                  : 'border-l-surface-300 bg-surface-50/50 opacity-75'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Zone Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-surface-900 truncate">
                      {zone.name || `Zone ${index + 1}`}
                    </h4>
                    <span className={clsx(
                      'badge text-xs',
                      zone.isActive ? 'badge-success' : 'badge-gray'
                    )}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Zone Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-surface-400" />
                      <span className="text-surface-600">₹{zone.deliveryCharge || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-surface-400" />
                      <span className="text-surface-600">{zone.estimatedTime || 30} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-surface-400" />
                      <span className="text-surface-600">Min ₹{zone.minimumOrder || 0}</span>
                    </div>
                    {coverage && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-surface-400" />
                          <span className="text-surface-600">~{coverage.radius} km radius</span>
                        </div>
                        <div className="flex items-center gap-1">
                        <Layers className="w-4 h-4 text-surface-400" />
                        <span className="text-surface-600">~{coverage.area} km²</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coverage Details */}
                  {coverage && (
                    <div className="mt-3 p-2 bg-white/50 rounded-lg text-xs text-surface-500">
                      <div className="flex items-center gap-2 flex-wrap">
                        <MapPin className="w-3 h-3" />
                        <span>Center: {coverage.center.lat.toFixed(4)}, {coverage.center.lng.toFixed(4)}</span>
                        <a 
                          href={`https://www.google.com/maps?q=${coverage.center.lat},${coverage.center.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline flex items-center gap-1"
                        >
                          View on Map <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Zone Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleToggleZone(zone._id, zone.isActive)}
                    className={clsx(
                      'p-2 rounded-lg transition-colors',
                      zone.isActive 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                    )}
                    title={zone.isActive ? 'Deactivate zone' : 'Activate zone'}
                  >
                    {zone.isActive ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteZone(zone._id)}
                    disabled={deletingZone === zone._id}
                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    title="Delete zone"
                  >
                    {deletingZone === zone._id ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Warning for multiple zones */}
      {zones.length > 1 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            This merchant has {zones.length} delivery zones. Make sure they don't overlap incorrectly, 
            as customers in overlapping areas will be matched to the first valid zone found.
          </span>
        </div>
      )}
    </div>
  )
}

