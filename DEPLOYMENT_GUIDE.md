# NetTopo Visualizer - Deployment Guide

## Overview
This guide explains how to deploy the React app on Ubuntu with Nginx, configured to fetch live topology data from a JSON file.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Log Generator / Network Scanner           │
│  (Your Python/Script)                      │
└──────────────────┬──────────────────────────┘
                   │ Writes JSON atomically
                   ▼
         /var/www/reactapp/data/
              raw_data_complete.json
                   │
                   │ Served by Nginx
                   ▼
┌─────────────────────────────────────────────┐
│  React App (Running in Browser)            │
│  - Fetches JSON every 5 seconds            │
│  - Auto-updates topology visualization     │
└─────────────────────────────────────────────┘
```

## Directory Structure

```
/var/www/reactapp/
 ├── index.html
 ├── assets/
 │   ├── index-[hash].js
 │   └── index-[hash].css
 └── data/
     └── raw_data_complete.json   <-- GENERATED FILE
```

## Prerequisites

- Ubuntu Server (20.04 or later)
- Node.js (v18 or later)
- Nginx
- Sudo access

## Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Verify installations
node --version
nginx -v
```

## Step 2: Build the React App

```bash
# Clone or upload your project
cd /path/to/NetTopo-Visualizer

# Install dependencies
npm install

# Build for production
npm run build

# This creates a 'dist' folder with:
# - index.html
# - assets/ folder
```

## Step 3: Deploy to Nginx

```bash
# Create application directory
sudo mkdir -p /var/www/reactapp/data

# Copy built files
sudo cp -r dist/* /var/www/reactapp/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/reactapp
sudo chmod -R 755 /var/www/reactapp

# Make data directory writable by your log generator
sudo chown -R your-user:www-data /var/www/reactapp/data
sudo chmod 775 /var/www/reactapp/data
```

## Step 4: Configure Nginx

Create/edit Nginx config:

```bash
sudo nano /etc/nginx/sites-available/reactapp
```

Add this configuration:

```nginx
server {
    listen 3000;
    listen [::]:3000;
    
    server_name _;
    root /var/www/reactapp;
    index index.html;

    # Disable caching for data directory (always fetch fresh)
    location /data/ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        add_header Access-Control-Allow-Origin "*";
        
        # Enable CORS if needed
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, OPTIONS";
            return 204;
        }
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/reactapp /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable on boot
sudo systemctl enable nginx
```

## Step 5: Test Nginx is Serving the File

Create a test JSON file:

```bash
sudo nano /var/www/reactapp/data/raw_data_complete.json
```

Paste minimal test data (see sample below), then test:

```bash
# Test from server
curl http://localhost:3000/data/raw_data_complete.json

# Should return JSON data

# Access web app
curl http://localhost:3000
# Should return HTML
```

From your browser:
```
http://<your-server-ip>:3000
```

## Step 6: Configure Your Log Generator

Your network scanner/log generator must write the JSON file **atomically** to avoid partial reads.

### Python Example (Recommended Pattern)

```python
import json
import os
import tempfile

def write_topology_data(data):
    """
    Atomically write topology data to avoid race conditions
    """
    target_file = "/var/www/reactapp/data/raw_data_complete.json"
    
    # Write to temporary file first
    tmp_fd, tmp_path = tempfile.mkstemp(
        dir="/var/www/reactapp/data",
        suffix=".tmp"
    )
    
    try:
        with os.fdopen(tmp_fd, 'w') as f:
            json.dump(data, f, indent=2)
        
        # Atomic replace - ensures React never reads partial data
        os.replace(tmp_path, target_file)
        
        # Set permissions
        os.chmod(target_file, 0o644)
        
        print(f"✓ Topology data written successfully")
        
    except Exception as e:
        print(f"✗ Error writing topology data: {e}")
        # Clean up temp file if it exists
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise

# Usage in your scanner
if __name__ == "__main__":
    topology_data = {
        "export_timestamp": "2026-01-09T10:00:00",
        "export_type": "COMPLETE_RAW_SCAN_DATA",
        "database_source": "network_scanner.db",
        "data": {
            "devices": {
                "count": 10,
                "records": [ /* ... */ ]
            },
            "connections": {
                "count": 15,
                "records": [ /* ... */ ]
            },
            # ... rest of data structure
        }
    }
    
    write_topology_data(topology_data)
```

### Bash Example

```bash
#!/bin/bash

TARGET="/var/www/reactapp/data/raw_data_complete.json"
TMP=$(mktemp "$TARGET.XXXXXX")

# Generate or copy your JSON data
cat > "$TMP" << 'EOF'
{
  "export_timestamp": "$(date -Iseconds)",
  "data": { ... }
}
EOF

# Atomic move
mv "$TMP" "$TARGET"
chmod 644 "$TARGET"
```

## Step 7: Verify Auto-Update

