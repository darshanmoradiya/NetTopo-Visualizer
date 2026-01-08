import React from 'react';
import { DeviceRecord, GraphNode } from '../types';
import { Search, Monitor, Smartphone, Wifi, Server, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceListProps {
  devices: DeviceRecord[];
  onSelect: (node: GraphNode) => void;
  searchTerm: string;
}

const DeviceList: React.FC<DeviceListProps> = ({ devices, onSelect, searchTerm }) => {
  const filtered = devices.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.ip?.includes(searchTerm) ||
    d.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type: string) => {
      if (type === 'Switch') return <Server className="w-3.5 h-3.5" />;
      if (type.includes('Android') || type.includes('iOS')) return <Smartphone className="w-3.5 h-3.5" />;
      if (type === 'WIFI') return <Wifi className="w-3.5 h-3.5" />;
      if (type === 'L2ONLY') return <HelpCircle className="w-3.5 h-3.5" />;
      return <Monitor className="w-3.5 h-3.5" />;
  };

  const getStateColor = (type: string) => {
      if (type.includes('ACTIVE') || type === 'Switch') return 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
      if (type === 'L2ONLY') return 'bg-slate-800 text-slate-500 border-slate-700';
      return 'bg-amber-500/5 text-amber-400 border-amber-500/20';
  };

  return (
    <div className="glass-panel rounded-xl shadow-lg flex flex-col h-full overflow-hidden border border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/20 backdrop-blur-sm flex justify-between items-center">
         <h3 className="text-slate-100 font-semibold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
            Device Inventory
         </h3>
         <span className="text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50 shadow-inner">
            {filtered.length} Devices
         </span>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/80 text-slate-300 sticky top-0 z-10 backdrop-blur-md shadow-sm">
            <tr>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500">Device</th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500">IP Address</th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500">Type</th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500">Conf.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            <AnimatePresence initial={false}>
            {filtered.map((device) => (
              <motion.tr 
                key={device.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hover:bg-blue-500/5 cursor-pointer transition-colors duration-150 group"
                onClick={() => {
                     const node: GraphNode = {
                         id: device.mac || `dev-${device.id}`,
                         label: device.name,
                         type: device.type,
                         ip: device.ip,
                         mac: device.mac,
                         vendor: device.vendor,
                         state: device.type, // Map Type to State roughly
                         confidence: device.confidence,
                         method: device.detection_method,
                         details: device,
                         index: 0, 
                         x: 0, y: 0, vx: 0, vy: 0
                     };
                     onSelect(node);
                }}
              >
                <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-200 truncate max-w-[180px] group-hover:text-blue-400 transition-colors">{device.name}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[180px] mt-0.5">{device.vendor}</div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-400 group-hover:text-slate-300">{device.ip}</td>
                <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStateColor(device.type)}`}>
                        {device.type}
                    </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                     <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full rounded-full" 
                            style={{ 
                                width: `${device.confidence}%`,
                                backgroundColor: device.confidence > 80 ? '#10b981' : device.confidence > 50 ? '#f59e0b' : '#ef4444' 
                            }}
                        ></div>
                     </div>
                     <span className="text-[10px] font-mono">{device.confidence}%</span>
                  </div>
                </td>
              </motion.tr>
            ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeviceList;