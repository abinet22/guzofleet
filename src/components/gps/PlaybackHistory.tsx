import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  ArrowLeft, Play, Pause, SkipForward, SkipBack, Calendar,
  Gauge, Clock, MapPin, Navigation, RotateCcw, Loader2, AlertTriangle,
  ZoomIn, ZoomOut, Crosshair,
} from 'lucide-react';

import { formatSpeed, formatDistance, Position } from '@/data/gpsData';

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWJpbmV0MTIzIiwiYSI6ImNrbWR3d3Y5NzJwbG8ycGp4bGU1bXBtaGsifQ.LIZpH0mev90pUGXewX6lww';

const PlaybackHistory: React.FC = () => {
  const { devices, selectedDeviceId, setCurrentView, fetchPlaybackRoute } = useAppContext();
  const device = devices.find(d => d.id === selectedDeviceId) || devices[0];

  const [selectedDeviceForPlayback, setSelectedDeviceForPlayback] = useState<number | null>(selectedDeviceId || (devices[0]?.id ?? null));
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().slice(0, 16);
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [showRoute, setShowRoute] = useState(false);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapCenter, setMapCenter] = useState<[number, number]>([38.75, 9.02]);
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const initializedRef = useRef(false);

  const currentPosition = positions[currentIndex];

  // Calculate trip summary
  const totalDistance = positions.reduce((sum, p) => sum + (p.attributes.distance || 0), 0);
  const maxSpeed = positions.length > 0 ? Math.max(...positions.map(p => p.speed)) : 0;
  const avgSpeed = positions.length > 0 ? positions.reduce((sum, p) => sum + p.speed, 0) / positions.length : 0;

  // Initialize Mapbox map - always rendered
  useEffect(() => {
    if (!mapContainerRef.current || initializedRef.current) return;
    
    initializedRef.current = true;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    console.log('Initializing map...');
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: mapCenter,
      zoom: mapZoom,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add route source and layer immediately
    mapRef.current.on('load', () => {
      console.log('Map loaded, adding sources...');
      
      // Add route source for full path
      mapRef.current?.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      // Full route line (gray dashed)
      mapRef.current?.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#94a3b8',
          'line-width': 3,
          'line-opacity': 0.5,
          'line-dasharray': [2, 2],
        },
      });

      // Add traveled route source
      mapRef.current?.addSource('route-traveled', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      // Traveled route line (blue solid)
      mapRef.current?.addLayer({
        id: 'route-traveled-line',
        type: 'line',
        source: 'route-traveled',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
        },
      });
    });

    // Cleanup
    return () => {
      console.log('Cleaning up map...');
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.remove();
      }
      mapRef.current?.remove();
      initializedRef.current = false;
    };
  }, []);

  // Update route on map when positions change
  useEffect(() => {
    if (!mapRef.current || positions.length === 0) return;

    // Wait for map to be ready
    const updateRoute = () => {
      try {
        // Update full route
        const routeGeoJSON = {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: positions.map(p => [p.longitude, p.latitude]),
          },
        };

        const routeSource = mapRef.current?.getSource('route') as mapboxgl.GeoJSONSource;
        if (routeSource) {
          routeSource.setData(routeGeoJSON);
        }

        // Update traveled route
        const traveledPositions = positions.slice(0, currentIndex + 1);
        const traveledGeoJSON = {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: traveledPositions.map(p => [p.longitude, p.latitude]),
          },
        };

        const traveledSource = mapRef.current?.getSource('route-traveled') as mapboxgl.GeoJSONSource;
        if (traveledSource) {
          traveledSource.setData(traveledGeoJSON);
        }

        // Fit bounds on first load
        if (positions.length > 1 && currentIndex === 0) {
          const bounds = new mapboxgl.LngLatBounds();
          positions.forEach(p => {
            if (p.latitude !== 0 && p.longitude !== 0) {
              bounds.extend([p.longitude, p.latitude]);
            }
          });
          if (bounds.isEmpty() === false) {
            mapRef.current?.fitBounds(bounds, { padding: 50 });
          }
        }
      } catch (error) {
        console.error('Error updating route:', error);
      }
    };

    // Wait a bit for map to be ready
    if (mapRef.current.loaded()) {
      updateRoute();
    } else {
      mapRef.current?.on('load', updateRoute);
    }
  }, [positions, currentIndex]);

  // Update vehicle marker
  useEffect(() => {
    if (!mapRef.current || !currentPosition || currentPosition.latitude === 0) return;

    try {
      if (!vehicleMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-4 bg-blue-400/20 rounded-full animate-ping" />
            <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
          </div>
        `;
        
        vehicleMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([currentPosition.longitude, currentPosition.latitude])
          .addTo(mapRef.current);
      } else {
        vehicleMarkerRef.current.setLngLat([currentPosition.longitude, currentPosition.latitude]);
      }
      
      // Rotate vehicle based on course
      const el = vehicleMarkerRef.current.getElement();
      const svg = el.querySelector('svg');
      if (svg) {
        svg.style.transform = `rotate(${currentPosition.course}deg)`;
      }

      // Pan map to follow vehicle during playback
      if (isPlaying) {
        mapRef.current.panTo([currentPosition.longitude, currentPosition.latitude], { duration: 0.5 });
      }
    } catch (error) {
      console.error('Error updating marker:', error);
    }
  }, [currentPosition, isPlaying]);

  // Playback control
  useEffect(() => {
    if (isPlaying && positions.length > 0) {
      playbackRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= positions.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, [isPlaying, playbackSpeed, positions.length]);

  const handleLoadRoute = async () => {
    if (!selectedDeviceForPlayback) {
      setRouteError('Please select a device');
      return;
    }
    setLoadingRoute(true);
    setRouteError('');
    
    // Reset markers and routes
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }
    
    // Clear routes
    if (mapRef.current?.loaded()) {
      try {
        const routeSource = mapRef.current.getSource('route') as mapboxgl.GeoJSONSource;
        if (routeSource) {
          routeSource.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] },
          });
        }
        const traveledSource = mapRef.current.getSource('route-traveled') as mapboxgl.GeoJSONSource;
        if (traveledSource) {
          traveledSource.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] },
          });
        }
      } catch (e) {}
    }
    
    try {
      const from = new Date(dateFrom).toISOString();
      const to = new Date(dateTo).toISOString();
      const routePositions = await fetchPlaybackRoute(selectedDeviceForPlayback, from, to);
      
      if (!routePositions || routePositions.length === 0) {
        setRouteError('No route data found for the selected time range.');
        return;
      }
      
      // Filter out invalid positions
      const validPositions = routePositions.filter(p => p.latitude !== 0 && p.longitude !== 0);
      if (validPositions.length === 0) {
        setRouteError('No valid position data found.');
        return;
      }
      
      setPositions(validPositions);
      setCurrentIndex(0);
      setIsPlaying(false);
      setShowRoute(true);
    } catch (err: any) {
      console.error('Failed to load route:', err);
      if (err?.message?.includes('JSON') || err?.message?.includes('Unexpected token')) {
        setRouteError('Server returned an invalid response.');
      } else {
        setRouteError(err?.message || 'Failed to load route data');
      }
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const getDuration = () => {
    if (positions.length < 2) return '0 min';
    const start = new Date(positions[0].fixTime).getTime();
    const end = new Date(positions[positions.length - 1].fixTime).getTime();
    const mins = Math.round((end - start) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => setCurrentView('vehicles')}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vehicles
      </button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Route Playback</h2>
          <p className="text-sm text-gray-500">View historical route data</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Device</label>
            <select
              value={selectedDeviceForPlayback || ''}
              onChange={e => setSelectedDeviceForPlayback(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">Select device...</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input
                type="datetime-local"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input
                type="datetime-local"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleLoadRoute}
              disabled={loadingRoute}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {loadingRoute ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {loadingRoute ? 'Loading...' : 'Load Route'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {routeError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {routeError}
        </div>
      )}

      {/* Map - Always visible */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden relative" style={{ height: '400px' }}>
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button 
            onClick={() => setMapZoom(z => Math.min(20, z + 1))} 
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setMapZoom(z => Math.max(5, z - 1))} 
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              if (positions.length > 1) {
                const bounds = new mapboxgl.LngLatBounds();
                positions.forEach(p => {
                  if (p.latitude !== 0 && p.longitude !== 0) {
                    bounds.extend([p.longitude, p.latitude]);
                  }
                });
                if (bounds.isEmpty() === false) {
                  mapRef.current?.fitBounds(bounds, { padding: 50, duration: 1000 });
                }
              } else {
                mapRef.current?.flyTo({ center: mapCenter, zoom: 12 });
              }
            }} 
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Show placeholder when no route */}
        {!showRoute && (
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <Navigation className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Select a device and date range, then click "Load Route"</p>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* Current info overlay */}
        {showRoute && currentPosition && (
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 shadow-lg z-20">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-500">Speed</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatSpeed(currentPosition.speed)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Point</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{currentIndex + 1}/{positions.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Route loaded - show stats and controls */}
      {showRoute && (
        <>
          {/* Trip Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Distance', value: formatDistance(totalDistance), icon: MapPin, color: 'text-blue-500' },
              { label: 'Max Speed', value: formatSpeed(maxSpeed), icon: Gauge, color: 'text-red-500' },
              { label: 'Avg Speed', value: formatSpeed(avgSpeed), icon: Gauge, color: 'text-green-500' },
              { label: 'Duration', value: getDuration(), icon: Clock, color: 'text-purple-500' },
              { label: 'Points', value: `${positions.length}`, icon: Navigation, color: 'text-cyan-500' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Playback Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="mb-4">
              <input
                type="range"
                min={0}
                max={Math.max(0, positions.length - 1)}
                value={currentIndex}
                onChange={e => { setCurrentIndex(Number(e.target.value)); setIsPlaying(false); }}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">
                  {positions[0] ? new Date(positions[0].fixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
                <span className="text-[10px] text-gray-400">
                  {positions.length > 0 ? new Date(positions[positions.length - 1].fixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button onClick={handleReset} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 5))} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-105"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              <button onClick={() => setCurrentIndex(Math.min(positions.length - 1, currentIndex + 5))} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                {[1, 2, 4, 8].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Speed Chart */}
          {positions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Speed Profile</h3>
              <div className="h-32 flex items-end gap-0.5">
                {positions.map((pos, i) => {
                  const height = maxSpeed > 0 ? (pos.speed / maxSpeed) * 100 : 0;
                  const isCurrent = i === currentIndex;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t cursor-pointer transition-all duration-200 hover:opacity-80"
                      style={{
                        height: `${Math.max(2, height)}%`,
                        backgroundColor: isCurrent ? '#3b82f6' : pos.speed > 80 ? '#ef4444' : pos.speed > 50 ? '#f59e0b' : '#22c55e',
                        opacity: i <= currentIndex ? 1 : 0.3,
                        minWidth: positions.length > 200 ? '1px' : '2px',
                      }}
                      onClick={() => { setCurrentIndex(i); setIsPlaying(false); }}
                      title={`${formatSpeed(pos.speed)} at ${new Date(pos.fixTime).toLocaleTimeString()}`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlaybackHistory;
