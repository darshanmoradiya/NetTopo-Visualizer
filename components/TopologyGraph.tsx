import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RawNetworkData, GraphNode, GraphLink, DeviceRecord } from '../types';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface TopologyGraphProps {
  data: RawNetworkData;
  onNodeSelect: (node: GraphNode | null) => void;
  selectedNodeId: string | null;
  searchTerm: string;
}

const TopologyGraph: React.FC<TopologyGraphProps> = ({ data, onNodeSelect, selectedNodeId, searchTerm }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Helper to check search match
  const isNodeMatch = (node: any) => {
    if (!node || !searchTerm) return false;
    const term = searchTerm.toLowerCase();
    
    const label = node.label || '';
    const ip = node.ip || '';
    const vendor = node.vendor || '';

    return (
      (typeof label === 'string' && label.toLowerCase().includes(term)) ||
      (typeof ip === 'string' && ip.toLowerCase().includes(term)) ||
      (typeof vendor === 'string' && vendor.toLowerCase().includes(term))
    );
  };

  const handleZoom = (factor: number) => {
    if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, factor);
    }
  };

  const handleReset = () => {
    if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  useEffect(() => {
    if (!data || !svgRef.current || !wrapperRef.current) return;

    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // --- Data Processing for New Schema ---
    const nodeMap = new Map<string, GraphNode>();
    const devices = data.data.devices.records;
    const connections = data.data.connections.records;

    // Helper to get consistent ID (prefer MAC for matching, then fallback to string ID)
    // Actually, since connections use MAC for target, we should map by MAC if available.
    // Source uses device_id, so we need a map for that too.
    const deviceIdToNodeId = new Map<number, string>();

    // 1. Create Nodes from Device Records
    devices.forEach((device) => {
      // Use MAC as primary ID if available, else Device ID
      const nodeId = device.mac && device.mac !== 'Unknown MAC' ? device.mac : `dev-${device.id}`;
      deviceIdToNodeId.set(device.id, nodeId);

      nodeMap.set(nodeId, {
        id: nodeId,
        originalId: device.id,
        label: device.name || device.ip,
        type: device.type,
        ip: device.ip,
        mac: device.mac,
        vendor: device.vendor,
        state: device.type.includes('ACTIVE') || device.type === 'Switch' ? 'ACTIVE' : 'INACTIVE',
        confidence: device.confidence,
        method: device.detection_method,
        details: device,
        x: centerX,
        y: centerY,
      });
    });

    // 2. Process Connections (Links)
    const links: GraphLink[] = [];
    
    connections.forEach((conn) => {
        const sourceNodeId = deviceIdToNodeId.get(conn.device_id);
        if (!sourceNodeId) return; // Source device not found in records

        const targetMac = conn.mac_address;
        let targetNodeId = targetMac;

        // If target doesn't exist in our map (L2 device not fully scanned), create it
        if (!nodeMap.has(targetNodeId)) {
            // Create a "Ghost" or L2-only node
            nodeMap.set(targetNodeId, {
                id: targetNodeId,
                label: conn.vendor !== 'Unknown Vendor' ? conn.vendor : targetMac,
                type: 'L2_DEVICE',
                ip: conn.ip_address !== 'No IP' ? conn.ip_address : 'L2 Only',
                mac: targetMac,
                vendor: conn.vendor,
                state: 'ACTIVE', // Assumed active if link is up
                confidence: 0,
                method: 'L2_LINK',
                details: null,
                x: centerX,
                y: centerY,
            });
        }

        links.push({
            source: sourceNodeId,
            target: targetNodeId,
            port: conn.port_name,
            status: conn.status
        });
    });

    const nodes = Array.from(nodeMap.values());

    // 3. Layout Logic (Hub & Spoke / Radial)
    // Find the Hub (Node with most connections)
    const linkCounts = new Map<string, number>();
    links.forEach(l => {
        const s = typeof l.source === 'string' ? l.source : l.source.id;
        const t = typeof l.target === 'string' ? l.target : l.target.id;
        linkCounts.set(s, (linkCounts.get(s) || 0) + 1);
        linkCounts.set(t, (linkCounts.get(t) || 0) + 1);
    });

    let maxConnections = 0;
    let hubId = nodes[0]?.id;
    
    nodes.forEach(n => {
        const count = linkCounts.get(n.id) || 0;
        if (count > maxConnections) {
            maxConnections = count;
            hubId = n.id;
        }
        if (n.type === 'Switch') hubId = n.id; // Force switch preference
    });

    // Assign Rings
    const ring1: GraphNode[] = []; // Active Hosts
    const ring2: GraphNode[] = []; // L2 / Inactive
    
    nodes.forEach(n => {
        if (n.id === hubId) {
            n.fx = centerX;
            n.fy = centerY;
        } else if (n.state === 'ACTIVE' && n.type !== 'L2_DEVICE') {
            ring1.push(n);
        } else {
            ring2.push(n);
        }
    });

    // Helper to distribute nodes on a circle
    const distributeRing = (ringNodes: GraphNode[], radius: number) => {
        const count = ringNodes.length;
        const angleStep = (2 * Math.PI) / count;
        ringNodes.forEach((n, i) => {
            const angle = i * angleStep;
            n.x = centerX + radius * Math.cos(angle);
            n.y = centerY + radius * Math.sin(angle);
        });
    };

    distributeRing(ring1, 200);
    distributeRing(ring2, 350);

    // --- Simulation ---
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).strength(0.2))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("collide", d3.forceCollide().radius(20))
      .force("r", d3.forceRadial((d: any) => {
          if (d.id === hubId) return 0;
          if (d.state === 'ACTIVE' && d.type !== 'L2_DEVICE') return 200;
          return 350;
      }, centerX, centerY).strength(0.8));

    // --- Rendering ---
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => g.attr("transform", event.transform));
    
    svg.call(zoom).on("dblclick.zoom", null);
    zoomRef.current = zoom;
    svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.85).translate(-width/2, -height/2));

    // Background Rings
    g.append("circle").attr("cx", centerX).attr("cy", centerY).attr("r", 200).attr("fill", "none").attr("stroke", "#1e293b").attr("stroke-dasharray", "4 4");
    g.append("circle").attr("cx", centerX).attr("cy", centerY).attr("r", 350).attr("fill", "none").attr("stroke", "#1e293b").attr("stroke-dasharray", "4 4");

    // Links
    const link = g.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.3)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    // Nodes
    const nodeGroup = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any)
      .on("click", (e, d) => {
        e.stopPropagation();
        onNodeSelect(d);
      });

    nodeGroup.each(function(d) {
        const el = d3.select(this);
        const color = getNodeColor(d.type, d.state);
        
        if (d.id === hubId || d.type === 'Switch') {
             el.append("path")
               .attr("d", "M0,-15 L13,-7.5 L13,7.5 L0,15 L-13,7.5 L-13,-7.5 Z")
               .attr("fill", "#1e293b")
               .attr("stroke", "#3b82f6")
               .attr("stroke-width", 2);
             el.append("text").text("SW").attr("dy", "0.3em").attr("text-anchor", "middle").attr("fill", "#3b82f6").attr("font-size", "8px").attr("font-weight", "bold");
        } else if (d.type.includes('Android') || d.type.includes('iOS')) {
             el.append("rect")
               .attr("width", 14).attr("height", 14)
               .attr("x", -7).attr("y", -7)
               .attr("transform", "rotate(45)")
               .attr("fill", "#1e293b")
               .attr("stroke", color)
               .attr("stroke-width", 2);
        } else if (d.state === 'ACTIVE' && d.type !== 'L2_DEVICE') {
             el.append("circle")
               .attr("r", 6)
               .attr("fill", "#1e293b")
               .attr("stroke", color)
               .attr("stroke-width", 2);
             el.append("circle").attr("r", 2).attr("fill", color);
        } else {
             // Inactive or L2
             el.append("rect")
               .attr("width", 8).attr("height", 8)
               .attr("x", -4).attr("y", -4)
               .attr("fill", "#1e293b")
               .attr("stroke", color)
               .attr("stroke-width", 1.5);
        }
    });

    nodeGroup.append("circle")
        .attr("r", 20)
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0)
        .attr("class", "selection-ring");

    const labels = nodeGroup.append("text")
      .text(d => d.label)
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("fill", "#94a3b8")
      .attr("dy", "0.35em")
      .style("pointer-events", "none")
      .attr("text-anchor", "start");
      
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
      
      labels.attr("transform", d => {
          if (d.id === hubId) return `translate(0, -25)`;
          const isLeft = d.x! < centerX;
          return `translate(${isLeft ? -15 : 15}, 0)`; 
      })
      .attr("text-anchor", d => d.id === hubId ? "middle" : (d.x! < centerX ? "end" : "start"));
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    const updateVisuals = () => {
         const selection = d3.select(svgRef.current);
         selection.selectAll(".selection-ring")
             .transition().duration(200)
             .attr("stroke-opacity", (d: any) => d.id === selectedNodeId ? 1 : 0);

         selection.selectAll("g.node-group")
             .attr("opacity", (d: any) => {
                 if (searchTerm && !isNodeMatch(d)) return 0.2;
                 return 1;
             });

         selection.selectAll("line")
             .attr("stroke-opacity", (d: any) => {
                 if (searchTerm) {
                     return (isNodeMatch(d.source) || isNodeMatch(d.target)) ? 0.6 : 0.05;
                 }
                 if (selectedNodeId) {
                     return (d.source.id === selectedNodeId || d.target.id === selectedNodeId) ? 0.6 : 0.1;
                 }
                 return 0.3;
             });
             
         selection.selectAll("text")
             .attr("fill", (d: any) => (d.id === selectedNodeId || isNodeMatch(d)) ? "#fff" : "#94a3b8")
             .attr("font-weight", (d: any) => (d.id === selectedNodeId || isNodeMatch(d)) ? "700" : "400");
    };

    updateVisuals();

    return () => {
      simulation.stop();
    };
  }, [data, selectedNodeId, searchTerm]);

  // Effect to Zoom to Selected Node
  useEffect(() => {
    if (!selectedNodeId || !svgRef.current || !zoomRef.current || !wrapperRef.current) return;
    const timeout = setTimeout(() => {
        const svg = d3.select(svgRef.current);
        const selection = svg.selectAll<SVGGElement, GraphNode>(".node-group");
        if (selection.empty()) return;
        const allNodes = selection.data();
        const targetNode = allNodes.find(n => n.id === selectedNodeId);
        if (targetNode && typeof targetNode.x === 'number') {
            const width = wrapperRef.current?.clientWidth || 0;
            const height = wrapperRef.current?.clientHeight || 0;
            const transform = d3.zoomIdentity.translate(-targetNode.x * 2 + width / 2, -targetNode.y * 2 + height / 2).scale(2);
            svg.transition().duration(1000).call(zoomRef.current.transform, transform);
        }
    }, 100);
    return () => clearTimeout(timeout);
  }, [selectedNodeId]);

  const getNodeColor = (type: string, state: string) => {
    if (type === 'L2_DEVICE') return '#475569'; // Slate 600
    if (state === 'INACTIVE') return '#64748b'; // Slate 500
    if (type === 'Switch') return '#3b82f6'; // Blue 500
    if (type.includes('Android') || type.includes('iOS')) return '#a855f7'; // Purple 500
    return '#10b981'; // Emerald 500
  };

  return (
    <div ref={wrapperRef} className="w-full h-full bg-[#0f172a] rounded-xl border border-slate-700/50 relative overflow-hidden shadow-inner group">
        <svg ref={svgRef} className="w-full h-full block" />
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
             <button onClick={() => handleZoom(1.2)} className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 shadow-lg border border-slate-700 transition-colors active:scale-95"><Plus size={16} /></button>
             <button onClick={() => handleZoom(0.8)} className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 shadow-lg border border-slate-700 transition-colors active:scale-95"><Minus size={16} /></button>
             <button onClick={handleReset} className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 shadow-lg border border-slate-700 transition-colors active:scale-95" title="Reset View"><RotateCcw size={16} /></button>
        </div>
        <div className="absolute top-4 left-4 bg-slate-900/90 p-3 rounded-lg border border-slate-700/50 backdrop-blur-sm shadow-xl pointer-events-none">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Topology Map</div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-400"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg><span>Main Switch</span></div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400"><div className="w-2.5 h-2.5 rounded-full border border-[#10b981] bg-[#1e293b] flex items-center justify-center"><div className="w-1 h-1 bg-[#10b981] rounded-full"></div></div><span>Active Host</span></div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400"><div className="w-2 h-2 border border-[#64748b] bg-[#1e293b]"></div><span>Inactive / Passive</span></div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400"><div className="w-2 h-2 border border-[#475569] bg-[#1e293b]"></div><span>L2 Only</span></div>
            </div>
        </div>
    </div>
  );
};

export default TopologyGraph;