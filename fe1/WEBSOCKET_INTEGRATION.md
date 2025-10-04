# WebSocket Integration Summary - Real-time Sensor Data

## Overview
Dashboard đã được cập nhật để sử dụng **WebSocket** thay vì REST API polling để nhận dữ liệu sensor real-time từ MQTT bridge.

## Architecture Flow

```
ESP32/Sensor → MQTT Broker → Go Backend (bridge.go) → WebSocket → React Frontend
                              (topic: sensor/information)      (ws://localhost:8080/ws)
```

### Backend Flow (brigde.go):
1. Subscribe MQTT topic `sensor/information`
2. Nhận data từ sensor: `{temperature, humidity, light_raw}`
3. Parse và save vào database
4. **Broadcast qua WebSocket** đến tất cả clients
5. Frontend nhận data real-time

## Changes Made

### 1. Created WebSocket Hook (`hooks/useSensorWebSocket.ts`)
```typescript
const { latestData, history, connected, error } = useSensorWebSocket();
```

**Features:**
- ✅ Auto-connect to `ws://localhost:8080/ws`
- ✅ Real-time data updates
- ✅ Keep last 50 readings in history
- ✅ Auto-reconnect on disconnect
- ✅ Parse sensor message format: `{temperature, humidity, light_raw}`

**Returns:**
- `latestData`: Latest sensor reading
- `history`: Array of last 50 readings for charts
- `connected`: WebSocket connection status
- `error`: Error message if any

### 2. Updated Dashboard (`pages/Dashboard.tsx`)

**Before:**
```typescript
// Polling API every 30 seconds
const [sensorResponse, latestSensor] = await Promise.all([
  sensorService.getAllSensorData(),
  sensorService.getLatestSensorData(),
]);
```

**After:**
```typescript
// Real-time WebSocket subscription
const { latestData, history, connected } = useSensorWebSocket();
```

**Key Changes:**
- ❌ Removed REST API polling for sensor data
- ✅ Added WebSocket connection for real-time updates
- ✅ Added connection status indicator (Wifi icon)
- ✅ Auto-update UI when new data arrives
- ✅ Keep device management via REST API

### 3. WebSocket Message Format

**MQTT Payload (from sensor):**
```json
{
  "temperature": 25.5,
  "humidity": 65.2,
  "light_raw": 450
}
```

**Transformed to SensorData:**
```typescript
{
  ID: timestamp,
  CreatedAt: ISO string,
  UpdatedAt: ISO string,
  temperature: 25.5,
  humidity: 65.2,
  light: 450  // Note: light_raw → light
}
```

## Benefits

### Real-time Updates
- ⚡ **Instant updates** - No 30-second delay
- 📊 **Live charts** - Data updates as sensor sends
- 🔄 **Auto-reconnect** - Handles connection drops

### Performance
- 🚀 **Reduced server load** - No polling every 30s
- 💾 **Less bandwidth** - Only send when data changes
- 🎯 **Efficient** - Push model instead of pull

### User Experience
- 👁️ **Connection status** - Visual indicator (Wifi icon)
- 📈 **Smooth updates** - No loading states between updates
- 🔴 **Live indicator** - Shows real-time connection

## Testing

### 1. Check WebSocket Connection
```bash
# In browser console (F12)
# You should see:
WebSocket: Connecting to ws://localhost:8080/ws
WebSocket: Connected successfully
WebSocket: Received sensor data: {temperature: 25.5, humidity: 65, light_raw: 450}
```

### 2. Check Dashboard UI
- ✅ Green Wifi icon = Connected
- ❌ Red Wifi icon = Disconnected
- 📊 Real-time chart updates
- 🔢 Latest values update instantly

### 3. Test Auto-reconnect
1. Stop backend server
2. Dashboard shows "WebSocket Disconnected" (red)
3. Start backend server
4. Dashboard auto-reconnects after 3 seconds
5. Green icon shows "WebSocket Connected"

## Backend Requirements

Ensure Go backend is running with WebSocket support:
```bash
cd gobe
go run cmd/myapp/main.go
```

**WebSocket endpoint:** `ws://localhost:8080/ws`
**MQTT topic:** `sensor/information`

## UI Changes

### Connection Status Indicator
```tsx
<div className={wsConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
  {wsConnected ? <Wifi /> : <WifiOff />}
  {wsConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
</div>
```

### Debug Panel (Can be removed)
```tsx
<div className="mb-4 p-4 bg-gray-800 rounded-lg">
  <p>✓ Dashboard Loaded</p>
  <p>Real-time Sensors: {sensorData.length} | Latest: {latestSensorData ? '✓' : '✗'}</p>
</div>
```

## Troubleshooting

### WebSocket not connecting
1. Check backend is running: http://localhost:8080
2. Check WebSocket endpoint: ws://localhost:8080/ws
3. Check browser console for errors

### No data updates
1. Check MQTT broker is running
2. Check sensor is publishing to topic `sensor/information`
3. Check bridge.go logs for MQTT messages

### Connection keeps dropping
1. Check network stability
2. Check MQTT broker connection
3. Review bridge.go error logs

## Next Steps

- [ ] Test with real ESP32/sensor hardware
- [ ] Remove debug panel after confirming it works
- [ ] Add error handling for malformed WebSocket messages
- [ ] Consider adding WebSocket reconnection limit
- [ ] Add data visualization improvements

## Data Flow Example

```
1. ESP32 sends: {"temperature": 25.5, "humidity": 65, "light_raw": 450}
   ↓
2. MQTT Broker receives on topic: sensor/information
   ↓
3. Go Backend (brigde.go) subscribes and receives
   ↓
4. Go saves to database
   ↓
5. Go broadcasts to WebSocket: ws://localhost:8080/ws
   ↓
6. React Frontend receives via useSensorWebSocket hook
   ↓
7. Dashboard updates UI instantly
```

## Performance Metrics

### Before (REST API Polling)
- Update interval: 30 seconds
- Request overhead: Every 30s
- Data freshness: Up to 30s old
- Server load: High (continuous polling)

### After (WebSocket)
- Update interval: Real-time (< 1s)
- Request overhead: Once (initial connection)
- Data freshness: Instant
- Server load: Low (push only when data changes)

---

**Note:** Fake data has been completely removed. Dashboard now shows only real sensor data from WebSocket.
