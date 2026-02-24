#!/usr/bin/env bash
set -e

APP_PASSWORD="$(tr -d '\r\n' < /run/secrets/db-app-password)"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER nsjwfbackend WITH CREATEDB PASSWORD '$(APP_PASSWORD)';
    CREATE DATABASE defaultdb WITH OWNER nsjwfbackend;
EOSQL