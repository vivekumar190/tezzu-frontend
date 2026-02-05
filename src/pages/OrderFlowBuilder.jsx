import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Plus,
  Trash2,
  ChefHat,
  Bike,
  Users,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  Truck,
  GripVertical,
  Save,
  RotateCcw,
  AlertCircle,
  Send,
  MessageCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import clsx from 'clsx'

// Order status definitions
const ORDER_STATUSES = [
  { id: 'pending', label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-700' },
  { id: 'payment_pending', label: 'Payment Pending', icon: DollarSign, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'accepted', label: 'Accepted', icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
  { id: 'preparing', label: 'Preparing', icon: ChefHat, color: 'bg-purple-100 text-purple-700' },
  { id: 'ready', label: 'Ready', icon: Package, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-cyan-100 text-cyan-700' },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  { id: 'undelivered', label: 'Undelivered', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
]

// Staff role definitions
const STAFF_ROLES = {
  cook: { label: 'Cook', icon: ChefHat, color: 'bg-orange-500' },
  delivery_boy: { label: 'Delivery Boy', icon: Bike, color: 'bg-blue-500' },
  cashier: { label: 'Cashier', icon: DollarSign, color: 'bg-green-500' },
  manager: { label: 'Manager', icon: Users, color: 'bg-purple-500' },
  helper: { label: 'Helper', icon: Users, color: 'bg-gray-500' },
}

// Default flow configuration
const DEFAULT_FLOW = [
  { 
    status: 'pending', 
    assignTo: null, 
    notifyStaff: true,
    notifyCustomer: true,
    autoTransition: false,
    visibleToRoles: ['manager', 'cashier'], // Which staff roles can see this status
    requiresPayment: false
  },
  { 
    status: 'payment_pending', 
    assignTo: 'cashier', 
    notifyStaff: true,
    notifyCustomer: true,
    autoTransition: false,
    visibleToRoles: ['manager', 'cashier'],
    requiresPayment: true, // Payment screenshot required
    sendPaymentQR: true    // Send QR code to customer
  },
  { 
    status: 'accepted', 
    assignTo: 'cook', 
    notifyStaff: true,
    notifyCustomer: true,
    autoTransition: false,
    visibleToRoles: ['manager', 'cook'],
    requiresPayment: false
  },
  { 
    status: 'preparing', 
    assignTo: 'cook', 
    notifyStaff: false,
    notifyCustomer: false,
    autoTransition: false,
    visibleToRoles: ['manager', 'cook'],
    requiresPayment: false
  },
  { 
    status: 'ready', 
    assignTo: 'delivery_boy', 
    notifyStaff: true,
    notifyCustomer: true,
    autoTransition: false,
    visibleToRoles: ['manager', 'delivery_boy'],
    requiresPayment: false
  },
  { 
    status: 'out_for_delivery', 
    assignTo: 'delivery_boy', 
    notifyStaff: false,
    notifyCustomer: true,
    autoTransition: false,
    visibleToRoles: ['manager', 'delivery_boy'],
    requiresPayment: false,
    nextStatuses: ['delivered', 'undelivered'] // Branching options
  },
  { 
    status: 'delivered', 
    assignTo: null, 
    notifyStaff: false,
    notifyCustomer: true,
    autoTransition: false,
    visibleToRoles: ['manager'],
    requiresPayment: false,
    isFinalStatus: true // End of flow
  },
  { 
    status: 'undelivered', 
    assignTo: 'manager', 
    notifyStaff: true,
    notifyCustomer: true,
    autoTransition: false,
    visibleToRoles: ['manager', 'delivery_boy'],
    requiresPayment: false,
    nextStatuses: ['out_for_delivery'] // Can retry delivery
  },
]

export default function OrderFlowBuilder() {
  const [flow, setFlow] = useState(null) // Start with null to detect loading
  const [hasChanges, setHasChanges] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const queryClient = useQueryClient()

  // Fetch current flow configuration
  const { data: savedFlow, isLoading, isError, isFetched } = useQuery({
    queryKey: ['order-flow'],
    queryFn: async () => {
      const res = await api.get('/merchants/me/order-flow')
      return res.data.data?.flow || null
    },
    retry: false,
    staleTime: 0, // Always fetch fresh data
  })

  // Set flow when data is loaded (only on initial load)
  useEffect(() => {
    if (isFetched && !initialLoadDone) {
      if (savedFlow && savedFlow.length > 0) {
        // Merge saved flow with defaults
        const mergedFlow = DEFAULT_FLOW.map(defaultStep => {
          const savedStep = savedFlow.find(s => s.status === defaultStep.status)
          if (savedStep) {
            // Check if field exists in saved data (undefined means not saved, use default)
            const hasNextStatuses = savedStep.nextStatuses !== undefined
            const hasVisibleToRoles = savedStep.visibleToRoles !== undefined
            
            const merged = {
              ...defaultStep,
              ...savedStep,
              // Use saved value if it exists (even empty array), otherwise use default
              nextStatuses: hasNextStatuses 
                ? savedStep.nextStatuses 
                : (defaultStep.nextStatuses || []),
              visibleToRoles: hasVisibleToRoles 
                ? savedStep.visibleToRoles 
                : (defaultStep.visibleToRoles || []),
            }
            
            console.log(`[Flow] ${defaultStep.status}: saved nextStatuses=${JSON.stringify(savedStep.nextStatuses)}, default=${JSON.stringify(defaultStep.nextStatuses)}, result=${JSON.stringify(merged.nextStatuses)}`)
            
            return merged
          }
          return defaultStep
        })
        setFlow(mergedFlow)
      } else {
      setFlow(DEFAULT_FLOW)
      }
      setInitialLoadDone(true)
    }
  }, [isFetched, savedFlow, initialLoadDone])

  // Fetch staff for assignment options
  const { data: staffData } = useQuery({
    queryKey: ['staff-for-flow'],
    queryFn: async () => {
      const res = await api.get('/staff')
      return res.data.data
    }
  })

  // Save flow mutation
  const saveFlowMutation = useMutation({
    mutationFn: (flowData) => api.put('/merchants/me/order-flow', { flow: flowData }),
    onSuccess: () => {
      toast.success('Order flow saved!')
      setHasChanges(false)
      queryClient.invalidateQueries(['order-flow'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to save flow')
    }
  })

  const handleSave = () => {
    saveFlowMutation.mutate(flow)
  }

  const handleReset = () => {
    if (savedFlow && savedFlow.length > 0) {
      // Reset to saved values (same logic as initial load)
      const mergedFlow = DEFAULT_FLOW.map(defaultStep => {
        const savedStep = savedFlow.find(s => s.status === defaultStep.status)
        if (savedStep) {
          const hasNextStatuses = savedStep.nextStatuses !== undefined
          const hasVisibleToRoles = savedStep.visibleToRoles !== undefined
          
          return {
            ...defaultStep,
            ...savedStep,
            nextStatuses: hasNextStatuses 
              ? savedStep.nextStatuses 
              : (defaultStep.nextStatuses || []),
            visibleToRoles: hasVisibleToRoles 
              ? savedStep.visibleToRoles 
              : (defaultStep.visibleToRoles || []),
          }
        }
        return defaultStep
      })
      setFlow(mergedFlow)
    } else {
      setFlow(DEFAULT_FLOW)
    }
    setHasChanges(false)
  }

  // Show loading state
  if (isLoading || !flow) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-500">Loading order flow...</p>
        </div>
      </div>
    )
  }

  const updateStep = (index, updates) => {
    const newFlow = [...flow]
    newFlow[index] = { ...newFlow[index], ...updates }
    setFlow(newFlow)
    setHasChanges(true)
  }

  // Drag and drop handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    const newFlow = [...flow]
    const draggedItem = newFlow[draggedIndex]
    newFlow.splice(draggedIndex, 1)
    newFlow.splice(index, 0, draggedItem)
    
    setFlow(newFlow)
    setDraggedIndex(index)
    setHasChanges(true)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const staff = staffData?.staff || []
  const staffByRole = staff.reduce((acc, s) => {
    if (!acc[s.role]) acc[s.role] = []
    acc[s.role].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Order Flow Builder</h1>
          <p className="text-surface-500">Customize how orders move through your kitchen and delivery</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <button onClick={handleReset} className="btn btn-secondary">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
          <button 
            onClick={handleSave} 
            disabled={!hasChanges || saveFlowMutation.isPending}
            className="btn btn-primary"
          >
            <Save className="w-4 h-4" />
            {saveFlowMutation.isPending ? 'Saving...' : 'Save Flow'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Drag steps to reorder the flow</li>
              <li>Assign staff roles to each step - they'll get WhatsApp notifications</li>
              <li>Enable notifications to alert staff and customers at each stage</li>
              <li><strong>Auto-transition:</strong> When staff completes a step, order automatically moves to next step and notifies the next assigned staff</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Auto-Transition Info */}
      <div className="card p-4 bg-emerald-50 border-emerald-200">
        <div className="flex items-center gap-3">
          <ArrowRight className="w-5 h-5 text-emerald-600" />
          <div className="text-sm text-emerald-800">
            <p className="font-medium">🔄 Auto-Transition Enabled</p>
            <p className="text-emerald-700">When staff marks their step complete, the order automatically moves to the next step and notifies the assigned staff.</p>
          </div>
        </div>
      </div>

      {/* Flow Builder */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-surface-900 mb-6">Order Flow Steps</h2>
        
        <div className="space-y-4">
          {flow.map((step, index) => {
            const status = ORDER_STATUSES.find(s => s.id === step.status)
            const StatusIcon = status?.icon || Package
            const assignedRole = step.assignTo ? STAFF_ROLES[step.assignTo] : null
            const AssignedIcon = assignedRole?.icon || Users
            const assignedStaff = step.assignTo ? staffByRole[step.assignTo] || [] : []

            return (
              <div key={step.status}>
                {/* Connection Arrow */}
                {index > 0 && (
                  <div className="flex justify-center py-2">
                    <div className="flex flex-col items-center text-surface-400">
                      <div className="w-0.5 h-4 bg-surface-300" />
                      <ArrowRight className="w-4 h-4 rotate-90" />
                      <div className="w-0.5 h-4 bg-surface-300" />
                    </div>
                  </div>
                )}

                {/* Flow Step Card */}
                <div
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={clsx(
                    'border-2 rounded-2xl p-4 transition-all cursor-move',
                    draggedIndex === index ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-surface-300'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Drag Handle */}
                    <div className="pt-2 text-surface-400 hover:text-surface-600">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Status Info */}
                    <div className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      status?.color || 'bg-gray-100 text-gray-600'
                    )}>
                      <StatusIcon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-surface-900">{status?.label || step.status}</h3>
                          <p className="text-sm text-surface-500">Step {index + 1}</p>
                        </div>
                      </div>

                      {/* Assignment */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-surface-500 mb-1 block">Assign to Role</label>
                          <select
                            value={step.assignTo || ''}
                            onChange={(e) => updateStep(index, { assignTo: e.target.value || null })}
                            className="input text-sm"
                          >
                            <option value="">No assignment</option>
                            {Object.entries(STAFF_ROLES).map(([key, role]) => (
                              <option key={key} value={key}>
                                {role.label} ({staffByRole[key]?.length || 0} available)
                              </option>
                            ))}
                          </select>
                          
                          {/* Show assigned staff preview */}
                          {step.assignTo && assignedStaff.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {assignedStaff.slice(0, 3).map(s => (
                                <span key={s._id} className="text-xs px-2 py-0.5 bg-surface-100 rounded-full text-surface-600">
                                  {s.name}
                                </span>
                              ))}
                              {assignedStaff.length > 3 && (
                                <span className="text-xs text-surface-500">+{assignedStaff.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Visible to Roles (Staff Portal) */}
                        <div>
                          <label className="text-xs font-medium text-surface-500 mb-1 block">Visible in Staff Portal</label>
                          <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-surface-50 rounded-lg">
                            {Object.entries(STAFF_ROLES).map(([key, role]) => (
                              <label key={key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={step.visibleToRoles?.includes(key) || false}
                                  onChange={(e) => {
                                    const currentRoles = step.visibleToRoles || []
                                    const newRoles = e.target.checked
                                      ? [...currentRoles, key]
                                      : currentRoles.filter(r => r !== key)
                                    updateStep(index, { visibleToRoles: newRoles })
                                  }}
                                  className="w-3 h-3 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-xs text-surface-700">{role.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Notifications & Payment */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-surface-500 mb-1 block">Options</label>
                          
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={step.notifyStaff}
                              onChange={(e) => updateStep(index, { notifyStaff: e.target.checked })}
                              className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-xs text-surface-700 flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              Notify Staff
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={step.notifyCustomer}
                              onChange={(e) => updateStep(index, { notifyCustomer: e.target.checked })}
                              className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-xs text-surface-700 flex items-center gap-1">
                              <Send className="w-3 h-3" />
                              Notify Customer
                            </span>
                          </label>

                          {/* Payment options for payment_pending status */}
                          {step.status === 'payment_pending' && (
                            <>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={step.sendPaymentQR}
                                  onChange={(e) => updateStep(index, { sendPaymentQR: e.target.checked })}
                                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-xs text-surface-700 flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  Send Payment QR
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={step.requiresPayment}
                                  onChange={(e) => updateStep(index, { requiresPayment: e.target.checked })}
                                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-xs text-surface-700 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Require Screenshot
                                </span>
                              </label>
                            </>
                          )}
                        </div>

                        {/* Next Status Options - for branching (e.g., out_for_delivery -> delivered/undelivered) */}
                        <div className="col-span-full">
                          <label className="text-xs font-medium text-surface-500 mb-1 block">
                            Next Status Options
                            <span className="text-surface-400 font-normal ml-1">(what happens after this step)</span>
                          </label>
                          <div className="flex flex-wrap gap-2 p-2 bg-surface-50 rounded-lg">
                            {ORDER_STATUSES.filter(s => s.id !== step.status && s.id !== 'pending').map(statusOption => (
                              <label 
                                key={statusOption.id} 
                                className={clsx(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border transition-all text-sm",
                                  (step.nextStatuses || []).includes(statusOption.id)
                                    ? "border-primary-500 bg-primary-50 text-primary-700"
                                    : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={(step.nextStatuses || []).includes(statusOption.id)}
                                  onChange={(e) => {
                                    const currentNext = step.nextStatuses || []
                                    const newNext = e.target.checked
                                      ? [...currentNext, statusOption.id]
                                      : currentNext.filter(s => s !== statusOption.id)
                                    updateStep(index, { nextStatuses: newNext })
                                  }}
                                  className="hidden"
                                />
                                {(() => {
                                  const Icon = statusOption.icon
                                  return <Icon className="w-4 h-4" />
                                })()}
                                <span>{statusOption.label}</span>
                              </label>
                            ))}
                          </div>
                          {(step.nextStatuses || []).length === 0 && index < flow.length - 1 && (
                            <p className="text-xs text-surface-400 mt-1">
                              ℹ️ If none selected, will automatically go to next step in flow
                            </p>
                          )}
                          {(step.nextStatuses || []).length > 1 && (
                            <p className="text-xs text-emerald-600 mt-1">
                              ✨ Multiple options enabled! Staff will see buttons for each option.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Preview Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Flow Preview</h2>
        <div className="flex flex-wrap items-center gap-2">
          {flow.map((step, index) => {
            const status = ORDER_STATUSES.find(s => s.id === step.status)
            const StatusIcon = status?.icon || Package
            const assignedRole = step.assignTo ? STAFF_ROLES[step.assignTo] : null

            return (
              <div key={step.status} className="flex items-center gap-2">
                {index > 0 && <ArrowRight className="w-4 h-4 text-surface-400" />}
                <div className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                  status?.color || 'bg-gray-100 text-gray-600'
                )}>
                  <StatusIcon className="w-4 h-4" />
                  <span>{status?.label}</span>
                  {assignedRole && (
                    <span className={clsx(
                      'ml-1 px-1.5 py-0.5 rounded text-xs text-white',
                      assignedRole.color
                    )}>
                      {assignedRole.label}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Staff Summary */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Staff Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(STAFF_ROLES).map(([key, role]) => {
            const count = staffByRole[key]?.length || 0
            const RoleIcon = role.icon
            const assignedInFlow = flow.filter(s => s.assignTo === key).length

            return (
              <div key={key} className="p-4 bg-surface-50 rounded-xl text-center">
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-white',
                  role.color
                )}>
                  <RoleIcon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-surface-900">{role.label}</p>
                <p className="text-sm text-surface-500">{count} staff</p>
                {assignedInFlow > 0 && (
                  <p className="text-xs text-primary-600 mt-1">{assignedInFlow} steps assigned</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
