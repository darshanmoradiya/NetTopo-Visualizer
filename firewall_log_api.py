#!/usr/bin/env python3
"""
Firewall Log API Server
Serves filtered firewall logs for NetTopo Visualizer
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import re
from datetime import datetime
from collections import deque
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React app

LOG_FILE = "/home/ubuntu/firewall_sim/firewall.log"
MAX_LOGS_PER_DEVICE = 100  # Return max 100 logs per device

def parse_log_line(line):
    """Parse a single firewall log line into structured data"""
    try:
        # Extract timestamp (first part before _gateway)
        timestamp_match = re.match(r'^(\S+)', line)
        timestamp = timestamp_match.group(1) if timestamp_match else None
        
        # Extract key-value pairs
        data = {}
        for match in re.finditer(r'(\w+)="([^"]*)"', line):
            key, value = match.groups()
            data[key] = value
        
        # Extract numeric values without quotes
        for match in re.finditer(r'(\w+)=(\d+)', line):
            key, value = match.groups()
            if key not in data:  # Don't override quoted values
                data[key] = value
        
        return {
            'timestamp': timestamp or data.get('timestamp', ''),
            'severity': data.get('severity', 'Information'),
            'src_ip': data.get('src_ip', ''),
            'dst_ip': data.get('dst_ip', ''),
            'src_mac': data.get('src_mac', ''),
            'dst_mac': data.get('dst_mac', ''),
            'protocol': data.get('protocol', ''),
            'src_port': data.get('src_port', ''),
            'dst_port': data.get('dst_port', ''),
            'fw_rule_name': data.get('fw_rule_name', ''),
            'log_subtype': data.get('log_subtype', ''),
            'src_country': data.get('src_country', ''),
            'dst_country': data.get('dst_country', ''),
            'in_interface': data.get('in_interface', ''),
            'out_interface': data.get('out_interface', ''),
            'raw': line.strip()  # Keep raw line for debugging
        }
    except Exception as e:
        print(f"Error parsing line: {e}")
        return None

def normalize_mac(mac):
    """Normalize MAC address to consistent format (remove colons/dashes, uppercase)"""
    if not mac:
        return ""
    return mac.replace(':', '').replace('-', '').upper()

@app.route('/api/logs/<mac_address>', methods=['GET'])
def get_device_logs(mac_address):
    """Get logs for a specific MAC address"""
    try:
        if not os.path.exists(LOG_FILE):
            return jsonify({
                'error': f'Log file not found: {LOG_FILE}',
                'logs': []
            }), 404
        
        normalized_search_mac = normalize_mac(mac_address)
        matching_logs = deque(maxlen=MAX_LOGS_PER_DEVICE)  # Keep only last N logs
        
        # Read log file (could optimize with tail for large files)
        with open(LOG_FILE, 'r') as f:
            for line in f:
                parsed = parse_log_line(line)
                if not parsed:
                    continue
                
                # Check if this log involves the requested MAC
                src_mac_normalized = normalize_mac(parsed['src_mac'])
                dst_mac_normalized = normalize_mac(parsed['dst_mac'])
                
                if normalized_search_mac in [src_mac_normalized, dst_mac_normalized]:
                    matching_logs.append(parsed)
        
        # Return newest first
        logs = list(reversed(matching_logs))
        
        return jsonify({
            'mac_address': mac_address,
            'count': len(logs),
            'logs': logs
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'logs': []
        }), 500

@app.route('/api/logs/tail/<mac_address>', methods=['GET'])
def get_device_logs_tail(mac_address):
    """Get recent logs for a device (last 50 lines approach for performance)"""
    try:
        if not os.path.exists(LOG_FILE):
            return jsonify({'error': 'Log file not found', 'logs': []}), 404
        
        # Use tail command for better performance on large files
        import subprocess
        result = subprocess.run(
            ['tail', '-n', '500', LOG_FILE],
            capture_output=True,
            text=True
        )
        
        normalized_search_mac = normalize_mac(mac_address)
        matching_logs = []
        
        for line in result.stdout.split('\n'):
            if not line.strip():
                continue
            
            parsed = parse_log_line(line)
            if not parsed:
                continue
            
            src_mac_normalized = normalize_mac(parsed['src_mac'])
            dst_mac_normalized = normalize_mac(parsed['dst_mac'])
            
            if normalized_search_mac in [src_mac_normalized, dst_mac_normalized]:
                matching_logs.append(parsed)
        
        # Return newest first, limit to MAX_LOGS_PER_DEVICE
        logs = list(reversed(matching_logs[-MAX_LOGS_PER_DEVICE:]))
        
        return jsonify({
            'mac_address': mac_address,
            'count': len(logs),
            'logs': logs
        })
    
    except Exception as e:
        return jsonify({'error': str(e), 'logs': []}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'log_file': LOG_FILE,
        'log_file_exists': os.path.exists(LOG_FILE)
    })

@app.route('/api/ping/<ip_address>', methods=['GET'])
def ping_device(ip_address):
    """Ping a device and return results"""
    try:
        import subprocess
        import re
        
        # Run ping command (send 4 packets, timeout 2 seconds)
        result = subprocess.run(
            ['ping', '-c', '4', '-W', '2', ip_address],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        success = result.returncode == 0
        output = result.stdout
        
        # Parse ping statistics
        stats = {
            'success': success,
            'ip': ip_address,
            'packets_sent': 4,
            'packets_received': 0,
            'packet_loss': 100,
            'min_ms': None,
            'avg_ms': None,
            'max_ms': None,
            'output': output
        }
        
        if success:
            # Parse packets received: "4 packets transmitted, 4 received, 0% packet loss"
            packets_match = re.search(r'(\d+) packets transmitted, (\d+) received, (\d+)% packet loss', output)
            if packets_match:
                stats['packets_sent'] = int(packets_match.group(1))
                stats['packets_received'] = int(packets_match.group(2))
                stats['packet_loss'] = int(packets_match.group(3))
            
            # Parse round-trip times: "rtt min/avg/max/mdev = 0.123/0.456/0.789/0.012 ms"
            rtt_match = re.search(r'rtt min/avg/max/mdev = ([\d.]+)/([\d.]+)/([\d.]+)/([\d.]+) ms', output)
            if rtt_match:
                stats['min_ms'] = float(rtt_match.group(1))
                stats['avg_ms'] = float(rtt_match.group(2))
                stats['max_ms'] = float(rtt_match.group(3))
        
        return jsonify(stats)
    
    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'ip': ip_address,
            'error': 'Ping timeout',
            'packets_sent': 4,
            'packets_received': 0,
            'packet_loss': 100
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'ip': ip_address,
            'error': str(e),
            'packets_sent': 0,
            'packets_received': 0,
            'packet_loss': 100
        }), 500

if __name__ == '__main__':
    # Run on port 5000
    app.run(host='0.0.0.0', port=5000, debug=False)
