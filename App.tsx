import React, { useState, useEffect } from 'react';
import TopologyGraph from './components/TopologyGraph';
import StatsPanel from './components/StatsPanel';
import DeviceList from './components/DeviceList';
import { RawNetworkData, GraphNode, DeviceRecord } from './types';
import { DEFAULT_DATA } from './constants';
import { LayoutDashboard, Network, List, Upload, Zap, Activity, Info, X, Search, Terminal, Loader2, CheckCircle2, AlertCircle, FileText, Download, ArrowRight, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Helper to Create GraphNode for consistency
const createGraphNodeFromDevice = (device: DeviceRecord): GraphNode => ({
  id: device.mac || `dev-${device.id}`,
  label: device.name,
  type: device.type,
  ip: device.ip,
  mac: device.mac,
  vendor: device.vendor,
  state: device.type.includes('ACTIVE') || device.type === 'Switch' ? 'ACTIVE' : 'INACTIVE',
  confidence: device.confidence,
  method: device.detection_method,
  details: device,
  x: 0, y: 0, vx: 0, vy: 0 
});

const App: React.FC = () => {
  const [data, setData] = useState<RawNetworkData>(DEFAULT_DATA);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
  const [jsonInput, setJsonInput] = useState<string>('');
  const [showInputModal, setShowInputModal] = useState(false);
  
  // Global Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDevices, setFilteredDevices] = useState<DeviceRecord[]>([]);

  // Action States
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{status: 'success' | 'error', msg: string} | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [deviceLogs, setDeviceLogs] = useState<any[]>([]);

  // Polling Effect
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch("/data/raw_data_complete.json", {
          cache: "no-store"
        });

        if (!res.ok) {
           return;
        }

        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch JSON", err);
      }
    };

    fetchData(); // initial load
    const interval = setInterval(fetchData, 5000); // every 5 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Search Effect
  useEffect(() => {
    if (!searchTerm.trim()) {
        setFilteredDevices([]);
        return;
    }
    const term = searchTerm.toLowerCase();
    const results = data.data.devices.records.filter(d => 
        (d.name && d.name.toLowerCase().includes(term)) ||
        (d.ip && d.ip.includes(term)) ||
        (d.vendor && d.vendor.toLowerCase().includes(term))
    );
    setFilteredDevices(results.slice(0, 8)); // Limit results
  }, [searchTerm, data.data.devices.records]);

  // Clear ping result when node changes
  useEffect(() => {
    setPingResult(null);
    setIsPinging(false);
  }, [selectedNode]);

  const handleNodeSelect = (node: GraphNode | null) => {
    setSelectedNode(node);
  };

  const handleSearchResultClick = (device: DeviceRecord) => {
    const node = createGraphNodeFromDevice(device);
    setSelectedNode(node);
    setActiveTab('dashboard'); // Switch to graph view
    setSearchTerm(''); 
    setFilteredDevices([]);
  };

  const handleJsonUpdate = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.data && parsed.data.devices && parsed.data.connections) {
        setData(parsed);
        setShowInputModal(false);
        setJsonInput('');
      } else {
        alert("Invalid JSON format. Must match the new export structure.");
      }
    } catch (e) {
      alert("Invalid JSON syntax.");
    }
  };

  const handlePing = () => {
    if (!selectedNode) return;
    setIsPinging(true);
    setPingResult(null);
    
    // Simulate network delay
    setTimeout(() => {
        const isOnline = selectedNode.state === 'ACTIVE' || selectedNode.type === 'Switch';
        const success = isOnline && Math.random() > 0.1; 
        
        setIsPinging(false);
        if (success) {
            const time = Math.floor(Math.random() * 20) + 1;
            setPingResult({
                status: 'success',
                msg: `Reply from ${selectedNode.ip}: bytes=32 time=${time}ms TTL=64`
            });
        } else {
            setPingResult({
                status: 'error',
                msg: `Request timed out. Destination host unreachable.`
            });
        }
        setTimeout(() => {
            if (selectedNode) setPingResult(null);
        }, 5000);
    }, 1500);
  };

  const handleViewLogs = () => {
    if (!selectedNode) return;
    
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const messages = [
        `Interface eth0 connection established`,
        `SSH session opened for user admin from 10.0.0.5`,
        `Packet dropped: IN=eth0 OUT= MAC=${selectedNode.mac.substring(0,8)}...`,
        `Cron job executed: /usr/bin/daily_backup`,
        `System load average: 0.12, 0.08, 0.05`,
        `DHCPDISCOVER received on eth0`,
        `DHCPOFFER sent to ${selectedNode.ip}`,
        `SNMP query received from management server`,
        `Kernel: [1234.567] link is up`,
        `Authentication failed for user root`
    ];
    
    const logs = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
        level: levels[Math.floor(Math.random() * (selectedNode.state === 'ACTIVE' ? 2 : levels.length))],
        message: messages[Math.floor(Math.random() * messages.length)]
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setDeviceLogs(logs);
    setShowLogsModal(true);
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans relative">
      
      {/* Sidebar Navigation */}
      <nav className="w-20 flex flex-col items-center py-6 glass-panel border-r-0 border-r-slate-800 z-40 m-3 rounded-2xl mb-3 mr-0 shadow-2xl relative">
        <div className="mb-8 p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.5)]">
          <Network className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 flex flex-col gap-6 w-full px-2">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
          />
          <NavButton 
            active={activeTab === 'list'} 
            onClick={() => setActiveTab('list')} 
            icon={<List className="w-5 h-5" />}
            label="Inventory"
          />
        </div>

        <button 
          onClick={() => setShowInputModal(true)}
          className="p-3 mx-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 mt-auto mb-2 flex flex-col items-center gap-1 group"
          title="Import Data"
        >
          <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 flex items-center px-8 justify-between z-20 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight flex items-center gap-2">
                Eagleyesoc <span className="text-blue-500">Radar</span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                System Operational
            </p>
          </div>

          {/* Global Search Bar with Results Dropdown */}
          <div className="flex-1 max-w-md mx-8 relative group z-50">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-700/50 rounded-xl leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 sm:text-sm transition-all shadow-inner"
                placeholder="Search nodes, IPs, vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
                <button 
                    onClick={() => { setSearchTerm(''); setFilteredDevices([]); }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
            
            {/* Search Results Dropdown */}
            <AnimatePresence>
            {searchTerm && filteredDevices.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#0F172A] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50"
                >
                    <div className="py-2">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                            <span>Matches Found</span>
                            <span className="bg-slate-800 text-slate-400 px-1.5 rounded">{filteredDevices.length}</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredDevices.map((device, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSearchResultClick(device)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-600/10 hover:border-l-2 border-l-2 border-transparent hover:border-blue-500 flex items-center justify-between group transition-all"
                            >
                                <div>
                                    <div className="text-sm font-medium text-slate-200 group-hover:text-white flex items-center gap-2">
                                        {device.name}
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${device.type.includes('ACTIVE') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                            {device.type}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 group-hover:text-slate-400 font-mono mt-0.5">
                                        {device.ip} • {device.vendor}
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                            </button>
                        ))}
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                <Terminal className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-400 font-mono">v3.0.0</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 shadow-lg border border-white/10"></div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-hidden px-6 pb-6 pt-0 relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            <div className={`flex flex-col gap-6 lg:col-span-3 h-full overflow-y-auto pr-1 custom-scrollbar pb-2`}>
              
              {activeTab === 'dashboard' && (
                <>
                  <StatsPanel data={data} />
                  <div className="flex-1 min-h-[600px] glass-panel rounded-2xl shadow-xl relative flex flex-col lg:flex-row overflow-hidden border border-slate-700/30">
                    {/* Graph Area */}
                    <div className="flex-1 h-full relative p-0 bg-black/20">
                        <TopologyGraph 
                          data={data} 
                          onNodeSelect={handleNodeSelect} 
                          selectedNodeId={selectedNode?.id || null}
                          searchTerm={searchTerm}
                        />
                    </div>
                    
                    {/* Details Panel - Slide Over */}
                    <AnimatePresence>
                    {selectedNode && (
                      <motion.div 
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full lg:w-96 bg-[#0f172a]/95 backdrop-blur-xl border-l border-slate-700/50 p-6 overflow-y-auto absolute right-0 top-0 bottom-0 shadow-[ -10px_0_30px_rgba(0,0,0,0.5)] z-20"
                      >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border border-white/5 ${
                                    selectedNode.type === 'Switch' ? 'bg-blue-600/20 text-blue-400' :
                                    selectedNode.state === 'ACTIVE' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400'
                                }`}>
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white leading-tight break-all">{selectedNode.label}</h2>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold bg-white/5 px-2 py-0.5 rounded w-fit">{selectedNode.type}</p>
                                </div>
                            </div>
                          <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg hover:bg-white/10">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-5">
                          <DetailRow label="Status">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                selectedNode.state === 'ACTIVE' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                    : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
                            }`}>
                                {selectedNode.state === 'ACTIVE' && <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>}
                                {selectedNode.state}
                            </span>
                          </DetailRow>

                          <div className="grid grid-cols-1 gap-4">
                             <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                <DetailRow label="IP Address" mono copy>{selectedNode.ip || 'N/A'}</DetailRow>
                             </div>
                             <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                <DetailRow label="MAC Address" mono>{selectedNode.mac || 'N/A'}</DetailRow>
                             </div>
                          </div>

                          <DetailRow label="Vendor">{selectedNode.vendor}</DetailRow>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <DetailRow label="Detection Method">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Shield className="w-3 h-3 text-indigo-400" />
                                    {selectedNode.method || 'Unknown'}
                                </div>
                            </DetailRow>
                            <DetailRow label="Confidence">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Zap className={`w-3 h-3 ${selectedNode.confidence > 50 ? 'text-amber-400' : 'text-slate-500'}`} />
                                    {selectedNode.confidence}%
                                </div>
                            </DetailRow>
                          </div>
                          
                          <div className="mt-8 pt-6 border-t border-slate-800">
                             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h4>
                             <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={handlePing}
                                    disabled={isPinging}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2 shadow-lg ${
                                        isPinging 
                                        ? 'bg-blue-600/50 text-white/50 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 hover:scale-[1.02] active:scale-95'
                                    }`}
                                >
                                    {isPinging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Terminal className="w-3 h-3" />}
                                    {isPinging ? 'Pinging...' : 'Ping Device'}
                                </button>
                                <button 
                                    onClick={handleViewLogs}
                                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-600 hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2"
                                >
                                    <FileText className="w-3 h-3" />
                                    View Logs
                                </button>
                             </div>

                             {/* Ping Result Feedback */}
                             <AnimatePresence>
                                {pingResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`mt-3 p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                                            pingResult.status === 'success' 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                                            : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                        }`}
                                    >
                                        {pingResult.status === 'success' ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
                                        {pingResult.msg}
                                    </motion.div>
                                )}
                             </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {activeTab === 'list' && (
                <div className="h-full pb-4">
                  <DeviceList 
                    devices={data.data.devices.records} 
                    onSelect={(node) => {
                        handleNodeSelect(node); 
                        setActiveTab('dashboard'); 
                    }} 
                    searchTerm={searchTerm}
                  />
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Input Modal */}
      <AnimatePresence>
      {showInputModal && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-panel bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Import Topology Data</h3>
                    <p className="text-xs text-slate-400">Paste Export JSON directly</p>
                  </div>
              </div>
              <button onClick={() => setShowInputModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <textarea 
                className="w-full flex-1 bg-[#020617] border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-64 shadow-inner custom-scrollbar"
                placeholder='{ "export_timestamp": "...", "data": { ... } }'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              ></textarea>
            </div>
            <div className="p-5 border-t border-slate-800 bg-slate-900/30 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setJsonInput(JSON.stringify(DEFAULT_DATA, null, 2));
                }}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors mr-auto hover:bg-white/5 rounded-lg"
              >
                Load Default
              </button>
              <button 
                onClick={() => setShowInputModal(false)}
                className="px-4 py-2 text-slate-300 hover:text-white text-sm transition-colors hover:bg-white/5 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleJsonUpdate}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95"
              >
                Visualize
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Logs Modal */}
      <AnimatePresence>
      {showLogsModal && selectedNode && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="glass-panel bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-700 w-full max-w-4xl h-[70vh] flex flex-col overflow-hidden"
          >
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400 border border-violet-500/20">
                       <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Logs</h3>
                       <p className="text-xs text-slate-400 font-mono">{selectedNode.label} • {selectedNode.ip}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg hover:bg-white/10" title="Download">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowLogsModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-white/10 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>
             </div>
             
             <div className="flex-1 overflow-auto bg-[#0a0f1e] p-4 custom-scrollbar">
                <div className="font-mono text-xs space-y-1">
                    {deviceLogs.map((log) => (
                        <div key={log.id} className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2 group">
                            <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                            <span className={`font-bold shrink-0 w-16 ${
                                log.level === 'INFO' ? 'text-blue-400' : 
                                log.level === 'WARN' ? 'text-yellow-400' : 
                                log.level === 'ERROR' ? 'text-red-400' : 'text-slate-400'
                            }`}>[{log.level}]</span>
                            <span className="text-slate-300 break-all">{log.message}</span>
                        </div>
                    ))}
                    <div className="animate-pulse text-slate-500 mt-2">_</div>
                </div>
             </div>
             
             <div className="p-2 bg-slate-900/50 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between px-4">
                <span>Showing last {deviceLogs.length} events</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live</span>
             </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(71, 85, 105, 0.4);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(71, 85, 105, 0.7);
        }
      `}</style>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
    <button 
      onClick={onClick}
      className={`group relative p-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
          active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {/* Tooltip */}
      <span className="absolute left-14 bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap pointer-events-none shadow-xl border border-slate-700 z-50">
          {label}
      </span>
    </button>
);

const DetailRow = ({ label, children, mono, copy }: any) => (
    <div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">{label}</span>
        <div className={`text-sm text-slate-200 flex items-center justify-between ${mono ? 'font-mono tracking-tight' : ''}`}>
            <span>{children}</span>
            {copy && (
                <span className="text-[10px] text-blue-500 cursor-pointer hover:text-blue-400 opacity-0 hover:opacity-100 transition-opacity">COPY</span>
            )}
        </div>
    </div>
);

export default App;