# 🚀 NetTopo Visualizer - Deployment Checklist

## Pre-Deployment

### Development Environment
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] App runs locally (`npm run dev`)
- [ ] No TypeScript errors (`npm run build`)

### Ubuntu Server Setup
- [ ] Ubuntu 20.04+ server ready
- [ ] SSH access configured
- [ ] Sudo privileges available
- [ ] Firewall configured (UFW or iptables)

## Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Verify
node --version  # Should show v18.x or higher
nginx -v        # Should show nginx version
```

- [ ] Node.js installed and verified
- [ ] Nginx installed and verified

## Step 2: Build React App

```bash
# On your development machine or server
cd NetTopo-Visualizer

# Install dependencies
npm install

# Build for production
npm run build

# Verify dist/ folder created
ls -la dist/
```

- [ ] Dependencies installed
- [ ] Build completed successfully
- [ ] `dist/` folder contains `index.html` and `assets/`

## Step 3: Deploy Files

```bash
# Create application directory
sudo mkdir -p /var/www/reactapp/data

# Copy built files
sudo cp -r dist/* /var/www/reactapp/

# Set ownership
sudo chown -R www-data:www-data /var/www/reactapp

# Set permissions
sudo chmod -R 755 /var/www/reactapp
sudo chmod 775 /var/www/reactapp/data

# Allow your user to write to data directory
sudo chown -R $USER:www-data /var/www/reactapp/data
```

- [ ] Directory `/var/www/reactapp/` created
- [ ] Files copied from `dist/`
- [ ] Ownership set to `www-data:www-data`
- [ ] Permissions set correctly
- [ ] Data directory writable

## Step 4: Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/reactapp
```

Paste this configuration:

```nginx
server {
    listen 3000;
    listen [::]:3000;
    
    server_name _;
    root /var/www/reactapp;
    index index.html;

    # Disable caching for data directory
    location /data/ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        add_header Access-Control-Allow-Origin "*";
        
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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/reactapp /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

- [ ] Nginx config file created
- [ ] Site enabled (symlink created)
- [ ] Config test passed (`nginx -t`)
- [ ] Nginx restarted successfully
- [ ] Nginx enabled on boot
- [ ] Nginx status shows "active (running)"

## Step 5: Configure Firewall

```bash
# Check firewall status
sudo ufw status

# Allow SSH (important!)
sudo ufw allow ssh

# Allow port 3000
sudo ufw allow 3000/tcp

# Enable firewall (if not already)
sudo ufw enable

# Verify
sudo ufw status numbered
```

- [ ] Firewall configured
- [ ] Port 3000 allowed
- [ ] SSH access maintained

## Step 6: Create Sample Data

```bash
# Create sample JSON file
sudo nano /var/www/reactapp/data/raw_data_complete.json
```

Copy content from `sample_data.json` or use the Python script:

```bash
# Copy the Python script to server
scp write_topology_data.py user@server:/tmp/

# SSH to server
ssh user@server

# Edit script to use production path
nano /tmp/write_topology_data.py
# Change: target_path = "/var/www/reactapp/data/raw_data_complete.json"

# Run script
python3 /tmp/write_topology_data.py

# Verify file created
ls -la /var/www/reactapp/data/raw_data_complete.json
```

- [ ] Sample data file created
- [ ] File has correct permissions (644)
- [ ] File is valid JSON

## Step 7: Test Nginx is Serving Files

```bash
# Test HTML page
curl -I http://localhost:3000/

# Test data file
curl http://localhost:3000/data/raw_data_complete.json

# Test from outside server (replace with your IP)
curl http://YOUR_SERVER_IP:3000/data/raw_data_complete.json
```

- [ ] HTML page loads (HTTP 200)
- [ ] JSON data loads (HTTP 200)
- [ ] Headers show `Cache-Control: no-cache` for data
- [ ] Accessible from outside server

## Step 8: Test in Browser

```bash
# On your development machine or from browser
http://YOUR_SERVER_IP:3000
```

**Check these in browser:**

- [ ] Page loads without errors
- [ ] Network topology graph appears
- [ ] Devices are visible in the graph
- [ ] Statistics panel shows data
- [ ] Device list table shows entries
- [ ] Search functionality works
- [ ] No console errors (F12 → Console)
- [ ] "Updated" timestamp appears in header

## Step 9: Test Auto-Update

```bash
# On server, modify the JSON file
sudo nano /var/www/reactapp/data/raw_data_complete.json

# Change the export_timestamp or add a device
# Save and exit

# Watch browser - should update within 5 seconds
```

- [ ] Browser updates automatically (within 5 seconds)
- [ ] Timestamp in header updates
- [ ] New data appears in visualization
- [ ] No errors in console

## Step 10: Set Up Data Generator

### Option A: Manual Testing
```bash
# Run Python script periodically
python3 write_topology_data.py
```

### Option B: Cron Job
```bash
# Edit crontab
crontab -e

# Add line to run every 5 minutes
*/5 * * * * /usr/bin/python3 /path/to/write_topology_data.py >> /var/log/topology_writer.log 2>&1
```

### Option C: Systemd Service
```bash
# Create service file
sudo nano /etc/systemd/system/topology-writer.service

