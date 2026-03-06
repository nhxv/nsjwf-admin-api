#!/usr/bin/env bash
set -e

APP_PASSWORD="$(tr -d '\r\n' < /run/secrets/db-app-password)"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER "$PG_USER" WITH CREATEDB PASSWORD '$APP_PASSWORD';
    CREATE DATABASE "$PG_DATABASE" WITH OWNER "$PG_USER";
EOSQL