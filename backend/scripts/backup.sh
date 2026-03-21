#!/bin/bash
# WAL-safe hot backup using sqlite3 .backup command
set -euo pipefail

DB_PATH="${1:-/data/dental_erp.db}"
BACKUP_DIR="${2:-/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/dental_erp_${TIMESTAMP}.db"

mkdir -p "${BACKUP_DIR}"
sqlite3 "${DB_PATH}" ".backup ${BACKUP_FILE}"
echo "Backup complete: ${BACKUP_FILE}"

# Uncomment to push to S3:
# aws s3 cp "${BACKUP_FILE}" s3://YOUR_BUCKET/backups/
