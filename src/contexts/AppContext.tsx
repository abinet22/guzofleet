import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Device, Position, GpsEvent, Geofence, Command, User,
  DeviceStatus, CommandType,
} from '@/data/gpsData';
import {
  loginSession, logoutSession, getSession, hasStoredAuth,
  fetchDevices, fetchPositions, fetchEvents, fetchGeofences,
  createGeofence as apiCreateGeofence, deleteGeofenceApi,
  createDevice as apiCreateDevice, updateDevice as apiUpdateDevice, deleteDeviceApi,
  sendCommandApi,
  connectWebSocket, disconnectWebSocket,
  fetchPositionHistory,
  ApiError,
} from '@/services/traccarApi';

// --- View Types ---
export type AppView = 'dashboard' | 'map' | 'vehicles' | 'vehicle-detail' | 'playback' | 'geofences' | 'alerts' | 'commands' | 'settings' | 'device-manager';

// --- Context Interface ---
interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loginError: string;

  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  sidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;

  // Devices
  devices: Device[];
  positions: Position[];
  selectedDeviceId: number | null;
  setSelectedDeviceId: (id: number | null) => void;
  getDevicePosition: (deviceId: number) => Position | undefined;
  addDevice: (device: { name: string; uniqueId: string; phone?: string; model?: string; category?: string; groupId?: number; }) => Promise<Device | null>;
  editDevice: (id: number, device: Partial<{ name: string; uniqueId: string; phone: string; model: string; category: string; groupId: number; }>) => Promise<Device | null>;
  removeDevice: (id: number) => Promise<boolean>;
  refreshDevices: () => Promise<void>;

  // Events
  events: GpsEvent[];
  alertFilter: string;
  setAlertFilter: (filter: string) => void;

  // Geofences
  geofences: Geofence[];
  addGeofence: (geofence: Omit<Geofence, 'id'>) => void;
  deleteGeofence: (id: number) => void;

  // Commands
  commandHistory: Command[];
  sendCommand: (deviceId: number, type: CommandType) => void;

  // Settings
  darkMode: boolean;
  toggleDarkMode: () => void;
  mapStyle: string;
  setMapStyle: (style: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredDevices: Device[];
  statusFilter: DeviceStatus | 'all';
  setStatusFilter: (f: DeviceStatus | 'all') => void;

  // Playback
  fetchPlaybackRoute: (deviceId: number, from: string, to: string) => Promise<Position[]>;

  // Loading / Connection
  wsConnected: boolean;
  loading: boolean;
  apiError: string | null;
  checkingSession: boolean;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // Navigation
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [events, setEvents] = useState<GpsEvent[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [commandHistory, setCommandHistory] = useState<Command[]>([]);

  // Selection
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [alertFilter, setAlertFilter] = useState('all');

  // Settings
  const [darkMode, setDarkMode] = useState(false);
  const [mapStyle, setMapStyle] = useState('streets');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');

  // Connection state
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Polling for fallback when WebSocket fails
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsFailedRef = useRef(false);
  const initialLoadDone = useRef(false);

  // ---- Polling fallback functions ----
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    console.log('[AppContext] Starting polling fallback (WebSocket unavailable)');
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const [devs, pos] = await Promise.all([fetchDevices(), fetchPositions()]);
        setDevices(devs);
        setPositions(pos);
      } catch (err) {
        console.warn('[AppContext] Polling refresh failed:', err);
      }
    }, 10000); // Poll every 10 seconds
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // ---- Auto-login: check existing session on mount ----
  useEffect(() => {
    (async () => {
      setCheckingSession(true);
      try {
        if (hasStoredAuth()) {
          const sessionUser = await getSession();
          if (sessionUser) {
            setIsAuthenticated(true);
            setUser(sessionUser);
          }
        }
      } catch {
        // Silent fail
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  // ---- Dark mode ----
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ---- Load all data when authenticated ----
  useEffect(() => {
    if (!isAuthenticated || initialLoadDone.current) return;
    initialLoadDone.current = true;

    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        const [devs, pos] = await Promise.all([
          fetchDevices(),
          fetchPositions(),
        ]);
        setDevices(devs);
        setPositions(pos);

        // Fetch events and geofences separately (may fail on some Traccar configs)
        try {
          const evts = await fetchEvents();
          setEvents(evts);
        } catch (err) {
          console.warn('[AppContext] fetchEvents failed:', err);
          setEvents([]);
        }

        try {
          const geos = await fetchGeofences();
          setGeofences(geos);
        } catch (err) {
          console.warn('[AppContext] fetchGeofences failed:', err);
          setGeofences([]);
        }
      } catch (err) {
        console.error('[AppContext] Initial data load failed:', err);
        setApiError(
          err instanceof ApiError
            ? `Server error: ${err.message}`
            : 'Could not connect to Traccar server'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  // ---- WebSocket: connect when authenticated ----
  useEffect(() => {
    if (!isAuthenticated) return;

    // Reset state
    wsFailedRef.current = false;
    stopPolling();

    connectWebSocket({
      onPositions: (newPositions) => {
        setPositions(prev => {
          const map = new Map(prev.map(p => [p.deviceId, p]));
          newPositions.forEach(p => map.set(p.deviceId, p));
          return Array.from(map.values());
        });
      },
      onDevices: (updatedDevices) => {
        setDevices(prev => {
          const map = new Map(prev.map(d => [d.id, d]));
          updatedDevices.forEach(d => map.set(d.id, d));
          return Array.from(map.values());
        });
      },
      onEvents: (newEvents) => {
        setEvents(prev => [...newEvents, ...prev].slice(0, 200));
      },
      onConnect: () => {
        setWsConnected(true);
        wsFailedRef.current = false;
        stopPolling();
      },
      onDisconnect: () => {
        setWsConnected(false);
        // Start polling if WebSocket disconnects
        if (!wsFailedRef.current) {
          wsFailedRef.current = true;
          startPolling();
        }
      },
      onError: () => {
        setWsConnected(false);
        // Start polling if WebSocket has error
        if (!wsFailedRef.current) {
          wsFailedRef.current = true;
          startPolling();
        }
      },
    });

    return () => {
      disconnectWebSocket();
      stopPolling();
      setWsConnected(false);
    };
  }, [isAuthenticated, startPolling, stopPolling]);

  // ---- Login ----
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoginError('');
    setLoading(true);
    try {
      const apiUser = await loginSession(email, password);
      setIsAuthenticated(true);
      setUser(apiUser);
      initialLoadDone.current = false;
      return true;
    } catch (err) {
      setLoginError(
        err instanceof ApiError
          ? err.message
          : 'Could not connect to server. Please check your network.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Logout ----
  const logout = useCallback(async () => {
    await logoutSession();
    disconnectWebSocket();
    stopPolling();
    setIsAuthenticated(false);
    setUser(null);
    setDevices([]);
    setPositions([]);
    setEvents([]);
    setGeofences([]);
    setCurrentView('dashboard');
    setSelectedDeviceId(null);
    initialLoadDone.current = false;
  }, [stopPolling]);

  // ---- Get device position ----
  const getDevicePositionFn = useCallback(
    (deviceId: number) => positions.find(p => p.deviceId === deviceId),
    [positions]
  );

  // ---- Device CRUD ----
  const addDevice = useCallback(async (device: {
    name: string; uniqueId: string; phone?: string; model?: string; category?: string; groupId?: number;
  }): Promise<Device | null> => {
    try {
      const created = await apiCreateDevice(device);
      setDevices(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.error('[AppContext] addDevice failed:', err);
      throw err;
    }
  }, []);

  const editDevice = useCallback(async (id: number, device: Partial<{
    name: string; uniqueId: string; phone: string; model: string; category: string; groupId: number;
  }>): Promise<Device | null> => {
    try {
      const updated = await apiUpdateDevice(id, device);
      setDevices(prev => prev.map(d => d.id === id ? updated : d));
      return updated;
    } catch (err) {
      console.error('[AppContext] editDevice failed:', err);
      throw err;
    }
  }, []);

  const removeDevice = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteDeviceApi(id);
      setDevices(prev => prev.filter(d => d.id !== id));
      setPositions(prev => prev.filter(p => p.deviceId !== id));
      if (selectedDeviceId === id) setSelectedDeviceId(null);
      return true;
    } catch (err) {
      console.error('[AppContext] removeDevice failed:', err);
      throw err;
    }
  }, [selectedDeviceId]);

  const refreshDevices = useCallback(async () => {
    try {
      const [devs, pos] = await Promise.all([fetchDevices(), fetchPositions()]);
      setDevices(devs);
      setPositions(pos);
    } catch (err) {
      console.error('[AppContext] refreshDevices failed:', err);
    }
  }, []);

  // ---- Geofence CRUD ----
  const addGeofence = useCallback(async (geofence: Omit<Geofence, 'id'>) => {
    const created = await apiCreateGeofence(geofence);
    setGeofences(prev => [...prev, created]);
  }, []);

  const deleteGeofence = useCallback(async (id: number) => {
    await deleteGeofenceApi(id);
    setGeofences(prev => prev.filter(g => g.id !== id));
  }, []);

  // ---- Send command ----
  const sendCommand = useCallback(async (deviceId: number, type: CommandType) => {
    const pendingCmd: Command = {
      id: Date.now(),
      deviceId,
      type,
      description: type.replace(/([A-Z])/g, ' $1').trim(),
      sentTime: new Date().toISOString(),
      status: 'pending',
    };
    setCommandHistory(prev => [pendingCmd, ...prev]);

    try {
      const result = await sendCommandApi(deviceId, type);
      setCommandHistory(prev =>
        prev.map(c => c.id === pendingCmd.id ? { ...result, id: pendingCmd.id } : c)
      );
    } catch (err) {
      setCommandHistory(prev =>
        prev.map(c =>
          c.id === pendingCmd.id
            ? { ...c, status: 'failed', response: err instanceof Error ? err.message : 'Failed' }
            : c
        )
      );
    }
  }, []);

  // ---- Playback ----
  const fetchPlaybackRoute = useCallback(async (deviceId: number, from: string, to: string): Promise<Position[]> => {
    return fetchPositionHistory(deviceId, from, to);
  }, []);

  // ---- Toggle helpers ----
  const toggleSidebar = useCallback(() => setSidebarOpen(p => !p), []);
  const toggleSidebarCollapse = useCallback(() => setSidebarCollapsed(p => !p), []);
  const toggleDarkMode = useCallback(() => setDarkMode(p => !p), []);

  // ---- Filtered devices ----
  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.attributes.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.attributes.driver?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.uniqueId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppContext.Provider
      value={{
        isAuthenticated, user, login, logout, loginError, checkingSession,
        currentView, setCurrentView, sidebarOpen, toggleSidebar, sidebarCollapsed, toggleSidebarCollapse,
        devices, positions, selectedDeviceId, setSelectedDeviceId, getDevicePosition: getDevicePositionFn,
        addDevice, editDevice, removeDevice, refreshDevices,
        events, alertFilter, setAlertFilter,
        geofences, addGeofence, deleteGeofence,
        commandHistory, sendCommand,
        darkMode, toggleDarkMode, mapStyle, setMapStyle,
        searchQuery, setSearchQuery, filteredDevices, statusFilter, setStatusFilter,
        fetchPlaybackRoute,
        wsConnected, loading, apiError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
