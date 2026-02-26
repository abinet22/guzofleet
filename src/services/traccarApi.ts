// ============================================
// Traccar API Service & WebSocket Manager
// ============================================
// Real Traccar API integration for Walta Pharmaceuticals GPS Platform.
// Uses Basic Auth (token stored in localStorage) for Capacitor compatibility.
// No mock data fallbacks – all data comes from the live server.
// ============================================

import {
  Device, Position, GpsEvent, Geofence, Command, User,
  CommandType, GeofenceType,
} from '@/data/gpsData';

// --------------- Configuration ---------------
const getEnv = (key: string, fallback: string): string => {
  return (import.meta as any).env?.[key] || fallback;
};

const BASE_URL = getEnv('VITE_TRACCAR_BASE_URL', 'https://gps.waltapharmaceuticals.pro.et').trim();
const API = BASE_URL.startsWith('http') ? `${BASE_URL}/api` : BASE_URL;

const getWsUrl = (): string => {
  const wsUrl = getEnv('VITE_TRACCAR_WS_URL', '');
  if (wsUrl) return wsUrl;
  const wsBase = BASE_URL.replace(/^http/, 'ws');
  return `${wsBase}/api/socket`;
};

const WS_URL = getWsUrl();
// const BASE_URL = ((import.meta as any).env?.VITE_TRACCAR_BASE_URL || 'https://gps.waltapharmaceuticals.pro.et').replace(/\/+$/, '');
// const API = `${BASE_URL}/api`;

// // Derive WebSocket URL from base (http→ws, https→wss)
// const wsBase = BASE_URL.replace(/^http/, 'ws');
// const WS_URL = (import.meta as any).env?.VITE_TRACCAR_WS_URL || `${wsBase}/api/socket`;

// // --------------- Auth Token Management ---------------
// // For Capacitor native apps, cookies don't persist reliably.
// // We store Basic Auth credentials and attach them to every request.

const AUTH_KEY = 'traccar_auth';

function getAuthHeader(): string | null {
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return null;
  return stored;
}

function setAuthHeader(email: string, password: string): void {
  const token = btoa(`${email}:${password}`);
  localStorage.setItem(AUTH_KEY, `Basic ${token}`);
}

function clearAuthHeader(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function hasStoredAuth(): boolean {
  return !!localStorage.getItem(AUTH_KEY);
}

// --------------- Helpers ---------------

/** Shared fetch wrapper – sends auth header & handles errors */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retries = 2,
): Promise<T> {
  const url = `${API}${path}`;
  const authHeader = getAuthHeader();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const config: RequestInit = {
    credentials: 'include',
    headers,
    ...options,
    // Override headers to use our merged version
  };
  config.headers = headers;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, config);

      if (res.status === 401) {
        throw new ApiError('Unauthorized – session expired', 401);
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new ApiError(body || `HTTP ${res.status}`, res.status);
      }

      if (res.status === 204) return undefined as unknown as T;

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw new ApiError(
        err instanceof Error ? err.message : 'Network error',
        0,
      );
    }
  }
  throw new ApiError('Max retries exceeded', 0);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// --------------- Auth Endpoints ---------------

/**
 * POST /api/session – Create a session (login).
 * Also stores Basic Auth credentials for future requests (Capacitor-safe).
 */
export async function loginSession(
  email: string,
  password: string,
): Promise<User> {
  const res = await fetch(`${API}/session`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${email}:${password}`)}`,
    },
    body: new URLSearchParams({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) throw new ApiError('Invalid email or password', 401);
    throw new ApiError(text || `Login failed (${res.status})`, res.status);
  }

  // Store auth for future requests (Capacitor compatibility)
  setAuthHeader(email, password);

  const data = await res.json();
  return mapUser(data);
}

/** DELETE /api/session – Destroy session (logout) */
export async function logoutSession(): Promise<void> {
  try {
    const authHeader = getAuthHeader();
    await fetch(`${API}/session`, {
      method: 'DELETE',
      credentials: 'include',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });
  } catch {
    // Ignore – we clear local state regardless
  }
  clearAuthHeader();
}

/** GET /api/session – Check if session is still valid (auto-login) */
export async function getSession(): Promise<User | null> {
  const authHeader = getAuthHeader();
  if (!authHeader) return null;

  try {
    const res = await fetch(`${API}/session`, {
      credentials: 'include',
      headers: { 'Authorization': authHeader },
    });
    if (!res.ok) {
      if (res.status === 401) clearAuthHeader();
      return null;
    }
    return mapUser(await res.json());
  } catch {
    return null;
  }
}

// --------------- Device Endpoints ---------------

/** GET /api/devices */
export async function fetchDevices(): Promise<Device[]> {
  const data = await apiFetch<any[]>('/devices');
  return data.map(mapDevice);
}

