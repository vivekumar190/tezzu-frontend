import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Megaphone, Plus, Play, Pause, XCircle, Users, Send, Eye, BarChart3, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

const STATUS_COLORS = {
  draft: 'bg-surface-100 text-surface-700',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  paused: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-surface-100 text-surface-500'
}

export default function Campaigns() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [page, setPage] = useState(1)

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns', page],
    queryFn: () => api.get('/campaigns', { params: { page, limit: 20 } }).then(r => r.data.data)
  })

  const { data: templates } = useQuery({
    queryKey: ['campaign-templates'],
    queryFn: () => api.get('/campaigns/templates').then(r => r.data.data)
  })

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet').then(r => r.data.data)
  })

  // Create campaign
  const [newCampaign, setNewCampaign] = useState({
    name: '', template: '', audienceType: 'all_customers', templateVariables: {}
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/campaigns', data).then(r => r.data.data),
    onSuccess: (data) => {
      toast.success('Campaign created')
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setShowCreate(false)
      setNewCampaign({ name: '', template: '', audienceType: 'all_customers', templateVariables: {} })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create campaign')
  })

  const estimateMutation = useMutation({
    mutationFn: (id) => api.post(`/campaigns/${id}/estimate`).then(r => r.data.data),
    onSuccess: (data) => {
      toast.success(`Audience: ${data.audienceCount} | Cost: ₹${data.estimatedCostRupees?.toFixed(2)}`)
    }
  })

  const sendMutation = useMutation({
    mutationFn: (id) => api.post(`/campaigns/${id}/send`).then(r => r.data.data),
    onSuccess: (data) => {
      toast.success(`Campaign sending to ${data.totalRecipients} recipients`)
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to send campaign')
  })

  const pauseMutation = useMutation({
    mutationFn: (id) => api.post(`/campaigns/${id}/pause`),
    onSuccess: () => {
      toast.success('Campaign paused')
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    }
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => api.post(`/campaigns/${id}/cancel`),
    onSuccess: () => {
      toast.success('Campaign cancelled')
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    }
  })

  const selectedTemplate = templates?.find(t => t._id === newCampaign.template)

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Marketing Campaigns</h1>
          <p className="text-sm text-surface-500 mt-1">
            Send promotional messages to your customers via WhatsApp
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* Wallet balance banner */}
      {walletData && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-sm">Wallet Balance:</span>
            <span className="font-bold text-lg">₹{walletData.balanceRupees?.toFixed(2)}</span>
          </div>
          <a href="/wallet" className="text-green-600 text-sm font-semibold hover:underline">
            Top Up →
          </a>
        </div>
      )}

      {/* Campaign List */}
      <div className="space-y-4">
        {campaignsData?.campaigns?.length === 0 && (
          <div className="card p-12 text-center">
            <Megaphone size={48} className="mx-auto text-surface-300 mb-4" />
            <p className="text-surface-500 text-lg">No campaigns yet</p>
            <p className="text-surface-400 text-sm mt-1">Create your first marketing campaign to reach your customers</p>
          </div>
        )}

        {campaignsData?.campaigns?.map(campaign => (
          <div key={campaign._id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-surface-900">{campaign.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[campaign.status]}`}>
                    {campaign.status}
                  </span>
                </div>
                <p className="text-sm text-surface-500">
                  Template: {campaign.template?.name || 'N/A'} · Audience: {campaign.audienceType?.replace(/_/g, ' ')}
                </p>
                {campaign.stats && campaign.stats.totalRecipients > 0 && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                    <span className="flex items-center gap-1"><Users size={12} /> {campaign.stats.totalRecipients}</span>
                    <span className="flex items-center gap-1"><Send size={12} /> {campaign.stats.sent} sent</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {campaign.stats.delivered} delivered</span>
                    <span className="flex items-center gap-1"><Eye size={12} /> {campaign.stats.read} read</span>
                    {campaign.stats.failed > 0 && (
                      <span className="flex items-center gap-1 text-red-500"><AlertCircle size={12} /> {campaign.stats.failed} failed</span>
                    )}
                  </div>
                )}
                {campaign.totalCost > 0 && (
                  <p className="text-xs text-surface-400 mt-1">Cost: ₹{(campaign.totalCost / 100).toFixed(2)}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {campaign.status === 'draft' && (
                  <>
                    <button
                      onClick={() => estimateMutation.mutate(campaign._id)}
                      disabled={estimateMutation.isPending}
                      className="btn btn-sm btn-secondary flex items-center gap-1"
                    >
                      <BarChart3 size={14} /> Estimate
                    </button>
                    <button
                      onClick={() => sendMutation.mutate(campaign._id)}
                      disabled={sendMutation.isPending}
                      className="btn btn-sm btn-primary flex items-center gap-1"
                    >
                      <Play size={14} /> Send
                    </button>
                  </>
                )}
                {campaign.status === 'sending' && (
                  <button
                    onClick={() => pauseMutation.mutate(campaign._id)}
                    className="btn btn-sm btn-secondary flex items-center gap-1"
                  >
                    <Pause size={14} /> Pause
                  </button>
                )}
                {['draft', 'scheduled', 'paused'].includes(campaign.status) && (
                  <button
                    onClick={() => cancelMutation.mutate(campaign._id)}
                    className="btn btn-sm text-red-500 hover:bg-red-50 flex items-center gap-1"
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-surface-900 mb-4">Create Campaign</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g., Diwali 20% Off"
                  className="w-full px-4 py-2.5 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Message Template</label>
                <select
                  value={newCampaign.template}
                  onChange={e => setNewCampaign({ ...newCampaign, template: e.target.value })}
                  className="w-full px-4 py-2.5 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">Select a template</option>
                  {templates?.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.category})</option>
                  ))}
                </select>

                {/* Template preview */}
                {selectedTemplate && (
                  <div className="mt-2 bg-surface-50 rounded-lg p-3">
                    <p className="text-xs text-surface-500 mb-1">Preview:</p>
                    <p className="text-sm text-surface-700">{selectedTemplate.body}</p>
                  </div>
                )}
              </div>

              {/* Template variables */}
              {selectedTemplate?.bodyVariables?.map(v => (
                <div key={v.index}>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    {v.name} <span className="text-surface-400">({v.description || `Variable {{${v.index}}}`})</span>
                  </label>
                  <input
                    type="text"
                    value={newCampaign.templateVariables[v.index] || ''}
                    onChange={e => setNewCampaign({
                      ...newCampaign,
                      templateVariables: { ...newCampaign.templateVariables, [v.index]: e.target.value }
                    })}
                    placeholder={v.example || ''}
                    className="w-full px-4 py-2.5 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Target Audience</label>
                <select
                  value={newCampaign.audienceType}
                  onChange={e => setNewCampaign({ ...newCampaign, audienceType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="all_customers">All Customers</option>
                  <option value="new_customers">New Customers (1 order)</option>
                  <option value="returning_customers">Returning Customers (2+ orders)</option>
                  <option value="inactive_customers">Inactive Customers (30+ days)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-surface-300 rounded-xl font-semibold text-surface-600 hover:bg-surface-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate(newCampaign)}
                  disabled={!newCampaign.name || !newCampaign.template || createMutation.isPending}
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:bg-surface-300"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Draft'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
