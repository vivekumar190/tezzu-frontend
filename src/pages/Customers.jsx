import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Search, MapPin, ShoppingBag, TrendingUp, 
  Phone, Calendar, Eye, Tag, MessageSquare, ChevronDown,
  UserCheck, Clock, IndianRupee, Filter, X, Map, RefreshCw
} from 'lucide-react';
import api from '../lib/api';

// Customer stats cards
function StatsCards({ stats }) {
  const cards = [
    { 
      label: 'Total Customers', 
      value: stats?.totalCustomers || 0, 
      icon: Users, 
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'With Orders', 
      value: stats?.customersWithOrders || 0, 
      icon: ShoppingBag, 
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    { 
      label: 'With Location', 
      value: stats?.customersWithLocation || 0, 
      icon: MapPin, 
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    { 
      label: 'Active Today', 
      value: stats?.activeToday || 0, 
      icon: UserCheck, 
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    },
    { 
      label: 'New This Week', 
      value: stats?.newThisWeek || 0, 
      icon: TrendingUp, 
      color: 'bg-cyan-500',
      bgColor: 'bg-cyan-50'
    },
    { 
      label: 'Avg. Order Value', 
      value: `₹${stats?.averageOrderValue || 0}`, 
      icon: IndianRupee, 
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className={`${card.bgColor} rounded-xl p-4 border border-gray-100`}>
          <div className="flex items-center gap-3">
            <div className={`${card.color} p-2 rounded-lg`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Customer card component
function CustomerCard({ customer, onView }) {
  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '').slice(-10);
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const hasLocation = customer.location?.coordinates?.[0] !== 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {(customer.name || 'C')[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {customer.name || 'Customer'}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {formatPhone(customer.phone)}
            </p>
          </div>
        </div>
        <button
          onClick={() => onView(customer)}
          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-lg font-semibold text-gray-900">
            {customer.stats?.totalOrders || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Total Spent</p>
          <p className="text-lg font-semibold text-gray-900">
            ₹{customer.stats?.totalSpent || 0}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Joined {formatDate(customer.createdAt)}
        </div>
        <div className="flex items-center gap-2">
          {hasLocation && (
            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <MapPin className="w-3 h-3" />
              Location
            </span>
          )}
        </div>
      </div>

      {customer.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {customer.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {customer.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{customer.tags.length - 3} more</span>
          )}
        </div>
      )}
    </div>
  );
}

// Customer detail modal
function CustomerDetailModal({ customer, onClose }) {
  const [activeTab, setActiveTab] = useState('details');
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');
  const [note, setNote] = useState(customer.notes || '');

  const { data: fullCustomer } = useQuery({
    queryKey: ['customer', customer._id],
    queryFn: () => api.get(`/customers/${customer._id}`).then(r => r.data.data),
    initialData: customer
  });

  const addTagMutation = useMutation({
    mutationFn: (tag) => api.post(`/customers/${customer._id}/tags`, { tag }),
    onSuccess: () => {
      queryClient.invalidateQueries(['customer', customer._id]);
      queryClient.invalidateQueries(['customers']);
      setNewTag('');
    }
  });

  const removeTagMutation = useMutation({
    mutationFn: (tag) => api.delete(`/customers/${customer._id}/tags/${tag}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['customer', customer._id]);
      queryClient.invalidateQueries(['customers']);
    }
  });

  const saveNoteMutation = useMutation({
    mutationFn: (note) => api.post(`/customers/${customer._id}/notes`, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries(['customer', customer._id]);
    }
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '').slice(-10);
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const hasLocation = fullCustomer.location?.coordinates?.[0] !== 0;
  const mapsLink = hasLocation 
    ? `https://maps.google.com/?q=${fullCustomer.location.coordinates[1]},${fullCustomer.location.coordinates[0]}`
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {(fullCustomer.name || 'C')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{fullCustomer.name || 'Customer'}</h2>
                <p className="text-white/80">{formatPhone(fullCustomer.phone)}</p>
                {hasLocation && fullCustomer.location?.address && (
                  <p className="text-sm text-white/70 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {fullCustomer.location.address}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{fullCustomer.stats?.totalOrders || 0}</p>
              <p className="text-xs text-white/70">Orders</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">₹{fullCustomer.stats?.totalSpent || 0}</p>
              <p className="text-xs text-white/70">Spent</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">₹{fullCustomer.stats?.averageOrderValue || 0}</p>
              <p className="text-xs text-white/70">Avg. Order</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{fullCustomer.engagement?.totalMessages || 0}</p>
              <p className="text-xs text-white/70">Messages</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex">
          {['details', 'orders', 'notes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[40vh] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Location */}
              {hasLocation && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📍 Last Known Location</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600">{fullCustomer.location.address || 'Location saved'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Updated: {formatDate(fullCustomer.location.updatedAt)}
                    </p>
                    {mapsLink && (
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                      >
                        <Map className="w-4 h-4" />
                        View on Google Maps
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Saved Addresses */}
              {fullCustomer.addresses?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📬 Saved Addresses</h4>
                  <div className="space-y-2">
                    {fullCustomer.addresses.map((addr, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-xs text-gray-500">Default</span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{addr.street}</p>
                        {addr.landmark && (
                          <p className="text-xs text-gray-400">Landmark: {addr.landmark}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">🏷️ Tags</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {fullCustomer.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => removeTagMutation.mutate(tag)}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        addTagMutation.mutate(newTag.trim());
                      }
                    }}
                  />
                  <button
                    onClick={() => newTag.trim() && addTagMutation.mutate(newTag.trim())}
                    disabled={!newTag.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Engagement */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">📊 Engagement</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">First Interaction</p>
                    <p className="text-sm font-medium">{formatDate(fullCustomer.engagement?.firstInteraction)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Last Interaction</p>
                    <p className="text-sm font-medium">{formatDate(fullCustomer.engagement?.lastInteraction)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Last Order</p>
                    <p className="text-sm font-medium">{formatDate(fullCustomer.stats?.lastOrderAt)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Customer Since</p>
                    <p className="text-sm font-medium">{formatDate(fullCustomer.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-3">
              {fullCustomer.recentOrders?.length > 0 ? (
                fullCustomer.recentOrders.map((order, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{order.merchant?.name}</p>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                      <span className="font-medium text-gray-900">₹{order.totalAmount}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No orders yet</p>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add notes about this customer..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => saveNoteMutation.mutate(note)}
                disabled={saveNoteMutation.isPending}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {saveNoteMutation.isPending ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Customers page
export default function Customers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showZoneReport, setShowZoneReport] = useState(false);
  const [filters, setFilters] = useState({
    hasOrders: false,
    hasLocation: false,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: () => api.get('/customers/stats').then(r => r.data.data)
  });

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', page, search, filters],
    queryFn: () => api.get('/customers', {
      params: {
        page,
        search,
        hasOrders: filters.hasOrders || undefined,
        hasLocation: filters.hasLocation || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      }
    }).then(r => r.data)
  });

  const { data: topCustomers } = useQuery({
    queryKey: ['top-customers'],
    queryFn: () => api.get('/customers/top?limit=5').then(r => r.data.data)
  });

  const { data: zoneReport, isLoading: zoneLoading, refetch: refetchZones } = useQuery({
    queryKey: ['zone-matching-report'],
    queryFn: () => api.get('/customers/zone-matching/report').then(r => r.data.data),
    enabled: showZoneReport
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage your customer database</p>
        </div>
        <button
          onClick={() => setShowZoneReport(!showZoneReport)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showZoneReport 
              ? 'bg-purple-500 text-white' 
              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
          }`}
        >
          <Map className="w-5 h-5" />
          Zone Matching
        </button>
      </div>

      {/* Zone Matching Report */}
      {showZoneReport && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Map className="w-5 h-5 text-purple-500" />
              Customer Zone Matching Report
            </h2>
            <button
              onClick={() => refetchZones()}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Refresh
            </button>
          </div>

          {zoneLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : zoneReport ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-3xl font-bold text-gray-900">{zoneReport.summary.totalCustomers}</p>
                  <p className="text-sm text-gray-500">Total with Location</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-3xl font-bold text-green-600">{zoneReport.summary.inZone}</p>
                  <p className="text-sm text-gray-500">In Delivery Zone</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-3xl font-bold text-red-500">{zoneReport.summary.outOfZone}</p>
                  <p className="text-sm text-gray-500">Outside Zones</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-3xl font-bold text-purple-600">{zoneReport.summary.coverage}%</p>
                  <p className="text-sm text-gray-500">Coverage Rate</p>
                </div>
              </div>

              {/* Breakdown by Zone and Merchant */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Zone Breakdown */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-3">📍 Customers by Zone</h3>
                  {zoneReport.zoneBreakdown.length > 0 ? (
                    <div className="space-y-2">
                      {zoneReport.zoneBreakdown.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.zone}</span>
                          <span className="font-medium text-gray-900">{item.customers}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No zone data available</p>
                  )}
                </div>

                {/* Merchant Breakdown */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-3">🏪 Customers per Restaurant</h3>
                  {zoneReport.merchantBreakdown.length > 0 ? (
                    <div className="space-y-2">
                      {zoneReport.merchantBreakdown.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.merchant}</span>
                          <span className="font-medium text-gray-900">{item.customers}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No merchant data available</p>
                  )}
                </div>
              </div>

              {/* Customers outside zones */}
              {zoneReport.customers.filter(c => !c.isInZone).length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-medium text-red-600 mb-3">⚠️ Customers Outside Delivery Zones</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {zoneReport.customers.filter(c => !c.isInZone).map((customer, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                        <div>
                          <span className="font-medium text-gray-900">{customer.name}</span>
                          <span className="text-gray-500 ml-2">{customer.phone}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500">{customer.stats?.totalOrders || 0} orders</span>
                          <span className="text-gray-400 mx-1">•</span>
                          <span className="text-gray-500">₹{customer.stats?.totalSpent || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Click Refresh to load zone matching data</p>
          )}
        </div>
      )}

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'border-blue-500 text-blue-500 bg-blue-50' : 'border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {(filters.hasOrders || filters.hasLocation) && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasOrders}
                onChange={(e) => {
                  setFilters({ ...filters, hasOrders: e.target.checked });
                  setPage(1);
                }}
                className="rounded text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Has Orders</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasLocation}
                onChange={(e) => {
                  setFilters({ ...filters, hasLocation: e.target.checked });
                  setPage(1);
                }}
                className="rounded text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Has Location</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Sort by:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-blue-500"
              >
                <option value="createdAt">Join Date</option>
                <option value="stats.totalOrders">Total Orders</option>
                <option value="stats.totalSpent">Total Spent</option>
                <option value="engagement.lastInteraction">Last Active</option>
              </select>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-blue-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : customersData?.data?.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customersData.data.map((customer) => (
                  <CustomerCard
                    key={customer._id}
                    customer={customer}
                    onView={setSelectedCustomer}
                  />
                ))}
              </div>

              {/* Pagination */}
              {customersData.pagination?.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {customersData.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(customersData.pagination.pages, p + 1))}
                    disabled={page === customersData.pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500">
                {search ? 'Try a different search term' : 'Customers will appear here when they start ordering'}
              </p>
            </div>
          )}
        </div>

        {/* Top Customers Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Top Customers
            </h3>
            <div className="space-y-3">
              {topCustomers?.map((customer, idx) => (
                <div
                  key={customer._id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-200 text-gray-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {customer.name || 'Customer'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {customer.stats?.totalOrders || 0} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{customer.stats?.totalSpent || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