/** POST /api/devices – Create a new device */
export async function createDevice(device: {
  name: string;
  uniqueId: string;
  phone?: string;
  model?: string;
  category?: string;
  groupId?: number;
  attributes?: Record<string, any>;
}): Promise<Device> {
  const body = {
    name: device.name,
    uniqueId: device.uniqueId,
    phone: device.phone || '',
    model: device.model || '',
    category: device.category || 'default',
    groupId: device.groupId || 0,
    attributes: device.attributes || {},
  };
  const data = await apiFetch<any>('/devices', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return mapDevice(data);
}

/** PUT /api/devices/:id – Update a device */
export async function updateDevice(id: number, device: Partial<{
  name: string;
  uniqueId: string;
  phone: string;
  model: string;
  category: string;
  groupId: number;
  attributes: Record<string, any>;
}>): Promise<Device> {
  const data = await apiFetch<any>(`/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ id, ...device }),
  });
  return mapDevice(data);
}

/** DELETE /api/devices/:id – Delete a device */
export async function deleteDeviceApi(id: number): Promise<void> {
  await apiFetch(`/devices/${id}`, { method: 'DELETE' });
}

// --------------- Position Endpoints ---------------

/** GET /api/positions (latest for all devices) */
export async function fetchPositions(): Promise<Position[]> {
  const data = await apiFetch<any[]>('/positions');
  return data.map(mapPosition);
}

/**
 * GET /api/reports/route?deviceId=ID&from=DATE&to=DATE
 * Used for playback / route history.
 */
export async function fetchPositionHistory(
  deviceId: number,
  from: string,
  to: string,
): Promise<Position[]> {
  const params = new URLSearchParams({
    deviceId: String(deviceId),
    from,
    to,
  });
  const data = await apiFetch<any[]>(`/positions?${params}`);
  console.log('Fetched position history:', data);
  return data.map(mapPosition);
}

// --------------- Event Endpoints ---------------

/** GET /api/reports/events – Events within a time range */
export async function fetchEvents(deviceId?: number): Promise<GpsEvent[]> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86400000);
  const params = new URLSearchParams({
    from: dayAgo.toISOString(),
    to: now.toISOString(),
  });
  if (deviceId) params.set('deviceId', String(deviceId));

  try {
    const data = await apiFetch<any[]>(`/reports/events?${params}`);
    return data.map(mapEvent);
  } catch (err) {
    // Some Traccar versions need all deviceId params
    // Try fetching without device filter
    if (deviceId) {
      console.warn('[TraccarAPI] fetchEvents with deviceId failed, trying without');
      const params2 = new URLSearchParams({
        from: dayAgo.toISOString(),
        to: now.toISOString(),
      });
      const data = await apiFetch<any[]>(`/reports/events?${params2}`);
      const allEvents = data.map(mapEvent);
      return deviceId ? allEvents.filter(e => e.deviceId === deviceId) : allEvents;
    }
    throw err;
  }
}

// --------------- Geofence Endpoints ---------------

/** GET /api/geofences */
export async function fetchGeofences(): Promise<Geofence[]> {
  const data = await apiFetch<any[]>('/geofences');
  return data.map(mapGeofence);
}

/** POST /api/geofences – Create a new geofence */
export async function createGeofence(
  geofence: Omit<Geofence, 'id'>,
): Promise<Geofence> {
  const body = {
    name: geofence.name,
    description: geofence.description,
    area: geofence.area,
    calendarId: geofence.calendarId || 0,
    attributes: geofence.attributes || {},
  };
  const data = await apiFetch<any>('/geofences', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return mapGeofence(data);
}

/** PUT /api/geofences/:id – Update a geofence */
export async function updateGeofenceApi(id: number, geofence: Partial<Geofence>): Promise<Geofence> {
  const data = await apiFetch<any>(`/geofences/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ id, ...geofence }),
  });
  return mapGeofence(data);
}

/** DELETE /api/geofences/:id */
export async function deleteGeofenceApi(id: number): Promise<void> {
  await apiFetch(`/geofences/${id}`, { method: 'DELETE' });
}

// --------------- Command Endpoints ---------------

/**
 * POST /api/commands/send
 * Sends a command to a device (e.g. engineStop, engineResume).
 */
export async function sendCommandApi(
  deviceId: number,
  type: CommandType,
): Promise<Command> {
  const traccarTypeMap: Record<CommandType, string> = {
    engineStop: 'engineStop',
    engineResume: 'engineResume',
    lockDoors: 'custom',
    unlockDoors: 'custom',
    locate: 'positionSingle',
  };

  const descriptions: Record<CommandType, string> = {
    engineStop: 'Engine Cut Off',
    engineResume: 'Engine Resume',
    lockDoors: 'Lock Doors',
    unlockDoors: 'Unlock Doors',
    locate: 'Request Location',
  };

  const body = {
    deviceId,
    type: traccarTypeMap[type],
    attributes: {},
  };

  const data = await apiFetch<any>('/commands/send', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    id: data?.id || Date.now(),
    deviceId,
    type,
    description: descriptions[type],
    sentTime: new Date().toISOString(),
    status: 'sent',
  };
}

