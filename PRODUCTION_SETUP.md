# Production Setup - Live Scan Data Integration

This guide configures the React app to automatically fetch data from your network scanner.

## Architecture

```
/opt/eagleyesocradar/scans/
├── scan_2026-01-09_16-32-02/
│   ├── raw_data_complete.json ← Scanner generates here
│   └── ...
├── scan_2026-01-09_16-36-57/
│   └── ...
└── (newest scans...)

        ↓ (every 5 min)
        
/usr/local/bin/update_topology_scan
    - Finds 2nd-to-last scan folder
    - Copies raw_data_complete.json atomically
        
        ↓
        
/var/www/reactapp/data/raw_data_complete.json
    - Nginx serves this file
    - React app polls every 5 seconds
```

**Why second-to-last scan?**
- Latest scan might still be in progress (incomplete data)
- Second-to-last is complete and stable

## Setup Instructions

### Prerequisites

```bash
# Copy project to Linux filesystem (if using shared folder)
cp -r /mnt/hgfs/sharedfolder/shared\ net\ topo/NetTopo-Visualizer ~/NetTopo-Visualizer
cd ~/NetTopo-Visualizer

# Install dependencies and build
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 1. Deploy React App

```bash
# Deploy to Nginx
sudo ./deploy.sh
```

### 2. One-Time Setup (Automated)

**Run this single command:**

```bash
# Copy scripts from shared folder (if needed)
cp /mnt/hgfs/sharedfolder/shared\ net\ topo/NetTopo-Visualizer/*.sh ~/NetTopo-Visualizer/

# Make executable and run setup
chmod +x SETUP_ONCE.sh
sudo bash SETUP_ONCE.sh
```

**This script does everything:**
- ✅ Configures passwordless sudo for update commands
- ✅ Installs update script to `/usr/local/bin/`
- ✅ Creates systemd service + timer (runs every 5 minutes)
- ✅ Creates data directory with correct permissions
- ✅ Enables and starts auto-updates
- ✅ Runs initial update

**No more password prompts!** All management commands work without sudo password.

### 3. Verify Setup

```bash
# Check timer status (no password needed)
sudo systemctl status update-topology-scan.timer

# Check data file
ls -lh /var/www/reactapp/data/raw_data_complete.json

# View recent logs
sudo journalctl -u update-topology-scan -n 20
```

## Management Commands

```bash
# View real-time logs
sudo journalctl -u update-topology-scan -f

# Check timer schedule
systemctl list-timers update-topology-scan

# Manual update (for testing)
sudo /usr/local/bin/update_topology_scan

# Stop auto-updates
sudo systemctl stop update-topology-scan.timer

# Restart auto-updates
sudo systemctl start update-topology-scan.timer

# Disable permanently
sudo systemctl disable update-topology-scan.timer
```

## Customization

### Change Update Frequency

Edit timer interval:

```bash
sudo systemctl edit update-topology-scan.timer
```

Add:
```ini
[Timer]
OnUnitActiveSec=10min  # Change from 5min to 10min
```

Then reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart update-topology-scan.timer
```

### Use Different Scan Folder

Edit `/usr/local/bin/update_topology_scan`:

```bash
sudo nano /usr/local/bin/update_topology_scan
```

Change:
```bash
SCANS_DIR="/opt/eagleyesocradar/scans"  # Your custom path
```

### Change React App Poll Interval

The React app polls every 5 seconds by default. To change:

Edit [App.tsx](App.tsx) line 55:
```typescript
const POLL_MS = Number(env.VITE_POLL_INTERVAL_MS) || 600000; // 10 min
```

Or rebuild with env var:
```bash
VITE_POLL_INTERVAL_MS=600000 npm run build  # 10 minutes
```

## Troubleshooting

### Data Not Updating

```bash
# Check if scans are being generated
ls -lt /opt/eagleyesocradar/scans | head -5

# Check timer is running
sudo systemctl status update-topology-scan.timer

# Check for errors
sudo journalctl -u update-topology-scan -n 50

# Run manually to see output
sudo /usr/local/bin/update_topology_scan
```

### Permission Issues

```bash
# Ensure data directory is writable
sudo chown -R www-data:www-data /var/www/reactapp/data
sudo chmod 775 /var/www/reactapp/data

# Ensure scan directory is readable
sudo chmod -R +r /opt/eagleyesocradar/scans
```

### React App Shows Old Data

```bash
# Check browser Network tab for 304 (cached) responses
# Clear browser cache or force refresh (Ctrl+Shift+R)

# Verify file timestamp
stat /var/www/reactapp/data/raw_data_complete.json

# Check Nginx cache headers
curl -I http://localhost/data/raw_data_complete.json
```

## Production Monitoring

Add to your monitoring system:

```bash
# Check if data file is fresh (< 10 minutes old)
find /var/www/reactapp/data/raw_data_complete.json -mmin -10

# Alert if timer failed
systemctl is-active update-topology-scan.timer
```

## Alternative: Cron Job (instead of systemd)

If you prefer cron:

```bash
# Edit root crontab
sudo crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * /usr/local/bin/update_topology_scan >> /var/log/topology-update.log 2>&1
```
