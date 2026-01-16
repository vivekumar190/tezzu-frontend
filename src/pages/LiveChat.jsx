import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, User, Clock, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react'
import api from '../lib/api'
import clsx from 'clsx'

export default function LiveChat() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [stats, setStats] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const messagesEndRef = useRef(null)
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    fetchConversations()
    fetchStats()
    // Poll for new conversations every 10 seconds
    const interval = setInterval(() => {
      fetchConversations()
      fetchStats()
    }, 10000)
    return () => clearInterval(interval)
  }, [statusFilter])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversationId)
      // Poll for new messages every 5 seconds when a conversation is selected
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(selectedConversation.conversationId)
      }, 5000)
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [selectedConversation?.conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      const { data } = await api.get(`/chat/conversations?${params.toString()}`)
      setConversations(data.data.conversations)
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/chat/stats')
      setStats(data.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`)
      setMessages(data.data.messages)
      // Update selected conversation with latest data
      if (data.data.conversation) {
        setSelectedConversation(data.data.conversation)
      }
      // Refresh conversations to update unread counts
      fetchConversations()
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || isSending) return

    setIsSending(true)
    try {
      const { data } = await api.post(`/chat/conversations/${selectedConversation.conversationId}/reply`, {
        message: newMessage
      })
      setMessages([...messages, data.data.message])
      setNewMessage('')
      fetchConversations()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleStatusChange = async (status) => {
    if (!selectedConversation) return
    try {
      await api.patch(`/chat/conversations/${selectedConversation.conversationId}`, { status })
      setSelectedConversation({ ...selectedConversation, status })
      fetchConversations()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const filteredConversations = conversations.filter(conv =>
    conv.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.visitorEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Live Chat</h1>
          <p className="text-surface-500 mt-1">Respond to visitor queries from the website</p>
        </div>
        <button
          onClick={() => { fetchConversations(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2 bg-surface-100 hover:bg-surface-200 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-surface-100">
          <div className="text-2xl font-bold text-surface-900">{stats.totalConversations || 0}</div>
          <div className="text-sm text-surface-500">Total Chats</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-surface-100">
          <div className="text-2xl font-bold text-green-600">{stats.activeConversations || 0}</div>
          <div className="text-sm text-surface-500">Active</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-surface-100">
          <div className="text-2xl font-bold text-orange-600">{stats.unreadMessages || 0}</div>
          <div className="text-sm text-surface-500">Unread Messages</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-surface-100">
          <div className="text-2xl font-bold text-blue-600">{stats.todayConversations || 0}</div>
          <div className="text-sm text-surface-500">Today</div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden" style={{ height: 'calc(100vh - 320px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-surface-100 flex flex-col">
            {/* Search & Filter */}
            <div className="p-4 border-b border-surface-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-surface-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.conversationId}
                    onClick={() => setSelectedConversation(conv)}
                    className={clsx(
                      'w-full p-4 text-left border-b border-surface-50 hover:bg-surface-50 transition-colors',
                      selectedConversation?.conversationId === conv.conversationId && 'bg-primary-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                        {conv.visitorName?.charAt(0) || 'V'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-surface-900 truncate">
                            {conv.visitorName || 'Visitor'}
                          </span>
                          <span className="text-xs text-surface-400">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-surface-500 truncate mt-0.5">
                          {conv.lastMessage || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={clsx(
                            'text-xs px-2 py-0.5 rounded-full',
                            conv.status === 'active' && 'bg-green-100 text-green-700',
                            conv.status === 'pending' && 'bg-orange-100 text-orange-700',
                            conv.status === 'closed' && 'bg-surface-100 text-surface-600'
                          )}>
                            {conv.status}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
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

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                      {selectedConversation.visitorName?.charAt(0) || 'V'}
                    </div>
                    <div>
                      <h3 className="font-medium text-surface-900">
                        {selectedConversation.visitorName || 'Visitor'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-surface-500">
                        {selectedConversation.visitorEmail && (
                          <span>{selectedConversation.visitorEmail}</span>
                        )}
                        {selectedConversation.visitorPhone && (
                          <span>• {selectedConversation.visitorPhone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange('closed')}
                      className={clsx(
                        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                        selectedConversation.status === 'closed'
                          ? 'bg-surface-200 text-surface-600'
                          : 'bg-surface-100 hover:bg-red-100 hover:text-red-600'
                      )}
                    >
                      <XCircle className="w-4 h-4" />
                      Close
                    </button>
                    <button
                      onClick={() => handleStatusChange('active')}
                      className={clsx(
                        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                        selectedConversation.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-surface-100 hover:bg-green-100 hover:text-green-600'
                      )}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Active
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-50">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={clsx(
                        'flex',
                        msg.sender === 'admin' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={clsx(
                          'max-w-[70%] px-4 py-3 rounded-2xl',
                          msg.sender === 'admin'
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-white text-surface-900 rounded-bl-md shadow-sm'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <div className={clsx(
                          'flex items-center gap-1 mt-1 text-xs',
                          msg.sender === 'admin' ? 'text-primary-200' : 'text-surface-400'
                        )}>
                          <Clock className="w-3 h-3" />
                          {formatTime(msg.createdAt)}
                          {msg.sender === 'admin' && msg.adminId && (
                            <span className="ml-2">• {msg.adminId.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-surface-100 bg-white">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !newMessage.trim()}
                      className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-surface-400">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a conversation to start replying</p>
                  <p className="text-sm mt-1">Messages from website visitors will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

