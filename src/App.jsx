import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import StaffLayout from './components/StaffLayout'
import Login from './pages/Login'
import StaffLogin from './pages/StaffLogin'
import Dashboard from './pages/Dashboard'
import Merchants from './pages/Merchants'
import MerchantDetail from './pages/MerchantDetail'
import MyShop from './pages/MyShop'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Users from './pages/Users'
import Staff from './pages/Staff'
import Leads from './pages/Leads'
import GeoMap from './pages/GeoMap'
import Customers from './pages/Customers'
import Settings from './pages/Settings'
import LiveChat from './pages/LiveChat'
import HowItWorks from './pages/HowItWorks'
import DemoSettings from './pages/DemoSettings'
import StaffOrders from './pages/StaffOrders'
import StaffProfile from './pages/StaffProfile'
import OrderFlowBuilder from './pages/OrderFlowBuilder'
import ChatFlowBuilder from './pages/ChatFlowBuilder'
import RazorpayAdmin from './pages/RazorpayAdmin'
import BillingAdmin from './pages/BillingAdmin'
import MerchantProfile from './pages/MerchantProfile'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50">
          <div className="card p-8 max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Something went wrong</h2>
            <p className="text-surface-500 mb-6">An unexpected error occurred. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function ProtectedRoute({ children, staffOnly = false }) {
  const { isAuthenticated, isLoading, token, user, _hasHydrated } = useAuthStore()
  
  // Show loading while hydrating or verifying auth
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-500">Loading...</p>
        </div>
      </div>
    )
  }
  
  // After hydration, check if authenticated
  if (isAuthenticated && user) {
    // Staff-only routes check
    if (staffOnly && user.role !== 'staff') {
      return <Navigate to="/" replace />
    }
    // Admin/merchant routes - redirect staff to staff portal
    if (!staffOnly && user.role === 'staff') {
      return <Navigate to="/staff/orders" replace />
    }
    return children
  }
  
  // Not authenticated - redirect to appropriate login
  if (staffOnly) {
    return <Navigate to="/staff/login" replace />
  }
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Admin/Merchant Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Staff Portal Routes */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff" element={
          <ProtectedRoute staffOnly>
            <StaffLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/staff/orders" replace />} />
          <Route path="orders" element={<StaffOrders />} />
          <Route path="profile" element={<StaffProfile />} />
        </Route>
        
        {/* Admin/Merchant Dashboard Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="merchants" element={<Merchants />} />
          <Route path="merchants/:id" element={<MerchantDetail />} />
          <Route path="my-shop" element={<MyShop />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="staff-management" element={<Staff />} />
          <Route path="order-flow" element={<OrderFlowBuilder />} />
          <Route path="chat-flow" element={<ChatFlowBuilder />} />
          <Route path="users" element={<Users />} />
          <Route path="leads" element={<Leads />} />
          <Route path="live-chat" element={<LiveChat />} />
          <Route path="geo-map" element={<GeoMap />} />
          <Route path="customers" element={<Customers />} />
          <Route path="settings" element={<Settings />} />
          <Route path="razorpay" element={<RazorpayAdmin />} />
          <Route path="billing" element={<BillingAdmin />} />
          <Route path="profile" element={<MerchantProfile />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="demo-settings" element={<DemoSettings />} />
        </Route>     
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

