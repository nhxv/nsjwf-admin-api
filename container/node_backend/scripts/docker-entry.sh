#!/bin/bash
# This is run via Dockerfile. Don't run directly.

PG_CONTAINER_HOSTNAME="pg16"

chmod +x scripts/wait-for-it.sh
./scripts/wait-for-it.sh --timeout=5 --strict "$PG_CONTAINER_HOSTNAME:5432" -- "$@"
