# NetTopo Visualizer - System Architecture

## Overview

NetTopo Visualizer is a real-time network topology visualization system that combines network scan data with live firewall logs to provide comprehensive network monitoring.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA SOURCES LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────┐        ┌──────────────────────────────┐  │
│  │  Network Scanner Tool    │        │   Firewall Log Generator     │  │
│  │  (Python/SNMP/Ping)      │        │   (Sophos XG/XGS Firewall)   │  │
│  └────────────┬─────────────┘        └──────────────┬───────────────┘  │
│               │                                      │                   │
│               │ Generates every 5 min               │ Continuous        │
│               ▼                                      ▼                   │
│  ┌──────────────────────────┐        ┌──────────────────────────────┐  │
│  │ /opt/eagleyesocradar/    │        │ /home/ubuntu/firewall_sim/   │  │
│  │ scans/scan_TIMESTAMP/    │        │ firewall.log                 │  │
│  │   ├─ raw_data_complete   │        │                              │  │
│  │   │  .json (127 devices) │        │ (Syslog format, continuous)  │  │
│  │   ├─ devices.csv         │        │                              │  │
│  │   └─ topology.png        │        │                              │  │
│  └──────────────────────────┘        └──────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                               │                         │
                               │                         │
┌──────────────────────────────┼─────────────────────────┼────────────────┐
│                    BACKEND SERVICES LAYER               │                │
├─────────────────────────────────────────────────────────────────────────┤
│                               │                         │                │
│              ┌────────────────▼────────────┐           │                │
│              │  Systemd Timer Service      │           │                │
│              │  (Every 5 minutes)          │           │                │
│              │                             │           │                │
│              │  /usr/local/bin/            │           │                │
│              │  update_topology_scan       │           │                │
│              │                             │           │                │
│              │  Logic:                     │           │                │
│              │  1. List all scan folders   │           │                │
│              │  2. Sort by timestamp       │           │                │
│              │  3. Pick 2nd-to-last        │           │                │
│              │  4. Atomic copy JSON        │           │                │
│              └────────────┬────────────────┘           │                │
│                           │                             │                │
│                           ▼                             │                │
│              ┌────────────────────────────┐            │                │
│              │  /var/www/reactapp/data/   │            │                │
│              │  raw_data_complete.json    │            │                │
│              │                            │            │                │
│              │  (Served by Nginx)         │            │                │
│              └────────────┬───────────────┘            │                │
│                           │                             │                │
│                           │                    ┌────────▼──────────┐    │
│                           │                    │  Flask REST API   │    │
│                           │                    │  (Port 5000)      │    │
│                           │                    │                   │    │
│                           │                    │  Endpoints:       │    │
│                           │                    │  • /api/health    │    │
│                           │                    │  • /api/ping/{ip} │    │
│                           │                    │  • /api/logs/     │    │
│                           │                    │    tail/{mac}     │    │
│                           │                    │                   │    │
│                           │                    │  Features:        │    │
│                           │                    │  • Parse firewall │    │
│                           │                    │    logs           │    │
│                           │                    │  • Filter by MAC  │    │
│                           │                    │  • Real ping test │    │
│                           │                    └───────────────────┘    │
│                           │                             │                │
└───────────────────────────┼─────────────────────────────┼────────────────┘
                            │                             │
                            │                             │
