import { RawNetworkData } from './types';

export const DEFAULT_DATA: RawNetworkData = {
  "export_timestamp": new Date().toISOString(),
  "export_type": "EMPTY_INIT",
  "database_source": "",
  "data": {
    "devices": {
      "count": 0,
      "records": []
    },
    "connections": {
      "count": 0,
      "records": []
    },
    "neighbors": {
      "count": 0,
      "records": []
    },
    "scan_metadata": [],
    "scan_state": {
      "count": 0,
      "records": []
    },
    "device_type_breakdown": {},
    "vendor_breakdown": {},
    "name_resolution_sources": {},
    "confidence_distribution": {},
    "port_analysis": {}
  }
};