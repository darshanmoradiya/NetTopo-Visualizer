# NetTopo Visualizer - AI Agent Instructions

## Project Overview

**NetTopo Visualizer** is a real-time network topology visualization app built with React 19, TypeScript, D3.js, and Vite. It displays live network scan data from a JSON file, auto-refreshing every 5 seconds to show an interactive force-directed graph with hub-and-spoke layout.

**Key Architecture:**
- **Data Flow:** Python scanner → `/var/www/reactapp/data/raw_data_complete.json` → React app loads on demand via manual refresh
- **Deployment:** Vite builds static assets served by Nginx on Ubuntu
- **Graph Layout:** D3 force simulation with automatic hub detection (highest connection count or first Switch type)
- **Update Model:** Manual refresh via UI button (no auto-polling)

## Critical Data Schema

The app expects JSON at `/data/raw_data_complete.json` with this structure:

```typescript
{
  export_timestamp: string,
  data: {
    devices: { records: DeviceRecord[] },
    connections: { records: ConnectionRecord[] },
    // ... see types.ts for complete schema
  }
}
```

**Key Relationships:**
- `connections[].device_id` → `devices[].id` (source device)
- `connections[].mac_address` → target device MAC (may create "ghost" L2-only nodes)
- Graph uses MAC addresses as primary node IDs for consistency

## Development Workflow

```bash
# Dev server (hot reload)
npm run dev  # → http://localhost:5173

# Production build
npm run build  # Creates dist/ folder

# Deploy to Ubuntu/Nginx
./deploy.sh  # Requires sudo, see deploy.sh for details
```

**Development Setup Requirements:**
1. **Sample Data**: Place JSON file at `public/data/raw_data_complete.json` for Vite to serve in dev mode
   - Copy from: `cp sample_data.json public/data/raw_data_complete.json`
   - Vite serves `public/` folder contents at root path
2. **Tailwind CSS**: Installed via PostCSS (not CDN) with config files:
   - `tailwind.config.js` - Content paths for purging
   - `postcss.config.js` - PostCSS plugins
   - `src/index.css` - Tailwind directives imported in `index.tsx`
3. **Cross-Platform (Windows + Ubuntu VM)**: 
   - **Shared folders (HGFS/vboxsf) DO NOT support symlinks** - npm install will fail
   - **Solution:** Copy project to Linux native filesystem (`~/NetTopo-Visualizer`) and run from there
   - Edit on Windows, sync via git/rsync, run on Linux native filesystem
   - See [DEV_SETUP.md](DEV_SETUP.md) for detailed workflow