// --------------- Groups Endpoints ---------------

/** GET /api/groups */
export async function fetchGroups(): Promise<any[]> {
  return apiFetch<any[]>('/groups');
}

// --------------- Server Info ---------------

/** GET /api/server */
export async function fetchServerInfo(): Promise<any> {
  return apiFetch<any>('/server');
}

// --------------- Notifications ---------------

/** GET /api/notifications */
export async function fetchNotifications(): Promise<any[]> {
  return apiFetch<any[]>('/notifications');
}

// --------------- WebSocket Manager ---------------

export type WsListener = {
  onPositions?: (positions: Position[]) => void;
  onDevices?: (devices: Device[]) => void;
  onEvents?: (events: GpsEvent[]) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (err: Event) => void;
};

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let listeners: WsListener = {};
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;

/** Start the WebSocket connection to Traccar */
export function connectWebSocket(newListeners: WsListener): void {
  listeners = newListeners;
  _connect();
}

function _connect(): void {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    ws = new WebSocket(WS_URL);
  } catch {
    _scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log('[WS] Connected to Traccar');
    reconnectAttempts = 0;
    listeners.onConnect?.();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.positions && Array.isArray(data.positions)) {
        listeners.onPositions?.(data.positions.map(mapPosition));
      }
      if (data.devices && Array.isArray(data.devices)) {
        listeners.onDevices?.(data.devices.map(mapDevice));
      }
      if (data.events && Array.isArray(data.events)) {
        listeners.onEvents?.(data.events.map(mapEvent));
      }
    } catch (err) {
      console.warn('[WS] Failed to parse message', err);
    }
  };

  ws.onclose = () => {
    console.log('[WS] Disconnected');
    listeners.onDisconnect?.();
    _scheduleReconnect();
  };

  ws.onerror = (err) => {
    console.warn('[WS] Error', err);
    listeners.onError?.(err);
  };
}

function _scheduleReconnect(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
  reconnectTimer = setTimeout(_connect, delay);
}

/** Cleanly close the WebSocket */
export function disconnectWebSocket(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = 0;
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
}

// --------------- Data Mappers ---------------

function mapUser(raw: any): User {
  return {
    id: raw.id ?? 0,
    name: raw.name ?? raw.email ?? 'User',
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    administrator: raw.administrator ?? false,
    deviceLimit: raw.deviceLimit ?? -1,
    userLimit: raw.userLimit ?? 0,
    attributes: {
      theme: raw.attributes?.theme ?? 'light',
      mapType: raw.attributes?.mapType ?? 'streets',
      notifications: raw.attributes?.notificationTokens ? true : true,
    },
  };
}

function mapDevice(raw: any): Device {
  const status: Device['status'] =
    raw.status === 'online' ? 'online' :
    raw.status === 'offline' ? 'offline' : 'idle';

  return {
    id: raw.id ?? 0,
    name: raw.name ?? `Device ${raw.id}`,
    uniqueId: raw.uniqueId ?? '',
    status,
    category: raw.category ?? 'default',
    model: raw.model ?? raw.category ?? 'Unknown',
    phone: raw.phone ?? '',
    lastUpdate: raw.lastUpdate ?? new Date().toISOString(),
    positionId: raw.positionId ?? 0,
    groupId: raw.groupId ?? 0,
    attributes: {
      batteryLevel: raw.attributes?.batteryLevel ?? null,
      totalDistance: raw.attributes?.totalDistance ?? 0,
      ignition: raw.attributes?.ignition ?? false,
      fuel: raw.attributes?.fuel ?? null,
      driver: raw.attributes?.driver ?? raw.contact ?? '',
      licensePlate: raw.attributes?.licensePlate ?? '',
      color: raw.attributes?.color ?? '#1976D2',
    },
  };
}

function mapPosition(raw: any): Position {
  return {
    id: raw.id ?? 0,
    deviceId: raw.deviceId ?? 0,
    latitude: raw.latitude ?? 0,
    longitude: raw.longitude ?? 0,
    altitude: raw.altitude ?? 0,
    speed: knotsToKmh(raw.speed ?? 0),
    course: raw.course ?? 0,
    accuracy: raw.accuracy ?? 0,
    address: raw.address ?? undefined,
    fixTime: raw.fixTime ?? new Date().toISOString(),
    serverTime: raw.serverTime ?? new Date().toISOString(),
    attributes: {
      batteryLevel: raw.attributes?.batteryLevel ?? undefined,
      ignition: raw.attributes?.ignition ?? false,
      distance: raw.attributes?.distance ?? 0,
      totalDistance: raw.attributes?.totalDistance ?? 0,
      motion: raw.attributes?.motion ?? false,
      fuel: raw.attributes?.fuel ?? undefined,
    },
  };
}

