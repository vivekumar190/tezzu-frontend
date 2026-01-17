import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, Users, Store, Layers, RefreshCw, Clock, ShoppingCart, 
  Navigation, Eye, EyeOff, Zap, TrendingUp, Target, Phone,
  ChevronRight, Activity, Globe, Crosshair
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color, emoji) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-size: 16px;
    ">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const userIcon = createCustomIcon('#3B82F6', '👤');
const userActiveIcon = createCustomIcon('#22C55E', '🛒');
const merchantIcon = createCustomIcon('#F97316', '🏪');
const merchantClosedIcon = createCustomIcon('#6B7280', '🏪');

// Map center controller
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 12);
    }
  }, [center, zoom, map]);
  return null;
}

export default function GeoMap() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showUsers, setShowUsers] = useState(true);
  const [showMerchants, setShowMerchants] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [timeRange, setTimeRange] = useState(24);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Delhi default
  const [mapZoom, setMapZoom] = useState(11);
  const [sidebarTab, setSidebarTab] = useState('users');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, merchantsRes, statsRes] = await Promise.all([
        api.get(`/geo/active-users?hours=${timeRange}`),
        api.get('/geo/merchants'),
        api.get('/geo/stats')
      ]);

      const users = usersRes.data.data?.users || [];
      const mers = merchantsRes.data.data?.merchants || [];
      
      setActiveUsers(users);
      setMerchants(mers);
      setStats(statsRes.data.data);

      // Auto-center map on first load
      if (users.length > 0 || mers.length > 0) {
        const allPoints = [
          ...users.map(u => u.location),
          ...mers.filter(m => m.location).map(m => m.location)
        ].filter(Boolean);
        
        if (allPoints.length > 0) {
          const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
          const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;
          setMapCenter([avgLat, avgLng]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch geo data:', error);
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000 / 60;
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  const getStateColor = (state) => {
    const colors = {
      'VIEWING_CART': 'bg-emerald-500',
      'BROWSING_MENU': 'bg-blue-500',
      'SELECTING_MERCHANT': 'bg-purple-500',
      'CONFIRMING_ORDER': 'bg-amber-500',
      'IDLE': 'bg-gray-400',
    };
    return colors[state] || 'bg-gray-400';
  };

  const getStateBadge = (state) => {
    const badges = {
      'VIEWING_CART': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Cart' },
      'BROWSING_MENU': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Browsing' },
      'SELECTING_MERCHANT': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Selecting' },
      'CONFIRMING_ORDER': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Ordering' },
      'ADDING_ITEMS': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Adding' },
      'IDLE': { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Idle' },
    };
    return badges[state] || badges['IDLE'];
  };

  // Zone colors
  const zoneColors = [
    { fill: '#3B82F6', stroke: '#1D4ED8' },
    { fill: '#22C55E', stroke: '#15803D' },
    { fill: '#F97316', stroke: '#C2410C' },
    { fill: '#8B5CF6', stroke: '#6D28D9' },
    { fill: '#EC4899', stroke: '#BE185D' },
  ];

  const focusOnUser = (user) => {
    setSelectedUser(user);
    setSelectedMerchant(null);
    if (user.location) {
      setMapCenter([user.location.lat, user.location.lng]);
      setMapZoom(15);
    }
  };

  const focusOnMerchant = (merchant) => {
    setSelectedMerchant(merchant);
    setSelectedUser(null);
    if (merchant.location) {
      setMapCenter([merchant.location.lat, merchant.location.lng]);
      setMapZoom(14);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-primary-600" />
            Live Geo Tracking
          </h1>
          <p className="text-surface-500 mt-1">Real-time customer locations & delivery zones</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range */}
          <div className="flex items-center gap-2 bg-surface-100 rounded-xl p-1">
            {[1, 6, 24, 72].map((h) => (
              <button
                key={h}
                onClick={() => setTimeRange(h)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  timeRange === h 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-surface-600 hover:text-surface-900'
                )}
              >
                {h}h
              </button>
            ))}
          </div>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 shadow-lg shadow-primary-500/25 transition-all"
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatPill icon={<Activity className="w-4 h-4" />} label="Active Now" value={stats.activeToday} color="blue" />
          <StatPill icon={<MapPin className="w-4 h-4" />} label="Total Located" value={stats.totalUsersWithLocation} color="green" />
          <StatPill icon={<TrendingUp className="w-4 h-4" />} label="This Week" value={stats.activeThisWeek} color="purple" />
          <StatPill icon={<Store className="w-4 h-4" />} label="Zone Merchants" value={stats.merchantsWithZones} color="orange" />
          <StatPill icon={<Target className="w-4 h-4" />} label="Total Zones" value={stats.totalZones} color="pink" />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 grid lg:grid-cols-4 gap-4 min-h-0">
        {/* Map */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-surface-200 overflow-hidden relative">
          {/* Map Controls Overlay */}
          <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-2 flex flex-col gap-1">
              <ToggleButton 
                active={showUsers} 
                onClick={() => setShowUsers(!showUsers)}
                icon={<Users className="w-4 h-4" />}
                label={`Users (${activeUsers.length})`}
                color="blue"
              />
              <ToggleButton 
                active={showMerchants} 
                onClick={() => setShowMerchants(!showMerchants)}
                icon={<Store className="w-4 h-4" />}
                label={`Merchants (${merchants.length})`}
                color="orange"
              />
              <ToggleButton 
                active={showZones} 
                onClick={() => setShowZones(!showZones)}
                icon={<Layers className="w-4 h-4" />}
                label="Zones"
                color="green"
              />
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3">
            <p className="text-xs font-semibold text-surface-600 mb-2">Legend</p>
            <div className="space-y-1.5">
              <LegendItem color="#3B82F6" emoji="👤" label="Browsing User" />
              <LegendItem color="#22C55E" emoji="🛒" label="Active Cart" />
              <LegendItem color="#F97316" emoji="🏪" label="Merchant (Open)" />
              <LegendItem color="#6B7280" emoji="🏪" label="Merchant (Closed)" />
            </div>
          </div>

          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Delivery Zones */}
            {showZones && merchants.map((merchant, mIdx) => 
              merchant.zones?.map((zone, zIdx) => {
                if (!zone.coordinates || zone.coordinates.length < 3) return null;
                const color = zoneColors[(mIdx + zIdx) % zoneColors.length];
                return (
                  <Polygon
                    key={`${merchant.id}-${zone.id}`}
                    positions={zone.coordinates.map(c => [c.lat, c.lng])}
                    pathOptions={{
                      color: color.stroke,
                      fillColor: color.fill,
                      fillOpacity: 0.15,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-1">
                        <p className="font-semibold">{zone.name}</p>
                        <p className="text-sm text-gray-600">{merchant.name}</p>
                        <div className="mt-2 text-xs space-y-1">
                          <p>💰 Delivery: ₹{zone.deliveryCharge || 0}</p>
                          <p>⏱️ Time: {zone.estimatedTime || 30} mins</p>
                          <p>📦 Min Order: ₹{zone.minimumOrder || 0}</p>
                        </div>
                      </div>
                    </Popup>
                  </Polygon>
                );
              })
            )}

            {/* Merchant Markers */}
            {showMerchants && merchants.map((merchant) => {
              if (!merchant.location) return null;
              return (
                <Marker
                  key={merchant.id}
                  position={[merchant.location.lat, merchant.location.lng]}
                  icon={merchant.acceptingOrders ? merchantIcon : merchantClosedIcon}
                  eventHandlers={{
                    click: () => focusOnMerchant(merchant),
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[180px]">
                      <p className="font-bold text-lg">{merchant.name}</p>
                      <p className={clsx(
                        'text-xs font-medium mt-1',
                        merchant.acceptingOrders ? 'text-green-600' : 'text-red-500'
                      )}>
                        {merchant.acceptingOrders ? '● Open for Orders' : '● Currently Closed'}
                      </p>
                      {merchant.address && (
                        <p className="text-sm text-gray-600 mt-2">
                          {typeof merchant.address === 'string' 
                            ? merchant.address 
                            : merchant.address.street || merchant.address.city || 'Address on file'}
                        </p>
                      )}
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          {merchant.zones?.length || 0} delivery zone(s)
                        </p>
                        {merchant.useLocationBasedOrdering && (
                          <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                            <Crosshair className="w-3 h-3" /> Location-based
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* User Markers */}
            {showUsers && activeUsers.map((user) => {
              if (!user.location) return null;
              const hasCart = user.cartItems > 0;
              return (
                <Marker
                  key={user.id}
                  position={[user.location.lat, user.location.lng]}
                  icon={hasCart ? userActiveIcon : userIcon}
                  eventHandlers={{
                    click: () => focusOnUser(user),
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[160px]">
                      <p className="font-bold">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.phone}</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTime(user.location.updatedAt)}
                        </p>
                        {user.cartItems > 0 && (
                          <p className="flex items-center gap-1 text-green-600">
                            <ShoppingCart className="w-3 h-3" /> {user.cartItems} items in cart
                          </p>
                        )}
                        {user.currentMerchant && (
                          <p className="flex items-center gap-1 text-orange-600">
                            <Store className="w-3 h-3" /> {user.currentMerchant}
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Highlight selected user with circle */}
            {selectedUser?.location && (
              <Circle
                center={[selectedUser.location.lat, selectedUser.location.lng]}
                radius={200}
                pathOptions={{
                  color: '#3B82F6',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 5',
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div className="bg-white rounded-2xl shadow-xl border border-surface-200 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-surface-100">
            <button
              onClick={() => setSidebarTab('users')}
              className={clsx(
                'flex-1 py-3 text-sm font-medium transition-colors',
                sidebarTab === 'users' 
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' 
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              <Users className="w-4 h-4 inline mr-1.5" />
              Users ({activeUsers.length})
            </button>
            <button
              onClick={() => setSidebarTab('merchants')}
              className={clsx(
                'flex-1 py-3 text-sm font-medium transition-colors',
                sidebarTab === 'merchants' 
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' 
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              <Store className="w-4 h-4 inline mr-1.5" />
              Merchants ({merchants.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'users' ? (
              activeUsers.length === 0 ? (
                <EmptyState 
                  icon={<MapPin className="w-12 h-12" />}
                  title="No active users"
                  subtitle={`in the last ${timeRange} hours`}
                />
              ) : (
                <div className="divide-y divide-surface-100">
                  {activeUsers.map((user) => (
                    <UserCard 
                      key={user.id} 
                      user={user} 
                      selected={selectedUser?.id === user.id}
                      onClick={() => focusOnUser(user)}
                      formatTime={formatTime}
                      getStateBadge={getStateBadge}
                    />
                  ))}
                </div>
              )
            ) : (
              merchants.length === 0 ? (
                <EmptyState 
                  icon={<Store className="w-12 h-12" />}
                  title="No merchants"
                  subtitle="Add merchants to see them here"
                />
              ) : (
                <div className="divide-y divide-surface-100">
                  {merchants.map((merchant) => (
                    <MerchantCard 
                      key={merchant.id} 
                      merchant={merchant}
                      selected={selectedMerchant?.id === merchant.id}
                      onClick={() => focusOnMerchant(merchant)}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Pill Component
function StatPill({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    pink: 'bg-pink-50 text-pink-600 border-pink-200',
  };

  return (
    <div className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl border', colors[color])}>
      {icon}
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs opacity-75">{label}</p>
      </div>
    </div>
  );
}

// Toggle Button
function ToggleButton({ active, onClick, icon, label, color }) {
  const colors = {
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all w-full',
        active ? 'bg-surface-100 text-surface-900' : 'text-surface-400 hover:bg-surface-50'
      )}
    >
      <div className={clsx('w-3 h-3 rounded-full transition-all', active ? colors[color] : 'bg-surface-300')} />
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
    </button>
  );
}

// Legend Item
function LegendItem({ color, emoji, label }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div 
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-white shadow"
        style={{ background: color }}
      >
        {emoji}
      </div>
      <span className="text-surface-600">{label}</span>
    </div>
  );
}

// Empty State
function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="text-surface-300 mb-3">{icon}</div>
      <p className="font-medium text-surface-600">{title}</p>
      <p className="text-sm text-surface-400">{subtitle}</p>
    </div>
  );
}

// User Card
function UserCard({ user, selected, onClick, formatTime, getStateBadge }) {
  const badge = getStateBadge(user.state);
  
  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-4 cursor-pointer transition-all hover:bg-surface-50',
        selected && 'bg-blue-50 border-l-4 border-l-blue-500'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
            user.cartItems > 0 ? 'bg-emerald-500' : 'bg-blue-500'
          )}>
            {user.name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-medium text-surface-900 text-sm">{user.name}</p>
            <p className="text-xs text-surface-400">{user.phone}</p>
          </div>
        </div>
        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', badge.bg, badge.text)}>
          {badge.label}
        </span>
      </div>
      
      <div className="ml-10 space-y-1">
        <p className="text-xs text-surface-500 flex items-center gap-1.5">
          <Navigation className="w-3 h-3" />
          {user.location?.name || `${user.location?.lat?.toFixed(4)}, ${user.location?.lng?.toFixed(4)}`}
        </p>
        <div className="flex items-center gap-3 text-xs text-surface-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatTime(user.location?.updatedAt)}
          </span>
          {user.cartItems > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShoppingCart className="w-3 h-3" /> {user.cartItems}
            </span>
          )}
        </div>
        {user.currentMerchant && (
          <p className="text-xs text-orange-600 flex items-center gap-1 font-medium">
            <Store className="w-3 h-3" /> {user.currentMerchant}
          </p>
        )}
      </div>
    </div>
  );
}

// Merchant Card
function MerchantCard({ merchant, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-4 cursor-pointer transition-all hover:bg-surface-50',
        selected && 'bg-orange-50 border-l-4 border-l-orange-500'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-lg',
            merchant.acceptingOrders ? 'bg-orange-500' : 'bg-gray-400'
          )}>
            🏪
          </div>
          <div>
            <p className="font-medium text-surface-900 text-sm">{merchant.name}</p>
            <p className="text-xs text-surface-400">
              {typeof merchant.address === 'string' 
                ? merchant.address 
                : (merchant.address?.city || merchant.address?.street || 'No address')}
            </p>
          </div>
        </div>
        <span className={clsx(
          'px-2 py-0.5 rounded-full text-xs font-medium',
          merchant.acceptingOrders 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-red-100 text-red-700'
        )}>
          {merchant.acceptingOrders ? 'Open' : 'Closed'}
        </span>
      </div>
      
      <div className="ml-10 space-y-1.5">
        {merchant.location ? (
          <p className="text-xs text-surface-500 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-green-500" />
            {merchant.location.lat.toFixed(4)}, {merchant.location.lng.toFixed(4)}
          </p>
        ) : (
          <p className="text-xs text-surface-400 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> No location set
          </p>
        )}
        
        <div className="flex items-center gap-3">
          <span className={clsx(
            'text-xs flex items-center gap-1',
            merchant.zones?.length > 0 ? 'text-purple-600' : 'text-surface-400'
          )}>
            <Layers className="w-3 h-3" /> {merchant.zones?.length || 0} zones
          </span>
          {merchant.useLocationBasedOrdering && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <Crosshair className="w-3 h-3" /> Location-based
            </span>
          )}
        </div>

        {merchant.zones?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {merchant.zones.slice(0, 3).map((zone, idx) => (
              <span
                key={zone.id || idx}
                className={clsx(
                  'px-1.5 py-0.5 rounded text-[10px]',
                  zone.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                )}
              >
                {zone.name}
              </span>
            ))}
            {merchant.zones.length > 3 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-100 text-surface-500">
                +{merchant.zones.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
