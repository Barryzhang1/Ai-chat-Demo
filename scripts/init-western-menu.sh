#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="${DB_NAME:-restaurant}"
MONGO_URI="${MONGO_URI:-}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_USER:-root}"
MONGO_PASS="${MONGO_PASS:-password}"
MONGO_AUTH_DB="${MONGO_AUTH_DB:-admin}"

MONGO_ARGS=()
if [[ -n "${MONGO_URI}" ]]; then
	MONGO_ARGS+=("${MONGO_URI}/${DB_NAME}")
else
	MONGO_ARGS+=("${MONGO_HOST}:${MONGO_PORT}/${DB_NAME}")
fi

if [[ -n "${MONGO_USER}" ]]; then
	MONGO_ARGS+=("--username" "${MONGO_USER}")
	MONGO_ARGS+=("--password" "${MONGO_PASS}")
	MONGO_ARGS+=("--authenticationDatabase" "${MONGO_AUTH_DB}")
fi

mongosh "${MONGO_ARGS[@]}" --eval "db.dishes.deleteMany({}); db.categories.deleteMany({});"

mongosh "${MONGO_ARGS[@]}" < "${ROOT_DIR}/init-western-categories.js"
mongosh "${MONGO_ARGS[@]}" < "${ROOT_DIR}/init-western-dishes.js"

echo "Done: western categories and dishes seeded in ${DB_NAME}."
