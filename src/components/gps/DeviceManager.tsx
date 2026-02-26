import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  Plus, Search, Car, Trash2, Edit, X, Check, Loader2,
  Hash, Phone, Tag, Layers, AlertTriangle, RefreshCw,
  Smartphone, Truck, Bus, Bike,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'default', label: 'Default', icon: Car },
  { id: 'car', label: 'Car', icon: Car },
  { id: 'truck', label: 'Truck', icon: Truck },
  { id: 'bus', label: 'Bus', icon: Bus },
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike },
  { id: 'van', label: 'Van', icon: Truck },
  { id: 'person', label: 'Person', icon: Smartphone },
];

const DeviceManager: React.FC = () => {
  const {
    devices, addDevice, editDevice, removeDevice, refreshDevices, loading,
  } = useAppContext();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUniqueId, setFormUniqueId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formCategory, setFormCategory] = useState('default');

  const resetForm = () => {
    setFormName('');
    setFormUniqueId('');
    setFormPhone('');
    setFormModel('');
    setFormCategory('default');
    setError('');
  };

  const openAddForm = () => {
    resetForm();
    setEditingId(null);
    setShowAddForm(true);
  };

  const openEditForm = (device: typeof devices[0]) => {
    setFormName(device.name);
    setFormUniqueId(device.uniqueId);
    setFormPhone(device.phone);
    setFormModel(device.model);
    setFormCategory(device.category);
    setEditingId(device.id);
    setShowAddForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUniqueId.trim()) {
      setError('Device name and identifier are required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await editDevice(editingId, {
          name: formName,
          uniqueId: formUniqueId,
          phone: formPhone,
          model: formModel,
          category: formCategory,
        });
        setSuccess(`Device "${formName}" updated successfully`);
      } else {
        await addDevice({
          name: formName,
          uniqueId: formUniqueId,
          phone: formPhone,
          model: formModel,
          category: formCategory,
        });
        setSuccess(`Device "${formName}" added successfully`);
      }
      setShowAddForm(false);
      resetForm();
      setEditingId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save device. Please check the identifier is unique.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSubmitting(true);
    try {
      await removeDevice(id);
      setConfirmDeleteId(null);
      setSuccess('Device deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete device');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDevices();
    setRefreshing(false);
  };

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.uniqueId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Device Management</h2>
          <p className="text-sm text-gray-500">Add, edit, and manage GPS tracking devices on the server</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openAddForm}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* How to Add Device Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">How to Add a GPS Device</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Create Device Here</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Click "Add Device" and enter a name and unique identifier (IMEI number from your GPS tracker).</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Configure the Tracker</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Set your GPS tracker to send data to: <span className="font-mono font-semibold">gps.waltapharmaceuticals.pro.et</span> on port <span className="font-mono font-semibold">5055</span> (or the port matching your device protocol).</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Start Tracking</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Once the tracker sends its first position, the device will appear as "online" and you can track it in real-time.</p>
            </div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Common Ports:</strong> 5055 (Osmand/TrackerCar), 5001 (TK103), 5013 (H02), 5023 (Teltonika), 5027 (Coban GPS306), 5093 (GT06).
            The unique identifier must match the IMEI or device ID programmed in your GPS tracker.
          </p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Device' : 'Add New Device'}
            </h3>
            <button onClick={() => { setShowAddForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Device Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g., Delivery Van #001"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Unique Identifier (IMEI) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formUniqueId}
                    onChange={e => setFormUniqueId(e.target.value)}
                    placeholder="e.g., 353456789012345"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">This must match the IMEI or ID configured on your GPS tracker device</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">SIM Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="e.g., +251911234567"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Model / Description</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formModel}
                    onChange={e => setFormModel(e.target.value)}
                    placeholder="e.g., Toyota Hilux"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormCategory(cat.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        formCategory === cat.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setEditingId(null); }}
                className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {editingId ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingId ? 'Update Device' : 'Add Device'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search devices by name, IMEI, or model..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Device Count */}
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-900 dark:text-white">{filteredDevices.length}</span> devices registered
      </p>

      {/* Device List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filteredDevices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Device</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Identifier</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Category</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Phone</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Last Update</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map(device => (
                  <tr
                    key={device.id}
                    className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          device.status === 'online' ? 'bg-green-50 dark:bg-green-900/20' :
                          device.status === 'idle' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                          'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <Car className={`w-4.5 h-4.5 ${
                            device.status === 'online' ? 'text-green-600' :
                            device.status === 'idle' ? 'text-yellow-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</p>
                          <p className="text-[10px] text-gray-500">{device.model || '--'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                        {device.uniqueId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">{device.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{device.phone || '--'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                        device.status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        device.status === 'idle' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {device.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditForm(device)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit device"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === device.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(device.id)}
                              disabled={submitting}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              title="Confirm delete"
                            >
                              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(device.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete device"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {searchQuery ? 'No devices found' : 'No devices registered'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'Add your first GPS tracking device to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddForm}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Device
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceManager;
