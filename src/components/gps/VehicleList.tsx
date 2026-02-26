import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  Car, Search, Grid3X3, List, Gauge, Battery, Fuel, MapPin,
  Clock, ChevronRight, User,
} from 'lucide-react';

import { timeAgoString } from '@/data/gpsData';

const VehicleList: React.FC = () => {
  const {
    filteredDevices, positions, searchQuery, setSearchQuery,
    statusFilter, setStatusFilter, setSelectedDeviceId, setCurrentView,
  } = useAppContext();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'speed' | 'battery' | 'lastUpdate'>('name');

  const sortedDevices = [...filteredDevices].sort((a, b) => {
    switch (sortBy) {
      case 'speed': {
        const posA = positions.find(p => p.deviceId === a.id);
        const posB = positions.find(p => p.deviceId === b.id);
        return (posB?.speed || 0) - (posA?.speed || 0);
      }
      case 'battery':
        return (b.attributes.batteryLevel || 0) - (a.attributes.batteryLevel || 0);
      case 'lastUpdate':
        return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleViewDetails = (deviceId: number) => {
    setSelectedDeviceId(deviceId);
    setCurrentView('vehicle-detail');
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, driver, IMEI..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['all', 'online', 'idle', 'offline'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="name">Sort: Name</option>
            <option value="speed">Sort: Speed</option>
            <option value="battery">Sort: Battery</option>
            <option value="lastUpdate">Sort: Last Update</option>
          </select>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>
              <Grid3X3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>
              <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-900 dark:text-white">{sortedDevices.length}</span> vehicles
      </p>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {sortedDevices.map(device => {
            const pos = positions.find(p => p.deviceId === device.id);
            return (
              <div
                key={device.id}
                onClick={() => handleViewDetails(device.id)}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <div className={`h-1 ${
                  device.status === 'online' ? 'bg-green-500' :
                  device.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        device.status === 'online' ? 'bg-green-50 dark:bg-green-900/20' :
                        device.status === 'idle' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                        'bg-red-50 dark:bg-red-900/20'
                      }`}>
                        <Car className={`w-5 h-5 ${
                          device.status === 'online' ? 'text-green-600' :
                          device.status === 'idle' ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{device.name}</h3>
                        <p className="text-[11px] text-gray-500">{device.model || device.uniqueId}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                      device.status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      device.status === 'idle' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {device.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {device.attributes.driver && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3.5 h-3.5" />
                        <span>{device.attributes.driver}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{pos?.address || `${pos?.latitude?.toFixed(4) || '--'}, ${pos?.longitude?.toFixed(4) || '--'}`}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Gauge className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{pos ? Math.round(pos.speed) : 0}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">km/h</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Battery className="w-3 h-3 text-green-500" />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{device.attributes.batteryLevel ?? '--'}%</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Battery</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Fuel className="w-3 h-3 text-orange-500" />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{device.attributes.fuel ?? '--'}%</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Fuel</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgoString(device.lastUpdate)}
                    </span>
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                      Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Vehicle</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Speed</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Battery</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Last Update</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Location</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sortedDevices.map(device => {
                  const pos = positions.find(p => p.deviceId === device.id);
                  return (
                    <tr
                      key={device.id}
                      onClick={() => handleViewDetails(device.id)}
                      className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            device.status === 'online' ? 'bg-green-50 dark:bg-green-900/20' :
                            device.status === 'idle' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                            'bg-red-50 dark:bg-red-900/20'
                          }`}>
                            <Car className={`w-4 h-4 ${
                              device.status === 'online' ? 'text-green-600' :
                              device.status === 'idle' ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</p>
                            <p className="text-[10px] text-gray-500">{device.uniqueId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                          device.status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          device.status === 'idle' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {device.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{pos ? Math.round(pos.speed) : 0} km/h</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {device.attributes.batteryLevel != null ? (
                            <>
                              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${(device.attributes.batteryLevel || 0) > 50 ? 'bg-green-500' : (device.attributes.batteryLevel || 0) > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${device.attributes.batteryLevel}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">{device.attributes.batteryLevel}%</span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">--</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{timeAgoString(device.lastUpdate)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{pos?.address || `${pos?.latitude?.toFixed(4) || '--'}`}</td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sortedDevices.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No vehicles found</h3>
          <p className="text-xs text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default VehicleList;
