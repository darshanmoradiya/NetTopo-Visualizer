#!/bin/bash
# Setup Firewall Log API as a systemd service

set -e

echo "🔧 Setting up Firewall Log API service..."

# 1. Install Python dependencies
echo "📦 Installing Python dependencies..."
sudo apt-get update
sudo apt-get install -y python3-pip python3-flask python3-flask-cors

# If system packages not available, use pip with break-system-packages
if ! dpkg -l | grep -q python3-flask-cors; then
    sudo pip3 install --break-system-packages flask flask-cors
fi

# 2. Copy API script to system location
echo "📋 Installing API script..."
sudo cp firewall_log_api.py /usr/local/bin/firewall_log_api
sudo chmod +x /usr/local/bin/firewall_log_api

# 3. Create systemd service
echo "⚙️  Creating systemd service..."
sudo tee /etc/systemd/system/firewall-log-api.service > /dev/null <<EOF
[Unit]
Description=Firewall Log API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/bin/python3 /usr/local/bin/firewall_log_api
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 4. Enable and start service
echo "🔄 Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable firewall-log-api.service
sudo systemctl start firewall-log-api.service

# 5. Check status
echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Service status:"
sudo systemctl status firewall-log-api.service --no-pager --lines=5
echo ""
echo "📝 Useful commands:"
echo "  • View logs:       sudo journalctl -u firewall-log-api -f"
echo "  • Restart service: sudo systemctl restart firewall-log-api"
echo "  • Stop service:    sudo systemctl stop firewall-log-api"
echo "  • Test API:        curl http://localhost:5000/api/health"
echo ""
