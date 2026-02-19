import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageCircle, Send, Search, Phone, Bot, UserRound,
  ShoppingCart, Loader2, ArrowLeft
} from 'lucide-react'
import api from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const formatLastActive = (dateString) => {
  if (!dateString) return 'Offline'
  const diff = Date.now() - new Date(dateString).getTime()
  if (diff < 120000) return 'Active now'
  if (diff < 3600000) return `Active ${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `Active ${Math.floor(diff / 3600000)}h ago`
  return `Active ${Math.floor(diff / 86400000)}d ago`
}

const isRecentlyActive = (dateString) => {
  if (!dateString) return false
  return (Date.now() - new Date(dateString).getTime()) < 300000 // 5 minutes
}

const formatPhone = (phone) => {
  if (!phone) return ''
  if (phone.startsWith('91') && phone.length === 12) {
    return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`
  }
  return phone
}

export default function WhatsAppChat() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const merchantId = typeof user?.merchant === 'object' ? user?.merchant?._id : user?.merchant
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [mobileView, setMobileView] = useState('list') // 'list' | 'chat'
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTakeover, setFilterTakeover] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['whatsapp-chat-conversations', filterTakeover],
    queryFn: () => api.get('/whatsapp-chat/conversations', {
      params: filterTakeover ? { status: 'takeover' } : {}
    }).then(r => r.data.data),
    refetchInterval: 15000
  })

  // Fetch messages when session selected
  const { isLoading: loadingMessages } = useQuery({
    queryKey: ['whatsapp-chat-messages', selectedSessionId],
    queryFn: () => api.get(`/whatsapp-chat/conversations/${selectedSessionId}/messages`).then(r => {
      setMessages(r.data.data.messages)
      return r.data.data
    }),
    enabled: !!selectedSessionId,
    refetchInterval: false
  })

  // Fetch customer info
  const { data: customerInfo } = useQuery({
    queryKey: ['whatsapp-chat-info', selectedSessionId],
    queryFn: () => api.get(`/whatsapp-chat/conversations/${selectedSessionId}/info`).then(r => r.data.data),
    enabled: !!selectedSessionId
  })

  // Send message
  const sendMutation = useMutation({
    mutationFn: (message) => api.post(`/whatsapp-chat/conversations/${selectedSessionId}/send`, { message }),
    onError: () => toast.error('Failed to send message')
  })

  // Takeover / Release
  const takeoverMutation = useMutation({
    mutationFn: () => api.post(`/whatsapp-chat/conversations/${selectedSessionId}/takeover`),
    onSuccess: () => {
      toast.success('Bot paused — you are now chatting directly')
      queryClient.invalidateQueries({ queryKey: ['whatsapp-chat-conversations'] })
    }
  })

  const releaseMutation = useMutation({
    mutationFn: () => api.post(`/whatsapp-chat/conversations/${selectedSessionId}/release`),
    onSuccess: () => {
      toast.success('Bot resumed')
      queryClient.invalidateQueries({ queryKey: ['whatsapp-chat-conversations'] })
    }
  })

  const selectedConversation = conversations.find(c => c._id === selectedSessionId)

  // Socket listener for real-time messages
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !merchantId) return

    socket.emit('join:whatsapp-chat', merchantId)

    const handleNewMessage = (data) => {
      if (selectedSessionId && data.sessionId === selectedSessionId) {
        setMessages(prev => {
          if (prev.some(m => m._id === data._id)) return prev
          return [...prev, data]
        })
      }
      queryClient.invalidateQueries({ queryKey: ['whatsapp-chat-conversations'] })
    }

    const handleChatUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-chat-conversations'] })
      if (selectedSessionId) {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-chat-info', selectedSessionId] })
      }
    }

    socket.on('whatsapp-chat:message', handleNewMessage)
    socket.on('whatsapp-chat:update', handleChatUpdate)

    return () => {
      socket.off('whatsapp-chat:message', handleNewMessage)
      socket.off('whatsapp-chat:update', handleChatUpdate)
      socket.emit('leave:whatsapp-chat', merchantId)
    }
  }, [selectedSessionId, queryClient, merchantId])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectConversation = useCallback((sessionId) => {
    setSelectedSessionId(sessionId)
    setMobileView('chat')
    setMessages([])
  }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text || sendMutation.isPending) return

    setNewMessage('')
    sendMutation.mutate(text)
    inputRef.current?.focus()
  }

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.phone?.includes(searchQuery) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">WhatsApp Chat</h1>
          <p className="text-surface-500 mt-0.5 text-sm">
            Chat directly with customers on WhatsApp
            {totalUnread > 0 && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">{totalUnread} unread</span>}
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={filterTakeover}
            onChange={e => setFilterTakeover(e.target.checked)}
            className="accent-primary-600 w-4 h-4"
          />
          <span className="text-surface-600">Active chats only</span>
        </label>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        <div className="flex h-full">

          {/* ── Conversations List ── */}
          <div className={clsx(
            'w-full md:w-80 border-r border-surface-100 flex flex-col',
            mobileView === 'chat' && 'hidden md:flex'
          )}>
            {/* Search */}
            <div className="p-3 border-b border-surface-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="animate-spin w-6 h-6 text-surface-400" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-surface-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1 text-surface-300">Customer messages will appear here</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv._id)}
                    className={clsx(
                      'w-full p-3 text-left border-b border-surface-50 hover:bg-surface-50 transition-colors',
                      selectedSessionId === conv._id && 'bg-primary-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium text-sm">
                          {conv.name?.charAt(0)?.toUpperCase() || '#'}
                        </div>
                        {conv.humanTakeover ? (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                            <UserRound className="w-2.5 h-2.5 text-white" />
                          </div>
                        ) : isRecentlyActive(conv.lastActive) && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-surface-900 text-sm truncate">
                            {conv.name || formatPhone(conv.phone)}
                          </span>
                          <span className="text-xs text-surface-400 flex-shrink-0 ml-2">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-xs text-surface-500 truncate mt-0.5">
                          {conv.lastDirection === 'outbound' && <span className="text-surface-400">You: </span>}
                          {conv.lastMessage || 'No messages'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {conv.humanTakeover && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">LIVE</span>
                          )}
                          {conv.cartItemCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium flex items-center gap-0.5">
                              <ShoppingCart className="w-2.5 h-2.5" /> {conv.cartItemCount}
                            </span>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="ml-auto bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Chat Area ── */}
          <div className={clsx(
            'flex-1 flex flex-col',
            mobileView === 'list' && 'hidden md:flex'
          )}>
            {selectedSessionId && selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileView('list')}
                      className="md:hidden p-1 -ml-1 text-surface-500 hover:text-surface-700"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium text-sm">
                      {selectedConversation.name?.charAt(0)?.toUpperCase() || '#'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900 text-sm">
                        {selectedConversation.name || formatPhone(selectedConversation.phone)}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-surface-500">
                        <Phone className="w-3 h-3" />
                        {formatPhone(selectedConversation.phone)}
                        <span className="text-surface-300">|</span>
                        <span className={clsx(
                          isRecentlyActive(selectedConversation.lastActive) ? 'text-green-600' : 'text-surface-400'
                        )}>
                          {formatLastActive(selectedConversation.lastActive)}
                        </span>
                        {selectedConversation.humanTakeover && (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium text-[10px]">BOT PAUSED</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConversation.humanTakeover ? (
                      <button
                        onClick={() => releaseMutation.mutate()}
                        disabled={releaseMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200"
                      >
                        <Bot className="w-4 h-4" />
                        Resume Bot
                      </button>
                    ) : (
                      <button
                        onClick={() => takeoverMutation.mutate()}
                        disabled={takeoverMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors border border-orange-200"
                      >
                        <UserRound className="w-4 h-4" />
                        Take Over
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="animate-spin w-6 h-6 text-surface-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-surface-500 bg-white/80 inline-block px-4 py-2 rounded-xl">
                        No chat messages yet. Take over the conversation to start chatting.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={clsx('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={clsx(
                            'max-w-[75%] px-3 py-2 rounded-lg shadow-sm',
                            msg.direction === 'outbound'
                              ? 'bg-[#dcf8c6] rounded-tr-none'
                              : 'bg-white rounded-tl-none'
                          )}
                        >
                          {msg.direction === 'inbound' && msg.senderName && (
                            <p className="text-xs font-semibold text-green-700 mb-0.5">{msg.senderName}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap text-surface-900">{msg.message}</p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span className="text-[10px] text-surface-400">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 border-t border-surface-100 bg-white">
                  {!selectedConversation.humanTakeover && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                      <Bot className="w-4 h-4 flex-shrink-0" />
                      <span>Bot is active. <strong>Take Over</strong> to pause the bot and reply directly. Sending a message will auto-pause the bot.</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={sendMutation.isPending || !newMessage.trim()}
                      className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-surface-400">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium text-surface-500">Select a conversation</p>
                  <p className="text-sm mt-1 text-surface-400">Pick a customer to start chatting on WhatsApp</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Customer Info Sidebar ── */}
          {selectedSessionId && customerInfo && (
            <div className="hidden lg:flex w-64 border-l border-surface-100 flex-col bg-surface-50 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Customer */}
                <div>
                  <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Customer</h4>
                  <div className="bg-white rounded-xl p-3 space-y-1.5">
                    <p className="text-sm font-medium text-surface-900">{customerInfo.customer?.name || 'Unknown'}</p>
                    <p className="text-xs text-surface-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {formatPhone(customerInfo.customer?.phone || selectedConversation?.phone)}
                    </p>
                    {customerInfo.customer?.totalOrders > 0 && (
                      <p className="text-xs text-surface-500">
                        {customerInfo.customer.totalOrders} order{customerInfo.customer.totalOrders !== 1 ? 's' : ''} placed
                      </p>
                    )}
                  </div>
                </div>

                {/* Session State */}
                <div>
                  <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Bot State</h4>
                  <div className="bg-white rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {customerInfo.session?.humanTakeover ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Paused (You)</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-surface-500">
                      Flow: <span className="font-mono text-surface-600">{customerInfo.session?.state}</span>
                    </p>
                    {customerInfo.session?.cartItems > 0 && (
                      <p className="text-xs text-surface-500 flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" />
                        {customerInfo.session.cartItems} items in cart
                      </p>
                    )}
                  </div>
                </div>

                {/* Recent Orders */}
                {customerInfo.recentOrders?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Recent Orders</h4>
                    <div className="space-y-2">
                      {customerInfo.recentOrders.map(order => (
                        <div key={order._id} className="bg-white rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-surface-900">#{order.orderNumber}</span>
                            <span className={clsx(
                              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                              order.status === 'delivered' && 'bg-green-100 text-green-700',
                              order.status === 'cancelled' && 'bg-red-100 text-red-700',
                              !['delivered', 'cancelled'].includes(order.status) && 'bg-blue-100 text-blue-700'
                            )}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-surface-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {order.totalAmount != null && ` — ₹${order.totalAmount}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
