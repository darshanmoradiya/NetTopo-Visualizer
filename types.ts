import * as d3 from 'd3';

export interface DeviceRecord {
  id: number;
  ip: string;
  name: string;
  type: string;
  detection_method: string;
  mac: string;
  confidence: number;
  network: string;
  vendor: string;
  last_seen: string;
  name_source: string;
  netbios_domain: string | null;
  logged_in_user: string | null;
  state?: string; // Optional as it might be inferred
}

export interface ConnectionRecord {
  id: number;
  device_id: number;
  port_name: string;
  port_alias: string;
  port_status: string;
  mac_address: string;
  ip_address: string;
  vendor: string;
  status: string;
}

export interface NeighborRecord {
  id: number;
  local_device_id: number;
  local_ip: string;
  local_port: string | null;
  protocol: string;
  remote_name: string;
  remote_port: string | null;
}

export interface ScanMetadata {
  id: number;
  start_time: string;
  end_time: string;
  total_devices: number;
  total_networks: number;
  snmp_version: string;
  community: string;
}

export interface ScanStateRecord {
  id: number;
  network: string;
  device: string;
  scan_time: string;
}

export interface PortAnalysis {
  [key: string]: {
    total_ports: number;
    active_ports: number;
  };
}

export interface RawNetworkData {
  export_timestamp: string;
  export_type: string;
  database_source: string;
  data: {
    devices: {
      count: number;
      records: DeviceRecord[];
    };
    connections: {
      count: number;
      records: ConnectionRecord[];
    };
    neighbors: {
      count: number;
      records: NeighborRecord[];
    };
    scan_metadata: ScanMetadata[];
    scan_state: {
      count: number;
      records: ScanStateRecord[];
    };
    device_type_breakdown: Record<string, number>;
    vendor_breakdown: Record<string, number>;
    name_resolution_sources: Record<string, number>;
    confidence_distribution: Record<string, number>;
    port_analysis: PortAnalysis;
    all_unique_macs?: {
      count: number;
      list: string[];
    };
    all_discovered_ips?: {
      count: number;
      list: string[];
    };
    domain_workgroup_breakdown?: Record<string, number>;
    logged_in_users?: {
      count: number;
      list: string[];
    };
  };
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string; // We will use stringified ID or MAC for D3
  originalId?: number; // The database ID
  label: string;
  type: string;
  ip: string;
  mac: string;
  vendor: string;
  state: string;
  confidence: number;
  method: string;
  details: DeviceRecord | null;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  port: string;
  status: string;
}