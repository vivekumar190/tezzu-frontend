import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Search, 
  Package,
  Plus,
  Filter,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import clsx from 'clsx'
import { useAuthStore } from '../store/authStore'

export default function Products() {
  const { user } = useAuthStore()
  const isMerchantAdmin = user?.role === 'merchant_admin'
  const [search, setSearch] = useState('')
  const [selectedMerchant, setSelectedMerchant] = useState('')
  const queryClient = useQueryClient()

  // Auto-select merchant for merchant_admin users
  useEffect(() => {
    if (isMerchantAdmin && user?.merchant) {
      setSelectedMerchant(user.merchant)
    }
  }, [isMerchantAdmin, user?.merchant])

  const { data: merchants } = useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      const res = await api.get('/merchants?limit=100')
      return res.data.data.merchants
    },
    enabled: !isMerchantAdmin // Only fetch for admin users
  })

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', selectedMerchant],
    queryFn: async () => {
      if (!selectedMerchant) return []
      const res = await api.get(`/products/merchant/${selectedMerchant}?limit=100`)
      return res.data.data.products
    },
    enabled: !!selectedMerchant
  })

  const toggleAvailability = useMutation({
    mutationFn: (productId) => api.patch(`/products/${productId}/toggle-availability`),
    onSuccess: () => {
      queryClient.invalidateQueries(['products', selectedMerchant])
      toast.success('Product availability updated')
    }
  })

  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Products</h1>
          <p className="text-surface-500">View and manage products across merchants</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          {/* Only show merchant selector for admin users */}
          {!isMerchantAdmin && (
            <select
              value={selectedMerchant}
              onChange={(e) => setSelectedMerchant(e.target.value)}
              className="input w-auto min-w-[200px]"
            >
              <option value="">Select Merchant</option>
              {merchants?.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          )}

          {selectedMerchant && (
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-12"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Table */}
      {!selectedMerchant ? (
        <div className="card p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-surface-300" />
          <h3 className="text-lg font-medium text-surface-900 mb-2">
            {isMerchantAdmin ? 'Loading your products...' : 'Select a merchant'}
          </h3>
          <p className="text-surface-500">
            {isMerchantAdmin ? 'Please wait...' : 'Choose a merchant to view their products'}
          </p>
        </div>
      ) : isLoading ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Product</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Category</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Price</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-surface-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-5 bg-surface-200 rounded w-3/4" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-surface-200 rounded w-1/2" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-surface-200 rounded w-16" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-surface-200 rounded w-20" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-surface-200 rounded w-24 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-surface-300" />
          <h3 className="text-lg font-medium text-surface-900 mb-2">No products found</h3>
          <p className="text-surface-500">Add products from the merchant detail page</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Product</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Category</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Price</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-surface-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-surface-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        'w-3 h-3 rounded-full flex-shrink-0',
                        product.isVeg ? 'bg-green-500' : 'bg-red-500'
                      )} />
                      <div>
                        <p className="font-medium text-surface-900">{product.name}</p>
                        <p className="text-sm text-surface-500 line-clamp-1">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge badge-gray">{product.category?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">₹{product.price}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      'badge',
                      product.isAvailable ? 'badge-success' : 'badge-error'
                    )}>
                      {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleAvailability.mutate(product._id)}
                      className="btn btn-ghost btn-sm"
                    >
                      {product.isAvailable ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-green-500" />
                          Mark Out
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-surface-400" />
                          Mark In
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

