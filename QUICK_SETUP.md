# Complete Production Setup - Quick Start

## One-Command Setup (Run on Ubuntu)

```bash
cd ~/NetTopo-Visualizer

# 1. Copy all files from shared folder
cp /mnt/hgfs/sharedfolder/shared\ net\ topo/NetTopo-Visualizer/*.sh .
cp /mnt/hgfs/sharedfolder/shared\ net\ topo/NetTopo-Visualizer/*.py .

# 2. Build and deploy React app
npm install
npm run build
sudo ./deploy.sh

# 3. Setup firewall log API
chmod +x setup_log_api.sh
sudo bash setup_log_api.sh

# 4. Setup topology auto-updates
chmod +x SETUP_ONCE.sh
sudo bash SETUP_ONCE.sh
```

## What This Sets Up

### 1. **React Web App** (http://your-ip/)
- Interactive network topology visualization
- Manual refresh button for latest scan data
- Device search and statistics
- Deployed to Nginx at `/var/www/reactapp/`

### 2. **Firewall Log API** (Port 5000)
- Flask REST API serving real firewall logs
- Filters logs by device MAC address
- Parses `/home/ubuntu/firewall_sim/firewall.log`
- Shows latest 100 logs per device
- **Endpoint:** `http://localhost:5000/api/logs/tail/{MAC}`

### 3. **Topology Auto-Update** (Every 5 min)
- Systemd timer copies second-to-last scan to Nginx
- Source: `/opt/eagleyesocradar/scans/scan_*/raw_data_complete.json`
- Destination: `/var/www/reactapp/data/raw_data_complete.json`
- Atomic updates (no partial files)

## Verify Everything Works

```bash
# Check all services
sudo systemctl status firewall-log-api        # Should be "active (running)"
sudo systemctl status update-topology-scan.timer  # Should be "active (waiting)"

# Test log API
curl http://localhost:5000/api/health
# Should return: {"status":"ok","log_file":"/home/ubuntu/firewall_sim/firewall.log","log_file_exists":true}

# Test with real MAC
curl "http://localhost:5000/api/logs/tail/00-42-38-C7-26-7B"
# Should return JSON with logs

# Check topology data
ls -lh /var/www/reactapp/data/raw_data_complete.json
# Should show recent file with scan data

# View logs
sudo journalctl -u firewall-log-api -f        # Real-time log API logs
sudo journalctl -u update-topology-scan -f    # Topology update logs
```

## Access the App

Open browser: **http://your-ubuntu-ip/**

**Features:**
- 🔄 Click "Refresh" button to load latest network scan
- 🔍 Search devices by name, IP, or vendor
- 👁️ Click any device node for details
- 📊 View statistics dashboard
- 📝 Click "View Logs" on a device to see real firewall logs

## Troubleshooting

### Firewall logs not showing

```bash
# Check if log file exists
ls -lh /home/ubuntu/firewall_sim/firewall.log

# Check API logs
sudo journalctl -u firewall-log-api -n 50

# Restart API
sudo systemctl restart firewall-log-api

# Test manually
python3 firewall_log_api.py  # Run in foreground to see errors
```

### Topology data not updating

```bash
# Check scans are being generated
ls -lt /opt/eagleyesocradar/scans | head -5

# Manually trigger update
sudo /usr/local/bin/update_topology_scan

# Check timer logs
sudo journalctl -u update-topology-scan -n 20
```

### Port 5000 already in use

```bash
# Find what's using port 5000
sudo lsof -i :5000

# Stop existing service
sudo systemctl stop firewall-log-api

# Or change port in firewall_log_api.py (last line: port=5000)
```

## File Locations

- **React App:** `/var/www/reactapp/`
- **Topology Data:** `/var/www/reactapp/data/raw_data_complete.json`
- **Log API Script:** `/usr/local/bin/firewall_log_api`
- **Update Script:** `/usr/local/bin/update_topology_scan`
- **Scan Folders:** `/opt/eagleyesocradar/scans/scan_*/`
- **Firewall Logs:** `/home/ubuntu/firewall_sim/firewall.log`

## Management Commands (No Password Required)

```bash
# Restart services
sudo systemctl restart firewall-log-api
sudo systemctl restart update-topology-scan.timer

# View logs
sudo journalctl -u firewall-log-api -f
sudo journalctl -u update-topology-scan -f

# Manual topology update
sudo systemctl start update-topology-scan

# Stop services
sudo systemctl stop firewall-log-api
sudo systemctl stop update-topology-scan.timer
```
