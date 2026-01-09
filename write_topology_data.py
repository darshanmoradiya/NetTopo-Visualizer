#!/usr/bin/env python3
"""
Network Topology Data Writer
Atomically writes network topology data to JSON file for NetTopo Visualizer

Usage:
    python write_topology_data.py

This script ensures atomic writes to prevent the React app from reading
partial/corrupted JSON data during updates.
"""

import json
import os
import tempfile
from datetime import datetime
from typing import Dict, List, Any


def generate_sample_topology_data() -> Dict[str, Any]:
    """
    Generate sample topology data.
    Replace this with your actual network scanning logic.
    """
    return {
        "export_timestamp": datetime.now().isoformat(),
        "export_type": "COMPLETE_RAW_SCAN_DATA",
        "database_source": "network_scanner.db",
        "data": {
            "devices": {
                "count": 5,
                "records": [
                    {
                        "id": 1,
                        "ip": "192.168.1.1",
                        "name": "Main Switch",
                        "type": "Switch",
                        "detection_method": "SNMP",
                        "mac": "00:11:22:33:44:55",
                        "confidence": 95,
                        "network": "192.168.1.0/24",
                        "vendor": "Cisco Systems",
                        "last_seen": datetime.now().isoformat(),
                        "name_source": "DNS",
                        "netbios_domain": None,
                        "logged_in_user": None
                    },
                    {
                        "id": 2,
                        "ip": "192.168.1.10",
                        "name": "Workstation-01",
                        "type": "ACTIVE_HOST",
                        "detection_method": "PING_SNMP",
                        "mac": "AA:BB:CC:DD:EE:01",
                        "confidence": 85,
                        "network": "192.168.1.0/24",
                        "vendor": "Intel Corporate",
                        "last_seen": datetime.now().isoformat(),
                        "name_source": "NetBIOS",
                        "netbios_domain": "WORKGROUP",
                        "logged_in_user": "john.doe"
                    },
                    {
                        "id": 3,
                        "ip": "192.168.1.11",
                        "name": "Workstation-02",
                        "type": "ACTIVE_HOST",
                        "detection_method": "PING_ONLY",
                        "mac": "AA:BB:CC:DD:EE:02",
                        "confidence": 70,
                        "network": "192.168.1.0/24",
                        "vendor": "Dell Inc.",
                        "last_seen": datetime.now().isoformat(),
                        "name_source": "DNS",
                        "netbios_domain": None,
                        "logged_in_user": None
                    },
                    {
                        "id": 4,
                        "ip": "192.168.1.50",
                        "name": "Android-Phone",
                        "type": "Android_DEVICE",
                        "detection_method": "PING_ONLY",
                        "mac": "AA:BB:CC:DD:EE:03",
                        "confidence": 60,
                        "network": "192.168.1.0/24",
                        "vendor": "Samsung Electronics",
                        "last_seen": datetime.now().isoformat(),
                        "name_source": "DHCP",
                        "netbios_domain": None,
                        "logged_in_user": None
                    },
                    {
                        "id": 5,
                        "ip": "192.168.1.100",
                        "name": "Server-01",
                        "type": "ACTIVE_HOST",
                        "detection_method": "SNMP",
                        "mac": "AA:BB:CC:DD:EE:04",
                        "confidence": 90,
                        "network": "192.168.1.0/24",
                        "vendor": "HP Enterprise",
                        "last_seen": datetime.now().isoformat(),
                        "name_source": "DNS",
                        "netbios_domain": None,
                        "logged_in_user": None
                    }
                ]
            },
            "connections": {
                "count": 4,
                "records": [
                    {
                        "id": 1,
                        "device_id": 1,
                        "port_name": "GigabitEthernet0/1",
                        "port_alias": "Uplink Port 1",
                        "port_status": "UP",
                        "mac_address": "AA:BB:CC:DD:EE:01",
                        "ip_address": "192.168.1.10",
                        "vendor": "Intel Corporate",
                        "status": "ACTIVE"
                    },
                    {
                        "id": 2,
                        "device_id": 1,
                        "port_name": "GigabitEthernet0/2",
                        "port_alias": "Uplink Port 2",
                        "port_status": "UP",
                        "mac_address": "AA:BB:CC:DD:EE:02",
                        "ip_address": "192.168.1.11",
                        "vendor": "Dell Inc.",
                        "status": "ACTIVE"
                    },
                    {
                        "id": 3,
                        "device_id": 1,
                        "port_name": "GigabitEthernet0/3",
                        "port_alias": "Wireless AP",
                        "port_status": "UP",
                        "mac_address": "AA:BB:CC:DD:EE:03",
                        "ip_address": "192.168.1.50",
                        "vendor": "Samsung Electronics",
                        "status": "ACTIVE"
                    },
                    {
                        "id": 4,
                        "device_id": 1,
                        "port_name": "GigabitEthernet0/4",
                        "port_alias": "Server Link",
                        "port_status": "UP",
                        "mac_address": "AA:BB:CC:DD:EE:04",
                        "ip_address": "192.168.1.100",
                        "vendor": "HP Enterprise",
                        "status": "ACTIVE"
                    }
                ]
            },
            "neighbors": {
                "count": 0,
                "records": []
            },
            "scan_metadata": [
                {
                    "id": 1,
                    "start_time": datetime.now().isoformat(),
                    "end_time": datetime.now().isoformat(),
                    "total_devices": 5,
                    "total_networks": 1,
                    "snmp_version": "v2c",
                    "community": "public"
                }
            ],
            "scan_state": {
                "count": 1,
                "records": [
                    {
                        "id": 1,
                        "network": "192.168.1.0/24",
                        "device": "192.168.1.1",
                        "scan_time": datetime.now().isoformat()
                    }
                ]
            },
            "device_type_breakdown": {
                "Switch": 1,
                "ACTIVE_HOST": 3,
                "Android_DEVICE": 1
            },
            "vendor_breakdown": {
                "Cisco Systems": 1,
                "Intel Corporate": 1,
                "Dell Inc.": 1,
                "Samsung Electronics": 1,
                "HP Enterprise": 1
            },
            "name_resolution_sources": {
                "DNS": 3,
                "NetBIOS": 1,
                "DHCP": 1
            },
            "confidence_distribution": {
                "90-100": 2,
                "70-89": 2,
                "50-69": 1
            },
            "port_analysis": {
                "192.168.1.1": {
                    "total_ports": 24,
                    "active_ports": 4
                }
            }
        }
    }


