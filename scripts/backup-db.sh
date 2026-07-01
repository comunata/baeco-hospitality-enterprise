#!/usr/bin/env bash
# Simple logical backup for the Supabase Postgres database.
#
# Supabase's paid plans (Pro and above) already run automatic daily backups
# (with point-in-time recovery on higher tiers) — see Project Settings →
# Database → Backups in the Supabase dashboard. This script is a
# *supplementary* on-demand/scheduled backup you control yourself (useful on
# the Free plan, which has no automatic backups, or as an extra off-site copy).
#
# Requirements: the Postgres client tools (`pg_dump`), available via:
#   - `brew install libpq` (macOS) then add it to PATH, or
#   - the Supabase CLI's bundled tools, or
#   - any Postgres 15+ client install.
#
# Usage:
#   SUPABASE_DB_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
#     ./scripts/backup-db.sh
#
# Find the connection string in Supabase Dashboard → Project Settings →
# Database → Connection string (URI). Use the "Session" pooler or direct
# connection; avoid the "Transaction" pooler for pg_dump.
#
# Schedule it (example, daily at 03:00, cron):
#   0 3 * * * SUPABASE_DB_URL="..." /path/to/scripts/backup-db.sh >> /var/log/baeco-backup.log 2>&1

set -euo pipefail

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "Error: set SUPABASE_DB_URL to your Supabase Postgres connection string." >&2
  echo "See the comments at the top of this script for where to find it." >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="${BACKUP_DIR}/baeco-db-${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "Dumping database to ${OUT_FILE}..."
pg_dump "${SUPABASE_DB_URL}" \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip -9 > "${OUT_FILE}"

echo "Backup written: ${OUT_FILE} ($(du -h "${OUT_FILE}" | cut -f1))"

# Optional retention: keep only the last N backups (default 14) in this dir.
KEEP="${BACKUP_RETENTION:-14}"
ls -1t "${BACKUP_DIR}"/baeco-db-*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
echo "Retention: keeping the latest ${KEEP} backups in ${BACKUP_DIR}."

# Restore with:
#   gunzip -c backups/baeco-db-<timestamp>.sql.gz | psql "$SUPABASE_DB_URL"
