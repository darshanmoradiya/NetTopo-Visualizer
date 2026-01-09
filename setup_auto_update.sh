#!/bin/bash
# Setup script for automatic scan data updates
# Run this once on Ubuntu to configure the auto-update system

set -e

echo "🔧 Setting up NetTopo Visualizer auto-update system..."

# 1. Copy update script to system location
echo "📋 Installing update script..."
sudo cp update_latest_scan.sh /usr/local/bin/update_topology_scan
sudo chmod +x /usr/local/bin/update_topology_scan

# 2. Create systemd service
echo "⚙️  Creating systemd service..."
sudo tee /etc/systemd/system/update-topology-scan.service > /dev/null <<EOF
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

# 3. Create systemd timer (runs every 5 minutes)
echo "⏰ Creating systemd timer..."
sudo tee /etc/systemd/system/update-topology-scan.timer > /dev/null <<EOF
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

# 4. Reload systemd and enable timer
echo "🔄 Enabling systemd timer..."
sudo systemctl daemon-reload
sudo systemctl enable update-topology-scan.timer
sudo systemctl start update-topology-scan.timer

# 5. Run once immediately
echo "▶️  Running initial update..."
sudo /usr/local/bin/update_topology_scan

# 6. Verify timer is running
echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Timer status:"
sudo systemctl status update-topology-scan.timer --no-pager
echo ""
echo "📝 Check logs with: sudo journalctl -u update-topology-scan -f"
echo "🔍 Manual run: sudo systemctl start update-topology-scan"
echo "⏸️  Stop timer: sudo systemctl stop update-topology-scan.timer"