def write_topology_data(data: Dict[str, Any], target_path: str = "/var/www/reactapp/data/raw_data_complete.json") -> bool:
    """
    Atomically write topology data to avoid race conditions.
    
    Args:
        data: The topology data dictionary
        target_path: Destination file path
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure directory exists
        data_dir = os.path.dirname(target_path)
        os.makedirs(data_dir, exist_ok=True)
        
        # Create temporary file in the same directory for atomic move
        tmp_fd, tmp_path = tempfile.mkstemp(
            dir=data_dir,
            suffix=".tmp",
            prefix=".topology_"
        )
        
        try:
            # Write JSON to temporary file
            with os.fdopen(tmp_fd, 'w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # Atomic replace - ensures React never reads partial data
            # os.replace is atomic on both Unix and Windows
            os.replace(tmp_path, target_path)
            
            # Set readable permissions
            os.chmod(target_path, 0o644)
            
            print(f"✓ Successfully wrote topology data to {target_path}")
            print(f"  Timestamp: {data.get('export_timestamp')}")
            print(f"  Devices: {data['data']['devices']['count']}")
            print(f"  Connections: {data['data']['connections']['count']}")
            
            return True
            
        except Exception as e:
            # Clean up temporary file if it still exists
            if os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except:
                    pass
            raise e
            
    except Exception as e:
        print(f"✗ Error writing topology data: {e}")
        return False


def validate_topology_data(data: Dict[str, Any]) -> bool:
    """
    Validate that the data structure is correct.
    
    Args:
        data: The topology data to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        # Check required top-level fields
        required_fields = ['export_timestamp', 'export_type', 'data']
        for field in required_fields:
            if field not in data:
                print(f"✗ Missing required field: {field}")
                return False
        
        # Check data structure
        data_section = data['data']
        required_data_fields = ['devices', 'connections']
        for field in required_data_fields:
            if field not in data_section:
                print(f"✗ Missing required data field: {field}")
                return False
        
        # Check devices structure
        if 'count' not in data_section['devices'] or 'records' not in data_section['devices']:
            print("✗ Invalid devices structure")
            return False
        
        # Check connections structure
        if 'count' not in data_section['connections'] or 'records' not in data_section['connections']:
            print("✗ Invalid connections structure")
            return False
        
        print("✓ Data structure validation passed")
        return True
        
    except Exception as e:
        print(f"✗ Validation error: {e}")
        return False


def main():
    """
    Main function - demonstrates usage
    """
    print("=" * 60)
    print("Network Topology Data Writer")
    print("=" * 60)
    
    # Generate or load your topology data
    print("\n1. Generating topology data...")
    topology_data = generate_sample_topology_data()
    
    # Validate the data
    print("\n2. Validating data structure...")
    if not validate_topology_data(topology_data):
        print("✗ Data validation failed. Aborting.")
        return 1
    
    # Write to file atomically
    print("\n3. Writing data to file...")
    
    # For testing locally, write to current directory
    # For production, use: /var/www/reactapp/data/raw_data_complete.json
    target_path = "./raw_data_complete.json"
    
    # Uncomment for production:
    # target_path = "/var/www/reactapp/data/raw_data_complete.json"
    
    success = write_topology_data(topology_data, target_path)
    
    if success:
        print("\n" + "=" * 60)
        print("✓ SUCCESS - Topology data written successfully!")
        print("=" * 60)
        print(f"\nFile location: {os.path.abspath(target_path)}")
        print(f"File size: {os.path.getsize(target_path):,} bytes")
        print("\nThe React app will automatically fetch this data within 5 seconds.")
        return 0
    else:
        print("\n" + "=" * 60)
        print("✗ FAILED - Could not write topology data")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    exit(main())
