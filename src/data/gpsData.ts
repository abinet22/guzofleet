// ============================================
// GPS Fleet Tracking - Data Models & Helpers
// ============================================
// Type definitions and utility functions.
// Mock data retained only as fallback reference.
// ============================================

// --- Type Definitions ---

export type DeviceStatus = 'online' | 'offline' | 'idle';
export type AlertType = 'overspeed' | 'geofence_exit' | 'geofence_enter' | 'ignition_on' | 'ignition_off' | 'low_battery' | 'harsh_braking' | 'maintenance';
export type CommandType = 'engineStop' | 'engineResume' | 'lockDoors' | 'unlockDoors' | 'locate';

export interface Device {
  id: number;
  name: string;
  uniqueId: string;
  status: DeviceStatus;
  category: string;
  model: string;
  phone: string;
  lastUpdate: string;
  positionId: number;
  groupId: number;
  attributes: {
    batteryLevel?: number;
    totalDistance?: number;
    ignition?: boolean;
    fuel?: number;
    driver?: string;
    licensePlate?: string;
    color?: string;
  };
}

export interface Position {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  course: number;
  accuracy: number;
  address?: string;
  fixTime: string;
  serverTime: string;
  attributes: {
    batteryLevel?: number;
    ignition?: boolean;
    distance?: number;
    totalDistance?: number;
    motion?: boolean;
    fuel?: number;
  };
}

export interface GpsEvent {
  id: number;
  deviceId: number;
  type: AlertType;
  eventTime: string;
  positionId: number;
  attributes: {
    speed?: number;
    speedLimit?: number;
    geofenceId?: number;
    geofenceName?: string;
    alarm?: string;
  };
}

export type GeofenceType = 'circle' | 'polygon' | 'polyline';

export interface Geofence {
  id: number;
  name: string;
  description: string;
  area: string;
  calendarId: number;
  attributes: {
    color?: string;
    speedLimit?: number;
  };
  // Circle specific
  centerLat?: number;
  centerLng?: number;
  radius?: number;
  // Type and coordinates for all geofence types
  geofenceType?: GeofenceType;
  coordinates?: [number, number][]; // Array of [lng, lat] pairs
}

export interface Command {
  id?: number;
  deviceId: number;
  type: CommandType;
  description: string;
  sentTime?: string;
  response?: string;
  status?: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface TripSummary {
  startTime: string;
  endTime: string;
  distance: number;
  maxSpeed: number;
  avgSpeed: number;
  drivingTime: number;
  stops: number;
  startAddress: string;
  endAddress: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  administrator: boolean;
  deviceLimit: number;
  userLimit: number;
  attributes: {
    theme?: 'light' | 'dark';
    mapType?: string;
    notifications?: boolean;
  };
}

// --- Helper Functions (use real time) ---

export const formatSpeed = (speed: number): string => `${Math.round(speed)} km/h`;

export const formatDistance = (meters: number): string => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

export const formatDistanceKm = (km: number): string => {
  return `${km.toFixed(0)} km`;
};

export const timeAgoString = (dateStr: string): string => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 60000);
  if (diff < 0) return 'Just now';
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

export const getAlertIcon = (type: AlertType): string => {
  const icons: Record<AlertType, string> = {
    overspeed: 'Gauge',
    geofence_exit: 'MapPinOff',
    geofence_enter: 'MapPin',
    ignition_on: 'Power',
    ignition_off: 'PowerOff',
    low_battery: 'BatteryLow',
    harsh_braking: 'AlertTriangle',
    maintenance: 'Wrench',
  };
  return icons[type];
};

export const getAlertColor = (type: AlertType): string => {
  const colors: Record<AlertType, string> = {
    overspeed: '#F44336',
    geofence_exit: '#FF9800',
    geofence_enter: '#4CAF50',
    ignition_on: '#2196F3',
    ignition_off: '#9E9E9E',
    low_battery: '#F44336',
    harsh_braking: '#FF5722',
    maintenance: '#795548',
  };
  return colors[type];
};

export const getAlertLabel = (type: AlertType): string => {
  const labels: Record<AlertType, string> = {
    overspeed: 'Overspeed',
    geofence_exit: 'Geofence Exit',
    geofence_enter: 'Geofence Enter',
    ignition_on: 'Ignition On',
    ignition_off: 'Ignition Off',
    low_battery: 'Low Battery',
    harsh_braking: 'Harsh Braking',
    maintenance: 'Maintenance',
  };
  return labels[type];
};

export const getStatusColor = (status: DeviceStatus): string => {
  const colors: Record<DeviceStatus, string> = {
    online: '#4CAF50',
    offline: '#F44336',
    idle: '#FF9800',
  };
  return colors[status];
};

// --- Empty defaults for when API returns no data ---
export const mockUser: User = {
  id: 0,
  name: 'User',
  email: '',
  phone: '',
  administrator: false,
  deviceLimit: -1,
  userLimit: 0,
  attributes: { theme: 'light', mapType: 'streets', notifications: true },
};

export const mockDevices: Device[] = [];
export const mockPositions: Position[] = [];
export const mockEvents: GpsEvent[] = [];
export const mockGeofences: Geofence[] = [];
export const mockPlaybackPositions: Position[] = [];

export const getDevicePosition = (deviceId: number): Position | undefined => undefined;
export const getDeviceEvents = (deviceId: number): GpsEvent[] => [];