**Data URL Configuration (runtime via env vars):**
- `VITE_TOPOLOGY_URL` - single URL
- `VITE_TOPOLOGY_URLS` - comma-separated fallback URLs
- See [App.tsx:52-55](App.tsx#L52-L55) for default URL fallback logic
- Data loads on page mount and via manual refresh button (no auto-polling)

## Component Architecture

**Three main views ([App.tsx](App.tsx)):**

1. **TopologyGraph** ([components/TopologyGraph.tsx](components/TopologyGraph.tsx))
   - D3 force-directed layout with zoom/pan
   - Auto-detects hub node (highest link count or first Switch)
   - Creates "ghost" L2-only nodes for unscanned devices (from connections without matching device records)
   - Node types: Switch, ACTIVE_HOST, INACTIVE_HOST, MOBILE_DEVICE, L2_DEVICE
   - Search highlighting via `searchTerm` prop

2. **StatsPanel** ([components/StatsPanel.tsx](components/StatsPanel.tsx))
   - Recharts-based visualizations
   - Displays: device type breakdown, vendor distribution, confidence scores, port analysis

3. **DeviceList** ([components/DeviceList.tsx](components/DeviceList.tsx))
   - Filterable table of all devices
   - Click to select node and switch to graph view

**State Management:**
- Global search in [App.tsx:144-155](App.tsx#L144-L155) filters devices by name/IP/vendor
- Selected node managed via callback props (no Redux/Context needed)

## Project-Specific Conventions

### 1. **Atomic JSON Writes**
Use [write_topology_data.py](write_topology_data.py) pattern for external data generators:
```python
# Write to temp, then atomic rename
with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp:
    json.dump(data, tmp)
os.replace(tmp.name, target_path)  # Atomic on POSIX
```
This prevents React app from reading partial JSON during updates.

### 2. **Node ID Consistency**
Always use MAC address as primary node ID when available ([TopologyGraph.tsx:70](components/TopologyGraph.tsx#L70)):
```typescript
const nodeId = device.mac && device.mac !== 'Unknown MAC' 
  ? device.mac 
  : `dev-${device.id}`;
```

### 3. **Force Graph Layout**
Hub-and-spoke layout is automatic ([TopologyGraph.tsx:131-147](components/TopologyGraph.tsx#L131-L147)):
- Prefers nodes with `type === 'Switch'`
- Falls back to highest connection count
- Hub positioned at center, spokes radially distributed

### 4. **No-Cache Fetch Headers**
Always include cache-busting headers for live data ([App.tsx:67-69](App.tsx#L67-69)):
```typescript
fetch(url, {
  cache: 'no-store',
  headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
})
```

### 5. **Manual Refresh Pattern**
Data loads on mount and via manual refresh button - no automatic polling ([App.tsx:40-100](App.tsx#L40-L100)):
- `fetchTopologyData()` function is called on mount and when user clicks "Refresh" button
- Shows loading spinner on refresh button during fetch
- Updates "last updated" timestamp in UI header
- Error state shows retry button that calls fetch again

## Deployment Specifics

**Target Environment:** Ubuntu 20.04+ with Nginx

**Production Data Flow:**
```
Scanner → /opt/eagleyesocradar/scans/scan_TIMESTAMP/raw_data_complete.json
    ↓ (systemd timer every 5 min)
update_topology_scan script (finds 2nd-to-last scan)
    ↓ (atomic copy)
/var/www/reactapp/data/raw_data_complete.json
    ↓ (Nginx serves)
React app (manual refresh button in UI)
```

**Why second-to-last scan:** Latest scan may be incomplete/in-progress; second-to-last is stable.

**User Experience:** Users click the "Refresh" button in the UI header to load latest data (no automatic polling).

**Directory Structure:**
```
/var/www/reactapp/
├── index.html
├── assets/          # Hashed JS/CSS bundles
└── data/
    └── raw_data_complete.json  # Auto-updated from scans
```

**Auto-Update Setup (see [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)):**
1. Run `sudo ./setup_auto_update.sh` to install systemd timer
2. Script runs every 5 minutes, copies 2nd-to-last scan's JSON
3. React app polls that file every 5 seconds for real-time updates

**Nginx Config Pattern (see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)):**
- SPA fallback: `try_files $uri /index.html`
- CORS headers for JSON endpoint
- Gzip compression enabled
- Cache-Control: no-cache for `/data/*`

**Permission Setup:**
```bash
sudo chown -R your-user:www-data /var/www/reactapp/data
sudo chmod 775 /var/www/reactapp/data
```

## Key Files Reference

- [types.ts](types.ts) - Complete TypeScript interfaces for JSON schema
- [constants.ts](constants.ts) - Empty default data structure (not used in production)
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Migration from static to dynamic data
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Full Nginx setup instructions
- [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) - Live scan data integration with auto-updates
- [DEV_SETUP.md](DEV_SETUP.md) - Development environment setup
- [sample_data.json](sample_data.json) - Example JSON format with all fields
- [update_latest_scan.sh](update_latest_scan.sh) - Script to copy second-last scan data
- [setup_auto_update.sh](setup_auto_update.sh) - Systemd timer installation script

## Common Tasks

**Add new device type:**
1. Update device type check in [TopologyGraph.tsx](components/TopologyGraph.tsx) color/icon mapping
2. Add to legend rendering logic
3.Change graph physics:**
- Edit D3 force parameters in [TopologyGraph.tsx:161-166](components/TopologyGraph.tsx#L161-L166)
- Adjust `forceStrength`, `linkDistance`, `chargeStrength` for tighter/looser clustering

**Debug data loading issues:**
- **Dev mode**: Ensure `public/data/raw_data_complete.json` exists (Vite serves public/ at root)
- **Browser errors**: Check Network tab for 404s or HTML responses (means file missing/wrong path)
- **CORS errors**: Only occur when fetching from external URLs (http://127.0.0.1) - use local paths in dev
- **JSON validation**: Verify structure matches [types.ts](types.ts) interfaces using browser console
- **Manual refresh**: Click "Refresh" button in UI header to reload data (no automatic updates)
- **CORS errors**: Only occur when fetching from external URLs (http://127.0.0.1) - use local paths in dev
- **JSON validation**: Verify structure matches [types.ts](types.ts) interfaces using browser console
