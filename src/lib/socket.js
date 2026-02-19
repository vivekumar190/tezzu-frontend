import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

// Use environment variable for production, same origin for development
const SOCKET_URL = import.meta.env.VITE_API_URL || undefined

let socket = null
let connectionAttempts = 0
const MAX_SILENT_ATTEMPTS = 3

export function initSocket() {
  const { token } = useAuthStore.getState()
  
  if (!token) return null
  
  if (socket?.connected) {
    return socket
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect()
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  })

  socket.on('connect', () => {
    connectionAttempts = 0
    console.log('Socket connected:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    // Only log unexpected disconnections
    if (reason !== 'io client disconnect') {
    console.log('Socket disconnected:', reason)
    }
  })

  socket.on('connect_error', (error) => {
    connectionAttempts++
    // Only log after several failed attempts to reduce noise
    if (connectionAttempts > MAX_SILENT_ATTEMPTS) {
      console.warn('Socket connection issue - will keep retrying...')
    }
  })

  // Suppress internal errors
  socket.io.on('error', () => {
    // Silent - handled by connect_error
  })

  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinMerchantRoom(merchantId) {
  if (socket?.connected) {
    socket.emit('join:merchant', merchantId)
  }
}

export function leaveMerchantRoom(merchantId) {
  if (socket?.connected) {
    socket.emit('leave:merchant', merchantId)
  }
}

export function joinWhatsAppChatRoom(merchantId) {
  if (socket?.connected) {
    socket.emit('join:whatsapp-chat', merchantId)
  }
}

export function leaveWhatsAppChatRoom(merchantId) {
  if (socket?.connected) {
    socket.emit('leave:whatsapp-chat', merchantId)
  }
}

