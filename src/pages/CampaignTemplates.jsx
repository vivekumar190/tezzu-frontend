import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { FileText, Plus, Edit, Trash2, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react'

const STATUS_ICONS = {
  approved: <CheckCircle2 size={14} className="text-green-600" />,
  pending_approval: <Clock size={14} className="text-yellow-600" />,
  rejected: <XCircle size={14} className="text-red-500" />,
  paused: <Clock size={14} className="text-surface-400" />
}

const EMPTY_TEMPLATE = {
  name: '',
  waTemplateName: '',
  category: 'marketing',
  language: 'en',
  headerType: 'none',
  headerContent: '',
  body: '',
  bodyVariables: [],
  footer: '',
  status: 'pending_approval',
  applicableTo: 'all',
  isActive: true
}

export default function CampaignTemplates() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [form, setForm] = useState(EMPTY_TEMPLATE)

  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: () => api.get('/campaigns/templates/admin').then(r => r.data.data)
  })

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingTemplate) {
        return api.put(`/campaigns/templates/${editingTemplate._id}`, data)
      }
      return api.post('/campaigns/templates', data)
    },
    onSuccess: () => {
      toast.success(editingTemplate ? 'Template updated' : 'Template created')
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] })
      setShowForm(false)
      setEditingTemplate(null)
      setForm(EMPTY_TEMPLATE)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save template')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/campaigns/templates/${id}`),
    onSuccess: () => {
      toast.success('Template deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] })
    }
  })

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      waTemplateName: template.waTemplateName,
      category: template.category,
      language: template.language || 'en',
      headerType: template.headerType || 'none',
      headerContent: template.headerContent || '',
      body: template.body,
      bodyVariables: template.bodyVariables || [],
      footer: template.footer || '',
      status: template.status,
      applicableTo: template.applicableTo || 'all',
      isActive: template.isActive
    })
    setShowForm(true)
  }

  const addVariable = () => {
    setForm({
      ...form,
      bodyVariables: [...form.bodyVariables, {
        index: form.bodyVariables.length + 1,
        name: '',
        description: '',
        example: ''
      }]
    })
  }

  const updateVariable = (idx, field, value) => {
    const vars = [...form.bodyVariables]
    vars[idx] = { ...vars[idx], [field]: value }
    setForm({ ...form, bodyVariables: vars })
  }

  const removeVariable = (idx) => {
    setForm({ ...form, bodyVariables: form.bodyVariables.filter((_, i) => i !== idx) })
  }

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
          <h1 className="text-2xl font-bold text-surface-900">Campaign Templates</h1>
          <p className="text-sm text-surface-500 mt-1">
            Manage WhatsApp message templates for marketing campaigns
          </p>
        </div>
        <button
          onClick={() => { setEditingTemplate(null); setForm(EMPTY_TEMPLATE); setShowForm(true); }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Template List */}
      <div className="grid gap-4">
        {templates?.length === 0 && (
          <div className="card p-12 text-center">
            <FileText size={48} className="mx-auto text-surface-300 mb-4" />
            <p className="text-surface-500 text-lg">No templates yet</p>
            <p className="text-surface-400 text-sm mt-1">Create message templates for merchants to use in campaigns</p>
          </div>
        )}

        {templates?.map(template => (
          <div key={template._id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-surface-900">{template.name}</h3>
                  <span className="flex items-center gap-1 text-xs">
                    {STATUS_ICONS[template.status]}
                    <span className="capitalize">{template.status.replace(/_/g, ' ')}</span>
                  </span>
                  <span className="px-2 py-0.5 bg-surface-100 rounded text-xs capitalize">{template.category}</span>
                </div>
                <p className="text-xs text-surface-400 mb-2">Meta Template: {template.waTemplateName}</p>
                <div className="bg-surface-50 rounded-lg p-3">
                  <p className="text-sm text-surface-700 whitespace-pre-wrap">{template.body}</p>
                </div>
                {template.bodyVariables?.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {template.bodyVariables.map(v => (
                      <span key={v.index} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {`{{${v.index}}}`} = {v.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 ml-4">
                <button onClick={() => handleEdit(template)} className="p-2 hover:bg-surface-100 rounded-lg">
                  <Edit size={16} className="text-surface-500" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this template?')) deleteMutation.mutate(template._id)
                  }}
                  className="p-2 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-surface-900 mb-4">
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Internal name"
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Meta Template Name</label>
                  <input
                    type="text"
                    value={form.waTemplateName}
                    onChange={e => setForm({ ...form, waTemplateName: e.target.value })}
                    placeholder="As registered on Meta"
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"
                  >
                    <option value="marketing">Marketing</option>
                    <option value="utility">Utility</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"
                  >
                    <option value="pending_approval">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Applicable To</label>
                  <select
                    value={form.applicableTo}
                    onChange={e => setForm({ ...form, applicableTo: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"
                  >
                    <option value="all">All</option>
                    <option value="restaurants">Restaurants</option>
                    <option value="grocery">Grocery</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="bakery">Bakery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Message Body</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  placeholder="Use {{1}}, {{2}} for variables"
                  rows={4}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm resize-none"
                />
              </div>

              {/* Variables */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-surface-700">Body Variables</label>
                  <button onClick={addVariable} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                    <Plus size={14} /> Add Variable
                  </button>
                </div>
                {form.bodyVariables.map((v, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <span className="px-2 py-1.5 bg-surface-100 rounded text-sm text-surface-500 flex-shrink-0">
                      {`{{${v.index}}}`}
                    </span>
                    <input
                      type="text"
                      value={v.name}
                      onChange={e => updateVariable(idx, 'name', e.target.value)}
                      placeholder="Variable name"
                      className="flex-1 px-3 py-1.5 border border-surface-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={v.example}
                      onChange={e => updateVariable(idx, 'example', e.target.value)}
                      placeholder="Example"
                      className="flex-1 px-3 py-1.5 border border-surface-300 rounded-lg text-sm"
                    />
                    <button onClick={() => removeVariable(idx)} className="p-1.5 hover:bg-red-50 rounded">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Footer (optional)</label>
                <input
                  type="text"
                  value={form.footer}
                  onChange={e => setForm({ ...form, footer: e.target.value })}
                  placeholder="Optional footer text"
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-surface-300 rounded-xl font-semibold text-surface-600 hover:bg-surface-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveMutation.mutate(form)}
                  disabled={!form.name || !form.waTemplateName || !form.body || saveMutation.isPending}
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:bg-surface-300"
                >
                  {saveMutation.isPending ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
