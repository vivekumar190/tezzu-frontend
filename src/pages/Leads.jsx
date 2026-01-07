import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  Building2,
  MapPin,
  CheckCircle,
  XCircle,
  MessageCircle,
  Filter,
  RefreshCw,
  ChevronDown,
  ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../lib/api'
import clsx from 'clsx'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'new', label: '🆕 New' },
  { value: 'contacted', label: '📞 Contacted' },
  { value: 'demo_scheduled', label: '📅 Demo Scheduled' },
  { value: 'demo_done', label: '✅ Demo Done' },
  { value: 'converted', label: '🎉 Converted' },
  { value: 'not_interested', label: '❌ Not Interested' },
  { value: 'follow_up', label: '🔄 Follow Up' },
]

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  demo_scheduled: 'bg-purple-100 text-purple-700 border-purple-200',
  demo_done: 'bg-green-100 text-green-700 border-green-200',
  converted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  not_interested: 'bg-red-100 text-red-700 border-red-200',
  follow_up: 'bg-orange-100 text-orange-700 border-orange-200',
}

export default function Leads() {
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leads', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('limit', '50')
      const res = await api.get(`/leads?${params}`)
      return res.data.data
    }
  })

  const { data: statsData } = useQuery({
    queryKey: ['leads-stats'],
    queryFn: async () => {
      const res = await api.get('/leads/stats/overview')
      return res.data.data
    }
  })

  const updateLeadMutation = useMutation({
    mutationFn: ({ leadId, updates }) => api.put(`/leads/${leadId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads'])
      queryClient.invalidateQueries(['leads-stats'])
      toast.success('Lead updated')
    }
  })

  const handleStatusChange = (leadId, newStatus) => {
    updateLeadMutation.mutate({ leadId, updates: { status: newStatus } })
  }

  const stats = [
    { label: 'Total Leads', value: statsData?.totalLeads || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'New Today', value: statsData?.newToday || 0, icon: Clock, color: 'bg-green-500' },
    { label: 'This Week', value: statsData?.newThisWeek || 0, icon: Calendar, color: 'bg-purple-500' },
    { label: 'Converted', value: statsData?.byStatus?.converted || 0, icon: CheckCircle, color: 'bg-emerald-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Leads</h1>
          <p className="text-surface-500">Manage demo requests and potential customers</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="btn btn-secondary"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', stat.color)}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                <p className="text-xs text-surface-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-surface-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 bg-surface-200 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-surface-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))
          ) : data?.leads?.length === 0 ? (
            <div className="card p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-surface-300" />
              <h3 className="text-lg font-medium text-surface-900 mb-2">No leads yet</h3>
              <p className="text-surface-500">Leads will appear here when visitors book demos</p>
            </div>
          ) : (
            data?.leads?.map((lead) => (
              <LeadCard
                key={lead._id}
                lead={lead}
                isSelected={selectedLead?._id === lead._id}
                onClick={() => setSelectedLead(lead)}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>

        {/* Lead Details Sidebar */}
        <div className="hidden lg:block">
          {selectedLead ? (
            <LeadDetails 
              lead={selectedLead} 
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="card p-8 text-center sticky top-28">
              <Users className="w-12 h-12 mx-auto mb-4 text-surface-300" />
              <p className="text-surface-500">Select a lead to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LeadCard({ lead, isSelected, onClick, onStatusChange }) {
  return (
    <div 
      className={clsx(
        'card p-5 cursor-pointer transition-all',
        isSelected ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-surface-900">{lead.name}</h3>
          <p className="text-sm text-surface-500">{lead.businessName || 'No business name'}</p>
        </div>
        <span className={clsx(
          'px-2 py-1 text-xs font-medium rounded-full border',
          STATUS_COLORS[lead.status]
        )}>
          {lead.status.replace('_', ' ')}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-surface-600 mb-3">
        <span className="flex items-center gap-1">
          <Phone className="w-4 h-4 text-surface-400" />
          {lead.phone}
        </span>
        <span className="flex items-center gap-1">
          <Mail className="w-4 h-4 text-surface-400" />
          {lead.email}
        </span>
      </div>

      {lead.demoDate && (
        <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
          <Calendar className="w-4 h-4" />
          Demo: {format(new Date(lead.demoDate), 'MMM d, yyyy')} at {lead.demoTime}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100">
        <span className="text-xs text-surface-400">
          {format(new Date(lead.createdAt), 'MMM d, h:mm a')}
        </span>
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <a 
            href={`https://wa.me/${lead.whatsappNumber || lead.phone}`.replace(/[^0-9+]/g, '')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-secondary"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

function LeadDetails({ lead, onStatusChange }) {
  return (
    <div className="card sticky top-28 overflow-hidden">
      <div className="p-6 border-b border-surface-100 bg-surface-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{lead.name}</h3>
          <span className={clsx(
            'px-2 py-1 text-xs font-medium rounded-full border',
            STATUS_COLORS[lead.status]
          )}>
            {lead.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-surface-500">
          {format(new Date(lead.createdAt), 'MMMM d, yyyy h:mm a')}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Contact Info */}
        <div>
          <h4 className="text-sm font-medium text-surface-500 mb-3">Contact Information</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-surface-400" />
              <span>{lead.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-surface-400" />
              <span>{lead.email}</span>
            </div>
            {lead.whatsappNumber && lead.whatsappNumber !== lead.phone && (
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-surface-400" />
                <span>{lead.whatsappNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Business Info */}
        {(lead.businessName || lead.businessType || lead.city) && (
          <div>
            <h4 className="text-sm font-medium text-surface-500 mb-3">Business Details</h4>
            <div className="space-y-3">
              {lead.businessName && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-surface-400" />
                  <span>{lead.businessName}</span>
                </div>
              )}
              {lead.businessType && (
                <div className="flex items-center gap-3">
                  <span className="text-sm capitalize">{lead.businessType}</span>
                </div>
              )}
              {lead.city && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-surface-400" />
                  <span>{lead.city}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Demo Info */}
        {lead.demoDate && (
          <div>
            <h4 className="text-sm font-medium text-surface-500 mb-3">Demo Scheduled</h4>
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-700">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
                  {format(new Date(lead.demoDate), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-purple-600 mt-1">
                <Clock className="w-4 h-4" />
                <span>{lead.demoTime}</span>
              </div>
            </div>
          </div>
        )}

        {/* Update Status */}
        <div>
          <h4 className="text-sm font-medium text-surface-500 mb-3">Update Status</h4>
          <select
            value={lead.status}
            onChange={(e) => onStatusChange(lead._id, e.target.value)}
            className="input w-full"
          >
            {STATUS_OPTIONS.filter(o => o.value).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <a 
            href={`https://wa.me/${(lead.whatsappNumber || lead.phone).replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary flex-1"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <a 
            href={`mailto:${lead.email}`}
            className="btn btn-secondary flex-1"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        </div>
      </div>
    </div>
  )
}

