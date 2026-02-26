# Geofence Enhancement TODO

## Plan Overview

Add support for Polygon and Polyline geofence types in addition to Circle. Also ensure proper map coverage on load and when selecting geofences from the list.

## Tasks

### 1. Update `src/data/gpsData.ts`

- [x] Add `geofenceType` field to Geofence interface (circle/polygon/polyline)
- [x] Add `coordinates` array field for polygon/polyline storage

### 2. Update `src/services/traccarApi.ts`

- [x] Enhance `mapGeofence` function to parse POLYGON format
- [x] Enhance `mapGeofence` function to parse LINESTRING format

### 3. Update `src/components/gps/Geofences.tsx`

- [x] Add geofence type selector (Circle/Polygon/Polyline) in create form
- [x] Implement click-to-draw polygon functionality
- [x] Implement click-to-draw polyline functionality
- [x] Render different map layers based on geofence type
- [x] Fit map bounds on first load to cover all geofences
- [x] On list item click, fly to the geofence area
