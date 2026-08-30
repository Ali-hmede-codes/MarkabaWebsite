#!/usr/bin/env bash
# =============================================================================
# News Markaba — env + domain setup
#
# Interactive:
#   bash scripts/setup-env.sh
#
# Quick examples:
#   bash scripts/setup-env.sh --domain localhost
#   bash scripts/setup-env.sh --domain markaba.news
#   bash scripts/setup-env.sh --domain markaba.news --api-host api.markaba.news
#   bash scripts/setup-env.sh --domain markaba.news --protocol https --db-password 'your-mysql-pass'
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_ENV="$ROOT_DIR/.env"
CLIENT_ENV="$ROOT_DIR/client/.env.local"

# Firebase (public web config — used by the Next.js client)
FIREBASE_API_KEY="AIzaSyCnHwH9EdWrSPc8NxLmWmLBEXxTNqZ1ewM"
FIREBASE_AUTH_DOMAIN="markaba-storage.firebaseapp.com"
FIREBASE_PROJECT_ID="markaba-storage"
FIREBASE_STORAGE_BUCKET="markaba-storage.firebasestorage.app"
FIREBASE_MESSAGING_SENDER_ID="500256409672"
FIREBASE_APP_ID="1:500256409672:web:cb483c912fa389b6c4307d"
FIREBASE_MEASUREMENT_ID="G-XV0VQHJ2NJ"

# OneSignal (public web app IDs — used by the Next.js client)
ONESIGNAL_APP_ID="02e93d78-0cea-455a-82c1-cfef034fbf18"
ONESIGNAL_SAFARI_WEB_ID="web.onesignal.auto.4b99c5db-a7c9-461a-8333-facb0838095d"
ONESIGNAL_APP_AUTH_KEY="qykry3a52eqbnesssenzlwgwu"
ONESIGNAL_USER_AUTH_KEY="tiy4h44nme3omergrt6xl5lta"

DOMAIN=""
PROTOCOL=""
FRONTEND_PORT=""
BACKEND_PORT=""
API_HOST=""
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD="3Yo6LJ2vmRuFi6NX8IWl"
DB_NAME="markabadatabase"
JWT_SECRET=""
SITE_NAME="نيوز مركبا"
NODE_ENV=""
INTERACTIVE=1

usage() {
  cat <<'EOF'
Usage: bash scripts/setup-env.sh [options]

Writes:
  .env                 (backend + shared)
  client/.env.local    (Next.js)

Options:
  --domain HOST          Site domain (localhost or markaba.news)
  --protocol http|https  Default: http for localhost, https otherwise
  --frontend-port N      Empty = omit port (use 80/443 via nginx)
  --backend-port N       API port if not using a reverse proxy (default 5000 on localhost)
  --api-host HOST        API host if different (e.g. api.markaba.news)
  --db-host HOST         MySQL host (default: localhost)
  --db-port N            MySQL port (default: 3306)
  --db-user NAME         MySQL user (default: root)
  --db-password PASS     MySQL password
  --db-name NAME         MySQL database (default: markabadatabase)
  --jwt-secret SECRET    Leave empty to generate a random secret
  --node-env ENV         development | production
  --yes                  Do not prompt (use flags + defaults)
  -h, --help             Show this help
EOF
}

prompt() {
  local label="$1"
  local current="$2"
  local reply=""
  if [[ -n "$current" ]]; then
    read -r -p "$label [$current]: " reply || true
  else
    read -r -p "$label: " reply || true
  fi
  if [[ -n "$reply" ]]; then
    printf '%s' "$reply"
  else
    printf '%s' "$current"
  fi
}

prompt_secret() {
  local label="$1"
  local current="$2"
  local reply=""
  read -r -s -p "$label: " reply || true
  echo
  if [[ -n "$reply" ]]; then
    printf '%s' "$reply"
  else
    printf '%s' "$current"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --protocol) PROTOCOL="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --frontend-port) FRONTEND_PORT="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --backend-port) BACKEND_PORT="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --api-host) API_HOST="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --db-host) DB_HOST="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --db-port) DB_PORT="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --db-user) DB_USER="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --db-password) DB_PASSWORD="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --db-name) DB_NAME="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --jwt-secret) JWT_SECRET="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --node-env) NODE_ENV="${2:-}"; INTERACTIVE=0; shift 2 ;;
    --yes) INTERACTIVE=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

echo
echo "News Markaba — environment setup"
echo "Project: $ROOT_DIR"
echo

if [[ "$INTERACTIVE" -eq 1 ]]; then
  echo "Press Enter to keep the value in [brackets]."
  echo
  DOMAIN="$(prompt "Domain (localhost or your site, e.g. markaba.news)" "${DOMAIN:-localhost}")"
fi

DOMAIN="${DOMAIN:-localhost}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN%%/*}"
DOMAIN="${DOMAIN%%:*}"

