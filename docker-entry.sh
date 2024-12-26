#!/bin/bash

PG_CONTAINER_HOSTNAME="pg16"

chmod +x wait-for-it.sh
./wait-for-it.sh --timeout=5 --strict "$PG_CONTAINER_HOSTNAME:5432" -- "$@"
