# NetTopo Visualizer - Implementation Summary

## ✅ What Was Changed

### 1. **App.tsx - Data Fetching Logic**
- **Removed**: Static import from `constants.ts`
- **Added**: Dynamic fetch from `/data/raw_data_complete.json`
- **Features**:
  - Auto-refresh every 5 seconds
  - Loading state with spinner
  - Error handling with retry button
  - Last update timestamp display
  - No-cache headers to ensure fresh data

### 2. **Key Changes in App.tsx**

#### State Management
```typescript
const [data, setData] = useState<RawNetworkData | null>(null);  // Changed from DEFAULT_DATA
const [isLoading, setIsLoading] = useState(true);               // New
const [loadError, setLoadError] = useState<string | null>(null); // New
const [lastUpdate, setLastUpdate] = useState<Date | null>(null); // New
```

#### Data Fetching Effect
```typescript
useEffect(() => {
  const fetchTopologyData = async () => {
    try {
      const response = await fetch('/data/raw_data_complete.json', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const jsonData = await response.json();
      setData(jsonData);
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      setLoadError(error.message);
      setIsLoading(false);
    }
  };

  fetchTopologyData();
  const interval = setInterval(fetchTopologyData, 5000); // Poll every 5s
  
  return () => clearInterval(interval);
}, []);
```

## 📁 New Files Created

1. **DEPLOYMENT_GUIDE.md** - Complete Ubuntu/Nginx deployment instructions
2. **sample_data.json** - Example topology data format
3. **write_topology_data.py** - Python script for atomic JSON writes
4. **README.md** - Updated with new features and documentation

## 🎯 How It Works

```
┌─────────────────────────────────────┐
│  Network Scanner (Python/Script)   │
│  - Runs scan                        │
│  - Generates JSON                   │
│  - Writes atomically                │
└──────────────┬──────────────────────┘
               │
               ▼
  /var/www/reactapp/data/
    raw_data_complete.json
               │
               │ (HTTP GET every 5s)
               ▼
┌─────────────────────────────────────┐
│  React App (Browser)                │
│  ├─ Fetches JSON                    │
│  ├─ Updates visualization           │
│  └─ Shows timestamp                 │
└─────────────────────────────────────┘
```

## 🚀 Deployment Steps (Quick Reference)

### 1. Build React App
```bash
npm install
npm run build
```

### 2. Deploy to Server
```bash
sudo cp -r dist/* /var/www/reactapp/
sudo mkdir -p /var/www/reactapp/data
sudo chown -R www-data:www-data /var/www/reactapp
```

### 3. Configure Nginx
```nginx
server {
    listen 3000;
    root /var/www/reactapp;
    index index.html;

    location /data/ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
    }

    location / {
        try_files $uri /index.html;
    }
}
```

### 4. Write Topology Data
```python
python write_topology_data.py
```

### 5. Access App
```
http://your-server-ip:3000
```

## 🔄 Auto-Update Flow

1. **Network Scanner** runs and generates data
2. **Python Script** writes JSON atomically to `/var/www/reactapp/data/raw_data_complete.json`
3. **Nginx** serves the file with no-cache headers
4. **React App** fetches every 5 seconds
5. **UI Updates** automatically with new data
6. **Timestamp** shows last successful update

## ⚙️ Configuration Options

### Change Polling Interval

In `App.tsx`, line ~80:
```typescript
const interval = setInterval(fetchTopologyData, 10000); // 10 seconds
```

### Change Data Path

In `App.tsx`, line ~55:
```typescript
const response = await fetch('/your/custom/path.json', { 
  cache: 'no-store' 
});
```

### Adjust Graph Layout

In `TopologyGraph.tsx`:
```typescript
distributeRing(ring1, 200);  // Inner ring radius
distributeRing(ring2, 350);  // Outer ring radius
```

## 📊 Data Format Requirements

### Required Fields
- `export_timestamp` - ISO 8601 timestamp
- `export_type` - String identifier
- `data.devices.count` - Integer
- `data.devices.records` - Array of device objects
- `data.connections.count` - Integer
- `data.connections.records` - Array of connection objects

### Device Record
```typescript
{
  id: number,
  ip: string,
  name: string,
  type: string,  // "Switch", "ACTIVE_HOST", "Android_DEVICE", etc.
  mac: string,
  vendor: string,
  confidence: number,
  ...
}
```

### Connection Record
```typescript
{
  id: number,
  device_id: number,      // References device.id
  port_name: string,
  mac_address: string,    // Target MAC
  ip_address: string,     // Target IP
  status: string,         // "ACTIVE", "INACTIVE"
  ...
}
```

## 🛠️ Troubleshooting

### Problem: "Failed to Load Data"

**Solutions:**
1. Check file exists: `ls /var/www/reactapp/data/raw_data_complete.json`
2. Test Nginx: `curl http://localhost:3000/data/raw_data_complete.json`
3. Check permissions: `sudo chmod 644 /var/www/reactapp/data/raw_data_complete.json`
4. View logs: `sudo tail -f /var/log/nginx/error.log`

### Problem: Data Not Updating

**Solutions:**
1. Clear browser cache (Ctrl+Shift+R)
2. Check console: F12 → Console tab
3. Verify file is being updated: `watch -n 1 'stat /var/www/reactapp/data/raw_data_complete.json'`
4. Check network tab in browser dev tools

### Problem: CORS Errors

**Solution:** Add to Nginx config:
```nginx
add_header Access-Control-Allow-Origin "*";
```

## 📈 Performance Tips

1. **Reduce Polling**: Increase interval if server load is high
2. **Compress JSON**: Enable gzip in Nginx for large datasets
3. **Limit Data**: Only include necessary fields
4. **Use CDN**: For static assets if serving many users

## 🔐 Security Checklist

- [ ] Use HTTPS in production
- [ ] Restrict firewall to trusted IPs
- [ ] Implement rate limiting in Nginx
- [ ] Validate JSON data structure
- [ ] Set proper file permissions (644)
- [ ] Keep dependencies updated

## 📚 Additional Resources

- [D3.js Documentation](https://d3js.org/)
- [React Documentation](https://react.dev/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🎉 Features

✅ Real-time data fetching (5s polling)
✅ Atomic file writes (no corrupted reads)
✅ Loading states & error handling
✅ Auto-refresh timestamp
✅ No rebuild needed for data updates
✅ Production-ready deployment
✅ Comprehensive documentation
✅ Sample data & scripts included

## 📞 Support

For issues:
1. Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. Review browser console (F12)
3. Check Nginx logs
4. Verify JSON structure matches [sample_data.json](sample_data.json)

---

**Last Updated:** January 9, 2026
**Version:** 3.0.0