if [[ -z "$PROTOCOL" ]]; then
  if [[ "$DOMAIN" == "localhost" || "$DOMAIN" == "127.0.0.1" ]]; then
    PROTOCOL="http"
  else
    PROTOCOL="https"
  fi
fi

if [[ -z "$NODE_ENV" ]]; then
  if [[ "$DOMAIN" == "localhost" || "$DOMAIN" == "127.0.0.1" ]]; then
    NODE_ENV="development"
  else
    NODE_ENV="production"
  fi
fi

if [[ "$INTERACTIVE" -eq 1 ]]; then
  PROTOCOL="$(prompt "Protocol (http or https)" "$PROTOCOL")"
  NODE_ENV="$(prompt "NODE_ENV (development or production)" "$NODE_ENV")"

  if [[ "$DOMAIN" == "localhost" || "$DOMAIN" == "127.0.0.1" ]]; then
    FRONTEND_PORT="$(prompt "Frontend port" "${FRONTEND_PORT:-3000}")"
    BACKEND_PORT="$(prompt "Backend port" "${BACKEND_PORT:-5000}")"
    API_HOST="$(prompt "API host (empty = same as domain)" "${API_HOST:-}")"
  else
    FRONTEND_PORT="$(prompt "Frontend port (empty if nginx uses 80/443)" "${FRONTEND_PORT:-}")"
    BACKEND_PORT="$(prompt "Backend port (empty if API is on api.DOMAIN or nginx)" "${BACKEND_PORT:-}")"
    API_HOST="$(prompt "API host (empty = same domain, or e.g. api.$DOMAIN)" "${API_HOST:-}")"
  fi

  DB_HOST="$(prompt "MySQL host" "$DB_HOST")"
  DB_PORT="$(prompt "MySQL port" "$DB_PORT")"
  DB_USER="$(prompt "MySQL user" "$DB_USER")"
  echo "MySQL password (leave empty to keep current / no password)"
  DB_PASSWORD="$(prompt_secret "MySQL password" "$DB_PASSWORD")"
  DB_NAME="$(prompt "MySQL database" "$DB_NAME")"
  echo "JWT secret (leave empty to generate a new one)"
  JWT_SECRET="$(prompt_secret "JWT secret" "$JWT_SECRET")"
else
  if [[ "$DOMAIN" == "localhost" || "$DOMAIN" == "127.0.0.1" ]]; then
    FRONTEND_PORT="${FRONTEND_PORT:-3000}"
    BACKEND_PORT="${BACKEND_PORT:-5000}"
  fi
fi

