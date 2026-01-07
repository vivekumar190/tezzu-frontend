import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

// Use environment variable for production, same origin for development
const SOCKET_URL = import.meta.env.VITE_API_URL || undefined

let socket = null

export function initSocket() {
  const { token } = useAuthStore.getState()
  
  if (!token) return null
  
  if (socket?.connected) {
    return socket
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message)
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

