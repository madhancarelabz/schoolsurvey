#!/bin/bash
# ============================================================
# AI Voice Survey System — Postgres Init
# This script runs ONCE on first container startup.
# Creates the school_survey database (via POSTGRES_DB env var).
# No additional databases needed:
#   - n8n is cloud-hosted (no local DB)
#   - Chatwoot is cloud-hosted at app.chatwoot.com (no local DB)
# ============================================================

set -e

echo "=== Database initialization complete ==="
echo "  - school_survey (created by POSTGRES_DB env var)"
echo "  - SQL scripts mounted in /docker-entrypoint-initdb.d/"