1. Open the web app in browser: `http://<server-ip>:3000`
2. Note the "Updated" timestamp in the header
3. Modify `/var/www/reactapp/data/raw_data_complete.json`
4. Within 5 seconds, the UI should refresh automatically
5. The timestamp should update

## JSON Data Format

The React app expects this exact structure:

```json
{
  "export_timestamp": "2026-01-09T10:00:00",
  "export_type": "COMPLETE_RAW_SCAN_DATA",
  "database_source": "path/to/database.db",
  "data": {
    "devices": {
      "count": 5,
      "records": [
        {
          "id": 1,
          "ip": "192.168.1.1",
          "name": "Main Switch",
          "type": "Switch",
          "detection_method": "SNMP",
          "mac": "00:11:22:33:44:55",
          "confidence": 95,
          "network": "192.168.1.0/24",
          "vendor": "Cisco",
          "last_seen": "2026-01-09T10:00:00",
          "name_source": "DNS",
          "netbios_domain": null,
          "logged_in_user": null
        }
      ]
    },
    "connections": {
      "count": 3,
      "records": [
        {
          "id": 1,
          "device_id": 1,
          "port_name": "GigabitEthernet0/1",
          "port_alias": "Uplink",
          "port_status": "UP",
          "mac_address": "AA:BB:CC:DD:EE:FF",
          "ip_address": "192.168.1.2",
          "vendor": "Intel",
          "status": "ACTIVE"
        }
      ]
    },
    "neighbors": { "count": 0, "records": [] },
    "scan_metadata": [],
    "scan_state": { "count": 0, "records": [] },
    "device_type_breakdown": {},
    "vendor_breakdown": {},
    "name_resolution_sources": {},
    "confidence_distribution": {},
    "port_analysis": {}
  }
}
```

## Firewall Configuration

```bash
# Allow port 3000
sudo ufw allow 3000/tcp

# Or if using iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

## Troubleshooting

### 1. App shows "Failed to Load Data"

```bash
# Check if file exists
ls -la /var/www/reactapp/data/raw_data_complete.json

# Check Nginx is serving it
curl http://localhost:3000/data/raw_data_complete.json

# Check permissions
sudo chmod 644 /var/www/reactapp/data/raw_data_complete.json

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 2. Changes not reflecting

```bash
# Clear browser cache (Ctrl+Shift+R)

# Check Nginx cache headers
curl -I http://localhost:3000/data/raw_data_complete.json

# Should see: Cache-Control: no-cache, no-store, must-revalidate
```

### 3. CORS errors (if accessing from different domain)

Edit Nginx config to add:
```nginx
add_header Access-Control-Allow-Origin "*";
```

### 4. Nginx won't start

```bash
# Check config syntax
sudo nginx -t

# Check port not in use
sudo netstat -tlnp | grep 3000

# Check Nginx status
sudo systemctl status nginx
```

## Performance Optimization

### 1. Adjust Polling Interval

In [App.tsx](App.tsx#L50-L80), change the interval:

```typescript
// Poll every 10 seconds instead of 5
const interval = setInterval(fetchTopologyData, 10000);
```

### 2. Compress JSON Data

Add to Nginx config:

```nginx
gzip on;
gzip_types application/json;
gzip_min_length 1000;
```

### 3. Reduce JSON File Size

Only include necessary data:
- Remove verbose metadata if not used
- Limit historical records
- Use shorter property names

## Monitoring

### Check Nginx Access Logs

```bash
# Watch requests
sudo tail -f /var/log/nginx/access.log | grep "/data/"

# Count requests per minute
sudo tail -f /var/log/nginx/access.log | grep "/data/" | awk '{print $4}' | cut -d: -f2 | uniq -c
```

### Monitor File Updates

```bash
# Watch file changes
watch -n 1 'stat /var/www/reactapp/data/raw_data_complete.json | grep Modify'
```

## Production Checklist

- [ ] Nginx configured and running
- [ ] React app built and deployed
- [ ] Data directory has correct permissions
- [ ] Test JSON file served successfully
- [ ] Log generator writes atomically
- [ ] Auto-update works (test by modifying JSON)
- [ ] Firewall allows port 3000
- [ ] HTTPS configured (recommended for production)
- [ ] Monitoring/logging set up
- [ ] Backup strategy for data

## Security Considerations

1. **HTTPS**: Use Let's Encrypt for SSL certificate
2. **Firewall**: Restrict access to trusted IPs if needed
3. **File Permissions**: Keep data directory restrictive
4. **Rate Limiting**: Add Nginx rate limiting for public deployments

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /data/ {
    limit_req zone=api burst=20;
    # ... rest of config
}
```

## Support

For issues:
- Check Nginx error logs: `/var/log/nginx/error.log`
- Check browser console for JavaScript errors
- Verify JSON structure matches expected format
- Test with curl to isolate issues

## License

MIT
