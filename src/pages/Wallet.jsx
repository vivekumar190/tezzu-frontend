import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownRight, RefreshCw, Settings, TrendingUp } from 'lucide-react'

export default function Wallet() {
  const queryClient = useQueryClient()
  const [topUpAmount, setTopUpAmount] = useState('')
  const [showTopUp, setShowTopUp] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)

  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet').then(r => r.data.data)
  })

  const { data: transactionsData } = useQuery({
    queryKey: ['wallet-transactions', page, filterType],
    queryFn: () => api.get('/wallet/transactions', {
      params: { page, limit: 20, ...(filterType && { type: filterType }) }
    }).then(r => r.data.data)
  })

  const { data: summaryData } = useQuery({
    queryKey: ['wallet-summary'],
    queryFn: () => api.get('/wallet/summary').then(r => r.data.data)
  })

  const topUpMutation = useMutation({
    mutationFn: (amount) => api.post('/wallet/topup', { amount }).then(r => r.data.data),
    onSuccess: (data) => {
      openRazorpayCheckout(data)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create top-up order')
  })

  const verifyMutation = useMutation({
    mutationFn: (paymentData) => api.post('/wallet/topup/verify', paymentData).then(r => r.data.data),
    onSuccess: (data) => {
      toast.success(`Wallet credited with ₹${(data.transaction.amount / 100).toFixed(2)}`)
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] })
      setShowTopUp(false)
    },
    onError: () => toast.error('Payment verification failed')
  })

  const openRazorpayCheckout = (orderData) => {
    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh the page.')
      return
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Tezzu',
      description: 'Wallet Top-Up',
      order_id: orderData.orderId,
      handler: (response) => {
        verifyMutation.mutate(response)
      },
      theme: { color: '#16a34a' }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount)
    if (!amount || amount < 1) {
      toast.error('Please enter a valid amount')
      return
    }
    topUpMutation.mutate(amount)
  }

  const getCategoryLabel = (cat) => {
    const labels = {
      top_up: 'Top Up',
      auto_top_up: 'Auto Top Up',
      message_utility: 'Utility Message',
      message_marketing: 'Marketing Message',
      message_authentication: 'Auth Message',
      message_service: 'Service Message',
      campaign: 'Campaign',
      refund: 'Refund',
      admin_adjustment: 'Admin Adjustment'
    }
    return labels[cat] || cat
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
        <h1 className="text-2xl font-bold text-surface-900">Wallet</h1>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm">Available Balance</p>
            <p className="text-4xl font-bold mt-1">₹{walletData?.balanceRupees?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <WalletIcon size={28} />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setShowTopUp(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-green-700 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors"
          >
            <Plus size={16} /> Top Up
          </button>
        </div>
      </div>

      {/* Top-up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTopUp(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-surface-900 mb-4">Top Up Wallet</h3>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(walletData?.topUpAmountOptions || [50000, 100000, 200000, 500000]).map(amt => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(String(amt / 100))}
                  className={`py-2.5 rounded-xl border-2 font-semibold text-sm transition-colors ${
                    topUpAmount === String(amt / 100)
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-surface-200 text-surface-600 hover:border-surface-300'
                  }`}
                >
                  ₹{amt / 100}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-surface-700 mb-1">Custom Amount (₹)</label>
              <input
                type="number"
                value={topUpAmount}
                onChange={e => setTopUpAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <button
              onClick={handleTopUp}
              disabled={topUpMutation.isPending || !topUpAmount}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:bg-surface-300 transition-colors"
            >
              {topUpMutation.isPending ? 'Processing...' : `Pay ₹${topUpAmount || 0}`}
            </button>
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      {summaryData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <ArrowUpRight size={18} />
              <span className="text-sm font-medium">Credits</span>
            </div>
            <p className="text-2xl font-bold text-surface-900">₹{(summaryData.totalCredits / 100).toFixed(2)}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <ArrowDownRight size={18} />
              <span className="text-sm font-medium">Debits</span>
            </div>
            <p className="text-2xl font-bold text-surface-900">₹{(summaryData.totalDebits / 100).toFixed(2)}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <TrendingUp size={18} />
              <span className="text-sm font-medium">Message Costs</span>
            </div>
            <p className="text-2xl font-bold text-surface-900">
              ₹{(
                Object.entries(summaryData.breakdown || {})
                  .filter(([k]) => k.startsWith('message_'))
                  .reduce((sum, [, v]) => sum + (v.total || 0), 0) / 100
              ).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Message Cost Reference */}
      {walletData?.messageCosts && (
        <div className="card p-4">
          <h3 className="font-semibold text-surface-900 mb-3">Message Costs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(walletData.messageCosts).map(([type, cost]) => (
              <div key={type} className="bg-surface-50 rounded-lg p-3 text-center">
                <p className="text-xs text-surface-500 capitalize">{type}</p>
                <p className="text-lg font-bold text-surface-900">₹{(cost / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="card">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-surface-900">Transaction History</h3>
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="text-sm border border-surface-300 rounded-lg px-3 py-1.5"
          >
            <option value="">All</option>
            <option value="credit">Credits</option>
            <option value="debit">Debits</option>
          </select>
        </div>

        <div className="divide-y">
          {transactionsData?.transactions?.length === 0 && (
            <p className="p-8 text-center text-surface-400">No transactions yet</p>
          )}
          {transactionsData?.transactions?.map(tx => (
            <div key={tx._id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                }`}>
                  {tx.type === 'credit' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">{getCategoryLabel(tx.category)}</p>
                  <p className="text-xs text-surface-500">{tx.description}</p>
                  <p className="text-xs text-surface-400">
                    {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'credit' ? '+' : '-'}₹{(tx.amount / 100).toFixed(2)}
                </p>
                <p className="text-xs text-surface-400">Bal: ₹{(tx.balanceAfter / 100).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {transactionsData?.pagination?.pages > 1 && (
          <div className="p-4 border-t flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-surface-500">
              Page {page} of {transactionsData.pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(transactionsData.pagination.pages, p + 1))}
              disabled={page === transactionsData.pagination.pages}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
