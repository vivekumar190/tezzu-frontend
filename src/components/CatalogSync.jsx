import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Image, 
  Store,
  Package,
  Link,
  Unlink,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  ExternalLink,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

// Catalog Setup Panel for Admins
function CatalogSetupPanel({ onSetupComplete }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const { user } = useAuthStore();
  const defaultName = user?.merchant?.name ? `${user.merchant.name} Catalog` : 'Product Catalog';
  const [catalogName, setCatalogName] = useState(defaultName);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [manualCatalogId, setManualCatalogId] = useState('');
  const queryClient = useQueryClient();

  // Fetch existing catalogs from debug endpoint (gets all accessible catalogs)
  const { data: debugData, isLoading: loadingCatalogs, error: catalogsError } = useQuery({
    queryKey: ['catalog-debug'],
    queryFn: async () => {
      const res = await api.get('/catalog/debug');
      return res.data.data;
    },
    retry: 1
  });

  const catalogs = debugData?.existingCatalogs || [];

  // Create new catalog
  const [createError, setCreateError] = useState(null);
  const createMutation = useMutation({
    mutationFn: async (name) => {
      const res = await api.post('/catalog/create', { name, autoSave: true });
      return res.data;
    },
    onSuccess: (data) => {
      setCreateError(null);
      toast.success(`Catalog "${data.data.name || catalogName}" created and configured!`);
      queryClient.invalidateQueries(['catalog-status']);
      queryClient.invalidateQueries(['catalog-list']);
      onSetupComplete?.();
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || 'Failed to create catalog';
      setCreateError(errorMsg);
      toast.error(errorMsg);
    }
  });

  // Select existing catalog
  const selectMutation = useMutation({
    mutationFn: async (catalogId) => {
      const res = await api.post('/catalog/settings', { catalogId });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Catalog configured successfully!');
      queryClient.invalidateQueries(['catalog-status']);
      onSetupComplete?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to configure catalog');
    }
  });

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Package className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Set Up WhatsApp Catalog</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create or connect a Meta Commerce Catalog to show products with images in WhatsApp
          </p>
        </div>
      </div>

      {/* Existing Catalogs */}
      {!loadingCatalogs && catalogs && catalogs.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Existing Catalog
          </label>
          <div className="flex gap-2">
            <select
              value={selectedCatalogId}
              onChange={(e) => setSelectedCatalogId(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a catalog...</option>
              {catalogs.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.product_count || 0} products) - {cat.businessName || 'Business'}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectMutation.mutate(selectedCatalogId)}
              disabled={!selectedCatalogId || selectMutation.isPending}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {selectMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Use This
            </button>
          </div>
          {debugData?.solution && (
            <p className="mt-2 text-sm text-blue-600">{debugData.solution}</p>
          )}
        </div>
      )}

      {/* Loading state */}
      {loadingCatalogs && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
          <p className="text-sm text-gray-600">Checking for existing catalogs...</p>
        </div>
      )}

      {/* No catalogs found - show helpful message */}
      {!loadingCatalogs && catalogs.length === 0 && debugData && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>No existing catalogs found.</strong> {debugData.solution}
          </p>
        </div>
      )}

      {/* Debug query error */}
      {!loadingCatalogs && catalogsError && !debugData && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            Could not check existing catalogs: {catalogsError.response?.data?.error || catalogsError.message}
          </p>
        </div>
      )}

      {/* Manual Catalog ID Entry */}
      <div className="mb-6">
        <button
          onClick={() => setShowManualEntry(!showManualEntry)}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          {showManualEntry ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Enter Catalog ID manually
        </button>
        
        {showManualEntry && (
          <div className="mt-3 bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              Find your Catalog ID at <a href="https://business.facebook.com/commerce/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta Commerce Manager</a>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCatalogId}
                onChange={(e) => setManualCatalogId(e.target.value)}
                placeholder="Enter Catalog ID (e.g., 123456789)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={() => selectMutation.mutate(manualCatalogId)}
                disabled={!manualCatalogId.trim() || selectMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {selectMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      {catalogs && catalogs.length > 0 && (
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-500">or</span>
          </div>
        </div>
      )}

      {/* Create New */}
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Catalog
        </button>
      ) : (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catalog Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={catalogName}
              onChange={(e) => setCatalogName(e.target.value)}
              placeholder="Enter catalog name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => createMutation.mutate(catalogName)}
              disabled={!catalogName.trim() || createMutation.isPending}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create
            </button>
          </div>
          <button
            onClick={() => setShowCreate(false)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error Display */}
      {createError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Setup Error
          </h4>
          <p className="text-sm text-red-700 mb-3">{createError}</p>
          
          {createError.includes('META_BUSINESS_ID') && (
            <div className="bg-white rounded p-3 text-sm">
              <p className="font-medium text-gray-900 mb-2">How to find your Business ID:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Go to <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">business.facebook.com/settings</a></li>
                <li>Click <strong>Business Info</strong> in the left sidebar</li>
                <li>Copy the <strong>Business ID</strong> (a number like 123456789)</li>
                <li>Add to your backend <code className="bg-gray-100 px-1 rounded">.env</code> file:
                  <pre className="mt-1 bg-gray-900 text-green-400 p-2 rounded text-xs">META_BUSINESS_ID=your_business_id</pre>
                </li>
                <li>Restart the backend server</li>
              </ol>
              <p className="mt-2 text-xs text-gray-500">
                ⚠️ Note: This is different from your WhatsApp Business Account ID
              </p>
            </div>
          )}
        </div>
      )}

      {/* Download CSV Option */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Alternative: Upload CSV</h4>
            <p className="text-sm text-gray-600 mt-1">
              Download your products as CSV and upload manually to Meta Commerce Manager
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="/api/catalog/export/csv"
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </a>
              <a
                href="https://business.facebook.com/commerce/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Upload to Meta
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Help Links */}
      <div className="mt-4 text-center">
        <a 
          href="https://business.facebook.com/settings/info" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Find your Business ID
        </a>
        <span className="mx-2 text-gray-300">|</span>
        <a 
          href="https://business.facebook.com/commerce/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Manage catalogs
        </a>
      </div>
    </div>
  );
}

// Catalog Status Card
function CatalogStatusCard({ status, onRefresh, isAdmin }) {
  if (!status) return null;

  const isConfigured = status.configured;
  const catalog = status.catalog;

  return (
    <div className={`rounded-xl border p-4 ${
      isConfigured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isConfigured ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {isConfigured ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              {isConfigured ? 'Catalog Connected' : 'Catalog Not Configured'}
            </h4>
            {isConfigured && catalog && (
              <p className="text-sm text-gray-600">
                {catalog.name} • {catalog.product_count || 0} products
              </p>
            )}
            {!isConfigured && !isAdmin && (
              <p className="text-sm text-yellow-700">
                Contact admin to set up Meta Commerce Catalog
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Sync Status for Merchant
function MerchantSyncStatus({ merchantId, merchantName, hasMerchantCatalog }) {
  const queryClient = useQueryClient();

  const { data: syncStatus, isLoading } = useQuery({
    queryKey: ['catalog-sync-status', merchantId],
    queryFn: async () => {
      const res = await api.get('/catalog/products/status');
      return res.data.data;
    },
    enabled: !!merchantId
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      // Use merchant-specific catalog sync if merchant has its own catalog, else global sync
      const endpoint = hasMerchantCatalog 
        ? `/catalog/sync-merchant-catalog/${merchantId}`
        : `/catalog/sync/${merchantId}`;
      const res = await api.post(endpoint);
      return res.data;
    },
    onSuccess: (data) => {
      const synced = data.data.synced || 0;
      const collections = data.data.collections || 0;
      let msg = `Synced ${synced} products to catalog`;
      if (collections > 0) msg += ` with ${collections} categories`;
      toast.success(msg);
      queryClient.invalidateQueries(['catalog-sync-status', merchantId]);
      queryClient.invalidateQueries(['catalog-status', merchantId]);
      queryClient.invalidateQueries(['products']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Sync failed');
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg h-24"></div>
    );
  }

  const syncPercentage = syncStatus?.syncPercentage || 0;
  const needsSync = syncStatus?.notSynced > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-blue-500" />
          <h4 className="font-medium text-gray-900">{merchantName || 'Your Products'}</h4>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            needsSync 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync to Catalog'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Sync Progress</span>
          <span className={`font-medium ${syncPercentage === 100 ? 'text-green-600' : 'text-blue-600'}`}>
            {syncPercentage}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              syncPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${syncPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-lg font-semibold text-gray-900">{syncStatus?.total || 0}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <p className="text-lg font-semibold text-green-600">{syncStatus?.synced || 0}</p>
          <p className="text-xs text-gray-500">Synced</p>
        </div>
        <div className={`rounded-lg p-2 ${syncStatus?.notSynced > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
          <p className={`text-lg font-semibold ${syncStatus?.notSynced > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
            {syncStatus?.notSynced || 0}
          </p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
      </div>

      {needsSync && (
        <p className="text-xs text-yellow-600 mt-3 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {syncStatus.notSynced} products not yet visible in WhatsApp catalog
        </p>
      )}
    </div>
  );
}

// Admin: All Merchants Sync
function AllMerchantsSyncPanel() {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: merchants } = useQuery({
    queryKey: ['merchants-for-sync'],
    queryFn: async () => {
      const res = await api.get('/merchants?limit=100&mode=all&includeInactive=true');
      return res.data.data.merchants;
    }
  });

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/catalog/sync');
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Synced ${data.data.synced} products, ${data.data.failed} failed`);
      queryClient.invalidateQueries(['catalog-sync-status']);
      queryClient.invalidateQueries(['catalog-status']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Sync failed');
    }
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-left">
            <h4 className="font-medium text-gray-900">All Merchants Sync</h4>
            <p className="text-sm text-gray-500">{merchants?.length || 0} merchants</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              syncAllMutation.mutate();
            }}
            disabled={syncAllMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} />
            {syncAllMutation.isPending ? 'Syncing All...' : 'Sync All'}
          </button>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && merchants && (
        <div className="border-t border-gray-200 p-4 space-y-3">
          {merchants.map((merchant) => (
            <MerchantSyncStatus 
              key={merchant._id} 
              merchantId={merchant._id}
              merchantName={merchant.name}
              hasMerchantCatalog={!!merchant.catalog?.catalogId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main CatalogSync Component
export default function CatalogSync({ merchantId, merchantName, compact = false }) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();

  const { data: catalogStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['catalog-status', merchantId],
    queryFn: async () => {
      const params = merchantId ? `?merchantId=${merchantId}` : '';
      const res = await api.get(`/catalog/status${params}`);
      return res.data.data;
    }
  });

  if (compact) {
    // Compact version for Products page
    return (
      <div className="mb-6">
        {/* Show setup panel for admins when not configured */}
        {!catalogStatus?.configured && isAdmin ? (
          <CatalogSetupPanel onSetupComplete={refetchStatus} />
        ) : (
          <>
            <CatalogStatusCard status={catalogStatus} onRefresh={refetchStatus} isAdmin={isAdmin} />
            
            {catalogStatus?.configured && merchantId && (
              <div className="mt-4">
                <MerchantSyncStatus 
                  merchantId={merchantId} 
                  merchantName={merchantName}
                  hasMerchantCatalog={!!catalogStatus?.isMerchantCatalog}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Full version for Settings page
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          📦 WhatsApp Product Catalog
        </h3>
        <p className="text-sm text-gray-500">
          Sync your products to Meta Commerce Catalog to show product images in WhatsApp
        </p>
      </div>

      {/* Show setup panel for admins when not configured */}
      {!catalogStatus?.configured && isAdmin ? (
        <CatalogSetupPanel onSetupComplete={refetchStatus} />
      ) : (
        <>
          <CatalogStatusCard status={catalogStatus} onRefresh={refetchStatus} isAdmin={isAdmin} />

          {catalogStatus?.configured && (
            <>
              {isAdmin ? (
                <AllMerchantsSyncPanel />
              ) : (
                merchantId && (
                  <MerchantSyncStatus 
                    merchantId={merchantId} 
                    merchantName={merchantName}
                    hasMerchantCatalog={!!catalogStatus?.isMerchantCatalog}
                  />
                )
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Pro Tip: Add Product Images
                </h4>
                <p className="text-sm text-blue-700">
                  Products with images look much better in WhatsApp! Add image URLs to your products 
                  for the best catalog experience.
                </p>
              </div>
            </>
          )}
        </>
      )}

      {!catalogStatus?.configured && !isAdmin && (
        <CatalogStatusCard status={catalogStatus} onRefresh={refetchStatus} isAdmin={isAdmin} />
      )}
    </div>
  );
}

// Export sub-components for flexibility
export { CatalogSetupPanel, CatalogStatusCard, MerchantSyncStatus, AllMerchantsSyncPanel };

