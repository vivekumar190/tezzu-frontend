import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  ChefHat,
  Bike,
  DollarSign,
  Clock,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import clsx from 'clsx'

const ROLE_CONFIG = {
  cook: { label: 'Cook', icon: ChefHat, color: 'bg-orange-100 text-orange-700' },
  delivery_boy: { label: 'Delivery Boy', icon: Bike, color: 'bg-blue-100 text-blue-700' },
  cashier: { label: 'Cashier', icon: DollarSign, color: 'bg-green-100 text-green-700' },
  manager: { label: 'Manager', icon: Users, color: 'bg-purple-100 text-purple-700' },
  helper: { label: 'Helper', icon: Users, color: 'bg-gray-100 text-gray-700' }
}

export default function Staff() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['staff', roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (roleFilter) params.append('role', roleFilter)
      const res = await api.get(`/staff?${params}`)
      return res.data.data
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff'])
      toast.success('Staff member deleted')
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to delete')
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/staff/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff'])
      toast.success('Status updated')
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update')
  })

  const staff = data?.staff || []
  const stats = data?.stats || {}
  const roles = data?.roles || {}

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  )

  const handleEdit = (member) => {
    setEditingStaff(member)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingStaff(null)
    setShowModal(true)
  }

  const handleDelete = (member) => {
    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
      deleteMutation.mutate(member._id)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Staff Management</h1>
          <p className="text-surface-500">Manage your restaurant staff</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          <UserPlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <p className="text-sm text-surface-500">Total Staff</p>
          <p className="text-2xl font-bold text-surface-900">{stats.total || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-surface-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active || 0}</p>
        </div>
        {Object.entries(stats.byRole || {}).map(([role, count]) => (
          <div key={role} className="card p-4">
            <p className="text-sm text-surface-500 capitalize">{role.replace('_', ' ')}s</p>
            <p className="text-2xl font-bold text-surface-900">{count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-12"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-auto min-w-[150px]"
          >
            <option value="">All Roles</option>
            {Object.entries(roles).map(([key, value]) => (
              <option key={key} value={value}>{key.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
          <p className="mt-4 text-surface-500">Loading staff...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-surface-300" />
          <h3 className="text-lg font-medium text-surface-900 mb-2">No staff members</h3>
          <p className="text-surface-500 mb-4">Add your first staff member to get started</p>
          <button onClick={handleAdd} className="btn btn-primary">
            <UserPlus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.helper
            const RoleIcon = roleConfig.icon

            return (
              <div key={member._id} className={clsx(
                'card p-5 transition-all hover:shadow-md',
                !member.isActive && 'opacity-60'
              )}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      roleConfig.color
                    )}>
                      <RoleIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900">{member.name}</h3>
                      <span className={clsx('badge text-xs', roleConfig.color)}>
                        {roleConfig.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleMutation.mutate(member._id)}
                      className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
                      title={member.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {member.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-surface-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(member)}
                      className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-surface-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(member)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-surface-600">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${member.phone}`} className="hover:text-primary-600">
                      {member.phone}
                    </a>
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-2 text-surface-600">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${member.email}`} className="hover:text-primary-600 truncate">
                        {member.email}
                      </a>
                    </div>
                  )}
                  {member.workingHours?.start && (
                    <div className="flex items-center gap-2 text-surface-600">
                      <Clock className="w-4 h-4" />
                      <span>{member.workingHours.start} - {member.workingHours.end}</span>
                    </div>
                  )}
                  {member.salary && (
                    <div className="flex items-center gap-2 text-surface-600">
                      <DollarSign className="w-4 h-4" />
                      <span>₹{member.salary.toLocaleString()}/month</span>
                    </div>
                  )}
                </div>

                {member.role === 'delivery_boy' && (
                  <div className="mt-4 pt-4 border-t border-surface-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-500">Total Deliveries</span>
                      <span className="font-semibold text-surface-900">{member.totalDeliveries || 0}</span>
                    </div>
                    {member.currentOrder && (
                      <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
                        🚀 Currently on delivery
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <StaffModal
          staff={editingStaff}
          roles={roles}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

function StaffModal({ staff, roles, onClose }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    phone: staff?.phone || '',
    role: staff?.role || 'cook',
    email: staff?.email || '',
    salary: staff?.salary || '',
    notes: staff?.notes || '',
    workingHoursStart: staff?.workingHours?.start || '',
    workingHoursEnd: staff?.workingHours?.end || ''
  })

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        name: data.name,
        phone: data.phone,
        role: data.role,
        email: data.email || null,
        salary: data.salary ? Number(data.salary) : null,
        notes: data.notes || null,
        workingHours: data.workingHoursStart && data.workingHoursEnd
          ? { start: data.workingHoursStart, end: data.workingHoursEnd }
          : null
      }
      
      if (staff) {
        return api.put(`/staff/${staff._id}`, payload)
      }
      return api.post('/staff', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff'])
      toast.success(staff ? 'Staff updated' : 'Staff added')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to save')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.phone || !formData.role) {
      toast.error('Name, phone, and role are required')
      return
    }
    saveMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h2 className="text-lg font-semibold text-surface-900">
              {staff ? 'Edit Staff' : 'Add Staff Member'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Enter name"
                  required
                />
              </div>

              <div>
                <label className="label">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="9876543210"
                  required
                />
              </div>

              <div>
                <label className="label">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                  required
                >
                  {Object.entries(roles).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="label">Salary (₹/month)</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="input"
                  placeholder="15000"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="label">Start Time</label>
                  <input
                    type="time"
                    value={formData.workingHoursStart}
                    onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="flex-1">
                  <label className="label">End Time</label>
                  <input
                    type="time"
                    value={formData.workingHoursEnd}
                    onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary flex-1"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : (staff ? 'Update' : 'Add Staff')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