┌───────────────────────────┼─────────────────────────────┼────────────────┐
│                    WEB SERVER LAYER (Nginx)             │                │
├─────────────────────────────────────────────────────────────────────────┤
│                            │                             │                │
│              ┌─────────────▼──────────────┐             │                │
│              │  Nginx (Port 80/443)       │             │                │
│              │                            │             │                │
│              │  Routes:                   │             │                │
│              │  • / → React SPA           │             │                │
│              │  • /data/* → JSON files    │             │                │
│              │                            │             │                │
│              │  Headers:                  │             │                │
│              │  • Cache-Control: no-cache │             │                │
│              │  • CORS enabled            │             │                │
│              └─────────────┬──────────────┘             │                │
│                            │                             │                │
└────────────────────────────┼─────────────────────────────┼────────────────┘
                             │                             │
                             │                             │
┌────────────────────────────┼─────────────────────────────┼────────────────┐
│                    FRONTEND LAYER (Browser)              │                │
├─────────────────────────────────────────────────────────────────────────┤
│                             │                             │                │
│              ┌──────────────▼─────────────────────────────▼──────────┐   │
│              │  React App (TypeScript + Vite)                        │   │
│              │                                                        │   │
│              │  Components:                                           │   │
│              │  ┌───────────────────────────────────────────────┐   │   │
│              │  │  App.tsx (Main Component)                     │   │   │
│              │  │  • Fetch topology data (manual refresh)       │   │   │
│              │  │  • Global search                              │   │   │
│              │  │  • Device selection                           │   │   │
│              │  ├───────────────────────────────────────────────┤   │   │
│              │  │  TopologyGraph.tsx                            │   │   │
│              │  │  • D3.js force-directed graph                 │   │   │
│              │  │  • Hub-and-spoke layout                       │   │   │
│              │  │  • Zoom, pan, drag interactions               │   │   │
│              │  ├───────────────────────────────────────────────┤   │   │
│              │  │  StatsPanel.tsx                               │   │   │
│              │  │  • Device type breakdown (pie chart)          │   │   │
│              │  │  • Vendor distribution (bar chart)            │   │   │
│              │  │  • Confidence scores (area chart)             │   │   │
│              │  ├───────────────────────────────────────────────┤   │   │
│              │  │  DeviceList.tsx                               │   │   │
│              │  │  • Sortable device table                      │   │   │
│              │  │  • Filter by type/vendor                      │   │   │
│              │  └───────────────────────────────────────────────┘   │   │
│              │                                                        │   │
│              │  User Actions:                                         │   │
│              │  • Click "Refresh" → Fetch /data/raw_data_complete   │   │
│              │  • Click Device → Show details panel                  │   │
│              │  • Click "Ping" → Call /api/ping/{ip}                │   │
│              │  • Click "View Logs" → Call /api/logs/tail/{mac}     │   │
│              └────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Detailed Data Flow

### 1. Network Topology Data Flow

```
Step 1: SCAN GENERATION
┌─────────────────────────────────────┐
│ Network Scanner (Python Script)    │
│ • Pings all IPs in 172.16.16.0/24 │
│ • SNMP queries switches            │
│ • NetBIOS name resolution          │
│ • MAC vendor lookup                │
└─────────────┬───────────────────────┘
              │ Writes every ~5 min
              ▼
┌─────────────────────────────────────┐
│ /opt/eagleyesocradar/scans/        │
│ scan_2026-01-09_16-52-06/          │
│   raw_data_complete.json           │
│                                     │
│ Contains:                           │
│ • 127 devices (ACTIVE_HOST/Switch) │
│ • Connections (port-to-MAC mapping)│
│ • Metadata (scan time, stats)      │
└─────────────────────────────────────┘

Step 2: AUTO-UPDATE SERVICE
┌─────────────────────────────────────┐
│ Systemd Timer (Every 5 min)        │
│ /usr/local/bin/update_topology_scan│
│                                     │
│ Logic:                              │
│ scan_dirs = ls /opt/.../scans      │
│ sorted = sort(scan_dirs)           │
│ second_last = sorted[-2]           │ ← Why 2nd? Latest may be incomplete
│ atomic_copy(second_last)           │
└─────────────┬───────────────────────┘
              │ Copies to web root
              ▼
┌─────────────────────────────────────┐
│ /var/www/reactapp/data/            │
│ raw_data_complete.json             │
│                                     │
│ Owned by: www-data:www-data        │
│ Permissions: 644                    │
└─────────────┬───────────────────────┘
              │ Served by Nginx
              ▼
┌─────────────────────────────────────┐
│ HTTP GET /data/raw_data_complete   │
│                                     │
│ Headers:                            │
│ • Cache-Control: no-cache          │
│ • Content-Type: application/json   │
└─────────────┬───────────────────────┘
              │ User clicks "Refresh"
              ▼
┌─────────────────────────────────────┐
│ React App (Browser)                 │
│ fetchTopologyData()                 │
│                                     │
│ 1. Fetch JSON from multiple URLs   │
│ 2. Parse and validate structure    │
│ 3. Create graph nodes & links      │
│ 4. Render D3 visualization         │
│ 5. Update stats dashboard          │
└─────────────────────────────────────┘
```

### 2. Firewall Logs Data Flow

```
Step 1: LOG GENERATION
┌─────────────────────────────────────┐
│ Sophos XG Firewall (Simulator)     │
│ • Logs every packet/connection     │
│ • Syslog format (key="value")      │
│ • Severity levels: Info/Warn/Crit  │
└─────────────┬───────────────────────┘
              │ Appends continuously
              ▼
┌─────────────────────────────────────┐
│ /home/ubuntu/firewall_sim/         │
│ firewall.log                        │
│                                     │
│ Format:                             │
│ timestamp device_name="..." src_ip= │
│ "172.16.16.26" dst_ip="173.194..." │
│ src_mac="8C:F8:C5:82:4C:FE" ...    │
│                                     │
│ • Grows indefinitely (rotate later)│
└─────────────────────────────────────┘

Step 2: LOG API SERVICE
┌─────────────────────────────────────┐
│ Flask API (Port 5000)               │
│ /usr/local/bin/firewall_log_api    │
│                                     │
│ Endpoint: GET /api/logs/tail/{mac} │
│                                     │
│ Logic:                              │
│ 1. tail -n 500 firewall.log        │ ← Fast read of recent logs
│ 2. Parse each line (regex)         │
│ 3. Filter by MAC (src or dst)      │
│ 4. Extract key fields:             │
│    • timestamp, severity           │
│    • src_ip, dst_ip, protocol      │
│    • src_mac, dst_mac              │
│    • fw_rule_name, interfaces      │
│ 5. Return JSON (max 100 logs)      │
└─────────────┬───────────────────────┘
              │ HTTP Response
              ▼
┌─────────────────────────────────────┐
│ React App (Browser)                 │
│ handleViewLogs()                    │
│                                     │
│ User clicks "View Logs" on device   │
│ → fetch(/api/logs/tail/{MAC})      │
│ → Parse response                    │
│ → Display in modal:                 │
│   • Newest logs first              │
│   • Color-coded severity badges    │
│   • Formatted: IP:Port → IP:Port   │
│   • Show rule name & country       │
└─────────────────────────────────────┘
```

### 3. Ping Device Data Flow

```
Step 1: USER ACTION
┌─────────────────────────────────────┐
│ User clicks "Ping Device" button   │
│ on selected node (e.g., 172.16.16.34)│
└─────────────┬───────────────────────┘
              │ HTTP GET
              ▼
┌─────────────────────────────────────┐
│ React App                           │
│ handlePing()                        │
│                                     │
│ fetch('http://localhost:5000/      │
│        api/ping/172.16.16.34')     │
└─────────────┬───────────────────────┘
              │ Forward to API
              ▼
┌─────────────────────────────────────┐
│ Flask API (Port 5000)               │
│ /api/ping/{ip}                      │
│                                     │
│ Logic:                              │
│ subprocess.run([                    │
│   'ping', '-c', '4',               │ ← Send 4 ICMP packets
│   '-W', '2',                       │ ← 2 sec timeout
│   '172.16.16.34'                   │
│ ])                                  │
│                                     │
│ Parse output:                       │
│ • Packets sent/received/lost       │
│ • RTT min/avg/max (milliseconds)   │
│                                     │
│ Return JSON:                        │
│ {                                   │
│   "success": true,                 │
│   "packets_received": 4,           │
│   "packet_loss": 0,                │
│   "avg_ms": 1.234                  │
│ }                                   │
└─────────────┬───────────────────────┘
              │ HTTP Response
              ▼
┌─────────────────────────────────────┐
│ React App                           │
│                                     │
│ Display result:                     │
│ ✅ Success:                         │
│   "Reply from 172.16.16.34:        │
│    4/4 packets (100% success)      │
│    Round-trip: avg=1.2ms"          │
│                                     │
│ ❌ Failed:                          │
│   "Request timed out.              │
│    100% packet loss"               │
└─────────────────────────────────────┘
```

## Component Details

### Backend Components

#### 1. Network Scanner
- **Location:** `/opt/eagleyesocradar/`
- **Language:** Python
- **Functions:**
  - ICMP ping sweep
  - SNMP device queries
  - NetBIOS name resolution
  - MAC vendor lookup
  - Connection mapping (port-to-MAC)
- **Output:** `raw_data_complete.json` (127 devices)
- **Schedule:** Every ~5 minutes

#### 2. Update Script
- **Location:** `/usr/local/bin/update_topology_scan`
- **Type:** Bash script
- **Trigger:** Systemd timer (every 5 min)
- **Logic:**
  ```bash
  # Get 2nd-to-last scan (latest may be incomplete)
  SECOND_LAST=$(ls -1 /opt/.../scans | sort -r | sed -n '2p')
  
  # Atomic copy (temp file + rename)
  cp $SOURCE ${TARGET}.tmp
  mv ${TARGET}.tmp $TARGET
  ```

#### 3. Firewall Log API
- **Location:** `/usr/local/bin/firewall_log_api`
- **Language:** Python + Flask
- **Port:** 5000
- **Endpoints:**
  - `GET /api/health` - Service status
  - `GET /api/ping/{ip}` - Real ICMP ping
  - `GET /api/logs/tail/{mac}` - Filter logs by MAC
- **Performance:** Uses `tail -n 500` for fast log reading

#### 4. Nginx Web Server
- **Port:** 80 (HTTP)
- **Roles:**
  - Serve React SPA
  - Serve JSON data files
  - Proxy to Flask API (optional)
- **Config:**
  ```nginx
  location /data/ {
    alias /var/www/reactapp/data/;
    add_header Cache-Control "no-cache";
  }
  ```

### Frontend Components

#### 1. TopologyGraph (D3.js)
- **Force simulation:** Positions nodes automatically
- **Hub detection:** Switch or highest-connection-count
- **Node types:**
  - 🔵 Switch (blue, large)
  - 🟢 ACTIVE_HOST (green)
  - ⚫ INACTIVE_HOST (gray)
  - 📱 Android_DEVICE (orange)
  - 🔗 L2_DEVICE (ghost nodes, no IP)

#### 2. StatsPanel (Recharts)
- Pie chart: Device type distribution
- Bar chart: Top vendors
- Area chart: Confidence distribution

#### 3. DeviceList
- Sortable table of all devices
- Filters: type, vendor, network
- Click row → select node on graph

## Data Schemas

### Network Topology JSON Schema
```json
{
  "export_timestamp": "2026-01-09T16:56:02",
  "export_type": "COMPLETE_RAW_SCAN_DATA",
  "database_source": "scans/.../network_data.db",
  "data": {
    "devices": {
      "count": 127,
      "records": [
        {
          "id": 1,
          "ip": "172.16.16.34",
          "name": "DESKTOP-OV53UAH",
          "type": "ACTIVE_HOST",
          "detection_method": "PING_ONLY",
          "mac": "00-42-38-C7-26-7B",
          "confidence": 53,
          "network": "172.16.16.0/24",
          "vendor": "Intel Corporate",
          "last_seen": "2026-01-09T16:52:30",
          "name_source": "NetBIOS"
        }
      ]
    },
    "connections": {
      "count": 120,
      "records": [
        {
          "id": 1,
          "device_id": 6,  // Switch ID
          "port_name": "GigabitEthernet1/0/1",
          "mac_address": "00-42-38-C7-26-7B",  // Target device
          "ip_address": "172.16.16.34",
          "vendor": "Intel Corporate",
          "status": "ACTIVE"
        }
      ]
    }
  }
}
```

### Firewall Log Format
```
2026-01-09T12:19:47+00:00 _gateway device_name="X01308HB6P42VD3" 
timestamp="2026-01-09T17:49:47" log_type="Firewall" severity="Information" 
fw_rule_name="LAN TO WAN" protocol="UDP" 
src_mac="8C:F8:C5:82:4C:FE" dst_mac="AA:BB:CC:3E:7C:D5" 
src_ip="172.16.16.26" dst_ip="173.194.14.172" 
src_port=43627 dst_port=443 
src_country="R1" dst_country="USA" 
in_interface="Port2" out_interface="Port1"
```

### API Response Examples

**Ping API Response:**
```json
{
  "success": true,
  "ip": "172.16.16.34",
  "packets_sent": 4,
  "packets_received": 4,
  "packet_loss": 0,
  "min_ms": 0.523,
  "avg_ms": 1.234,
  "max_ms": 2.145
}
```

**Logs API Response:**
```json
{
  "mac_address": "00-42-38-C7-26-7B",
  "count": 42,
  "logs": [
    {
      "timestamp": "2026-01-09T17:49:47",
      "severity": "Information",
      "src_ip": "172.16.16.26",
      "dst_ip": "173.194.14.172",
      "src_mac": "8C:F8:C5:82:4C:FE",
      "dst_mac": "AA:BB:CC:3E:7C:D5",
      "protocol": "UDP",
      "src_port": "43627",
      "dst_port": "443",
      "fw_rule_name": "LAN TO WAN",
      "src_country": "R1",
      "dst_country": "USA"
    }
  ]
}
```

## System Requirements

### Server (Ubuntu 24.04)
- **CPU:** 2+ cores
- **RAM:** 4GB minimum
- **Disk:** 20GB (log rotation recommended)
- **Network:** Access to monitored network

### Software Stack
- **OS:** Ubuntu 24.04 LTS
- **Web Server:** Nginx 1.24+
- **Runtime:** Node.js 18+ (build), Python 3.12+ (API)
- **Libraries:**
  - Python: Flask, Flask-CORS
  - Node: React 19, D3.js 7, Recharts, Tailwind CSS

### Ports
- **80:** HTTP (Nginx → React App)
- **5000:** Flask API (internal, localhost only)

## Performance Considerations

### Scalability
- **Network Scanner:** Can handle ~500 IPs in 5 minutes
- **Log API:** Reads last 500 lines (sub-second response)
- **Graph Rendering:** D3.js handles 200+ nodes smoothly
- **Auto-Update:** No browser impact (manual refresh only)

### Optimizations
1. **Second-to-last scan:** Prevents incomplete data
2. **Atomic file writes:** No partial JSON reads
3. **tail command:** Faster than full file read
4. **Manual refresh:** No constant polling overhead
5. **Cache-Control:** Ensures fresh data

## Security

### Current Implementation
- ✅ API runs on localhost (not exposed)
- ✅ Nginx serves static files only
- ✅ No authentication (internal network)
- ✅ CORS enabled for development

### Production Recommendations
- 🔒 Add HTTPS (Let's Encrypt)
- 🔒 Implement authentication (OAuth2)
- 🔒 Rate limiting on API
- 🔒 Firewall rules (UFW)
- 🔒 Log rotation (logrotate)
- 🔒 Regular security updates

## Troubleshooting

### Common Issues

**1. No devices shown:**
- Check: `ls /opt/eagleyesocradar/scans/`
- Verify: Scanner is running
- Trigger: `sudo /usr/local/bin/update_topology_scan`

**2. Logs not loading:**
- Check: `sudo systemctl status firewall-log-api`
- Test: `curl http://localhost:5000/api/health`
- Verify: `/home/ubuntu/firewall_sim/firewall.log` exists

**3. Ping not working:**
- Requires: Root or CAP_NET_RAW capability
- Flask runs as 'ubuntu' user
- Sudo rules configured in SETUP_ONCE.sh

**4. Stale data:**
- Click "Refresh" button manually
- Check: "Updated HH:MM:SS" timestamp in header
- Verify: Timer is running with `systemctl status update-topology-scan.timer`

## Maintenance

### Daily Tasks
- Monitor disk usage: `df -h`
- Check services: `systemctl status firewall-log-api update-topology-scan.timer`

### Weekly Tasks
- Review logs: `sudo journalctl -u firewall-log-api -u update-topology-scan --since "1 week ago"`
- Verify scan generation: `ls -lt /opt/eagleyesocradar/scans | head -10`

### Monthly Tasks
- Rotate firewall logs: `logrotate /etc/logrotate.d/firewall`
- Clean old scans: `find /opt/eagleyesocradar/scans -mtime +30 -delete`
- Update packages: `sudo apt update && sudo apt upgrade`

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-09  
**Author:** NetTopo Visualizer Team
