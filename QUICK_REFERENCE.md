# 🎯 Quick Reference - NetTopo Visualizer

## 📍 Important Paths

| What | Path |
|------|------|
| **React App** | `/var/www/reactapp/` |
| **Data File** | `/var/www/reactapp/data/raw_data_complete.json` |
| **Nginx Config** | `/etc/nginx/sites-available/reactapp` |
| **Nginx Logs** | `/var/log/nginx/` |
| **Access URL** | `http://YOUR_IP:3000` |

## 🚀 Common Commands

### Service Management
```bash
# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# Reload Nginx (no downtime)
sudo systemctl reload nginx
```

### File Operations
```bash
# View current data
cat /var/www/reactapp/data/raw_data_complete.json

# Edit data
sudo nano /var/www/reactapp/data/raw_data_complete.json

# Check file size
ls -lh /var/www/reactapp/data/raw_data_complete.json

# Watch file for changes
watch -n 1 'stat /var/www/reactapp/data/raw_data_complete.json'
```

### Testing
```bash
# Test JSON file is accessible
curl http://localhost:3000/data/raw_data_complete.json

# Test with headers
curl -I http://localhost:3000/data/raw_data_complete.json

# Test from remote
curl http://YOUR_IP:3000/data/raw_data_complete.json

# Pretty print JSON
curl -s http://localhost:3000/data/raw_data_complete.json | python3 -m json.tool
```

### Logs
```bash
# Watch access logs (live)
sudo tail -f /var/log/nginx/access.log

# Watch error logs (live)
sudo tail -f /var/log/nginx/error.log

# Filter data requests only
sudo tail -f /var/log/nginx/access.log | grep "/data/"

# Last 50 lines of errors
sudo tail -50 /var/log/nginx/error.log

# Search for specific error
sudo grep "error" /var/log/nginx/error.log
```

### Permissions
```bash
# Fix app permissions
sudo chown -R www-data:www-data /var/www/reactapp
sudo chmod -R 755 /var/www/reactapp

# Fix data directory
sudo chown -R $USER:www-data /var/www/reactapp/data
sudo chmod 775 /var/www/reactapp/data

# Fix data file
sudo chmod 644 /var/www/reactapp/data/raw_data_complete.json
```

## 🔧 Quick Fixes

### Problem: "Failed to Load Data"
```bash
# 1. Check file exists
ls -la /var/www/reactapp/data/raw_data_complete.json

# 2. Check it's valid JSON
python3 -m json.tool /var/www/reactapp/data/raw_data_complete.json

# 3. Test Nginx serving it
curl http://localhost:3000/data/raw_data_complete.json

# 4. Fix permissions
sudo chmod 644 /var/www/reactapp/data/raw_data_complete.json
```

### Problem: Page Won't Load
```bash
# 1. Check Nginx is running
sudo systemctl status nginx

# 2. Check port 3000
sudo netstat -tlnp | grep 3000

# 3. Check firewall
sudo ufw status

# 4. Check Nginx errors
sudo tail -20 /var/log/nginx/error.log
```

### Problem: Auto-Refresh Not Working
```bash
# 1. Check cache headers
curl -I http://localhost:3000/data/raw_data_complete.json | grep -i cache

# Should see: Cache-Control: no-cache, no-store, must-revalidate

# 2. Clear browser cache
# Browser: Ctrl+Shift+R (hard reload)

# 3. Check browser console
# Browser: F12 → Console tab
```

## 📝 Update Data

### Using Python Script
```bash
python3 write_topology_data.py
```

### Manual Update
```bash
sudo nano /var/www/reactapp/data/raw_data_complete.json
# Edit and save
# Browser will update within 5 seconds
```

### From Another Script
```python
import json
import os
import tempfile

data = { "export_timestamp": "...", "data": {...} }

tmp = tempfile.mkstemp(dir="/var/www/reactapp/data")[1]
with open(tmp, 'w') as f:
    json.dump(data, f)
os.replace(tmp, "/var/www/reactapp/data/raw_data_complete.json")
os.chmod("/var/www/reactapp/data/raw_data_complete.json", 0o644)
```

## 🎨 Customize

### Change Polling Interval
**File:** `App.tsx` (rebuild required)
```typescript
const interval = setInterval(fetchTopologyData, 10000); // 10 seconds
```

### Change Port
**File:** `/etc/nginx/sites-available/reactapp`
```nginx
listen 8080;  # Change from 3000
```
```bash
sudo systemctl reload nginx
sudo ufw allow 8080/tcp
```

