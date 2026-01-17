import { useState } from 'react'
import { 
  Smartphone, 
  Globe, 
  Server, 
  Database,
  MessageCircle,
  ShoppingCart,
  MapPin,
  Users,
  Store,
  Bell,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  Zap,
  Shield,
  Clock,
  Package,
  CreditCard,
  Navigation,
  Layers,
  RefreshCw,
  Wifi,
  Cloud,
  Code,
  Terminal,
  Cpu
} from 'lucide-react'
import clsx from 'clsx'

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'customer', label: 'Customer Flow', icon: Users },
    { id: 'merchant', label: 'Merchant Flow', icon: Store },
    { id: 'technical', label: 'Technical Stack', icon: Code },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-surface-900 mb-3">
          How Tezzu Works
        </h1>
        <p className="text-surface-500 text-lg">
          Complete guide to the Tezzu platform - connecting customers with local merchants through WhatsApp and mobile app
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex bg-surface-100 rounded-2xl p-1.5 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-surface-600 hover:text-surface-900'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'customer' && <CustomerFlowSection />}
        {activeTab === 'merchant' && <MerchantFlowSection />}
        {activeTab === 'technical' && <TechnicalSection />}
      </div>
    </div>
  )
}

function OverviewSection() {
  return (
    <div className="space-y-8">
      {/* Architecture Diagram */}
      <div className="card p-8">
        <h2 className="text-xl font-bold text-surface-900 mb-6 text-center">System Architecture</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
          {/* Customer Apps */}
          <div className="space-y-4">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white text-center">
              <Smartphone className="w-10 h-10 mx-auto mb-3" />
              <h3 className="font-bold">Mobile App</h3>
              <p className="text-sm text-blue-100 mt-1">React Native / Expo</p>
            </div>
            <div className="card bg-gradient-to-br from-green-500 to-green-600 p-6 text-white text-center">
              <MessageCircle className="w-10 h-10 mx-auto mb-3" />
              <h3 className="font-bold">WhatsApp</h3>
              <p className="text-sm text-green-100 mt-1">WATI Integration</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex justify-center">
            <ArrowRight className="w-8 h-8 text-surface-300" />
          </div>
          <div className="lg:hidden flex justify-center">
            <ArrowDown className="w-8 h-8 text-surface-300" />
          </div>

          {/* Backend */}
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white text-center">
            <Server className="w-10 h-10 mx-auto mb-3" />
            <h3 className="font-bold">Backend API</h3>
            <p className="text-sm text-purple-100 mt-1">Node.js / Express</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className="px-2 py-1 bg-white/20 rounded text-xs">REST API</span>
              <span className="px-2 py-1 bg-white/20 rounded text-xs">Socket.IO</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex justify-center">
            <ArrowRight className="w-8 h-8 text-surface-300" />
          </div>
          <div className="lg:hidden flex justify-center">
            <ArrowDown className="w-8 h-8 text-surface-300" />
          </div>

          {/* Database & Services */}
          <div className="space-y-4">
            <div className="card bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white text-center">
              <Database className="w-10 h-10 mx-auto mb-3" />
              <h3 className="font-bold">MongoDB</h3>
              <p className="text-sm text-emerald-100 mt-1">Database</p>
            </div>
            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white text-center">
              <Globe className="w-10 h-10 mx-auto mb-3" />
              <h3 className="font-bold">Admin Panel</h3>
              <p className="text-sm text-orange-100 mt-1">React / Vite</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard 
          icon={<MapPin className="w-6 h-6" />}
          title="Location-Based Discovery"
          description="Customers see only merchants that deliver to their location using polygon-based delivery zones"
          color="blue"
        />
        <FeatureCard 
          icon={<MessageCircle className="w-6 h-6" />}
          title="WhatsApp Ordering"
          description="Full ordering experience through WhatsApp with WATI integration for automated responses"
          color="green"
        />
        <FeatureCard 
          icon={<Bell className="w-6 h-6" />}
          title="Real-time Updates"
          description="Push notifications and Socket.IO for live order status updates"
          color="purple"
        />
        <FeatureCard 
          icon={<Shield className="w-6 h-6" />}
          title="Cart Sync"
          description="Seamless cart synchronization between mobile app and WhatsApp"
          color="orange"
        />
      </div>

      {/* Platforms */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-surface-900 mb-6">Platform Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlatformCard 
            title="Mobile App (Tezzu)"
            tech="React Native + Expo"
            features={[
              'Location-based restaurant discovery',
              'Browse menus & add to cart',
              'Place orders & track status',
              'Push notifications',
              'Saved addresses',
              'Order history'
            ]}
            color="blue"
          />
          <PlatformCard 
            title="WhatsApp Bot"
            tech="WATI + Custom Flows"
            features={[
              'Natural language ordering',
              'Location sharing for discovery',
              'Menu browsing via messages',
              'Order placement',
              'Status updates',
              'Cart management'
            ]}
            color="green"
          />
          <PlatformCard 
            title="Admin Dashboard"
            tech="React + Vite"
            features={[
              'Merchant management',
              'Order monitoring',
              'Delivery zone configuration',
              'Product catalog management',
              'Customer analytics',
              'Live geo tracking'
            ]}
            color="purple"
          />
        </div>
      </div>
    </div>
  )
}

function CustomerFlowSection() {
  const steps = [
    {
      step: 1,
      title: 'Open App / WhatsApp',
      description: 'Customer opens the Tezzu mobile app or sends a message on WhatsApp',
      icon: <Smartphone className="w-6 h-6" />,
      color: 'blue'
    },
    {
      step: 2,
      title: 'Share Location',
      description: 'App requests location permission or customer shares live location on WhatsApp',
      icon: <MapPin className="w-6 h-6" />,
      color: 'green'
    },
    {
      step: 3,
      title: 'Discover Restaurants',
      description: 'System shows only merchants with active delivery zones covering customer\'s location',
      icon: <Store className="w-6 h-6" />,
      color: 'purple'
    },
    {
      step: 4,
      title: 'Browse Menu',
      description: 'Customer browses categories and products, views prices and details',
      icon: <Layers className="w-6 h-6" />,
      color: 'orange'
    },
    {
      step: 5,
      title: 'Add to Cart',
      description: 'Items added to cart are synced between mobile app and WhatsApp',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'pink'
    },
    {
      step: 6,
      title: 'Checkout',
      description: 'Customer confirms order with delivery address and payment method',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'cyan'
    },
    {
      step: 7,
      title: 'Order Placed',
      description: 'Order sent to merchant via WhatsApp notification and dashboard',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'emerald'
    },
    {
      step: 8,
      title: 'Track Status',
      description: 'Real-time updates: Confirmed → Preparing → Ready → Out for Delivery → Delivered',
      icon: <Navigation className="w-6 h-6" />,
      color: 'amber'
    }
  ]

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <h2 className="text-xl font-bold text-surface-900 mb-6 text-center">Customer Journey</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              <StepCard {...step} />
              {index < steps.length - 1 && index % 4 !== 3 && (
                <ArrowRight className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300 z-10" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mode Toggle Explanation */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-surface-900 mb-4">Discovery Modes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-blue-900">Tezzu Now Mode</h3>
            </div>
            <p className="text-blue-700 text-sm">
              Only shows merchants that have active delivery zones covering the customer's current location. 
              Uses polygon intersection to match user coordinates with merchant delivery areas.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
              <CheckCircle className="w-4 h-4" />
              <span>Zone-based filtering (strict)</span>
            </div>
          </div>
          
          <div className="p-4 bg-surface-50 rounded-xl border border-surface-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-surface-500 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-surface-900">All Shops Mode</h3>
            </div>
            <p className="text-surface-600 text-sm">
              Shows all active merchants regardless of location. Useful for browsing or when customer 
              wants to see all available options. Delivery availability checked at checkout.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-surface-500">
              <Globe className="w-4 h-4" />
              <span>No location filtering</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MerchantFlowSection() {
  return (
    <div className="space-y-8">
      {/* Merchant Setup */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-surface-900 mb-6">Merchant Onboarding</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SetupStep 
            step={1}
            title="Create Merchant"
            description="Admin creates merchant account with business details, WhatsApp number"
          />
          <SetupStep 
            step={2}
            title="Configure Location"
            description="Set store coordinates and enable location-based ordering"
          />
          <SetupStep 
            step={3}
            title="Create Delivery Zones"
            description="Draw polygon zones or set radius-based circular zones"
          />
          <SetupStep 
            step={4}
            title="Add Products"
            description="Create categories and add products with prices, images"
          />
        </div>
      </div>

      {/* Delivery Zones */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-surface-900 mb-4">Delivery Zone System</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-surface-800 mb-3">Zone Configuration</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg">
                <MapPin className="w-5 h-5 text-primary-500 mt-0.5" />
                <div>
                  <p className="font-medium text-surface-900">Polygon Zones</p>
                  <p className="text-sm text-surface-500">Draw custom shapes on map for precise coverage</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg">
                <Navigation className="w-5 h-5 text-primary-500 mt-0.5" />
                <div>
                  <p className="font-medium text-surface-900">Radius Zones</p>
                  <p className="text-sm text-surface-500">Set circular zones with 3km, 5km, 10km radius</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary-500 mt-0.5" />
                <div>
                  <p className="font-medium text-surface-900">Zone Pricing</p>
                  <p className="text-sm text-surface-500">Different delivery charges per zone</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-surface-800 mb-3">Zone Status Impact</h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Active Zone
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Merchant visible to customers in this area on both app and WhatsApp
                </p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 font-medium">
                  <Clock className="w-4 h-4" />
                  Inactive Zone
                </div>
                <p className="text-sm text-amber-600 mt-1">
                  Zone exists but not used for customer matching
                </p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-medium">
                  <Shield className="w-4 h-4" />
                  No Zones
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Merchant not visible on app (only visible in "All Shops" mode)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Management */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-surface-900 mb-4">Order Status Flow</h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'].map((status, index, arr) => (
            <div key={status} className="flex items-center gap-2">
              <span className={clsx(
                'px-4 py-2 rounded-xl font-medium text-sm',
                index === 0 && 'bg-amber-100 text-amber-700',
                index === 1 && 'bg-blue-100 text-blue-700',
                index === 2 && 'bg-purple-100 text-purple-700',
                index === 3 && 'bg-cyan-100 text-cyan-700',
                index === 4 && 'bg-orange-100 text-orange-700',
                index === 5 && 'bg-green-100 text-green-700',
              )}>
                {status}
              </span>
              {index < arr.length - 1 && (
                <ArrowRight className="w-4 h-4 text-surface-300" />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-surface-500 mt-4">
          Each status change triggers push notification to customer and updates in real-time via Socket.IO
        </p>
      </div>
    </div>
  )
}

function TechnicalSection() {
  return (
    <div className="space-y-8">
      {/* Tech Stack */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TechCard 
          title="Frontend - Admin"
          items={[
            { name: 'React 18', desc: 'UI Library' },
            { name: 'Vite', desc: 'Build Tool' },
            { name: 'TailwindCSS', desc: 'Styling' },
            { name: 'React Query', desc: 'Data Fetching' },
            { name: 'React Router', desc: 'Navigation' },
            { name: 'Zustand', desc: 'State Management' },
            { name: 'Recharts', desc: 'Charts' },
            { name: 'Leaflet', desc: 'Maps' },
          ]}
          icon={<Globe className="w-6 h-6" />}
          color="orange"
        />
        <TechCard 
          title="Mobile App"
          items={[
            { name: 'React Native', desc: 'Cross-platform' },
            { name: 'Expo SDK 53', desc: 'Development' },
            { name: 'Expo Router', desc: 'Navigation' },
            { name: 'React Query', desc: 'Data Fetching' },
            { name: 'Zustand', desc: 'State Management' },
            { name: 'Socket.IO Client', desc: 'Real-time' },
            { name: 'Expo Notifications', desc: 'Push Notifications' },
            { name: 'Expo Location', desc: 'GPS' },
          ]}
          icon={<Smartphone className="w-6 h-6" />}
          color="blue"
        />
        <TechCard 
          title="Backend"
          items={[
            { name: 'Node.js', desc: 'Runtime' },
            { name: 'Express.js', desc: 'Web Framework' },
            { name: 'MongoDB', desc: 'Database' },
            { name: 'Mongoose', desc: 'ODM' },
            { name: 'Socket.IO', desc: 'WebSockets' },
            { name: 'JWT', desc: 'Authentication' },
            { name: 'WATI API', desc: 'WhatsApp' },
            { name: 'Expo Push', desc: 'Notifications' },
          ]}
          icon={<Server className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* API Endpoints */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-surface-900 mb-4">Key API Endpoints</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EndpointGroup 
            title="Authentication"
            endpoints={[
              { method: 'POST', path: '/auth/login', desc: 'Login with phone/OTP' },
              { method: 'POST', path: '/auth/verify-otp', desc: 'Verify OTP' },
              { method: 'GET', path: '/auth/me', desc: 'Get current user' },
            ]}
          />
          <EndpointGroup 
            title="Merchants"
            endpoints={[
              { method: 'GET', path: '/merchants?mode=nearby&lat&lng', desc: 'Get nearby merchants' },
              { method: 'GET', path: '/merchants?mode=all', desc: 'Get all merchants' },
              { method: 'GET', path: '/merchants/:id/menu', desc: 'Get merchant menu' },
            ]}
          />
          <EndpointGroup 
            title="Orders"
            endpoints={[
              { method: 'POST', path: '/orders', desc: 'Create new order' },
              { method: 'GET', path: '/orders/my-orders', desc: 'Get user orders' },
              { method: 'PATCH', path: '/orders/:id/status', desc: 'Update order status' },
            ]}
          />
          <EndpointGroup 
            title="Cart Sync"
            endpoints={[
              { method: 'GET', path: '/cart', desc: 'Get server-side cart' },
              { method: 'POST', path: '/cart/sync', desc: 'Sync local cart to server' },
              { method: 'POST', path: '/cart/sync-from-whatsapp', desc: 'Get WhatsApp cart' },
            ]}
          />
        </div>
      </div>

      {/* Real-time Events */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-surface-900 mb-4">Socket.IO Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-surface-50 rounded-xl">
            <h3 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-500" />
              Client → Server
            </h3>
            <div className="space-y-2 text-sm">
              <code className="block p-2 bg-white rounded border">join:customer:{'{phone}'}</code>
              <code className="block p-2 bg-white rounded border">join:merchant:{'{merchantId}'}</code>
            </div>
          </div>
          <div className="p-4 bg-surface-50 rounded-xl">
            <h3 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-blue-500" />
              Server → Client
            </h3>
            <div className="space-y-2 text-sm">
              <code className="block p-2 bg-white rounded border">order:created</code>
              <code className="block p-2 bg-white rounded border">order:status</code>
              <code className="block p-2 bg-white rounded border">cart:updated</code>
            </div>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-surface-900 mb-4">Deployment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-surface-50 rounded-xl text-center">
            <Cloud className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <h3 className="font-semibold">Backend</h3>
            <p className="text-sm text-surface-500">Render.com</p>
          </div>
          <div className="p-4 bg-surface-50 rounded-xl text-center">
            <Globe className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <h3 className="font-semibold">Admin Dashboard</h3>
            <p className="text-sm text-surface-500">Vercel / Netlify</p>
          </div>
          <div className="p-4 bg-surface-50 rounded-xl text-center">
            <Database className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold">Database</h3>
            <p className="text-sm text-surface-500">MongoDB Atlas</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function FeatureCard({ icon, title, description, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
  }

  return (
    <div className={clsx('card p-6 border-2', colors[color])}>
      <div className="mb-3">{icon}</div>
      <h3 className="font-bold text-surface-900 mb-2">{title}</h3>
      <p className="text-sm text-surface-600">{description}</p>
    </div>
  )
}

function PlatformCard({ title, tech, features, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  }

  return (
    <div className="card overflow-hidden">
      <div className={clsx('p-4 bg-gradient-to-r text-white', colors[color])}>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm opacity-80">{tech}</p>
      </div>
      <div className="p-4">
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-surface-600">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StepCard({ step, title, description, icon, color }) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
  }

  return (
    <div className="card p-4 h-full">
      <div className="flex items-center gap-3 mb-3">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-white', colors[color])}>
          {icon}
        </div>
        <span className="text-xs font-bold text-surface-400">STEP {step}</span>
      </div>
      <h3 className="font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-sm text-surface-500">{description}</p>
    </div>
  )
}

function SetupStep({ step, title, description }) {
  return (
    <div className="text-center p-4">
      <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xl font-bold mx-auto mb-3">
        {step}
      </div>
      <h3 className="font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-sm text-surface-500">{description}</p>
    </div>
  )
}

function TechCard({ title, items, icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  }

  return (
    <div className="card overflow-hidden">
      <div className={clsx('p-4 bg-gradient-to-r text-white flex items-center gap-3', colors[color])}>
        {icon}
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="font-medium text-surface-900">{item.name}</span>
              <span className="text-surface-500">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EndpointGroup({ title, endpoints }) {
  return (
    <div className="p-4 bg-surface-50 rounded-xl">
      <h3 className="font-semibold text-surface-800 mb-3">{title}</h3>
      <div className="space-y-2">
        {endpoints.map((ep, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className={clsx(
              'px-2 py-0.5 rounded text-xs font-bold',
              ep.method === 'GET' && 'bg-green-100 text-green-700',
              ep.method === 'POST' && 'bg-blue-100 text-blue-700',
              ep.method === 'PATCH' && 'bg-amber-100 text-amber-700',
              ep.method === 'DELETE' && 'bg-red-100 text-red-700',
            )}>
              {ep.method}
            </span>
            <div>
              <code className="text-surface-700">{ep.path}</code>
              <p className="text-surface-500 text-xs">{ep.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

