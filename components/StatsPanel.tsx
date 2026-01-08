import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { RawNetworkData } from '../types';
import { Activity, Server, Radio, Clock, ShieldCheck, Zap, Database, BarChart3 } from 'lucide-react';

interface StatsPanelProps {
  data: RawNetworkData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

const CountUp = ({ value, color }: { value: number, color?: string }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = value;
        const duration = 1500;
        const incrementTime = 20;
        const step = Math.ceil(end / (duration / incrementTime)) || 1;
        
        const timer = setInterval(() => {
            start += step;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, incrementTime);
        return () => clearInterval(timer);
    }, [value]);

    return <span className={color}>{count}</span>;
};

const StatsPanel: React.FC<StatsPanelProps> = ({ data }) => {
  const { 
    device_type_breakdown, 
    vendor_breakdown, 
    confidence_distribution,
    name_resolution_sources,
    devices,
    connections,
    scan_metadata
  } = data.data;

  // Prepare Chart Data
  const typeData = Object.entries(device_type_breakdown).map(([name, value]) => ({ name: name.replace('_', ' '), value })).sort((a, b) => b.value - a.value);
  const vendorData = Object.entries(vendor_breakdown).map(([name, value]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, full: name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  const confidenceData = Object.entries(confidence_distribution).map(([range, value]) => ({ range, value }));
  const resolutionData = Object.entries(name_resolution_sources).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const activeCount = devices.records.filter(d => d.type === 'ACTIVE_HOST' || d.type === 'Switch').length;
  const scanDuration = scan_metadata[0] ? 
    ((new Date(scan_metadata[0].end_time).getTime() - new Date(scan_metadata[0].start_time).getTime()) / 1000).toFixed(1) + 's' 
    : 'N/A';

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4"
    >
      {/* KPI Cards */}
      <motion.div variants={item}>
        <KpiCard 
            title="Total Devices" 
            value={devices.count} 
            icon={<Server className="w-5 h-5 text-indigo-400" />} 
            borderColor="border-indigo-500/30"
        />
      </motion.div>
      <motion.div variants={item}>
        <KpiCard 
            title="Active Hosts" 
            value={activeCount} 
            icon={<Activity className="w-5 h-5 text-emerald-400" />} 
            valueColor="text-emerald-400"
            borderColor="border-emerald-500/30"
        />
      </motion.div>
      <motion.div variants={item}>
        <KpiCard 
            title="Total Ports" 
            value={connections.count} 
            icon={<Radio className="w-5 h-5 text-blue-400" />} 
            valueColor="text-blue-400"
            borderColor="border-blue-500/30"
        />
      </motion.div>
      <motion.div variants={item}>
        <div className="glass-panel p-4 rounded-xl shadow-lg border-l-2 border-slate-500/30 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 h-full">
            <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Scan Duration</h3>
            <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-slate-200 tracking-tight font-mono">
                {scanDuration}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Completed: {new Date(data.export_timestamp).toLocaleTimeString()}</p>
        </div>
      </motion.div>

      {/* Row 2: Breakdowns */}
      <motion.div variants={item} className="glass-panel p-5 rounded-xl shadow-lg col-span-1 md:col-span-2 flex flex-col min-h-[280px]">
        <h3 className="text-slate-200 font-semibold mb-4 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-500" />
            Device Classification
        </h3>
        <div className="flex-1 flex items-center">
          <div className="h-48 w-1/2">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                >
                    {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}
                />
                </PieChart>
            </ResponsiveContainer>
          </div>
           <div className="flex flex-col gap-2 w-1/2 overflow-y-auto max-h-56 pr-2 custom-scrollbar">
            {typeData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-xs text-slate-400 hover:bg-white/5 p-1.5 rounded transition-colors justify-between">
                    <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full shadow-sm shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="truncate" title={entry.name}>{entry.name}</span>
                    </div>
                    <span className="font-mono text-slate-300 font-bold ml-2">{entry.value}</span>
                </div>
            ))}
        </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-panel p-5 rounded-xl shadow-lg col-span-1 md:col-span-2 min-h-[280px]">
        <h3 className="text-slate-200 font-semibold mb-4 text-sm flex items-center gap-2">
             <ShieldCheck className="w-4 h-4 text-violet-500" />
             Top Vendors
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendorData} layout="vertical" margin={{ left: 10, right: 30, bottom: 0, top: 0 }}>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120} 
                tick={{fill: '#94a3b8', fontSize: 11}} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                 cursor={{fill: '#334155', opacity: 0.2}}
                 contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}
                 formatter={(value: number) => [value, 'Devices']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {vendorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Row 3: Confidence & Sources */}
      <motion.div variants={item} className="glass-panel p-5 rounded-xl shadow-lg col-span-1 md:col-span-2 min-h-[250px]">
          <h3 className="text-slate-200 font-semibold mb-4 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Confidence Distribution
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={confidenceData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <defs>
                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                    <XAxis dataKey="range" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#f59e0b" fillOpacity={1} fill="url(#colorConfidence)" />
                </AreaChart>
            </ResponsiveContainer>
          </div>
      </motion.div>

      <motion.div variants={item} className="glass-panel p-5 rounded-xl shadow-lg col-span-1 md:col-span-2 min-h-[250px]">
          <h3 className="text-slate-200 font-semibold mb-4 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Name Resolution Sources
          </h3>
          <div className="flex flex-wrap gap-3">
              {resolutionData.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex-1 min-w-[120px] flex flex-col items-center justify-center hover:bg-slate-700/50 transition-colors">
                      <span className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">{item.name}</span>
                      <span className="text-xl font-bold text-white">{item.value}</span>
                  </div>
              ))}
          </div>
      </motion.div>

    </motion.div>
  );
};

const KpiCard = ({ title, value, icon, valueColor = "text-white", borderColor = "border-slate-600/30" }: any) => (
  <div className={`glass-panel p-4 rounded-xl shadow-lg border-l-2 ${borderColor} flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 h-full`}>
    <div className="flex justify-between items-start mb-2">
        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</h3>
        {icon}
    </div>
    <div className={`text-3xl font-bold ${valueColor} tracking-tight font-mono`}>
        <CountUp value={value} />
    </div>
  </div>
);

export default StatsPanel;