if [[ -z "$JWT_SECRET" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    JWT_SECRET="$(openssl rand -hex 32)"
  else
    JWT_SECRET="markaba-$(date +%s)-$RANDOM-$RANDOM"
  fi
fi

site_url() {
  local host="$1"
  local port="$2"
  if [[ -z "$port" || "$port" == "80" && "$PROTOCOL" == "http" || "$port" == "443" && "$PROTOCOL" == "https" ]]; then
    printf '%s://%s' "$PROTOCOL" "$host"
  else
    printf '%s://%s:%s' "$PROTOCOL" "$host" "$port"
  fi
}

FRONTEND_URL="$(site_url "$DOMAIN" "$FRONTEND_PORT")"
API_HOSTNAME="${API_HOST:-$DOMAIN}"
BACKEND_URL="$(site_url "$API_HOSTNAME" "$BACKEND_PORT")"
API_URL="${BACKEND_URL}/api/v2"
UPLOAD_URL="${BACKEND_URL}/uploads"

ALLOWED_ORIGINS="$FRONTEND_URL"
if [[ "$DOMAIN" != "localhost" && "$DOMAIN" != "127.0.0.1" ]]; then
  WWW_URL="$(site_url "www.$DOMAIN" "$FRONTEND_PORT")"
  if [[ "$ALLOWED_ORIGINS" != *"$WWW_URL"* ]]; then
    ALLOWED_ORIGINS="$ALLOWED_ORIGINS,$WWW_URL"
  fi
fi
if [[ "$FRONTEND_URL" != "$BACKEND_URL" ]]; then
  ALLOWED_ORIGINS="$ALLOWED_ORIGINS,$BACKEND_URL"
fi
if [[ "$DOMAIN" == "localhost" ]]; then
  ALLOWED_ORIGINS="$ALLOWED_ORIGINS,http://127.0.0.1:${FRONTEND_PORT:-3000}"
fi

echo
echo "Will write:"
echo "  Site:    $FRONTEND_URL"
echo "  API:     $API_URL"
echo "  Uploads: $UPLOAD_URL"
echo "  DB:      $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo "  Env:     $NODE_ENV"
echo "  Files:   $ROOT_ENV"
echo "           $CLIENT_ENV"
echo

if [[ "$INTERACTIVE" -eq 1 ]]; then
  read -r -p "Write these files? [Y/n]: " confirm || true
  if [[ "${confirm,,}" == "n" || "${confirm,,}" == "no" ]]; then
    echo "Cancelled."
    exit 0
  fi
fi

write_root_env() {
  cat > "$ROOT_ENV" <<EOF
# =============================================================================
# News Markaba — generated by scripts/setup-env.sh
# Domain: $DOMAIN
# =============================================================================

NODE_ENV=$NODE_ENV
PORT=${BACKEND_PORT:-5000}
TZ=Asia/Beirut
TIMEZONE=Asia/Beirut

DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_SSL=false

FRONTEND_URL=$FRONTEND_URL
BACKEND_URL=$BACKEND_URL
CLIENT_URL=$FRONTEND_URL
ALLOWED_ORIGINS=$ALLOWED_ORIGINS

JWT_SECRET=$JWT_SECRET

NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL
NEXT_PUBLIC_SERVER_URL=$BACKEND_URL
NEXT_PUBLIC_CLIENT_URL=$FRONTEND_URL
NEXT_PUBLIC_SITE_URL=$FRONTEND_URL
NEXT_PUBLIC_SITE_NAME=$SITE_NAME
NEXT_PUBLIC_UPLOAD_URL=$UPLOAD_URL

ONESIGNAL_APP_ID=$ONESIGNAL_APP_ID
ONESIGNAL_APP_AUTH_KEY=$ONESIGNAL_APP_AUTH_KEY
ONESIGNAL_USER_AUTH_KEY=$ONESIGNAL_USER_AUTH_KEY
NEXT_PUBLIC_ONESIGNAL_APP_ID=$ONESIGNAL_APP_ID
NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID=$ONESIGNAL_SAFARI_WEB_ID
NEXT_PUBLIC_ONESIGNAL_NOTIFY_BUTTON=true

PRAYER_LATITUDE=33.8547
PRAYER_LONGITUDE=35.8623
PRAYER_TIMEZONE=Asia/Beirut
PRAYER_METHOD=2
PRAYER_JURISTIC=0
PRAYER_DATA_FILE=../data/prayer.json
WEATHER_DATA_FILE=../data/weather.json
WEATHER_UPDATE_SCHEDULE=0 6 * * *
PRAYER_UPDATE_SCHEDULE=0 5 * * *
NEWS_CLEANUP_SCHEDULE=0 2 * * *
FOOTBALL_BACKUP_SCHEDULE=0 6 * * *
FOOTBALL_UPDATE_SCHEDULE=0 7 * * *

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

REDIS_URL=redis://localhost:6379

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$FIREBASE_MEASUREMENT_ID
GOOGLE_ANALYTICS_CLIENT_EMAIL=
GOOGLE_ANALYTICS_PRIVATE_KEY=
GOOGLE_ANALYTICS_PROJECT_ID=$FIREBASE_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=
NEXT_PUBLIC_GA_ID=$FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_FB_PIXEL_ID=
EOF
}

write_client_env() {
  cat > "$CLIENT_ENV" <<EOF
# News Markaba — generated by scripts/setup-env.sh
# Domain: $DOMAIN

NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL
NEXT_PUBLIC_SERVER_URL=$BACKEND_URL
NEXT_PUBLIC_CLIENT_URL=$FRONTEND_URL
NEXT_PUBLIC_SITE_URL=$FRONTEND_URL
NEXT_PUBLIC_SITE_NAME=$SITE_NAME
NEXT_PUBLIC_UPLOAD_URL=$UPLOAD_URL

JWT_SECRET=$JWT_SECRET
BACKEND_URL=$BACKEND_URL

NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$FIREBASE_MEASUREMENT_ID
GOOGLE_ANALYTICS_PROJECT_ID=$FIREBASE_PROJECT_ID
NEXT_PUBLIC_GA_ID=$FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_FB_PIXEL_ID=

NEXT_PUBLIC_ONESIGNAL_APP_ID=$ONESIGNAL_APP_ID
NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID=$ONESIGNAL_SAFARI_WEB_ID
NEXT_PUBLIC_ONESIGNAL_NOTIFY_BUTTON=true
EOF
}

write_root_env
write_client_env

echo
echo "Done."
echo "  $ROOT_ENV"
echo "  $CLIENT_ENV"
echo
echo "Next:"
if [[ "$NODE_ENV" == "development" ]]; then
  echo "  1. Set DB_PASSWORD in .env if MySQL needs one"
  echo "  2. mysql -u $DB_USER -p < sql/schema.sql"
  echo "  3. npm run start-dev"
  echo "  4. Open $FRONTEND_URL"
else
  echo "  1. Point DNS for $DOMAIN (and $API_HOSTNAME if different) to this server"
  echo "  2. Put the same values in your nginx / PM2 config"
  echo "  3. Restart: pm2 restart all   (or npm run start-vps)"
  echo "  4. Open $FRONTEND_URL"
fi
echo
