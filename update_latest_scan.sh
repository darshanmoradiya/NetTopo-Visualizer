#!/bin/bash
# Update symlink to second-last scan folder for NetTopo Visualizer
# Run this script via cron or systemd timer

SCANS_DIR="/opt/eagleyesocradar/scans"
LINK_TARGET="/var/www/reactapp/data/raw_data_complete.json"
BACKUP_LINK="/var/www/reactapp/data/raw_data_complete.json.bak"

# Get second-to-last scan folder (sorted by name, which is timestamp-based)
SECOND_LAST_SCAN=$(ls -1 "$SCANS_DIR" | grep "^scan_" | sort -r | sed -n '2p')

if [ -z "$SECOND_LAST_SCAN" ]; then
    echo "[$(date)] ERROR: Could not find second-last scan folder" >&2
    exit 1
fi

SOURCE_JSON="$SCANS_DIR/$SECOND_LAST_SCAN/raw_data_complete.json"

# Verify source file exists
if [ ! -f "$SOURCE_JSON" ]; then
    echo "[$(date)] ERROR: Source file not found: $SOURCE_JSON" >&2
    exit 1
fi

# Create backup of current file
if [ -f "$LINK_TARGET" ]; then
    cp "$LINK_TARGET" "$BACKUP_LINK" 2>/dev/null || true
fi

# Atomic copy (safer than symlink for web serving)
cp "$SOURCE_JSON" "${LINK_TARGET}.tmp"
mv "${LINK_TARGET}.tmp" "$LINK_TARGET"

# Set permissions
chown www-data:www-data "$LINK_TARGET"
chmod 644 "$LINK_TARGET"

echo "[$(date)] Successfully updated to scan: $SECOND_LAST_SCAN"
