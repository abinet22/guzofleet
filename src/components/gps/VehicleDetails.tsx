import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  ArrowLeft, Car, Gauge, Battery, Fuel, MapPin, Clock, Navigation,
  Zap, User, Hash, Phone, Activity,
  History, Terminal, Mountain, Target, Wifi,
} from 'lucide-react';

import { timeAgoString, formatSpeed, formatDistance } from '@/data/gpsData';

const VehicleDetails: React.FC = () => {
  const {
    devices, positions, selectedDeviceId, setSelectedDeviceId,
    setCurrentView, events,
  } = useAppContext();

  const device = devices.find(d => d.id === selectedDeviceId);
  const position = positions.find(p => p.deviceId === selectedDeviceId);
  const deviceEvents = events.filter(e => e.deviceId === selectedDeviceId).slice(0, 5);

  if (!device) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-96">
        <Car className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">No vehicle selected</p>
        <button
          onClick={() => setCurrentView('vehicles')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
        >
          Browse Vehicles
        </button>
      </div>
    );
  }

  const batteryLevel = device.attributes.batteryLevel || 0;
  const fuelLevel = device.attributes.fuel || 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <button
        onClick={() => setCurrentView('vehicles')}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vehicles
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className={`h-2 ${
          device.status === 'online' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
          device.status === 'idle' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
          'bg-gradient-to-r from-red-400 to-rose-500'
        }`} />
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                device.status === 'online' ? 'bg-green-50 dark:bg-green-900/20' :
                device.status === 'idle' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                'bg-red-50 dark:bg-red-900/20'
              }`}>
                <Car className={`w-8 h-8 ${
                  device.status === 'online' ? 'text-green-600' :
                  device.status === 'idle' ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{device.name}</h2>
                <p className="text-sm text-gray-500">{device.model} {device.attributes.licensePlate ? `- ${device.attributes.licensePlate}` : ''}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    device.status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    device.status === 'idle' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {device.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Updated {timeAgoString(device.lastUpdate)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setSelectedDeviceId(device.id); setCurrentView('map'); }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" /> Track on Map
              </button>
              <button
                onClick={() => { setSelectedDeviceId(device.id); setCurrentView('playback'); }}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <History className="w-4 h-4" /> View Playback
              </button>
              <button
                onClick={() => { setSelectedDeviceId(device.id); setCurrentView('commands'); }}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <Terminal className="w-4 h-4" /> Send Command
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: Gauge, label: 'Speed', value: position ? formatSpeed(position.speed) : '0 km/h', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: Zap, label: 'Ignition', value: position?.attributes.ignition ? 'ON' : 'OFF', color: position?.attributes.ignition ? 'text-green-500' : 'text-red-500', bg: position?.attributes.ignition ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20' },
          { icon: Battery, label: 'Battery', value: batteryLevel ? `${batteryLevel}%` : '--', color: batteryLevel > 50 ? 'text-green-500' : batteryLevel > 20 ? 'text-yellow-500' : 'text-red-500', bg: 'bg-gray-50 dark:bg-gray-700' },
          { icon: Fuel, label: 'Fuel', value: fuelLevel ? `${fuelLevel}%` : '--', color: fuelLevel > 30 ? 'text-green-500' : 'text-orange-500', bg: 'bg-gray-50 dark:bg-gray-700' },
          { icon: Navigation, label: 'Course', value: position ? `${Math.round(position.course)}°` : '--', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { icon: Mountain, label: 'Altitude', value: position ? `${Math.round(position.altitude)}m` : '--', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Device Information</h3>
          <div className="space-y-3">
            {[
              { icon: Hash, label: 'Unique ID (IMEI)', value: device.uniqueId },
              { icon: Car, label: 'Model', value: device.model || '--' },
              { icon: User, label: 'Driver', value: device.attributes.driver || 'Unassigned' },
              { icon: Phone, label: 'SIM Phone', value: device.phone || '--' },
              { icon: Hash, label: 'License Plate', value: device.attributes.licensePlate || '--' },
              { icon: Activity, label: 'Category', value: device.category.charAt(0).toUpperCase() + device.category.slice(1) },
              { icon: Wifi, label: 'GPS Accuracy', value: position ? `${Math.round(position.accuracy)}m` : '--' },
              { icon: Target, label: 'Total Distance', value: formatDistance(device.attributes.totalDistance || 0) },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last Known Position */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Last Known Position</h3>
          {position ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{position.address || 'Address unavailable'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Lat:</span> {position.latitude.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Lng:</span> {position.longitude.toFixed(6)}
                  </div>
                </div>
              </div>

              {batteryLevel > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Battery className="w-4 h-4" /> Battery Level
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{batteryLevel}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        batteryLevel > 50 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                        batteryLevel > 20 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                      style={{ width: `${batteryLevel}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-0.5">Fix Time</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {new Date(position.fixTime).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-0.5">Server Time</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {new Date(position.serverTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No position data available</p>
              <p className="text-xs mt-1">This device has not sent any positions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Events</h3>
          <button onClick={() => setCurrentView('alerts')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            View All Events
          </button>
        </div>
        {deviceEvents.length > 0 ? (
          <div className="space-y-2">
            {deviceEvents.map(event => (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className={`w-2 h-2 rounded-full ${
                  event.type === 'overspeed' ? 'bg-red-500' :
                  event.type.includes('geofence') ? 'bg-orange-500' :
                  event.type === 'low_battery' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-gray-500">
                    {event.attributes.speed && `Speed: ${Math.round(event.attributes.speed)} km/h`}
                    {event.attributes.geofenceName && `Zone: ${event.attributes.geofenceName}`}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400">{timeAgoString(event.eventTime)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No recent events for this vehicle</p>
        )}
      </div>
    </div>
  );
};

export default VehicleDetails;
