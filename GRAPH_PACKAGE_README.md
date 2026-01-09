# Network Topology Graph Component - Standalone Package

This is a reusable D3.js-based network topology visualization component built with React and TypeScript.

## Features

- **Interactive Force-Directed Graph**: Uses D3.js force simulation for dynamic network visualization
- **Hub-and-Spoke Layout**: Automatically identifies the main switch/hub and arranges devices in concentric rings
- **Node Types**: Different visual representations for switches, active hosts, mobile devices, and L2-only devices
- **Zoom & Pan**: Full zoom and pan controls with smooth animations
- **Search & Filter**: Highlight and filter nodes based on search criteria
- **Node Selection**: Click to select nodes with animated focus and zoom
- **Drag & Drop**: Interactive node dragging with physics simulation
- **Responsive**: Adapts to container size

## Installation

### 1. Install Dependencies

```bash
npm install d3 react react-dom lucide-react
npm install --save-dev @types/d3 typescript
```

### 2. Required Files

Copy these files to your project:
- `TopologyGraph.tsx` - Main component
- `types.ts` - TypeScript interfaces
- Add Tailwind CSS or adjust styling as needed

## Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "d3": "^7.9.0",
    "lucide-react": "^0.562.0"
  },
  "devDependencies": {
    "@types/d3": "^7.4.0",
    "typescript": "^5.0.0"
  }
}
```

## Usage

### Basic Example

```tsx
import TopologyGraph from './components/TopologyGraph';
import { RawNetworkData, GraphNode } from './types';

function App() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const handleNodeSelect = (node: GraphNode | null) => {
    setSelectedNode(node?.id || null);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <input 
        type="text" 
        placeholder="Search devices..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <TopologyGraph
        data={networkData}
        onNodeSelect={handleNodeSelect}
        selectedNodeId={selectedNode}
        searchTerm={searchTerm}
      />
    </div>
  );
}
```

## Data Structure

The component expects data in the following format:

```typescript
const networkData: RawNetworkData = {
  export_timestamp: "2026-01-08T17:03:15.311275",
  export_type: "COMPLETE_RAW_SCAN_DATA",
  database_source: "network_data.db",
  data: {
    devices: {
      count: 10,
      records: [
        {
          id: 1,
          ip: "192.168.1.1",
          name: "Main Switch",
          type: "Switch",
          detection_method: "SNMP",
          mac: "00:11:22:33:44:55",
          confidence: 95,
          network: "192.168.1.0/24",
          vendor: "Cisco",
          last_seen: "2026-01-08T17:00:00",
          name_source: "DNS",
          netbios_domain: null,
          logged_in_user: null
        },
        // ... more devices
      ]
    },
    connections: {
      count: 5,
      records: [
        {
          id: 1,
          device_id: 1,
          port_name: "GigabitEthernet0/1",
          port_alias: "Uplink",
          port_status: "UP",
          mac_address: "AA:BB:CC:DD:EE:FF",
          ip_address: "192.168.1.2",
          vendor: "Intel",
          status: "ACTIVE"
        },
        // ... more connections
      ]
    },
    neighbors: { count: 0, records: [] },
    scan_metadata: [],
    scan_state: { count: 0, records: [] },
    device_type_breakdown: {},
    vendor_breakdown: {},
    name_resolution_sources: {},
    confidence_distribution: {},
    port_analysis: {}
  }
};
```

## Component Props

```typescript
interface TopologyGraphProps {
  data: RawNetworkData;           // Network data (devices & connections)
  onNodeSelect: (node: GraphNode | null) => void;  // Callback when node is clicked
  selectedNodeId: string | null;   // Currently selected node ID
  searchTerm: string;              // Search filter text
}
```

## Styling

The component uses Tailwind CSS classes. If you don't use Tailwind, replace these classes:

```css
/* Replace Tailwind classes with custom CSS */
.w-full { width: 100%; }
.h-full { height: 100%; }
.bg-[#0f172a] { background-color: #0f172a; }
.rounded-xl { border-radius: 0.75rem; }
.border { border-width: 1px; }
.border-slate-700\/50 { border-color: rgba(51, 65, 85, 0.5); }
/* ... and so on */
```

## Customization

### Change Node Colors

Modify the `getNodeColor` function:

```typescript
const getNodeColor = (type: string, state: string) => {
  if (type === 'L2_DEVICE') return '#475569';
  if (state === 'INACTIVE') return '#64748b';
  if (type === 'Switch') return '#3b82f6';
  if (type.includes('Android') || type.includes('iOS')) return '#a855f7';
  return '#10b981'; // Default color for active hosts
};
```

### Adjust Ring Radii

Change the ring distances in the component:

```typescript
distributeRing(ring1, 200);  // Inner ring radius
distributeRing(ring2, 350);  // Outer ring radius
```

### Modify Force Simulation

Adjust physics parameters:

```typescript
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links).id((d: any) => d.id).strength(0.2))  // Link strength
  .force("charge", d3.forceManyBody().strength(-200))  // Repulsion strength
  .force("collide", d3.forceCollide().radius(20))  // Collision radius
  .force("r", d3.forceRadial(...).strength(0.8));  // Radial force strength
```

## Node Types

The graph supports different node visualizations:

1. **Switch/Hub**: Blue hexagon with "SW" label
2. **Active Host**: Green circle with inner dot
3. **Mobile Device** (Android/iOS): Purple rotated square
4. **Inactive Device**: Gray small square
5. **L2-Only Device**: Slate gray small square

## Controls

- **Mouse Wheel**: Zoom in/out
- **Click & Drag**: Pan the view
- **Click Node**: Select and focus on node
- **Drag Node**: Move individual nodes
- **+ Button**: Zoom in
- **- Button**: Zoom out
- **Reset Button**: Return to original view

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (requires ES6)

## Performance Tips

1. **Large Networks** (>500 nodes): Consider reducing simulation forces or limiting visible nodes
2. **Animation**: Set `alphaTarget` lower for smoother rendering
3. **Labels**: Hide labels for nodes outside viewport for better performance

## License

MIT License - Free to use, modify, and distribute

## Credits

Built with:
- [D3.js](https://d3js.org/) - Data visualization library
- [React](https://react.dev/) - UI framework
- [Lucide React](https://lucide.dev/) - Icon library

## Support

For issues or questions, refer to:
- D3.js Documentation: https://d3js.org/
- React Documentation: https://react.dev/