function mapEvent(raw: any): GpsEvent {
  const typeMap: Record<string, GpsEvent['type']> = {
    deviceOverspeed: 'overspeed',
    geofenceExit: 'geofence_exit',
    geofenceEnter: 'geofence_enter',
    ignitionOn: 'ignition_on',
    ignitionOff: 'ignition_off',
    deviceOffline: 'low_battery',
    alarm: 'harsh_braking',
    maintenance: 'maintenance',
  };

  return {
    id: raw.id ?? 0,
    deviceId: raw.deviceId ?? 0,
    type: typeMap[raw.type] ?? 'maintenance',
    eventTime: raw.eventTime ?? raw.serverTime ?? new Date().toISOString(),
    positionId: raw.positionId ?? 0,
    attributes: {
      speed: raw.attributes?.speed ? knotsToKmh(raw.attributes.speed) : undefined,
      speedLimit: raw.attributes?.speedLimit ? knotsToKmh(raw.attributes.speedLimit) : undefined,
      geofenceId: raw.geofenceId ?? undefined,
      geofenceName: raw.attributes?.geofenceName ?? undefined,
      alarm: raw.attributes?.alarm ?? undefined,
    },
  };
}

function mapGeofence(raw: any): Geofence {
  let centerLat: number | undefined;
  let centerLng: number | undefined;
  let radius: number | undefined;
  let geofenceType: GeofenceType = 'circle';
  let coordinates: [number, number][] | undefined;

  // Parse CIRCLE format: CIRCLE (lng lat, radius)
  const circleMatch = raw.area?.match(/CIRCLE\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*,\s*([\d.]+)\s*\)/i);
  if (circleMatch) {
    centerLat = parseFloat(circleMatch[1]);
    centerLng = parseFloat(circleMatch[2]);
    radius = parseFloat(circleMatch[3]);
    geofenceType = 'circle';
  }

  // Parse POLYGON format: POLYGON ((lng lat, lng lat, ...))
  const polygonMatch = raw.area?.match(/POLYGON\s*\(\s*\(\s*([\d\s.,\-\+]+)\s*\)\s*\)/i);
  if (polygonMatch) {
    geofenceType = 'polygon';
    const coordsStr = polygonMatch[1];
    const coordPairs = coordsStr.split(',').map((pair: string) => {
      const [lng, lat] = pair.trim().split(/\s+/).map(Number);
      return [lng, lat] as [number, number];
    });
    coordinates = coordPairs;
    // Calculate center for polygon
    if (coordinates.length > 0) {
      const sumLng = coordinates.reduce((sum, c) => sum + c[0], 0);
      const sumLat = coordinates.reduce((sum, c) => sum + c[1], 0);
      centerLng = sumLng / coordinates.length;
      centerLat = sumLat / coordinates.length;
    }
  }

  // Parse LINESTRING format: LINESTRING (lng lat, lng lat, ...)
  const lineStringMatch = raw.area?.match(/LINESTRING\s*\(\s*([\d\s.,\-\+]+)\s*\)/i);
  if (lineStringMatch) {
    geofenceType = 'polyline';
    const coordsStr = lineStringMatch[1];
    const coordPairs = coordsStr.split(',').map((pair: string) => {
      const [lng, lat] = pair.trim().split(/\s+/).map(Number);
      return [lng, lat] as [number, number];
    });
    coordinates = coordPairs;
    // Calculate center for polyline
    if (coordinates.length > 0) {
      const sumLng = coordinates.reduce((sum, c) => sum + c[0], 0);
      const sumLat = coordinates.reduce((sum, c) => sum + c[1], 0);
      centerLng = sumLng / coordinates.length;
      centerLat = sumLat / coordinates.length;
    }
  }

  return {
    id: raw.id ?? 0,
    name: raw.name ?? 'Unnamed',
    description: raw.description ?? '',
    area: raw.area ?? '',
    calendarId: raw.calendarId ?? 0,
    attributes: {
      color: raw.attributes?.color ?? '#1976D2',
      speedLimit: raw.attributes?.speedLimit ?? undefined,
    },
    centerLat,
    centerLng,
    radius,
    geofenceType,
    coordinates,
  };
}

/** Traccar reports speed in knots – convert to km/h */
function knotsToKmh(knots: number): number {
  return knots * 1.852;
}

/** Export base URL for display in settings */
export const TRACCAR_BASE_URL = BASE_URL;
export const TRACCAR_WS_URL = WS_URL;
