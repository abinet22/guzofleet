import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Car, X, Gauge, Zap, Clock, MapPin,
  Maximize2, Minimize2, Layers, ChevronRight,
  ZoomIn, ZoomOut, Crosshair, Eye, EyeOff,
} from 'lucide-react';

import { Device, Position, timeAgoString, formatSpeed } from '@/data/gpsData';

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWJpbmV0MTIzIiwiYSI6ImNrbWR3d3Y5NzJwbG8ycGp4bGU1bXBtaGsifQ.LIZpH0mev90pUGXewX6lww';

const LiveMap: React.FC = () => { 
  const {
    devices, positions, filteredDevices, selectedDeviceId, setSelectedDeviceId,
    setCurrentView, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    wsConnected, geofences,
  } = useAppContext();

  const [selectedVehicle, setSelectedVehicle] = useState<Device | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapCenter, setMapCenter] = useState<[number, number]>([38.75, 9.02]); // [lng, lat]
  const [fullscreen, setFullscreen] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const initializedRef = useRef(false);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current || initializedRef.current) return;
    
    initializedRef.current = true;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: mapCenter,
      zoom: mapZoom,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapRef.current.on('load', () => {
      // Add geofence source and layer
      mapRef.current?.addSource('geofences', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      mapRef.current?.addLayer({
        id: 'geofence-fills',
        type: 'fill',
        source: 'geofences',
        paint: {
          'fill-color': '#1976D2',
          'fill-opacity': 0.1,
        },
      });

      mapRef.current?.addLayer({
        id: 'geofence-borders',
        type: 'line',
        source: 'geofences',
        paint: {
          'line-color': '#1976D2',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });
    });

    // Cleanup on unmount
    return () => {
      mapRef.current?.remove();
      initializedRef.current = false;
    };
  }, []);

  // Update map center when state changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(mapCenter);
    }
  }, [mapCenter]);

  // Update map zoom when state changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapZoom);
    }
  }, [mapZoom]);

  // Update geofences on map
  useEffect(() => {
    if (!mapRef.current?.isStyleLoaded()) return;

    const features = geofences
      .filter(gf => showGeofences && gf.centerLat && gf.centerLng)
      .map(gf => ({
        type: 'Feature' as const,
        properties: {
          id: gf.id,
          name: gf.name,
          color: gf.attributes.color || '#1976D2',
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [gf.centerLng! - 0.01, gf.centerLat! - 0.01],
            [gf.centerLng! + 0.01, gf.centerLat! - 0.01],
            [gf.centerLng! + 0.01, gf.centerLat! + 0.01],
            [gf.centerLng! - 0.01, gf.centerLat! + 0.01],
            [gf.centerLng! - 0.01, gf.centerLat! - 0.01],
          ]],
        },
      }));

    const source = mapRef.current.getSource('geofences') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features,
      });
    }
  }, [geofences, showGeofences]);

  // Update vehicle markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach((marker, id) => {
      if (!filteredDevices.find(d => d.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    filteredDevices.forEach(device => {
      const pos = positions.find(p => p.deviceId === device.id);
      if (!pos || (pos.latitude === 0 && pos.longitude === 0)) return;

      const isSelected = selectedVehicle?.id === device.id;
      const isMoving = pos.speed > 5;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'vehicle-marker cursor-pointer';
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          ${isMoving && device.status === 'online' ? '<div class="absolute -inset-3 rounded-full bg-blue-400/20 animate-ping" />' : ''}
          ${isSelected ? '<div class="absolute -inset-4 rounded-full border-2 border-blue-500 animate-pulse" />' : ''}
          <div class="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform ${
            isSelected ? 'scale-125' : 'hover:scale-110'
          } ${
            device.status === 'online' ? 'bg-green-500' :
            device.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
          }" style="transform: rotate(${pos.course}deg)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div class="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span class="text-[10px] font-medium px-1.5 py-0.5 rounded shadow-sm ${
              isSelected ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }">
              ${device.name}
            </span>
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        handleSelectVehicle(device);
      });

      // Update or create marker
      if (markersRef.current.has(device.id)) {
        markersRef.current.get(device.id)?.setLngLat([pos.longitude, pos.latitude]);
      } else {
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([pos.longitude, pos.latitude])
          .addTo(mapRef.current!);
        markersRef.current.set(device.id, marker);
      }
    });
  }, [filteredDevices, positions, selectedVehicle]);

  // Auto-center on first positions load
  useEffect(() => {
    if (positions.length > 0 && !selectedVehicle) {
      const avgLat = positions.reduce((s, p) => s + p.latitude, 0) / positions.length;
      const avgLng = positions.reduce((s, p) => s + p.longitude, 0) / positions.length;
      if (avgLat !== 0 && avgLng !== 0) {
        setMapCenter([avgLng, avgLat]);
      }
    }
  }, [positions.length, selectedVehicle]);

  const handleSelectVehicle = (device: Device) => {
    const pos = positions.find(p => p.deviceId === device.id);
    setSelectedVehicle(device);
    setSelectedPosition(pos || null);
    setSelectedDeviceId(device.id);
    if (pos && pos.latitude !== 0) {
      setMapCenter([pos.longitude, pos.latitude]);
      mapRef.current?.flyTo({
        center: [pos.longitude, pos.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  };

  const handleCloseSheet = () => {
    setSelectedVehicle(null);
    setSelectedPosition(null);
    setSelectedDeviceId(null);
  };

  useEffect(() => {
    if (selectedDeviceId) {
      const device = devices.find(d => d.id === selectedDeviceId);
      if (device) handleSelectVehicle(device);
    }
  }, [selectedDeviceId, devices]);

  useEffect(() => {
    if (selectedVehicle) {
      const pos = positions.find(p => p.deviceId === selectedVehicle.id);
      if (pos) setSelectedPosition(pos);
    }
  }, [positions, selectedVehicle]);

  return (
    <div className={`flex h-[calc(100vh-4rem)] ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Vehicle List Panel */}
      {showPanel && (
        <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden flex-shrink-0 hidden lg:flex">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Vehicles</h3>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-500">{wsConnected ? 'Live' : 'Offline'}</span>
              </div>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search vehicles..."
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex gap-1 mt-2">
              {(['all', 'online', 'idle', 'offline'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredDevices.map(device => {
              const pos = positions.find(p => p.deviceId === device.id);
              const isSelected = selectedVehicle?.id === device.id;
              return (
                <div
                  key={device.id}
                  onClick={() => handleSelectVehicle(device)}
                  className={`p-3 border-b border-gray-50 dark:border-gray-800 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      device.status === 'online' ? 'bg-green-100 dark:bg-green-900/30' :
                      device.status === 'idle' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <Car className={`w-4.5 h-4.5 ${
                        device.status === 'online' ? 'text-green-600' :
                        device.status === 'idle' ? 'text-yellow-600' :
                        'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{device.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{device.attributes.driver || device.uniqueId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        {pos ? `${Math.round(pos.speed)} km/h` : '--'}
                      </p>
                      <p className="text-[10px] text-gray-400">{timeAgoString(device.lastUpdate)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredDevices.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No vehicles found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* Map Controls - Overlaid on Mapbox */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button onClick={() => setMapZoom(z => Math.min(20, z + 1))} className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setMapZoom(z => Math.max(5, z - 1))} className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-10 h-px bg-gray-200 dark:bg-gray-700" />
          <button onClick={() => {
            if (positions.length > 0) {
              const avgLat = positions.reduce((s, p) => s + p.latitude, 0) / positions.length;
              const avgLng = positions.reduce((s, p) => s + p.longitude, 0) / positions.length;
              setMapCenter([avgLng, avgLat]);
              mapRef.current?.flyTo({
                center: [avgLng, avgLat],
                zoom: 12,
                duration: 1000,
              });
            }
          }} className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700" title="Center on fleet">
            <Crosshair className="w-4 h-4" />
          </button>
          <button onClick={() => setShowGeofences(!showGeofences)} className={`w-10 h-10 rounded-xl shadow-lg flex items-center justify-center transition-colors border ${showGeofences ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`} title="Toggle geofences">
            <Layers className="w-4 h-4" />
          </button>
          <button onClick={() => setFullscreen(!fullscreen)} className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={() => setShowPanel(!showPanel)}
          className="absolute top-4 left-4 z-10 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 flex items-center gap-2"
        >
          {showPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="hidden sm:inline">{showPanel ? 'Hide' : 'Show'} Panel</span>
        </button>

        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg px-3 py-2 border border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500" /> {devices.filter(d => d.status === 'online').length} Online
            </span>
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 rounded-full bg-yellow-500" /> {devices.filter(d => d.status === 'idle').length} Idle
            </span>
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 rounded-full bg-red-500" /> {devices.filter(d => d.status === 'offline').length} Offline
            </span>
          </div>
        </div>

        {/* Vehicle Detail Bottom Sheet */}
        {selectedVehicle && selectedPosition && (
          <div className="absolute bottom-4 right-4 left-4 lg:left-auto lg:w-96 z-10 animate-slide-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{selectedVehicle.name}</h3>
                    <p className="text-xs text-blue-100">{selectedVehicle.model} {selectedVehicle.attributes.licensePlate ? `- ${selectedVehicle.attributes.licensePlate}` : ''}</p>
                  </div>
                </div>
                <button onClick={handleCloseSheet} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-px bg-gray-100 dark:bg-gray-800">
                {[
                  { icon: Gauge, label: 'Speed', value: formatSpeed(selectedPosition.speed) },
                  { icon: Zap, label: 'Ignition', value: selectedPosition.attributes.ignition ? 'ON' : 'OFF' },
                  { icon: Clock, label: 'Updated', value: timeAgoString(selectedPosition.fixTime) },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-white dark:bg-gray-900 p-3 text-center">
                      <Icon className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{stat.value}</div>
                      <div className="text-[10px] text-gray-500">{stat.label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">{selectedPosition.address || `${selectedPosition.latitude.toFixed(5)}, ${selectedPosition.longitude.toFixed(5)}`}</p>
                </div>
              </div>

              <div className="flex gap-2 p-4 pt-0">
                <button
                  onClick={() => { setSelectedDeviceId(selectedVehicle.id); setCurrentView('vehicle-detail'); }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  Details <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { setSelectedDeviceId(selectedVehicle.id); setCurrentView('playback'); }}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Playback
                </button>
                <button
                  onClick={() => { setSelectedDeviceId(selectedVehicle.id); setCurrentView('commands'); }}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Command
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMap;
