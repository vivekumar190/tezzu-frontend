import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Receipt, 
  IndianRupee, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Store, 
  Loader2, 
  RefreshCw,
  Download,
  Send,
  Link2,
  Ban,
  Gift,
  FileText,
  Settings,
  Calendar,
  Users,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Eye,
  ChevronDown,
  ExternalLink,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function BillingAdmin() {
  const [activeTab, setActiveTab] = useState('overview')
  const queryClient = useQueryClient()

  // Fetch billing summary
  const { data: summary, isLoading: summaryLoading, refetch } = useQuery({
    queryKey: ['billing-summary'],
    queryFn: async () => {
      const res = await api.get('/admin/billing/summary')
      return res.data.data
    }
  })

  // Fetch billing settings
  const { data: settings } = useQuery({
    queryKey: ['billing-settings'],
    queryFn: async () => {
      const res = await api.get('/admin/billing/settings')
      return res.data.data
    }
  })

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          <p className="text-surface-500">Loading billing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            Merchant Billing
          </h1>
          <p className="text-surface-500 mt-1">Manage invoices for offline payment merchants</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn btn-ghost">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Pending</p>
              <p className="text-2xl font-bold text-surface-900">₹{summary?.pending?.amount?.toLocaleString() || 0}</p>
              <p className="text-xs text-surface-400">{summary?.pending?.count || 0} invoices</p>
            </div>
          </div>
        </div>
        <div className="card p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">₹{summary?.overdue?.amount?.toLocaleString() || 0}</p>
              <p className="text-xs text-surface-400">{summary?.overdue?.count || 0} invoices</p>
            </div>
          </div>
        </div>
        <div className="card p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Collected (Month)</p>
              <p className="text-2xl font-bold text-green-600">₹{summary?.paidThisMonth?.amount?.toLocaleString() || 0}</p>
              <p className="text-xs text-surface-400">{summary?.paidThisMonth?.count || 0} invoices</p>
            </div>
          </div>
        </div>
        <div className="card p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Offline Merchants</p>
              <p className="text-2xl font-bold text-surface-900">{summary?.offlineMerchants || 0}</p>
              <p className="text-xs text-surface-400">₹{summary?.platformFee || 5}/order</p>
            </div>
          </div>
        </div>
        <div className="card p-5 hover:shadow-lg transition-shadow border-2 border-dashed border-purple-200 bg-purple-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Unbilled Orders</p>
              <p className="text-2xl font-bold text-purple-600">{summary?.billableOrders?.total || 0}</p>
              <p className="text-xs text-surface-400">≈ ₹{summary?.billableOrders?.estimatedRevenue?.toLocaleString() || 0} revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unbilled Orders Alert */}
      {summary?.billableOrders?.total > 0 && summary?.pending?.count === 0 && (
        <div className="card p-4 border-l-4 border-l-purple-500 bg-purple-50">
          <div className="flex items-center gap-4">
            <FileText className="w-6 h-6 text-purple-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-purple-900">
                You have {summary.billableOrders.total} unbilled orders from offline merchants
              </p>
              <p className="text-sm text-purple-700">
                Go to "Generate Invoices" tab to create invoices and collect ₹{summary.billableOrders.estimatedRevenue} in platform fees.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('generate')} 
              className="btn btn-primary btn-sm whitespace-nowrap"
            >
              Generate Invoices
            </button>
          </div>
        </div>
      )}

      {/* Platform Fee Info */}
      <div className="card p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center">
              <IndianRupee className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">Offline Merchant Billing</h3>
              <p className="text-sm text-surface-600">Platform fee collected monthly via invoice</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">₹{settings?.platformFeePerOrder / 100 || 5}</p>
              <p className="text-xs text-surface-500">Per Order</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{settings?.gracePeriodDays || 7}</p>
              <p className="text-xs text-surface-500">Grace Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-1 overflow-x-auto pb-px">
          {[
            { id: 'overview', label: 'All Invoices', icon: FileText },
            { id: 'pending', label: 'Pending', icon: Clock },
            { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
            { id: 'generate', label: 'Generate Invoices', icon: Receipt },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'overdue' && summary?.overdue?.count > 0 && (
                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                  {summary.overdue.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && <InvoicesTab status="" queryClient={queryClient} />}
        {activeTab === 'pending' && <InvoicesTab status="pending" queryClient={queryClient} />}
        {activeTab === 'overdue' && <InvoicesTab status="overdue" queryClient={queryClient} />}
        {activeTab === 'generate' && <GenerateInvoicesTab queryClient={queryClient} />}
        {activeTab === 'settings' && <BillingSettingsTab />}
      </div>
    </div>
  )
}

// Invoices Tab Component
function InvoicesTab({ status, queryClient }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['billing-invoices', status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : ''
      const res = await api.get(`/admin/billing/invoices${params}`)
      return res.data.data
    }
  })

  const createPaymentLinkMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const res = await api.post(`/admin/billing/invoices/${invoiceId}/payment-link`)
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Payment link created!')
      queryClient.invalidateQueries(['billing-invoices'])
      if (data.data?.paymentLink?.shortUrl) {
        window.open(data.data.paymentLink.shortUrl, '_blank')
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create payment link')
  })

  const markPaidMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentMethod, notes }) => {
      const res = await api.post(`/admin/billing/invoices/${invoiceId}/mark-paid`, { paymentMethod, notes })
      return res.data
    },
    onSuccess: () => {
      toast.success('Invoice marked as paid!')
      queryClient.invalidateQueries(['billing-invoices'])
      queryClient.invalidateQueries(['billing-summary'])
      setSelectedInvoice(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to mark as paid')
  })

  const sendReminderMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const res = await api.post(`/admin/billing/invoices/${invoiceId}/send-reminder`)
      return res.data
    },
    onSuccess: () => {
      toast.success('Reminder sent!')
      queryClient.invalidateQueries(['billing-invoices'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send reminder')
  })

  const waiveMutation = useMutation({
    mutationFn: async ({ invoiceId, reason }) => {
      const res = await api.post(`/admin/billing/invoices/${invoiceId}/waive`, { reason })
      return res.data
    },
    onSuccess: () => {
      toast.success('Invoice waived!')
      queryClient.invalidateQueries(['billing-invoices'])
      queryClient.invalidateQueries(['billing-summary'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to waive invoice')
  })

  const filteredInvoices = data?.invoices?.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.merchant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getStatusBadge = (invoiceStatus) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-surface-100 text-surface-500',
      waived: 'bg-purple-100 text-purple-700',
      draft: 'bg-blue-100 text-blue-700'
    }
    return styles[invoiceStatus] || 'bg-surface-100 text-surface-500'
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Export */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 w-full sm:w-64"
          />
        </div>
        <a
          href={`/api/admin/billing/export${status ? `?status=${status}` : ''}`}
          className="btn btn-secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </a>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase">Merchant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase">Period</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-surface-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase">Due Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-surface-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-surface-500">
                    No invoices found
                  </td>
                </tr>
              ) : filteredInvoices.map(invoice => (
                <tr key={invoice._id} className="hover:bg-surface-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">{invoice.invoiceNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-surface-900">{invoice.merchant?.name}</p>
                      <p className="text-xs text-surface-500">{invoice.merchant?.whatsappNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {monthNames[invoice.billingPeriod?.month - 1]} {invoice.billingPeriod?.year}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{invoice.orderCount}</td>
                  <td className="px-4 py-3 text-right font-bold text-surface-900">
                    ₹{invoice.totalAmountRupees?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium capitalize', getStatusBadge(invoice.status))}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                        <>
                          {invoice.razorpayPaymentLink?.shortUrl ? (
                            <a
                              href={invoice.razorpayPaymentLink.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-surface-100 rounded-lg"
                              title="Open Payment Link"
                            >
                              <ExternalLink className="w-4 h-4 text-blue-600" />
                            </a>
                          ) : (
                            <button
                              onClick={() => createPaymentLinkMutation.mutate(invoice._id)}
                              disabled={createPaymentLinkMutation.isPending}
                              className="p-1.5 hover:bg-surface-100 rounded-lg"
                              title="Create Payment Link"
                            >
                              <Link2 className="w-4 h-4 text-primary-600" />
                            </button>
                          )}
                          <button
                            onClick={() => sendReminderMutation.mutate(invoice._id)}
                            disabled={sendReminderMutation.isPending}
                            className="p-1.5 hover:bg-surface-100 rounded-lg"
                            title="Send Reminder"
                          >
                            <Send className="w-4 h-4 text-amber-600" />
                          </button>
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-1.5 hover:bg-surface-100 rounded-lg"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for waiving this invoice:')
                              if (reason) waiveMutation.mutate({ invoiceId: invoice._id, reason })
                            }}
                            className="p-1.5 hover:bg-surface-100 rounded-lg"
                            title="Waive Invoice"
                          >
                            <Gift className="w-4 h-4 text-purple-600" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-surface-400">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Paid Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Mark Invoice as Paid</h3>
            <p className="text-sm text-surface-600 mb-4">
              Invoice: <span className="font-mono">{selectedInvoice.invoiceNumber}</span><br />
              Amount: <span className="font-bold">₹{selectedInvoice.totalAmountRupees}</span>
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                markPaidMutation.mutate({
                  invoiceId: selectedInvoice._id,
                  paymentMethod: formData.get('paymentMethod'),
                  notes: formData.get('notes')
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Payment Method</label>
                <select name="paymentMethod" required className="input w-full">
                  <option value="">Select method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Notes (optional)</label>
                <input type="text" name="notes" className="input w-full" placeholder="Transaction ID, remarks, etc." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelectedInvoice(null)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={markPaidMutation.isPending} className="btn btn-primary flex-1">
                  {markPaidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Generate Invoices Tab
function GenerateInvoicesTab({ queryClient }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const { data: pendingMerchants, isLoading } = useQuery({
    queryKey: ['billing-merchants-pending'],
    queryFn: async () => {
      const res = await api.get('/admin/billing/merchants-pending')
      return res.data.data
    }
  })

  const generateAllMutation = useMutation({
    mutationFn: async ({ year, month }) => {
      const res = await api.post('/admin/billing/generate-monthly', { year, month })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries(['billing-invoices'])
      queryClient.invalidateQueries(['billing-summary'])
      queryClient.invalidateQueries(['billing-merchants-pending'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate invoices')
  })

  const generateSingleMutation = useMutation({
    mutationFn: async ({ merchantId, year, month }) => {
      const res = await api.post(`/admin/billing/generate/${merchantId}`, { year, month })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries(['billing-invoices'])
      queryClient.invalidateQueries(['billing-merchants-pending'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate invoice')
  })

  const [year, month] = selectedMonth.split('-').map(Number)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="card p-6">
        <h3 className="font-semibold text-surface-900 mb-4">Generate Monthly Invoices</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Billing Period</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input"
            />
          </div>
          <button
            onClick={() => generateAllMutation.mutate({ year, month })}
            disabled={generateAllMutation.isPending}
            className="btn btn-primary"
          >
            {generateAllMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Receipt className="w-4 h-4 mr-2" />
            )}
            Generate All Invoices for {monthNames[month - 1]} {year}
          </button>
        </div>
        <p className="text-sm text-surface-500 mt-3">
          This will generate invoices for all offline merchants who have orders in the selected period.
        </p>
      </div>

      {/* Merchants Pending Billing */}
      <div className="card p-6">
        <h3 className="font-semibold text-surface-900 mb-4">
          Merchants with Unbilled Orders
          {pendingMerchants?.total > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
              {pendingMerchants.total}
            </span>
          )}
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : pendingMerchants?.merchants?.length === 0 ? (
          <p className="text-surface-500 text-center py-8">All merchants are up to date!</p>
        ) : (
          <div className="space-y-3">
            {pendingMerchants?.merchants?.map(merchant => (
              <div key={merchant._id} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center">
                    <Store className="w-5 h-5 text-surface-600" />
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">{merchant.name}</p>
                    <p className="text-xs text-surface-500">{merchant.whatsappNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-surface-900">{merchant.pendingOrders}</p>
                    <p className="text-xs text-surface-500">orders</p>
                  </div>
                  <button
                    onClick={() => generateSingleMutation.mutate({ merchantId: merchant._id, year, month })}
                    disabled={generateSingleMutation.isPending}
                    className="btn btn-secondary btn-sm"
                  >
                    Generate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Billing Settings Tab
function BillingSettingsTab() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['billing-settings'],
    queryFn: async () => {
      const res = await api.get('/admin/billing/settings')
      return res.data.data
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      const res = await api.put('/admin/billing/settings', updates)
      return res.data
    },
    onSuccess: () => {
      toast.success('Settings updated!')
      queryClient.invalidateQueries(['billing-settings'])
      queryClient.invalidateQueries(['billing-summary'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update settings')
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.target)
          updateMutation.mutate({
            platformFeePerOrder: Number(formData.get('platformFee')) * 100, // Convert to paise
            gracePeriodDays: Number(formData.get('gracePeriod')),
            paymentLinkExpiryDays: Number(formData.get('paymentLinkExpiry')),
            autoGenerateEnabled: formData.get('autoGenerate') === 'on',
            taxEnabled: formData.get('taxEnabled') === 'on',
            taxPercentage: Number(formData.get('taxPercentage')) || 0
          })
        }}
        className="space-y-6"
      >
        {/* Fee Settings */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5" />
            Fee Settings
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Platform Fee per Order (₹)</label>
              <input
                type="number"
                name="platformFee"
                defaultValue={settings?.platformFeePerOrder / 100 || 5}
                min="1"
                step="0.5"
                className="input w-full"
              />
              <p className="text-xs text-surface-500 mt-1">Amount charged per order</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Grace Period (Days)</label>
              <input
                type="number"
                name="gracePeriod"
                defaultValue={settings?.gracePeriodDays || 7}
                min="1"
                max="60"
                className="input w-full"
              />
              <p className="text-xs text-surface-500 mt-1">Days after invoice generation before it's due</p>
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Tax Settings
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="taxEnabled"
                defaultChecked={settings?.taxEnabled}
                className="w-5 h-5 rounded border-surface-300"
              />
              <span className="font-medium">Enable GST on invoices</span>
            </label>
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-surface-700 mb-1">Tax Percentage (%)</label>
              <input
                type="number"
                name="taxPercentage"
                defaultValue={settings?.taxPercentage || 18}
                min="0"
                max="100"
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Auto-generation Settings */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Invoice Generation
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="autoGenerate"
                defaultChecked={settings?.autoGenerateEnabled}
                className="w-5 h-5 rounded border-surface-300"
              />
              <span className="font-medium">Auto-generate invoices on 1st of each month</span>
            </label>
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-surface-700 mb-1">Payment Link Expiry (Days)</label>
              <input
                type="number"
                name="paymentLinkExpiry"
                defaultValue={settings?.paymentLinkExpiryDays || 30}
                min="7"
                max="90"
                className="input w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={updateMutation.isPending} className="btn btn-primary">
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  )
}

