#!/bin/bash
# One-time setup script for passwordless sudo and auto-updates
# Run this ONCE with: sudo bash SETUP_ONCE.sh

set -e

echo "🔧 NetTopo Visualizer - Production Setup"
echo "========================================="
echo ""

# Get the current non-root user
REAL_USER="${SUDO_USER:-$USER}"
echo "👤 Setting up for user: $REAL_USER"
echo ""

# 1. Configure passwordless sudo for specific commands
echo "🔐 Configuring passwordless sudo..."
cat > /etc/sudoers.d/nettopo-visualizer <<EOF
# NetTopo Visualizer - Allow specific commands without password
$REAL_USER ALL=(ALL) NOPASSWD: /usr/local/bin/update_topology_scan
$REAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl start update-topology-scan
$REAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl stop update-topology-scan
$REAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart update-topology-scan
$REAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl status update-topology-scan*
$REAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl enable update-topology-scan*
$REAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl disable update-topology-scan*
$REAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl daemon-reload
$REAL_USER ALL=(ALL) NOPASSWD: /bin/journalctl -u update-topology-scan*
EOF

chmod 0440 /etc/sudoers.d/nettopo-visualizer
echo "✓ Passwordless sudo configured"
echo ""

# 2. Install update script
echo "📋 Installing update script..."
if [ ! -f "update_latest_scan.sh" ]; then
    echo "❌ ERROR: update_latest_scan.sh not found in current directory"
    exit 1
fi

cp update_latest_scan.sh /usr/local/bin/update_topology_scan
chmod +x /usr/local/bin/update_topology_scan
echo "✓ Script installed to /usr/local/bin/update_topology_scan"
echo ""

# 3. Create systemd service
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/update-topology-scan.service <<EOF
[Unit]
Description=Update NetTopo Visualizer with latest scan data
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/update_topology_scan
User=root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
echo "✓ Service created"
echo ""

# 4. Create systemd timer (runs every 5 minutes)
echo "⏰ Creating systemd timer..."
cat > /etc/systemd/system/update-topology-scan.timer <<EOF
[Unit]
Description=Update topology scan data every 5 minutes
Requires=update-topology-scan.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
AccuracySec=1s

[Install]
WantedBy=timers.target
EOF
echo "✓ Timer created"
echo ""

# 5. Ensure data directory exists
echo "📁 Creating data directory..."
mkdir -p /var/www/reactapp/data
chown -R www-data:www-data /var/www/reactapp/data
chmod 755 /var/www/reactapp/data
echo "✓ Data directory ready"
echo ""

# 6. Reload systemd and enable timer
echo "🔄 Enabling systemd timer..."
systemctl daemon-reload
systemctl enable update-topology-scan.timer
systemctl start update-topology-scan.timer
echo "✓ Timer enabled and started"
echo ""

# 7. Run once immediately
echo "▶️  Running initial update..."
/usr/local/bin/update_topology_scan || echo "⚠️  Initial update failed (may be expected if no scans exist yet)"
echo ""

# 8. Verify timer is running
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Timer Status:"
systemctl status update-topology-scan.timer --no-pager --lines=0
echo ""
echo "📝 Useful Commands (no password needed):"
echo "  • View logs:      sudo journalctl -u update-topology-scan -f"
echo "  • Manual update:  sudo systemctl start update-topology-scan"
echo "  • Timer status:   sudo systemctl status update-topology-scan.timer"
echo "  • Stop timer:     sudo systemctl stop update-topology-scan.timer"
echo ""
echo "🌐 Access your app at: http://$(hostname -I | awk '{print $1}')/"
echo ""