# Paste configuration (see DEPLOYMENT_GUIDE.md)

# Enable and start
sudo systemctl enable topology-writer
sudo systemctl start topology-writer
```

- [ ] Data generator configured
- [ ] Data updates automatically
- [ ] Logs are being written
- [ ] No errors in logs

## Step 11: Monitoring & Logs

```bash
# Watch Nginx access logs
sudo tail -f /var/log/nginx/access.log | grep "/data/"

# Watch Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Watch data file changes
watch -n 1 'stat /var/www/reactapp/data/raw_data_complete.json'

# Check Nginx status
sudo systemctl status nginx

# View recent Nginx logs
sudo journalctl -u nginx -n 50 --no-pager
```

- [ ] Logs are accessible
- [ ] No errors in Nginx logs
- [ ] Fetch requests appearing in access log
- [ ] Data file timestamp updating

## Step 12: Performance Testing

```bash
# Test with curl (measure response time)
time curl -s http://localhost:3000/data/raw_data_complete.json > /dev/null

# Test with Apache Bench (if installed)
ab -n 100 -c 10 http://localhost:3000/data/raw_data_complete.json

# Monitor server resources
htop  # or top
```

- [ ] Response time < 100ms
- [ ] Server load acceptable
- [ ] Memory usage normal
- [ ] No timeout errors

## Step 13: Security Hardening

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Restrict SSH access (optional)
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no (if using keys)

# Restart SSH
sudo systemctl restart sshd

# Set up fail2ban (optional)
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

- [ ] System updated
- [ ] Automatic updates configured
- [ ] SSH hardened
- [ ] fail2ban installed (optional)

## Step 14: HTTPS Setup (Production)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Update Nginx to listen on 443
sudo nano /etc/nginx/sites-available/reactapp
# Change: listen 443 ssl;
# Add SSL certificate paths

# Restart Nginx
sudo systemctl restart nginx
```

- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] HTTPS working
- [ ] Auto-renewal configured
- [ ] HTTP redirects to HTTPS

## Step 15: Backup & Recovery

```bash
# Create backup directory
sudo mkdir -p /var/backups/reactapp

# Backup script
sudo nano /usr/local/bin/backup-reactapp.sh

# Add backup cron job
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-reactapp.sh
```

- [ ] Backup directory created
- [ ] Backup script created
- [ ] Backup cron job scheduled
- [ ] Test restore procedure documented

## Final Verification

### Browser Tests
- [ ] Open `http://YOUR_SERVER_IP:3000`
- [ ] Page loads in < 3 seconds
- [ ] Graph renders correctly
- [ ] All interactive features work
- [ ] Search functionality works
- [ ] Device details panel works
- [ ] Auto-refresh works (check timestamp)
- [ ] No console errors
- [ ] Mobile responsive (test on phone)

### Command Line Tests
```bash
# Test endpoints
curl -I http://localhost:3000/
curl -I http://localhost:3000/data/raw_data_complete.json

# Check services
sudo systemctl status nginx
sudo systemctl status topology-writer  # if using systemd

# Check logs
sudo tail -20 /var/log/nginx/error.log
sudo tail -20 /var/log/nginx/access.log

# Check disk space
df -h

# Check memory
free -h
```

- [ ] All curl tests return 200
- [ ] All services running
- [ ] No errors in logs
- [ ] Sufficient disk space (>10% free)
- [ ] Sufficient memory (>100MB free)

## Troubleshooting Reference

### Issue: Page Won't Load
```bash
sudo systemctl status nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Issue: Data Won't Load
```bash
ls -la /var/www/reactapp/data/
curl http://localhost:3000/data/raw_data_complete.json
sudo chmod 644 /var/www/reactapp/data/raw_data_complete.json
```

### Issue: Auto-Refresh Not Working
- Check browser console for errors
- Verify `Cache-Control` headers with `curl -I`
- Check network tab in browser (F12)

### Issue: Nginx Won't Start
```bash
sudo nginx -t  # Check config
sudo netstat -tlnp | grep 3000  # Check port
sudo systemctl restart nginx
```

## Documentation Checklist

- [ ] README.md read and understood
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] IMPLEMENTATION_SUMMARY.md reviewed
- [ ] sample_data.json format understood
- [ ] write_topology_data.py configured

## Support Resources

- [ ] Bookmark: [D3.js Docs](https://d3js.org/)
- [ ] Bookmark: [Nginx Docs](https://nginx.org/en/docs/)
- [ ] Bookmark: [React Docs](https://react.dev/)
- [ ] Save: Server IP address
- [ ] Save: Nginx config location
- [ ] Save: Data file path
- [ ] Save: Log file locations

## Sign-Off

**Deployed by:** _________________

**Date:** _________________

**Server IP:** _________________

**Domain (if any):** _________________

**Notes:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

---

✅ **Deployment Complete!**

Your NetTopo Visualizer is now live and updating automatically.

Access at: `http://YOUR_SERVER_IP:3000`
