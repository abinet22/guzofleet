import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  Car, MapPin, Wifi, WifiOff, Clock, Gauge, Fuel, AlertTriangle,
  TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Navigation,
  Battery, Zap, BarChart3, Loader2,
} from 'lucide-react';
import { timeAgoString, getAlertLabel, getAlertColor, formatDistance } from '@/data/gpsData';

const Dashboard: React.FC = () => {
  const { devices, positions, events, setCurrentView, setSelectedDeviceId, loading } = useAppContext();

  const onlineDevices = devices.filter(d => d.status === 'online');
  const offlineDevices = devices.filter(d => d.status === 'offline');
  const idleDevices = devices.filter(d => d.status === 'idle');
  const movingDevices = positions.filter(p => {
    const device = devices.find(d => d.id === p.deviceId);
    return device?.status === 'online' && p.speed > 5;
  });

  // Animated counters
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedOnline, setAnimatedOnline] = useState(0);
  const [animatedOffline, setAnimatedOffline] = useState(0);
  const [animatedMoving, setAnimatedMoving] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedTotal(Math.round(devices.length * ease));
      setAnimatedOnline(Math.round(onlineDevices.length * ease));
      setAnimatedOffline(Math.round(offlineDevices.length * ease));
      setAnimatedMoving(Math.round(movingDevices.length * ease));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [devices.length, onlineDevices.length, offlineDevices.length, movingDevices.length]);

  const avgSpeed = positions.filter(p => p.speed > 0).length > 0
    ? Math.round(positions.filter(p => p.speed > 0).reduce((sum, p) => sum + p.speed, 0) / positions.filter(p => p.speed > 0).length)
    : 0;

  const totalDistanceToday = positions.reduce((sum, p) => sum + (p.attributes.distance || 0), 0);

  if (loading && devices.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-sm text-gray-500">Loading fleet data from server...</p>
      </div>
    );
  }

  if (!loading && devices.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-96">
        <Car className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Devices Found</h3>
        <p className="text-sm text-gray-500 mb-4 text-center max-w-md">
          Your fleet is empty. Add GPS tracking devices to start monitoring your vehicles.
        </p>
        <button
          onClick={() => setCurrentView('device-manager')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
        >
          Add Your First Device
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Vehicles',
      value: animatedTotal,
      icon: Car,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      change: `${devices.length}`,
      changeUp: true,
    },
    {
      label: 'Online / Active',
      value: animatedOnline,
      icon: Wifi,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      change: devices.length > 0 ? `${Math.round((onlineDevices.length / devices.length) * 100)}%` : '0%',
      changeUp: true,
    },
    {
      label: 'Offline',
      value: animatedOffline,
      icon: WifiOff,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
      change: `${offlineDevices.length}`,
      changeUp: false,
    },
    {
      label: 'In Motion',
      value: animatedMoving,
      icon: Navigation,
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      change: onlineDevices.length > 0 ? `${Math.round((movingDevices.length / onlineDevices.length) * 100)}%` : '0%',
      changeUp: true,
    },
  ];

  const quickStats = [
    { label: 'Avg Speed', value: `${avgSpeed} km/h`, icon: Gauge, color: 'text-blue-500' },
    { label: 'Distance Today', value: formatDistance(totalDistanceToday), icon: TrendingUp, color: 'text-green-500' },
    { label: 'Active Alerts', value: `${events.filter(e => ['overspeed', 'geofence_exit', 'low_battery'].includes(e.type)).length}`, icon: AlertTriangle, color: 'text-orange-500' },
    { label: 'Idle Vehicles', value: `${idleDevices.length}`, icon: Clock, color: 'text-yellow-500' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => card.label.includes('Online') ? setCurrentView('map') : setCurrentView('vehicles')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${card.changeUp ? 'text-green-500' : 'text-red-500'}`}>
                  {card.changeUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {card.change}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{card.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-[11px] text-gray-500">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Fleet Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Fleet Status</h3>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Online', count: onlineDevices.length, color: 'bg-green-500', pct: devices.length > 0 ? (onlineDevices.length / devices.length) * 100 : 0 },
              { label: 'Idle', count: idleDevices.length, color: 'bg-yellow-500', pct: devices.length > 0 ? (idleDevices.length / devices.length) * 100 : 0 },
              { label: 'Offline', count: offlineDevices.length, color: 'bg-red-500', pct: devices.length > 0 ? (offlineDevices.length / devices.length) * 100 : 0 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.count}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" className="dark:stroke-gray-700" />
                {devices.length > 0 && (
                  <>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12"
                      strokeDasharray={`${(onlineDevices.length / devices.length) * 251.2} 251.2`}
                      strokeLinecap="round" className="transition-all duration-1000" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" strokeWidth="12"
                      strokeDasharray={`${(idleDevices.length / devices.length) * 251.2} 251.2`}
                      strokeDashoffset={`${-(onlineDevices.length / devices.length) * 251.2}`}
                      strokeLinecap="round" className="transition-all duration-1000" />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{devices.length}</span>
                <span className="text-[10px] text-gray-500">Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <button onClick={() => setCurrentView('alerts')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {events.length > 0 ? events.slice(0, 8).map(event => {
              const device = devices.find(d => d.id === event.deviceId);
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => { setSelectedDeviceId(event.deviceId); setCurrentView('vehicle-detail'); }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: getAlertColor(event.type) + '20' }}>
                    <Activity className="w-4 h-4" style={{ color: getAlertColor(event.type) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{getAlertLabel(event.type)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {device?.name || `Device #${event.deviceId}`}
                      {event.attributes.speed && ` - ${Math.round(event.attributes.speed)} km/h`}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeAgoString(event.eventTime)}</span>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent events</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Vehicles */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Active Vehicles</h3>
            <button onClick={() => setCurrentView('vehicles')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {onlineDevices.length > 0 ? onlineDevices.slice(0, 8).map(device => {
              const pos = positions.find(p => p.deviceId === device.id);
              return (
                <div
                  key={device.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => { setSelectedDeviceId(device.id); setCurrentView('vehicle-detail'); }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{device.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Gauge className="w-3 h-3" /> {pos ? Math.round(pos.speed) : 0} km/h
                      </span>
                      {device.attributes.batteryLevel != null && (
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Battery className="w-3 h-3" /> {device.attributes.batteryLevel}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-400">
                <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active vehicles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Fleet Overview Map</h3>
            <p className="text-xs text-gray-500 mt-0.5">{onlineDevices.length} vehicles currently active</p>
          </div>
          <button
            onClick={() => setCurrentView('map')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Open Live Map
          </button>
        </div>
        <div
          className="h-64 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 relative cursor-pointer"
          onClick={() => setCurrentView('map')}
        >
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
          {positions.slice(0, 8).map((pos, i) => {
            const device = devices.find(d => d.id === pos.deviceId);
            if (!device || device.status === 'offline') return null;
            // Simple scatter based on index
            const x = 10 + (i * 11) % 80;
            const y = 15 + ((i * 17 + 5) % 70);
            return (
              <div key={pos.deviceId} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
                <div className="relative">
                  <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg" />
                  {device.status === 'online' && <div className="absolute -inset-2 bg-blue-400/30 rounded-full animate-ping" />}
                </div>
              </div>
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-6 py-3 rounded-xl shadow-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Click to open interactive map
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
