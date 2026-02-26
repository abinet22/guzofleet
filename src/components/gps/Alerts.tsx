import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  Search, Gauge, MapPin, MapPinOff, Power, PowerOff,
  BatteryLow, AlertTriangle, Wrench, Clock, ChevronRight,
  AlertCircle,
} from 'lucide-react';

import { getAlertLabel, getAlertColor, timeAgoString, AlertType } from '@/data/gpsData';

const alertIcons: Record<AlertType, React.ElementType> = {
  overspeed: Gauge,
  geofence_exit: MapPinOff,
  geofence_enter: MapPin,
  ignition_on: Power,
  ignition_off: PowerOff,
  low_battery: BatteryLow,
  harsh_braking: AlertTriangle,
  maintenance: Wrench,
};

const Alerts: React.FC = () => {
  const { events, devices, setSelectedDeviceId, setCurrentView } = useAppContext();
  const [filter, setFilter] = useState<AlertType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter(e => {
    const matchesFilter = filter === 'all' || e.type === filter;
    const device = devices.find(d => d.id === e.deviceId);
    const matchesSearch = !searchQuery ||
      device?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const alertTypes: (AlertType | 'all')[] = ['all', 'overspeed', 'geofence_exit', 'geofence_enter', 'ignition_on', 'ignition_off', 'low_battery', 'harsh_braking', 'maintenance'];

  // Count by type
  const typeCounts = alertTypes.reduce((acc, type) => {
    acc[type] = type === 'all' ? events.length : events.filter(e => e.type === type).length;
    return acc;
  }, {} as Record<string, number>);

  const handleViewDevice = (deviceId: number) => {
    setSelectedDeviceId(deviceId);
    setCurrentView('vehicle-detail');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Alerts & Events</h2>
          <p className="text-sm text-gray-500">{events.length} total events recorded</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Alert Type Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {(['overspeed', 'geofence_exit', 'geofence_enter', 'low_battery', 'harsh_braking', 'ignition_on', 'ignition_off', 'maintenance'] as AlertType[]).map(type => {
          const Icon = alertIcons[type];
          const count = typeCounts[type] || 0;
          const color = getAlertColor(type);
          return (
            <button
              key={type}
              onClick={() => setFilter(filter === type ? 'all' : type)}
              className={`bg-white dark:bg-gray-800 rounded-xl p-3 border transition-all text-center ${
                filter === type
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-100 dark:border-gray-700 hover:shadow-md'
              }`}
            >
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
              <div className="text-[9px] text-gray-500 leading-tight">{getAlertLabel(type)}</div>
            </button>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {alertTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {type === 'all' ? 'All Events' : getAlertLabel(type as AlertType)}
            <span className="ml-1 opacity-70">({typeCounts[type] || 0})</span>
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filteredEvents.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {filteredEvents.map(event => {
              const device = devices.find(d => d.id === event.deviceId);
              const Icon = alertIcons[event.type];
              const color = getAlertColor(event.type);
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => handleViewDevice(event.deviceId)}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color + '15' }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {getAlertLabel(event.type)}
                      </h4>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: color + '20', color }}
                      >
                        {event.type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{device?.name || `Device #${event.deviceId}`}</span>
                      {event.attributes.speed && (
                        <span> - Speed: {Math.round(event.attributes.speed)} mph</span>
                      )}
                      {event.attributes.speedLimit && (
                        <span> (Limit: {event.attributes.speedLimit} mph)</span>
                      )}
                      {event.attributes.geofenceName && (
                        <span> - Zone: {event.attributes.geofenceName}</span>
                      )}
                    </p>
                  </div>

                  {/* Time & Action */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {timeAgoString(event.eventTime)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(event.eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No events found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
