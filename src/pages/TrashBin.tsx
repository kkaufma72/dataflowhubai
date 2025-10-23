import React, { useState } from 'react';
import { useTrashBin } from '../hooks/useTrashBin';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Clock,
  Database,
  Cpu,
  Filter,
  Search,
  X,
} from 'lucide-react';

const TrashBin: React.FC = () => {
  const {
    trashItems,
    loading,
    restoreItem,
    permanentlyDelete,
    emptyTrash,
    getDaysUntilExpiration,
  } = useTrashBin();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [emptyingTrash, setEmptyingTrash] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const filteredItems = trashItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.item_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'dataset':
        return <Database className="h-5 w-5 text-blue-600" />;
      case 'model':
        return <Cpu className="h-5 w-5 text-purple-600" />;
      default:
        return <Trash2 className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleRestore = async (id: string) => {
    setRestoring(id);
    try {
      await restoreItem(id);
    } catch (error) {
      console.error('Failed to restore:', error);
      alert('Failed to restore item. Please try again.');
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setDeleting(id);
    try {
      await permanentlyDelete(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to permanently delete item. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptyingTrash(true);
    try {
      await emptyTrash();
      setShowEmptyConfirm(false);
    } catch (error) {
      console.error('Failed to empty trash:', error);
      alert('Failed to empty trash. Please try again.');
    } finally {
      setEmptyingTrash(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Trash2 className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trash Bin</h1>
              <p className="text-gray-600">
                {trashItems.length} {trashItems.length === 1 ? 'item' : 'items'} • Items auto-delete after 30 days
              </p>
            </div>
          </div>

          {trashItems.length > 0 && (
            <button
              onClick={() => setShowEmptyConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 className="h-4 w-4" />
              Empty Trash
            </button>
          )}
        </div>

        {/* Warning Banner */}
        {trashItems.some(item => getDaysUntilExpiration(item.expires_at) <= 3) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">Items Expiring Soon</h3>
              <p className="text-sm text-yellow-700">
                Some items will be permanently deleted in the next 3 days. Restore them now if you need them.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      {trashItems.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search trash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="dataset">Datasets</option>
              <option value="model">Models</option>
            </select>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || filterType !== 'all' ? 'No items found' : 'Trash is empty'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Deleted datasets and models will appear here for 30 days before being permanently deleted.'}
          </p>
        </div>
      )}

      {/* Trash Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const daysLeft = getDaysUntilExpiration(item.expires_at);
          const isExpiringSoon = daysLeft <= 7;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-lg border-2 p-4 transition-all ${
                isExpiringSoon ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                    {getIcon(item.item_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.item_name}
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                        {item.item_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          Deleted {new Date(item.deleted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 ${isExpiringSoon ? 'text-yellow-700 font-medium' : ''}`}>
                        <AlertTriangle className={`h-4 w-4 ${isExpiringSoon ? '' : 'opacity-0'}`} />
                        <span>
                          {daysLeft === 0
                            ? 'Expires today'
                            : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRestore(item.id)}
                    disabled={restoring === item.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {restoring === item.id ? 'Restoring...' : 'Restore'}
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(item.id)}
                    disabled={deleting === item.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Forever
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Permanently Delete?</h2>
            </div>

            <p className="text-gray-600 mb-6">
              This action cannot be undone. The item will be permanently deleted and cannot be restored.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleting !== null}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePermanentDelete(showDeleteConfirm)}
                disabled={deleting !== null}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Empty Trash?</h2>
            </div>

            <p className="text-gray-600 mb-2">
              This will permanently delete all {trashItems.length} items in the trash.
            </p>
            <p className="text-red-600 font-medium mb-6">
              This action cannot be undone!
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                disabled={emptyingTrash}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={emptyingTrash}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {emptyingTrash ? 'Emptying...' : 'Empty Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashBin;
