import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageCircle,
  MapPin,
  ShoppingBag,
  ShoppingCart,
  ClipboardList,
  Clock,
  CreditCard,
  CheckCircle,
  GripVertical,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  Image,
  ToggleLeft,
  ToggleRight,
  Eye,
  Info,
  Smartphone,
  Zap,
  HelpCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import clsx from 'clsx'

// ========================================
// STEP DEFINITIONS
// ========================================

const CHAT_STEPS = [
  { id: 'welcome', label: 'Welcome', icon: MessageCircle, color: 'bg-green-100 text-green-700', description: 'Greeting message when customer starts a conversation', canDisable: false },
  { id: 'location', label: 'Location', icon: MapPin, color: 'bg-blue-100 text-blue-700', description: 'Request customer location for delivery', canDisable: true },
  { id: 'menu', label: 'Menu Display', icon: ShoppingBag, color: 'bg-purple-100 text-purple-700', description: 'How products and categories are shown', canDisable: false },
  { id: 'cart', label: 'Cart', icon: ShoppingCart, color: 'bg-amber-100 text-amber-700', description: 'Cart view, actions, and messages', canDisable: false },
  { id: 'checkout', label: 'Checkout', icon: ClipboardList, color: 'bg-indigo-100 text-indigo-700', description: 'Address collection and order summary', canDisable: false },
  { id: 'delivery_time', label: 'Delivery Time', icon: Clock, color: 'bg-cyan-100 text-cyan-700', description: 'Let customers schedule delivery time', canDisable: true },
  { id: 'payment', label: 'Payment', icon: CreditCard, color: 'bg-yellow-100 text-yellow-700', description: 'Payment method selection and processing', canDisable: false },
  { id: 'confirmation', label: 'Confirmation', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', description: 'Order placed confirmation message', canDisable: false },
]

// Default step configs (matching chatFlowConfig.js STEP_DEFAULTS)
const DEFAULT_STEP_CONFIGS = {
  welcome: {
    greetingTemplate: '👋 Welcome to *{{merchantName}}*{{customerGreeting}}!',
    description: '{{merchantDescription}}',
    welcomeImage: null,
    showMinOrder: true,
    showDeliveryCharge: true,
    showEstTime: true,
  },
  location: {
    promptMessage: '📍 Please share your delivery location.\n\nTap 📎 → Location → Send your current location',
    skipButtonLabel: '⏭️ Skip Location',
  },
  menu: {
    displayMode: 'categories',
    headerMessage: '',
    showPrices: true,
    catalogBrowseMessage: '🛍️ Browse our full menu at *{{merchantName}}*!\n\nTap below to view all products and add to cart.',
    addedToCartMessage: '✅ Added *{{quantity}}x {{productName}}* to cart!',
    quantityPrompt: '📦 How many *{{productName}}* would you like to add?\n\nTap a button or type a number (1-10):',
  },
  cart: {
    emptyCartMessage: '🛒 Your cart is empty!\n\nBrowse the menu to add items first.',
    showContinueShopping: true,
    showClearCart: true,
    clearConfirmMessage: '🗑️ *Clear your cart?*\n\nYou have {{cartCount}} item(s) worth ₹{{cartTotal}}.\n\nThis will remove all items. Continue?',
    cartClearedMessage: '🗑️ Cart cleared! Ready to start fresh!',
    minOrderMessage: '⚠️ Minimum order amount is ₹{{minOrder}}\n\nPlease add ₹{{difference}} more to proceed.',
    returnCartMessage: '👋 Welcome back{{customerGreeting}}!\n\nYou have *{{cartCount}} item(s)* in your cart\n💵 Total: *₹{{cartTotal}}*\n\nWhat would you like to do?',
  },
  checkout: {
    addressPrompt: '📍 *Where should we deliver?*\n\nPlease type your complete address:',
    addressHint: '_Street, Building, Landmark, City, Pincode_',
    minAddressLength: 10,
  },
  delivery_time: {
    headerMessage: '⏰ Choose Delivery Time',
    bodyMessage: 'When would you like your order delivered?',
  },
  payment: {
    headerMessage: '💳 *Payment*\n\n*Order Total: ₹{{grandTotal}}*\n\nPlease select your payment method:',
    enableCOD: null,
    enableUPI: null,
    enableRazorpay: null,
    waitingForPaymentMessage: '📸 Please send a screenshot of your payment.\n\nOr tap the button below to switch to Cash on Delivery.',
    paymentReceivedMessage: '✅ *Payment Screenshot Received!*\n\nYour order is being processed.\nThe restaurant will verify your payment and confirm your order shortly.',
  },
  confirmation: {
    confirmationMessage: "We're notifying the restaurant.\nYou'll get updates on your order! 📱",
    thankYouMessage: '_Thank you for ordering with {{merchantName}}!_ 🙏',
    orderCancelledMessage: '❌ Order cancelled.',
    outsideHoursMessage: '🕐 *{{merchantName}}* is currently closed.\n\nOur hours: *{{openTime}} – {{closeTime}}*\n\nYou can still browse our menu. We\'ll accept orders when we\'re back! 🙏',
    goodbyeMessage: '👋 No problem! Type *hi* when you want to order again.',
  },
}

// Available template variables
const TEMPLATE_VARIABLES = [
  { key: '{{merchantName}}', desc: 'Shop name' },
  { key: '{{customerName}}', desc: 'Customer name' },
  { key: '{{customerGreeting}}', desc: ', Name (or empty)' },
  { key: '{{merchantDescription}}', desc: 'Shop description' },
  { key: '{{cartTotal}}', desc: 'Cart total' },
  { key: '{{cartCount}}', desc: 'Items in cart' },
  { key: '{{minOrder}}', desc: 'Min. order amount' },
  { key: '{{deliveryCharge}}', desc: 'Delivery charge' },
  { key: '{{grandTotal}}', desc: 'Total with delivery' },
  { key: '{{orderNumber}}', desc: 'Order number' },
]

// ========================================
// MAIN COMPONENT
// ========================================

export default function ChatFlowBuilder() {
  const [useCustomFlow, setUseCustomFlow] = useState(false)
  const [steps, setSteps] = useState([])
  const [autoReplies, setAutoReplies] = useState([])
  const [customMessages, setCustomMessages] = useState({ afterWelcome: '', afterOrder: '', outsideHours: '' })
  const [hasChanges, setHasChanges] = useState(false)
  const [expandedStep, setExpandedStep] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const queryClient = useQueryClient()

  // Fetch current chat flow
  const { data: savedData, isLoading, isFetched } = useQuery({
    queryKey: ['chat-flow'],
    queryFn: async () => {
      const res = await api.get('/merchants/me/chat-flow')
      return res.data.data
    },
    retry: false,
    staleTime: 0,
  })

  // Initialize state from saved data
  useEffect(() => {
    if (isFetched && !initialLoadDone) {
      setUseCustomFlow(savedData?.useCustomChatFlow || false)

      // Build steps from saved data merged with defaults
      const savedSteps = savedData?.chatFlow?.steps || []
      const mergedSteps = CHAT_STEPS.map((stepDef, index) => {
        const saved = savedSteps.find(s => s.stepId === stepDef.id)
        return {
          stepId: stepDef.id,
          enabled: saved?.enabled !== undefined ? saved.enabled : true,
          sortOrder: saved?.sortOrder !== undefined ? saved.sortOrder : index,
          config: { ...DEFAULT_STEP_CONFIGS[stepDef.id], ...(saved?.config || {}) }
        }
      })
      // Sort by sortOrder
      mergedSteps.sort((a, b) => a.sortOrder - b.sortOrder)
      setSteps(mergedSteps)

      setAutoReplies(savedData?.chatFlow?.autoReplies || [])
      setCustomMessages(savedData?.chatFlow?.customMessages || { afterWelcome: '', afterOrder: '', outsideHours: '' })
      setInitialLoadDone(true)
    }
  }, [isFetched, savedData, initialLoadDone])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data) => api.put('/merchants/me/chat-flow', data),
    onSuccess: () => {
      toast.success('Chat flow saved!')
      setHasChanges(false)
      queryClient.invalidateQueries(['chat-flow'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to save chat flow')
    }
  })

  const handleSave = () => {
    // Reassign sortOrder based on current array order
    const orderedSteps = steps.map((step, i) => ({ ...step, sortOrder: i }))
    saveMutation.mutate({
      useCustomChatFlow: useCustomFlow,
      chatFlow: {
        steps: orderedSteps,
        autoReplies,
        customMessages
      }
    })
  }

  const handleReset = () => {
    setInitialLoadDone(false) // Triggers re-init from saved data
    setHasChanges(false)
  }

  // Step config updaters
  const updateStepConfig = useCallback((stepId, configUpdates) => {
    setSteps(prev => prev.map(s =>
      s.stepId === stepId ? { ...s, config: { ...s.config, ...configUpdates } } : s
    ))
    setHasChanges(true)
  }, [])

  const toggleStepEnabled = useCallback((stepId) => {
    setSteps(prev => prev.map(s =>
      s.stepId === stepId ? { ...s, enabled: !s.enabled } : s
    ))
    setHasChanges(true)
  }, [])

  // Drag and drop
  const handleDragStart = (index) => setDraggedIndex(index)
  const handleDragEnd = () => setDraggedIndex(null)
  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setSteps(prev => {
      const updated = [...prev]
      const [dragged] = updated.splice(draggedIndex, 1)
      updated.splice(index, 0, dragged)
      return updated
    })
    setDraggedIndex(index)
    setHasChanges(true)
  }

  // Auto-replies management
  const addAutoReply = () => {
    setAutoReplies(prev => [...prev, { keywords: [''], response: '', enabled: true }])
    setHasChanges(true)
  }
  const updateAutoReply = (index, updates) => {
    setAutoReplies(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r))
    setHasChanges(true)
  }
  const removeAutoReply = (index) => {
    setAutoReplies(prev => prev.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  // Custom messages
  const updateCustomMessage = (key, value) => {
    setCustomMessages(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const isStandalone = savedData?.isStandalone || false

  // ========================================
  // WHATSAPP PREVIEW
  // ========================================
  const previewMessages = useMemo(() => {
    if (!steps.length) return []
    const messages = []
    const welcomeStep = steps.find(s => s.stepId === 'welcome')
    if (welcomeStep) {
      const cfg = welcomeStep.config
      let text = (cfg.greetingTemplate || '').replace('{{merchantName}}', savedData?.merchantName || 'Your Store').replace('{{customerGreeting}}', ', John')
      text += '\n\n' + (cfg.description || '').replace('{{merchantDescription}}', 'Fresh food delivered to your door.')
      if (cfg.showMinOrder) text += '\n\n🛒 Min. Order: ₹200'
      if (cfg.showDeliveryCharge) text += '\n🚚 Delivery: ₹30'
      if (cfg.showEstTime) text += '\n⏱️ Est. Time: 30 mins'
      const welcomeButtons = ['📋 View Menu']
      if (savedData?.useLocationBasedOrdering) welcomeButtons.push('📍 Share Location')
      messages.push({ from: 'bot', text, buttons: welcomeButtons })
    }
    if (customMessages.afterWelcome) {
      messages.push({ from: 'bot', text: customMessages.afterWelcome.replace('{{merchantName}}', savedData?.merchantName || 'Your Store') })
    }
    return messages
  }, [steps, customMessages.afterWelcome, savedData?.merchantName])

  // ========================================
  // RENDER
  // ========================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Chat Flow Builder</h1>
          <p className="text-surface-500 mt-1">Customize your WhatsApp customer conversation</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Unsaved changes
            </span>
          )}
          <button onClick={handleReset} disabled={!hasChanges} className="btn btn-secondary flex items-center gap-2 disabled:opacity-50">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending} className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Standalone gate */}
      {!isStandalone && (
        <div className="card p-4 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800">Standalone Merchant Required</h3>
              <p className="text-amber-700 text-sm mt-1">
                Custom chat flow is only available for standalone merchants with their own WhatsApp Business number.
                Configure your WhatsApp number in <strong>My Shop</strong> first.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Master toggle */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              useCustomFlow ? 'bg-green-100' : 'bg-surface-100'
            )}>
              <Zap className={clsx('w-5 h-5', useCustomFlow ? 'text-green-600' : 'text-surface-400')} />
            </div>
            <div>
              <h2 className="font-semibold text-surface-900">Enable Custom Chat Flow</h2>
              <p className="text-sm text-surface-500">
                {useCustomFlow
                  ? 'Your customers see your customized flow. Toggle OFF to revert to default.'
                  : 'When ON, customers will see your customized conversation. When OFF, the default flow runs.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setUseCustomFlow(!useCustomFlow); setHasChanges(true) }}
            disabled={!isStandalone}
            className={clsx('transition-colors disabled:opacity-50 disabled:cursor-not-allowed')}
          >
            {useCustomFlow
              ? <ToggleRight className="w-12 h-12 text-green-500" />
              : <ToggleLeft className="w-12 h-12 text-surface-300" />
            }
          </button>
        </div>
      </div>

      {/* Builder content */}
      <div className={clsx('transition-opacity', !useCustomFlow && 'opacity-50 pointer-events-none')}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Step Cards */}
          <div className="lg:col-span-2 space-y-3">
            {/* Variables reference */}
            <div className="card p-3">
              <button onClick={() => setShowVariables(!showVariables)} className="flex items-center gap-2 text-sm text-surface-600 hover:text-surface-900 w-full">
                <HelpCircle className="w-4 h-4" />
                <span className="font-medium">Available Variables</span>
                {showVariables ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
              {showVariables && (
                <div className="mt-3 grid grid-cols-2 gap-1 text-xs">
                  {TEMPLATE_VARIABLES.map(v => (
                    <div key={v.key} className="flex items-center gap-2 py-1">
                      <code className="bg-surface-100 px-1.5 py-0.5 rounded text-primary-600">{v.key}</code>
                      <span className="text-surface-500">{v.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step cards */}
            <h3 className="font-semibold text-surface-700 text-sm uppercase tracking-wider">Conversation Steps</h3>
            {steps.map((step, index) => {
              const stepDef = CHAT_STEPS.find(s => s.id === step.stepId)
              if (!stepDef) return null
              // Only show location step if location-based ordering is enabled in merchant settings
              if (step.stepId === 'location' && !savedData?.useLocationBasedOrdering) return null
              const Icon = stepDef.icon
              const isExpanded = expandedStep === step.stepId

              return (
                <div
                  key={step.stepId}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={clsx(
                    'card border transition-all',
                    draggedIndex === index ? 'border-primary-500 bg-primary-50 shadow-lg' : 'border-surface-200',
                    !step.enabled && 'opacity-60'
                  )}
                >
                  {/* Step header */}
                  <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedStep(isExpanded ? null : step.stepId)}>
                    <GripVertical className="w-4 h-4 text-surface-400 cursor-grab shrink-0" />
                    <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', stepDef.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-surface-900">{stepDef.label}</span>
                        <span className="text-xs text-surface-400">Step {index + 1}</span>
                      </div>
                      <p className="text-xs text-surface-500 truncate">{stepDef.description}</p>
                    </div>
                    {stepDef.canDisable && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStepEnabled(step.stepId) }}
                        className="shrink-0"
                      >
                        {step.enabled
                          ? <ToggleRight className="w-8 h-8 text-green-500" />
                          : <ToggleLeft className="w-8 h-8 text-surface-300" />
                        }
                      </button>
                    )}
                    {isExpanded
                      ? <ChevronDown className="w-5 h-5 text-surface-400 shrink-0" />
                      : <ChevronRight className="w-5 h-5 text-surface-400 shrink-0" />
                    }
                  </div>

                  {/* Step config (expanded) */}
                  {isExpanded && (
                    <div className="border-t border-surface-200 p-4 space-y-4 bg-surface-50">
                      <StepConfigForm
                        stepId={step.stepId}
                        config={step.config}
                        onUpdate={(updates) => updateStepConfig(step.stepId, updates)}
                      />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Auto-Replies */}
            <h3 className="font-semibold text-surface-700 text-sm uppercase tracking-wider mt-6">Auto Replies</h3>
            <div className="card p-4 space-y-3">
              <p className="text-sm text-surface-500">
                Set up keyword-based instant replies. These are checked before AI responses.
              </p>
              {autoReplies.map((rule, index) => (
                <div key={index} className="border border-surface-200 rounded-lg p-3 space-y-2 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-surface-500">Auto Reply #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateAutoReply(index, { enabled: !rule.enabled })}>
                        {rule.enabled
                          ? <ToggleRight className="w-6 h-6 text-green-500" />
                          : <ToggleLeft className="w-6 h-6 text-surface-300" />
                        }
                      </button>
                      <button onClick={() => removeAutoReply(index)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-surface-600">Keywords (comma separated)</label>
                    <input
                      type="text"
                      value={rule.keywords?.join(', ') || ''}
                      onChange={(e) => updateAutoReply(index, { keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                      placeholder="hours, timing, open, schedule"
                      className="input mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-surface-600">Response</label>
                    <textarea
                      value={rule.response || ''}
                      onChange={(e) => updateAutoReply(index, { response: e.target.value })}
                      placeholder="We're open Monday-Saturday, 9am to 10pm!"
                      rows={2}
                      className="input mt-1 text-sm"
                    />
                  </div>
                </div>
              ))}
              <button onClick={addAutoReply} className="btn btn-secondary text-sm flex items-center gap-2 w-full justify-center">
                <Plus className="w-4 h-4" /> Add Auto Reply
              </button>
            </div>

            {/* Custom Messages */}
            <h3 className="font-semibold text-surface-700 text-sm uppercase tracking-wider mt-6">Custom Messages</h3>
            <div className="card p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-surface-700">After Welcome (Promotional)</label>
                <textarea
                  value={customMessages.afterWelcome || ''}
                  onChange={(e) => updateCustomMessage('afterWelcome', e.target.value)}
                  placeholder="🔥 Today's Special: 20% off on all pizzas! Use code PIZZA20"
                  rows={2}
                  className="input mt-1 text-sm"
                />
                <p className="text-xs text-surface-400 mt-1">Sent right after the welcome message</p>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700">After Order (Follow-up)</label>
                <textarea
                  value={customMessages.afterOrder || ''}
                  onChange={(e) => updateCustomMessage('afterOrder', e.target.value)}
                  placeholder="⭐ Rate us on Google Maps! Your feedback helps us improve."
                  rows={2}
                  className="input mt-1 text-sm"
                />
                <p className="text-xs text-surface-400 mt-1">Sent after order is placed</p>
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700">Outside Business Hours</label>
                <textarea
                  value={customMessages.outsideHours || ''}
                  onChange={(e) => updateCustomMessage('outsideHours', e.target.value)}
                  placeholder="😴 We're currently closed. Our hours are Mon-Sat 9am-10pm. See you soon!"
                  rows={2}
                  className="input mt-1 text-sm"
                />
                <p className="text-xs text-surface-400 mt-1">Sent when customer messages outside business hours</p>
              </div>
            </div>
          </div>

          {/* Right: WhatsApp Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <h3 className="font-semibold text-surface-700 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Preview
              </h3>
              <div className="card overflow-hidden">
                {/* Phone frame */}
                <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{savedData?.merchantName || 'Your Store'}</p>
                    <p className="text-green-200 text-xs">online</p>
                  </div>
                </div>

                {/* Chat area */}
                <div className="bg-[#ece5dd] p-3 min-h-[400px] space-y-2">
                  {previewMessages.map((msg, i) => (
                    <div key={i} className={clsx(
                      'max-w-[85%] rounded-lg p-2.5 shadow-sm',
                      msg.from === 'bot' ? 'bg-white mr-auto' : 'bg-[#dcf8c6] ml-auto'
                    )}>
                      <p className="text-xs text-surface-800 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      {msg.buttons && (
                        <div className="mt-2 space-y-1">
                          {msg.buttons.map((btn, j) => (
                            <div key={j} className="text-center text-xs text-blue-500 font-medium py-1.5 border-t border-surface-200">
                              {btn}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-surface-400 text-right mt-1">12:00 PM</p>
                    </div>
                  ))}

                  {previewMessages.length === 0 && (
                    <div className="text-center text-surface-400 text-xs py-10">
                      Configure steps to see preview
                    </div>
                  )}
                </div>
              </div>

              {/* Info card */}
              <div className="card p-3 mt-3 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    Preview shows the welcome step. The actual WhatsApp conversation will follow all configured steps in order.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ========================================
// STEP CONFIG FORMS
// ========================================

function StepConfigForm({ stepId, config, onUpdate }) {
  switch (stepId) {
    case 'welcome': return <WelcomeConfig config={config} onUpdate={onUpdate} />
    case 'location': return <LocationConfig config={config} onUpdate={onUpdate} />
    case 'menu': return <MenuConfig config={config} onUpdate={onUpdate} />
    case 'cart': return <CartConfig config={config} onUpdate={onUpdate} />
    case 'checkout': return <CheckoutConfig config={config} onUpdate={onUpdate} />
    case 'delivery_time': return <DeliveryTimeConfig config={config} onUpdate={onUpdate} />
    case 'payment': return <PaymentConfig config={config} onUpdate={onUpdate} />
    case 'confirmation': return <ConfirmationConfig config={config} onUpdate={onUpdate} />
    default: return <p className="text-sm text-surface-400">No configuration available.</p>
  }
}

function TextFieldWithCount({ label, value, onChange, placeholder, maxLength, rows = 1, hint }) {
  const length = (value || '').length
  const isOver = maxLength && length > maxLength
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-surface-600">{label}</label>
        {maxLength && (
          <span className={clsx('text-xs', isOver ? 'text-red-500 font-medium' : 'text-surface-400')}>
            {length}/{maxLength}
          </span>
        )}
      </div>
      {rows > 1 ? (
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={clsx('input mt-1 text-sm', isOver && 'border-red-300')} />
      ) : (
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={clsx('input mt-1 text-sm', isOver && 'border-red-300')} />
      )}
      {hint && <p className="text-xs text-surface-400 mt-1">{hint}</p>}
    </div>
  )
}

function CheckboxField({ label, checked, onChange, hint }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input type="checkbox" checked={checked || false} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
      <div>
        <span className="text-sm text-surface-700">{label}</span>
        {hint && <p className="text-xs text-surface-400">{hint}</p>}
      </div>
    </label>
  )
}

// Welcome Step Config
function WelcomeConfig({ config, onUpdate }) {
  return (
    <div className="space-y-3">
      <TextFieldWithCount label="Greeting Template" value={config.greetingTemplate} onChange={(v) => onUpdate({ greetingTemplate: v })} placeholder="👋 Welcome to *{{merchantName}}*!" maxLength={1024} rows={2} hint="Use {{merchantName}}, {{customerGreeting}} etc." />
      <TextFieldWithCount label="Description" value={config.description} onChange={(v) => onUpdate({ description: v })} placeholder="Browse our menu and place your order." maxLength={500} rows={2} />
      <TextFieldWithCount label="Welcome Image URL" value={config.welcomeImage} onChange={(v) => onUpdate({ welcomeImage: v })} placeholder="https://res.cloudinary.com/..." hint="Optional. Leave empty for text-only welcome." />
      <div className="flex flex-wrap gap-4">
        <CheckboxField label="Show Min Order" checked={config.showMinOrder} onChange={(v) => onUpdate({ showMinOrder: v })} />
        <CheckboxField label="Show Delivery Charge" checked={config.showDeliveryCharge} onChange={(v) => onUpdate({ showDeliveryCharge: v })} />
        <CheckboxField label="Show Est. Time" checked={config.showEstTime} onChange={(v) => onUpdate({ showEstTime: v })} />
      </div>
    </div>
  )
}

// Location Step Config
function LocationConfig({ config, onUpdate }) {
  return (
    <div className="space-y-3">
      <TextFieldWithCount label="Location Prompt" value={config.promptMessage} onChange={(v) => onUpdate({ promptMessage: v })} placeholder="📍 Share your location..." maxLength={1024} rows={3} />
      <TextFieldWithCount label="Skip Button Label" value={config.skipButtonLabel} onChange={(v) => onUpdate({ skipButtonLabel: v })} placeholder="⏭️ Skip Location" maxLength={20} hint="Max 20 characters (WhatsApp button limit)" />
    </div>
  )
}

// Menu Step Config
function MenuConfig({ config, onUpdate }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-surface-600">Display Mode</label>
        <div className="flex gap-3 mt-2">
          {[
            { value: 'categories', label: 'Categories', desc: 'Show categories first' },
            { value: 'all_products', label: 'All Products', desc: 'Show all items' },
            { value: 'catalog', label: 'Catalog', desc: 'Use WhatsApp catalog' },
          ].map(mode => (
            <label key={mode.value} className={clsx(
              'flex-1 p-3 rounded-lg border cursor-pointer transition-colors text-center',
              config.displayMode === mode.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-surface-200 hover:border-surface-300'
            )}>
              <input type="radio" name="displayMode" value={mode.value} checked={config.displayMode === mode.value} onChange={() => onUpdate({ displayMode: mode.value })} className="sr-only" />
              <p className="text-sm font-medium text-surface-900">{mode.label}</p>
              <p className="text-xs text-surface-500 mt-0.5">{mode.desc}</p>
            </label>
          ))}
        </div>
      </div>
      <TextFieldWithCount label="Custom Header Message" value={config.headerMessage} onChange={(v) => onUpdate({ headerMessage: v })} placeholder="Optional message shown above the menu" maxLength={500} hint="Leave empty for default" />
      <TextFieldWithCount label="Catalog Browse Message" value={config.catalogBrowseMessage} onChange={(v) => onUpdate({ catalogBrowseMessage: v })} placeholder="🛍️ Browse our full menu at *{{merchantName}}*!" maxLength={500} rows={2} hint="Shown when using catalog mode. Use {{merchantName}}" />
      <TextFieldWithCount label="Added to Cart Message" value={config.addedToCartMessage} onChange={(v) => onUpdate({ addedToCartMessage: v })} placeholder="✅ Added *{{quantity}}x {{productName}}* to cart!" maxLength={200} hint="Use {{quantity}}, {{productName}}" />
      <TextFieldWithCount label="Quantity Prompt" value={config.quantityPrompt} onChange={(v) => onUpdate({ quantityPrompt: v })} placeholder="📦 How many *{{productName}}*?" maxLength={300} hint="Use {{productName}}" />
      <CheckboxField label="Show Prices" checked={config.showPrices} onChange={(v) => onUpdate({ showPrices: v })} hint="Display prices next to product names" />
    </div>
  )
}

// Cart Step Config
function CartConfig({ config, onUpdate }) {
  return (
    <div className="space-y-3">
      <TextFieldWithCount label="Empty Cart Message" value={config.emptyCartMessage} onChange={(v) => onUpdate({ emptyCartMessage: v })} maxLength={1024} rows={2} />
      <TextFieldWithCount label="Returning Customer Cart Message" value={config.returnCartMessage} onChange={(v) => onUpdate({ returnCartMessage: v })} placeholder="👋 Welcome back{{customerGreeting}}!" maxLength={500} rows={2} hint="Shown when customer returns with items in cart. Use {{customerGreeting}}, {{cartCount}}, {{cartTotal}}" />
      <TextFieldWithCount label="Clear Cart Confirm" value={config.clearConfirmMessage} onChange={(v) => onUpdate({ clearConfirmMessage: v })} placeholder="🗑️ *Clear your cart?*" maxLength={500} rows={2} hint="Use {{cartCount}}, {{cartTotal}}" />
      <TextFieldWithCount label="Cart Cleared Message" value={config.cartClearedMessage} onChange={(v) => onUpdate({ cartClearedMessage: v })} placeholder="🗑️ Cart cleared!" maxLength={200} />
      <TextFieldWithCount label="Min Order Warning" value={config.minOrderMessage} onChange={(v) => onUpdate({ minOrderMessage: v })} placeholder="⚠️ Min order is ₹{{minOrder}}" maxLength={300} hint="Use {{minOrder}}, {{difference}}" />
      <div className="flex flex-wrap gap-4">
        <CheckboxField label="Show 'Continue Shopping' button" checked={config.showContinueShopping} onChange={(v) => onUpdate({ showContinueShopping: v })} />
        <CheckboxField label="Show 'Clear Cart' button" checked={config.showClearCart} onChange={(v) => onUpdate({ showClearCart: v })} />
      </div>
    </div>
  )
}

// Checkout Step Config
function CheckoutConfig({ config, onUpdate }) {
  return (
    <div className="space-y-3">
      <TextFieldWithCount label="Address Prompt" value={config.addressPrompt} onChange={(v) => onUpdate({ addressPrompt: v })} maxLength={1024} rows={2} />
      <TextFieldWithCount label="Address Hint" value={config.addressHint} onChange={(v) => onUpdate({ addressHint: v })} placeholder="_Street, Building, Landmark..._" maxLength={200} />
      <div>
        <label className="text-xs font-medium text-surface-600">Minimum Address Length</label>
        <input type="number" value={config.minAddressLength || 10} onChange={(e) => onUpdate({ minAddressLength: parseInt(e.target.value) || 10 })} min={5} max={50} className="input mt-1 text-sm w-24" />
      </div>
    </div>
  )
}

// Delivery Time Step Config
function DeliveryTimeConfig({ config, onUpdate }) {
  return (
    <div className="space-y-3">
      <TextFieldWithCount label="Header Message" value={config.headerMessage} onChange={(v) => onUpdate({ headerMessage: v })} placeholder="⏰ Choose Delivery Time" maxLength={60} hint="Max 60 chars (WhatsApp list header)" />
      <TextFieldWithCount label="Body Message" value={config.bodyMessage} onChange={(v) => onUpdate({ bodyMessage: v })} placeholder="When would you like your order delivered?" maxLength={1024} rows={2} />
    </div>
  )
}

// Payment Step Config
function PaymentConfig({ config, onUpdate }) {
  return (
    <div className="space-y-3">
      <TextFieldWithCount label="Payment Header Message" value={config.headerMessage} onChange={(v) => onUpdate({ headerMessage: v })} maxLength={1024} rows={2} hint="Use {{grandTotal}} for order total" />
      <TextFieldWithCount label="Waiting for Payment Message" value={config.waitingForPaymentMessage} onChange={(v) => onUpdate({ waitingForPaymentMessage: v })} placeholder="📸 Please send a screenshot of your payment." maxLength={500} rows={2} hint="Shown while waiting for payment screenshot" />
      <TextFieldWithCount label="Payment Received Message" value={config.paymentReceivedMessage} onChange={(v) => onUpdate({ paymentReceivedMessage: v })} placeholder="✅ *Payment Screenshot Received!*" maxLength={500} rows={2} hint="Shown after screenshot is uploaded" />
      <div className="space-y-2">
        <label className="text-xs font-medium text-surface-600">Payment Methods</label>
        <p className="text-xs text-surface-400">Set to override merchant defaults, or leave as "Auto" to inherit from shop settings.</p>
        {[
          { key: 'enableCOD', label: 'Cash on Delivery' },
          { key: 'enableUPI', label: 'UPI / QR Code Payment' },
          { key: 'enableRazorpay', label: 'Online Payment (Razorpay)' },
        ].map(method => (
          <div key={method.key} className="flex items-center gap-3">
            <select
              value={config[method.key] === null ? 'auto' : config[method.key] ? 'on' : 'off'}
              onChange={(e) => {
                const val = e.target.value === 'auto' ? null : e.target.value === 'on'
                onUpdate({ [method.key]: val })
              }}
              className="input text-sm w-24"
            >
              <option value="auto">Auto</option>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
            <span className="text-sm text-surface-700">{method.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Confirmation Step Config
function ConfirmationConfig({ config, onUpdate }) {
  return (
    <div className="space-y-3">
      <TextFieldWithCount label="Confirmation Message" value={config.confirmationMessage} onChange={(v) => onUpdate({ confirmationMessage: v })} maxLength={1024} rows={2} hint="Shown after order is placed" />
      <TextFieldWithCount label="Thank You Message" value={config.thankYouMessage} onChange={(v) => onUpdate({ thankYouMessage: v })} maxLength={500} hint="Closing line. Use {{merchantName}}" />
      <TextFieldWithCount label="Order Cancelled Message" value={config.orderCancelledMessage} onChange={(v) => onUpdate({ orderCancelledMessage: v })} placeholder="❌ Order cancelled." maxLength={300} />
      <TextFieldWithCount label="Outside Hours Message" value={config.outsideHoursMessage} onChange={(v) => onUpdate({ outsideHoursMessage: v })} placeholder="🕐 *{{merchantName}}* is currently closed." maxLength={500} rows={2} hint="Use {{merchantName}}, {{openTime}}, {{closeTime}}" />
      <TextFieldWithCount label="Goodbye Message" value={config.goodbyeMessage} onChange={(v) => onUpdate({ goodbyeMessage: v })} placeholder="👋 No problem! Type *hi* when you want to order again." maxLength={300} hint="Shown when customer cancels with empty cart" />
    </div>
  )
}
