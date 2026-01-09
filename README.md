<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NetTopo Visualizer - Network Topology Visualization

A real-time, interactive network topology visualization tool built with React, D3.js, and TypeScript. Displays live network scan data with automatic updates.

## ✨ Features

- 🔄 **Real-time Updates**: Auto-fetches topology data every 5 seconds
- 🎨 **Interactive D3.js Graph**: Force-directed layout with zoom, pan, and drag
- 🎯 **Hub-and-Spoke Layout**: Automatically identifies main switch/hub
- 🔍 **Global Search**: Find devices by name, IP, or vendor
- 📊 **Statistics Dashboard**: Visualize device types, vendors, and confidence scores
- 🎭 **Node Types**: Different visuals for switches, hosts, mobile devices, and L2-only devices
- 📱 **Responsive Design**: Works on desktop and tablets
- 🌙 **Dark Theme**: Beautiful glassmorphic UI with Tailwind CSS

## 🚀 Quick Start

### Development Mode

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to http://localhost:5173
```

### Production Deployment (Ubuntu + Nginx)

See the complete [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

**Quick Deploy:**

```bash
# Build the app
npm run build

# Deploy to Nginx
sudo cp -r dist/* /var/www/reactapp/

# Create data directory
sudo mkdir -p /var/www/reactapp/data

# Place your JSON file
sudo cp your_topology_data.json /var/www/reactapp/data/raw_data_complete.json
```

## 📂 Project Structure

```
NetTopo-Visualizer/
├── components/
│   ├── TopologyGraph.tsx   # Main D3.js visualization
│   ├── StatsPanel.tsx      # Statistics and charts
│   └── DeviceList.tsx      # Device inventory table
├── App.tsx                 # Main application component
├── types.ts                # TypeScript interfaces
├── sample_data.json        # Sample data format
├── DEPLOYMENT_GUIDE.md     # Production deployment guide
└── README.md
```

## 📊 Data Format

The app fetches data from `/data/raw_data_complete.json`. See [sample_data.json](sample_data.json) for the complete structure.

**Minimal Example:**

```json
{
  "export_timestamp": "2026-01-09T10:00:00",
  "export_type": "COMPLETE_RAW_SCAN_DATA",
  "database_source": "network_scanner.db",
  "data": {
    "devices": {
      "count": 2,
      "records": [
        {
          "id": 1,
          "ip": "192.168.1.1",
          "name": "Main Switch",
          "type": "Switch",
          "mac": "00:11:22:33:44:55",
          "vendor": "Cisco",
          "confidence": 95,
          ...
        }
      ]
    },
    "connections": {
      "count": 1,
      "records": [
        {
          "device_id": 1,
          "port_name": "Gi0/1",
          "mac_address": "AA:BB:CC:DD:EE:FF",
          "status": "ACTIVE",
          ...
        }
      ]
    },
    ...
  }
}
```

## 🔧 Configuration

### Polling Interval

Change auto-refresh interval in [App.tsx](App.tsx):

```typescript
// Poll every 10 seconds instead of 5
const interval = setInterval(fetchTopologyData, 10000);
```

### Data Source

By default, fetches from `/data/raw_data_complete.json`. To change:

```typescript
const response = await fetch('/your/custom/path.json', { 
  cache: 'no-store' 
});
```

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **D3.js 7** - Force-directed graph visualization
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Statistics charts
- **Framer Motion** - Animations
- **Lucide React** - Icons

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete Ubuntu/Nginx setup
- [Sample Data](sample_data.json) - Example JSON structure
- [Graph Package](GRAPH_PACKAGE_README.md) - Standalone graph component docs

## 🔐 Production Setup

For production deployments:

1. ✅ Use HTTPS (Let's Encrypt)
2. ✅ Configure Nginx caching properly
3. ✅ Set up atomic file writes for data updates
4. ✅ Add firewall rules
5. ✅ Monitor Nginx logs
6. ✅ Implement rate limiting

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for details.

## 🐛 Troubleshooting

### "Failed to Load Data" Error

```bash
# Check if file exists
ls -la /var/www/reactapp/data/raw_data_complete.json

# Test Nginx is serving it
curl http://localhost:3000/data/raw_data_complete.json

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Data Not Updating

- Clear browser cache (Ctrl+Shift+R)
- Check Nginx cache headers
- Verify JSON file is being updated
- Check browser console for errors

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - Free to use, modify, and distribute

## 📧 Support

For issues:
- Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Review browser console for errors
- Verify JSON structure matches [sample_data.json](sample_data.json)
- Check Nginx error logs

## 🙏 Credits

Built with:
- [D3.js](https://d3js.org/) - Data visualization
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Recharts](https://recharts.org/) - Charts

---

**View in AI Studio:** https://ai.studio/apps/drive/1k_BhbSnrk-5BUuXvgfz7tvB0G6T27Vv1
