import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Hexagon, Plus, Trash2, MapPin, X, Check, Circle,
  Shield, Gauge, ZoomIn, ZoomOut, Crosshair,
  Pentagon, Activity,
} from 'lucide-react';
import { GeofenceType } from '@/data/gpsData';

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWJpbmV0MTIzIiwiYSI6ImNrbWR3d3Y5NzJwbG8ycGp4bGU1bXBtaGsifQ.LIZpH0mev90pUGXewX6lww';

const Geofences: React.FC = () => {
  const { geofences, addGeofence, deleteGeofence, positions } = useAppContext();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRadius, setNewRadius] = useState(1000);
  const [newColor, setNewColor] = useState('#1976D2');
  const [newSpeedLimit, setNewSpeedLimit] = useState(35);
  const [selectedGeofence, setSelectedGeofence] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([38.75, 9.02]);
  const [mapZoom, setMapZoom] = useState(12);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // New state for geofence types
  const [geofenceType, setGeofenceType] = useState<GeofenceType>('circle');
  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>([]);
  const [polylineCoords, setPolylineCoords] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initializedRef = useRef(false);
  const initialFitDone = useRef(false);

  const colors = ['#1976D2', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#795548', '#607D8B'];

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

    // Click handler for creating geofences
    mapRef.current.on('click', (e) => {
      if (showCreate && isDrawing) {
        const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        
        if (geofenceType === 'polygon') {
          setPolygonCoords(prev => [...prev, newPoint]);
        } else if (geofenceType === 'polyline') {
          setPolylineCoords(prev => [...prev, newPoint]);
        }
      } else if (showCreate && geofenceType === 'circle') {
        setClickedLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    });

    // Cleanup on unmount
    return () => {
      mapRef.current?.remove();
      initializedRef.current = false;
    };
  }, [showCreate, isDrawing, geofenceType]);

  // Fit map bounds to cover all geofences on initial load
  useEffect(() => {
    if (!mapRef.current?.isStyleLoaded() || initialFitDone.current || geofences.length === 0) return;
    
    initialFitDone.current = true;

    // Calculate bounds from all geofences
    const bounds = new mapboxgl.LngLatBounds();
    let hasValidBounds = false;

    geofences.forEach(gf => {
      if ((gf.geofenceType === 'circle' || !gf.geofenceType) && gf.centerLat && gf.centerLng) {
        bounds.extend([gf.centerLng, gf.centerLat]);
        hasValidBounds = true;
      } else if (gf.coordinates && gf.coordinates.length > 0) {
        gf.coordinates.forEach(coord => {
          bounds.extend(coord);
        });
        hasValidBounds = true;
      }
    });

    if (hasValidBounds) {
      mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
    }
  }, [geofences]);

  // Update geofences on map
  useEffect(() => {
    if (!mapRef.current?.isStyleLoaded()) return;

    // Remove existing layers
    const layers = mapRef.current.getStyle().layers;
    layers.forEach(layer => {
      if (layer.id.startsWith('geofence-')) {
        mapRef.current?.removeLayer(layer.id);
      }
    });

    // Remove existing sources
    const sources = ['geofences-circle', 'geofences-polygon', 'geofences-polyline'];
    sources.forEach(sourceId => {
      if (mapRef.current?.getStyle().sources[sourceId]) {
        mapRef.current?.removeSource(sourceId);
      }
    });

    // Filter geofences by type
    const circleGeofences = geofences.filter(gf => 
      gf.geofenceType === 'circle' || !gf.geofenceType
    ).filter(gf => gf.centerLat && gf.centerLng);

    const polygonGeofences = geofences.filter(gf => 
      gf.geofenceType === 'polygon'
    ).filter(gf => gf.coordinates && gf.coordinates.length > 0);

    const polylineGeofences = geofences.filter(gf => 
      gf.geofenceType === 'polyline'
    ).filter(gf => gf.coordinates && gf.coordinates.length > 0);

    // Add circle geofences source
    if (circleGeofences.length > 0) {
      const circleFeatures = circleGeofences.map(gf => ({
        type: 'Feature' as const,
        properties: {
          id: gf.id,
          name: gf.name,
          color: gf.attributes.color || '#1976D2',
          radius: gf.radius || 1000,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [gf.centerLng!, gf.centerLat!],
        },
      }));

      mapRef.current.addSource('geofences-circle', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: circleFeatures },
      });

      mapRef.current.addLayer({
        id: 'geofence-circles',
        type: 'circle',
        source: 'geofences-circle',
        paint: {
          'circle-radius': ['/', ['get', 'radius'], 10],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.2,
          'circle-stroke-width': 2,
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-opacity': 0.8,
        },
      });

      mapRef.current.addLayer({
        id: 'geofence-circle-labels',
        type: 'symbol',
        source: 'geofences-circle',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': ['get', 'color'],
        },
      });
    }

    // Add polygon geofences source
    if (polygonGeofences.length > 0) {
      const polygonFeatures = polygonGeofences.map(gf => {
        // Create closed polygon coordinates (first and last point same)
        const closedCoords = [...gf.coordinates!, gf.coordinates![0]];
        return {
          type: 'Feature' as const,
          properties: {
            id: gf.id,
            name: gf.name,
            color: gf.attributes.color || '#1976D2',
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [closedCoords] as any,
          },
        };
      });

      mapRef.current.addSource('geofences-polygon', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: polygonFeatures },
      });

      mapRef.current.addLayer({
        id: 'geofence-polygon-fills',
        type: 'fill',
        source: 'geofences-polygon',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.2,
        },
      });

      mapRef.current.addLayer({
        id: 'geofence-polygon-outlines',
        type: 'line',
        source: 'geofences-polygon',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
        },
      });

      mapRef.current.addLayer({
        id: 'geofence-polygon-labels',
        type: 'symbol',
        source: 'geofences-polygon',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': ['get', 'color'],
        },
      });
    }

    // Add polyline geofences source
    if (polylineGeofences.length > 0) {
      const polylineFeatures = polylineGeofences.map(gf => ({
        type: 'Feature' as const,
        properties: {
          id: gf.id,
          name: gf.name,
          color: gf.attributes.color || '#1976D2',
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: gf.coordinates!,
        },
      }));

      mapRef.current.addSource('geofences-polyline', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: polylineFeatures },
      });

      mapRef.current.addLayer({
        id: 'geofence-polylines',
        type: 'line',
        source: 'geofences-polyline',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
        },
      });

      mapRef.current.addLayer({
        id: 'geofence-polyline-labels',
        type: 'symbol',
        source: 'geofences-polyline',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': ['get', 'color'],
        },
      });
    }

    // Click handlers for all geofence layers
    const clickLayers = ['geofence-circles', 'geofence-polygon-fills', 'geofence-polylines'];
    clickLayers.forEach(layerId => {
      if (!mapRef.current?.getLayer(layerId)) return;
      
      mapRef.current?.on('click', layerId, (e) => {
        if (e.features && e.features[0]) {
          const id = e.features[0].properties?.id;
          if (id) {
            setSelectedGeofence(id);
            mapRef.current?.flyTo({
              center: e.lngLat,
              zoom: 15,
              duration: 1000,
            });
          }
        }
      });
    });

    // Change cursor on hover
    const hoverLayers = ['geofence-circles', 'geofence-polygon-fills', 'geofence-polylines'];
    hoverLayers.forEach(layerId => {
      if (!mapRef.current?.getLayer(layerId)) return;
      
      mapRef.current?.on('mouseenter', layerId, () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        }
      });
      mapRef.current?.on('mouseleave', layerId, () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = '';
        }
      });
    });
  }, [geofences]);

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

  // Auto-center on first positions load
  useEffect(() => {
    if (positions.length > 0) {
      const avgLat = positions.reduce((s, p) => s + p.latitude, 0) / positions.length;
      const avgLng = positions.reduce((s, p) => s + p.longitude, 0) / positions.length;
      if (avgLat !== 0 && avgLng !== 0) {
        setMapCenter([avgLng, avgLat]);
      }
    }
  }, [positions.length]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    
    let area: string;
    let coords: [number, number][] | undefined;
    
    if (geofenceType === 'circle') {
      const lat = clickedLocation?.lat ?? mapCenter[1];
      const lng = clickedLocation?.lng ?? mapCenter[0];
      area = `CIRCLE (${lng} ${lat}, ${newRadius})`;
    } else if (geofenceType === 'polygon') {
      coords = polygonCoords;
      const coordStr = polygonCoords.map(c => `${c[0]} ${c[1]}`).join(', ');
      area = `POLYGON ((${coordStr}))`;
    } else {
      coords = polylineCoords;
      const coordStr = polylineCoords.map(c => `${c[0]} ${c[1]}`).join(', ');
      area = `LINESTRING (${coordStr})`;
    }
    
    // Calculate center
    let centerLat: number | undefined;
    let centerLng: number | undefined;
    
    if (geofenceType === 'circle') {
      centerLat = clickedLocation?.lat ?? mapCenter[1];
      centerLng = clickedLocation?.lng ?? mapCenter[0];
    } else if (coords && coords.length > 0) {
      const sumLng = coords.reduce((sum, c) => sum + c[0], 0);
      const sumLat = coords.reduce((sum, c) => sum + c[1], 0);
      centerLng = sumLng / coords.length;
      centerLat = sumLat / coords.length;
    }
    
    addGeofence({
      name: newName,
      description: newDescription,
      area,
      calendarId: 0,
      attributes: { color: newColor, speedLimit: newSpeedLimit },
      centerLat,
      centerLng,
      radius: geofenceType === 'circle' ? newRadius : undefined,
      geofenceType,
      coordinates: coords,
    });
    
    // Reset form
    setNewName('');
    setNewDescription('');
    setNewRadius(1000);
    setClickedLocation(null);
    setPolygonCoords([]);
    setPolylineCoords([]);
    setShowCreate(false);
    setIsDrawing(false);
  };

  const handleDelete = (id: number) => {
    deleteGeofence(id);
    setConfirmDelete(null);
    if (selectedGeofence === id) setSelectedGeofence(null);
  };

  // Handle selecting a geofence from the list - fly to it on map
  const handleSelectGeofence = (geofence: typeof geofences[0]) => {
    setSelectedGeofence(geofence.id);
    
    if (!mapRef.current) return;
    
    if ((geofence.geofenceType === 'circle' || !geofence.geofenceType) && geofence.centerLat && geofence.centerLng) {
      mapRef.current.flyTo({
        center: [geofence.centerLng, geofence.centerLat],
        zoom: 14,
        duration: 1000,
      });
    } else if (geofence.coordinates && geofence.coordinates.length > 0) {
      // Fit bounds to polygon/polyline
      const bounds = new mapboxgl.LngLatBounds();
      geofence.coordinates.forEach(coord => {
        bounds.extend(coord);
      });
      mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
    }
  };

  // Start drawing mode
  const handleStartDrawing = () => {
    setIsDrawing(true);
    setPolygonCoords([]);
    setPolylineCoords([]);
  };

  // Clear drawing
  const handleClearDrawing = () => {
    if (geofenceType === 'polygon') {
      setPolygonCoords([]);
    } else if (geofenceType === 'polyline') {
      setPolylineCoords([]);
    }
  };

  // Finish drawing (for polygon)
  const handleFinishPolygon = () => {
    setIsDrawing(false);
  };

  const selected = geofences.find(g => g.id === selectedGeofence);

  const getGeofenceTypeIcon = (type?: GeofenceType) => {
    switch (type) {
      case 'polygon':
        return <Pentagon className="w-4 h-4" style={{ color: type ? undefined : '#888' }} />;
      case 'polyline':
        return <Activity className="w-4 h-4" style={{ color: type ? undefined : '#888' }} />;
      default:
        return <Circle className="w-4 h-4" style={{ color: type ? undefined : '#888' }} />;
    }
  };

  const getGeofenceTypeLabel = (type?: GeofenceType) => {
    switch (type) {
      case 'polygon':
        return 'Polygon';
      case 'polyline':
        return 'Polyline';
      default:
        return 'Circle';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Geofence Management</h2>
          <p className="text-sm text-gray-500">{geofences.length} geofences configured</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Geofence
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">New Geofence</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Geofence Type Selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Geofence Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setGeofenceType('circle'); setIsDrawing(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  geofenceType === 'circle'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Circle className="w-4 h-4" /> Circle
              </button>
              <button
                onClick={() => { setGeofenceType('polygon'); handleStartDrawing(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  geofenceType === 'polygon'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Pentagon className="w-4 h-4" /> Polygon
              </button>
              <button
                onClick={() => { setGeofenceType('polyline'); handleStartDrawing(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  geofenceType === 'polyline'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Activity className="w-4 h-4" /> Polyline
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g., Office Zone"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Brief description"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Radius only for circle */}
            {geofenceType === 'circle' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Radius (meters)</label>
                <input
                  type="number"
                  value={newRadius}
                  onChange={e => setNewRadius(Number(e.target.value))}
                  min={100}
                  max={10000}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            {/* Drawing instructions for polygon/polyline */}
            {geofenceType !== 'circle' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    {geofenceType === 'polygon' ? 'Polygon Points' : 'Polyline Points'}
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={handleClearDrawing}
                      className="text-xs px-2 py-1 text-gray-500 hover:text-red-500"
                    >
                      Clear
                    </button>
                    {geofenceType === 'polygon' && polygonCoords.length >= 3 && (
                      <button
                        onClick={handleFinishPolygon}
                        className="text-xs px-2 py-1 text-green-600 hover:text-green-700 font-medium"
                      >
                        Finish
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {isDrawing 
                    ? `Click on map to add points (${geofenceType === 'polygon' ? polygonCoords.length : polylineCoords.length} added)`
                    : 'Click the type button to start drawing'}
                </div>
                {geofenceType === 'polygon' && polygonCoords.length >= 3 && !isDrawing && (
                  <div className="text-xs text-green-600">Polygon complete! Ready to create.</div>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Speed Limit (mph)</label>
              <input
                type="number"
                value={newSpeedLimit}
                onChange={e => setNewSpeedLimit(Number(e.target.value))}
                min={5}
                max={100}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-8 h-8 rounded-lg transition-transform ${newColor === color ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Click location for circle */}
          {geofenceType === 'circle' && showCreate && !isDrawing && (
            <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Click on map to set center location
              {clickedLocation && (
                <span className="ml-2 text-blue-600">
                  ({clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)})
                </span>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => { setShowCreate(false); setIsDrawing(false); setPolygonCoords([]); setPolylineCoords([]); }}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={
                !newName.trim() || 
                (geofenceType === 'circle' && !clickedLocation) ||
                (geofenceType === 'polygon' && polygonCoords.length < 3) ||
                (geofenceType === 'polyline' && polylineCoords.length < 2)
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Create
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Geofence List */}
        <div className="xl:col-span-1 space-y-3">
          {geofences.map(gf => (
            <div
              key={gf.id}
              onClick={() => handleSelectGeofence(gf)}
              className={`bg-white dark:bg-gray-800 rounded-xl border p-4 cursor-pointer transition-all ${
                selectedGeofence === gf.id
                  ? 'border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                  : 'border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: (gf.attributes.color || '#1976D2') + '20' }}
                  >
                    {getGeofenceTypeIcon(gf.geofenceType)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{gf.name}</h4>
                    <p className="text-xs text-gray-500">{gf.description}</p>
                  </div>
                </div>
                {confirmDelete === gf.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(gf.id); }}
                      className="p-1.5 bg-red-500 text-white rounded-lg text-xs"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                      className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(gf.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  {getGeofenceTypeIcon(gf.geofenceType)} {getGeofenceTypeLabel(gf.geofenceType)}
                </span>
                {(gf.geofenceType === 'circle' || !gf.geofenceType) && (
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Circle className="w-3 h-3" /> {gf.radius || 0}m radius
                  </span>
                )}
                {gf.coordinates && (
                  <span className="text-[11px] text-gray-500">
                    {gf.coordinates.length} pts
                  </span>
                )}
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Gauge className="w-3 h-3" /> {gf.attributes.speedLimit || 0} mph
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Map Preview */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <button 
              onClick={() => setMapZoom(z => Math.min(20, z + 1))} 
              className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setMapZoom(z => Math.max(5, z - 1))} 
              className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-10 h-px bg-gray-200 dark:bg-gray-700" />
            <button 
              onClick={() => {
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
              }} 
              className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              title="Center on fleet"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Create mode indicator */}
          {showCreate && (
            <div className="absolute top-4 left-4 z-10 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-xl shadow-lg flex items-center gap-2">
              {geofenceType === 'circle' ? (
                <MapPin className="w-4 h-4" />
              ) : (
                getGeofenceTypeIcon(geofenceType)
              )}
              {geofenceType === 'circle' ? 'Click on map to set location' : 
                isDrawing ? `Click to add points (${geofenceType === 'polygon' ? polygonCoords.length : polylineCoords.length})` :
                'Drawing mode'}
              {clickedLocation && geofenceType === 'circle' && (
                <span className="ml-2 text-blue-100">
                  ({clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)})
                </span>
              )}
            </div>
          )}

          <div ref={mapContainerRef} className="h-[500px] w-full" />

          {/* Selected geofence info overlay */}
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-4 shadow-lg z-20">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: (selected.attributes.color || '#1976D2') + '20' }}
                >
                  {getGeofenceTypeIcon(selected.geofenceType)}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{selected.name}</h4>
                  <p className="text-xs text-gray-500">{selected.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {(selected.geofenceType === 'circle' || !selected.geofenceType) ? `${selected.radius}m` : 
                      selected.coordinates ? `${selected.coordinates.length} pts` : '-'}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {getGeofenceTypeLabel(selected.geofenceType)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500">
                  Speed Limit: <span className="font-medium text-gray-900 dark:text-white">{selected.attributes.speedLimit} mph</span>
                </span>
                {selected.centerLat && selected.centerLng && (
                  <>
                    <span className="text-xs text-gray-500">
                      Lat: <span className="font-medium text-gray-900 dark:text-white">{selected.centerLat?.toFixed(4)}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      Lng: <span className="font-medium text-gray-900 dark:text-white">{selected.centerLng?.toFixed(4)}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Geofences;
