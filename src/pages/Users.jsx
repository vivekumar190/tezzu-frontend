import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Search, 
  Plus,
  Users as UsersIcon,
  MoreVertical,
  Shield,
  Store,
  User,
  Mail,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import clsx from 'clsx'

const ROLE_ICONS = {
  admin: Shield,
  merchant_admin: Store,
  staff: User
}

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  merchant_admin: 'bg-blue-100 text-blue-700',
  staff: 'bg-surface-100 text-surface-700'
}

export default function Users() {
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/admin/users?limit=100')
      return res.data.data
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User status updated')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User deleted')
    }
  })

  const filteredUsers = data?.users?.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Users</h1>
          <p className="text-surface-500">Manage admin and staff accounts</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12"
          />
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Merchant</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Last Login</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-surface-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-5 bg-surface-200 rounded w-40" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-surface-200 rounded w-24" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-surface-200 rounded w-32" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-surface-200 rounded w-20" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-surface-200 rounded w-28" /></td>
                  <td className="px-6 py-4"><div className="h-5 bg-surface-200 rounded w-10 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card p-12 text-center">
          <UsersIcon className="w-16 h-16 mx-auto mb-4 text-surface-300" />
          <h3 className="text-lg font-medium text-surface-900 mb-2">No users found</h3>
          <p className="text-surface-500">Add users to manage your platform</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Merchant</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-surface-500 uppercase">Last Login</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-surface-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredUsers.map((user) => {
                const RoleIcon = ROLE_ICONS[user.role] || User
                const isCurrentUser = user._id === currentUser?._id
                
                return (
                  <tr key={user._id} className="hover:bg-surface-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-surface-900">
                            {user.name}
                            {isCurrentUser && <span className="ml-2 text-xs text-primary-600">(You)</span>}
                          </p>
                          <p className="text-sm text-surface-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx('badge', ROLE_COLORS[user.role])}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.merchant?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx('badge', user.isActive ? 'badge-success' : 'badge-gray')}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500">
                      {user.lastLogin 
                        ? format(new Date(user.lastLogin), 'MMM d, h:mm a')
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 hover:bg-surface-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-surface-500" />
                        </button>
                        {!isCurrentUser && (
                          <>
                            <button
                              onClick={() => toggleStatusMutation.mutate(user._id)}
                              className="p-2 hover:bg-surface-100 rounded-lg"
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {user.isActive 
                                ? <ToggleRight className="w-4 h-4 text-green-500" />
                                : <ToggleLeft className="w-4 h-4 text-surface-400" />
                              }
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this user?')) {
                                  deleteMutation.mutate(user._id)
                                }
                              }}
                              className="p-2 hover:bg-surface-100 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-surface-400 hover:text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowCreateModal(false)
            setEditingUser(null)
          }}
        />
      )}
    </div>
  )
}

function UserModal({ user, onClose }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'staff',
    merchant: user?.merchant?._id || user?.merchant || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const { data: merchants } = useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      const res = await api.get('/merchants?limit=100&mode=all&includeInactive=true')
      return res.data.data.merchants
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = { ...formData }
      if (!payload.password) delete payload.password
      if (!payload.merchant) delete payload.merchant

      if (user) {
        await api.put(`/admin/users/${user._id}`, payload)
        toast.success('User updated successfully')
      } else {
        await api.post('/admin/users', payload)
        toast.success('User created successfully')
      }
      
      queryClient.invalidateQueries(['users'])
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
            {user ? 'Edit User' : 'Add New User'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>

          {!user && (
            <div>
              <label className="label">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                minLength={6}
                required={!user}
              />
            </div>
          )}

          <div>
            <label className="label">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
            >
              <option value="staff">Staff</option>
              <option value="merchant_admin">Merchant Admin</option>
            </select>
          </div>

          {formData.role === 'merchant_admin' && (
            <div>
              <label className="label">Assigned Merchant</label>
              <select
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                className="input"
              >
                <option value="">Select Merchant</option>
                {merchants?.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : (user ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