### Change Data Path
**File:** `App.tsx` (rebuild required)
```typescript
fetch('/api/topology.json', { cache: 'no-store' })
```

## 🔍 Monitoring

### Real-Time
```bash
# Watch all activity
sudo tail -f /var/log/nginx/access.log

# Count requests per minute
sudo tail -f /var/log/nginx/access.log | awk '{print $4}' | cut -d: -f2 | uniq -c

# Monitor system resources
htop
```

### Health Check Script
```bash
#!/bin/bash
# Save as: check-health.sh

echo "=== NetTopo Visualizer Health Check ==="
echo ""

echo "Nginx Status:"
systemctl is-active nginx

echo -e "\nData File:"
if [ -f "/var/www/reactapp/data/raw_data_complete.json" ]; then
    echo "✓ Exists"
    ls -lh /var/www/reactapp/data/raw_data_complete.json
else
    echo "✗ Missing!"
fi

echo -e "\nHTTP Test:"
curl -s -o /dev/null -w "Status: %{http_code}\nTime: %{time_total}s\n" http://localhost:3000/

echo -e "\nRecent Errors:"
sudo tail -5 /var/log/nginx/error.log || echo "None"

echo -e "\nDisk Space:"
df -h /var/www/reactapp | tail -1
```

## 📊 Data Format Quick Reference

**Minimal Valid JSON:**
```json
{
  "export_timestamp": "2026-01-09T10:00:00",
  "export_type": "COMPLETE_RAW_SCAN_DATA",
  "database_source": "scanner.db",
  "data": {
    "devices": {
      "count": 1,
      "records": [{
        "id": 1,
        "ip": "192.168.1.1",
        "name": "Switch",
        "type": "Switch",
        "mac": "00:11:22:33:44:55",
        "vendor": "Cisco",
        "confidence": 95,
        "detection_method": "SNMP",
        "network": "192.168.1.0/24",
        "last_seen": "2026-01-09T10:00:00",
        "name_source": "DNS",
        "netbios_domain": null,
        "logged_in_user": null
      }]
    },
    "connections": {
      "count": 0,
      "records": []
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

## 🆘 Emergency Contacts

**Documentation Files:**
- `README.md` - Overview
- `DEPLOYMENT_GUIDE.md` - Full deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `sample_data.json` - Data format example

**Log Locations:**
- Nginx Access: `/var/log/nginx/access.log`
- Nginx Error: `/var/log/nginx/error.log`
- System: `sudo journalctl -u nginx`

**Config Files:**
- Nginx: `/etc/nginx/sites-available/reactapp`
- App: `/var/www/reactapp/`

## 📱 Browser Testing

**Open:**
```
http://YOUR_SERVER_IP:3000
```

**Quick Tests:**
1. ✅ Page loads without errors
2. ✅ Graph displays with nodes
3. ✅ Search works
4. ✅ Device list shows entries
5. ✅ Timestamp updates every 5 seconds
6. ✅ Click node shows details panel
7. ✅ Zoom/pan controls work
8. ✅ No console errors (F12)

## 🔐 Security Quick Check

```bash
# 1. Check Nginx is not running as root
ps aux | grep nginx

# 2. Check file permissions
ls -la /var/www/reactapp/data/

# 3. Check firewall
sudo ufw status

# 4. Check open ports
sudo netstat -tlnp

# 5. Check for security updates
sudo apt update && sudo apt list --upgradable
```

## 💾 Quick Backup

```bash
# Backup everything
sudo tar -czf ~/reactapp-backup-$(date +%Y%m%d).tar.gz \
  /var/www/reactapp \
  /etc/nginx/sites-available/reactapp

# Backup data only
sudo cp /var/www/reactapp/data/raw_data_complete.json \
  ~/topology-backup-$(date +%Y%m%d-%H%M%S).json

# Restore
sudo tar -xzf ~/reactapp-backup-*.tar.gz -C /
```

## 🎯 Performance Tips

```bash
# 1. Enable Gzip in Nginx
sudo nano /etc/nginx/nginx.conf
# Add: gzip on; gzip_types application/json;

# 2. Monitor file size
du -h /var/www/reactapp/data/raw_data_complete.json

# 3. Check response time
time curl -s http://localhost:3000/data/raw_data_complete.json > /dev/null

# 4. Monitor memory
free -h
```

---

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed troubleshooting.
