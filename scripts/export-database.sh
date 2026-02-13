#!/bin/bash
# Database Export Script for Railway Migration
# Run this script to export all data from your Replit PostgreSQL database
# Usage: bash scripts/export-database.sh

echo "=== Somken Jobs Database Export ==="
echo ""

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  exit 1
fi

EXPORT_DIR="database-export"
mkdir -p "$EXPORT_DIR"

echo "Exporting database schema and data..."

# Export full database (schema + data) using pg_dump
pg_dump "$DATABASE_URL" --no-owner --no-privileges --clean --if-exists > "$EXPORT_DIR/full-backup.sql" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Full backup exported to $EXPORT_DIR/full-backup.sql"
else
  echo "⚠️  pg_dump not available, using alternative export method..."
  
  # Alternative: Export data as SQL INSERT statements using psql
  for table in users jobs countries invoices cities sectors; do
    echo "Exporting table: $table..."
    psql "$DATABASE_URL" -c "COPY $table TO STDOUT WITH (FORMAT csv, HEADER true);" > "$EXPORT_DIR/${table}.csv" 2>/dev/null
    if [ $? -eq 0 ]; then
      ROWS=$(wc -l < "$EXPORT_DIR/${table}.csv")
      echo "  ✅ $table: $((ROWS - 1)) rows exported"
    else
      echo "  ⚠️  Could not export $table"
    fi
  done
fi

echo ""
echo "=== Export Complete ==="
echo ""
echo "Files saved to: $EXPORT_DIR/"
echo ""
echo "=== How to import into Railway ==="
echo ""
echo "1. Get your Railway DATABASE_URL from the Railway dashboard"
echo "2. Run: psql YOUR_RAILWAY_DATABASE_URL < $EXPORT_DIR/full-backup.sql"
echo "   OR use the CSV files to import table by table"
echo ""
echo "Alternative: Since most jobs are auto-fetched from ReliefWeb,"
echo "you can also just run 'npm run db:push' on Railway and let"
echo "the job fetcher repopulate the database automatically."
echo "You'd only need to manually import users and manually-posted jobs."
