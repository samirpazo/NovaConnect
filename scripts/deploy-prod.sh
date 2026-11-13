#!/usr/bin/env bash
# ==============================================================================
# deploy-prod.sh — Despliegue de NovaConnect a Producción (VPS)
# Dominio: novaconnect.novateam.tech
# Puerto interno: 127.0.0.1:3004 -> contenedor 80
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

VPS_IP="${VPS_IP:-5.183.8.172}"
REMOTE_SRC="/opt/nova/novaconnect-src"

echo "==> 1. Sincronizando código fuente a VPS ($VPS_IP:$REMOTE_SRC)..."
ssh root@"$VPS_IP" "mkdir -p $REMOTE_SRC"
rsync -az --delete \
  --exclude '.git' \
  --exclude '.expo' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.env*' \
  --exclude 'android' \
  --exclude 'ios' \
  --exclude '.DS_Store' \
  "$REPO_ROOT/" "root@$VPS_IP:$REMOTE_SRC/"

echo "==> 2. Compilando y desplegando contenedor novaconnect-web en VPS..."
ssh root@"$VPS_IP" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/nova/novaconnect-src

# Resguardar imagen previa para rollback
podman tag localhost/novaconnect-web:latest localhost/novaconnect-web:previous 2>/dev/null || true

# Compilar imagen podman con ulimit adecuado para empaquetado de Metro
podman build --ulimit nofile=65536:65536 -t localhost/novaconnect-web:latest -f Dockerfile .

# Reemplazar contenedor
podman rm -f novaconnect-web 2>/dev/null || true
podman run -d \
  --name novaconnect-web \
  --network nova-internal \
  --restart always \
  -p 127.0.0.1:3004:80 \
  localhost/novaconnect-web:latest

# Limpiar capas intermedias
podman image prune -f

# Verificar health check local
sleep 2
curl -fsSI http://127.0.0.1:3004/ | head -n 1
echo "==> Contenedor novaconnect-web activo en 127.0.0.1:3004:80."
REMOTE

echo "==> 3. Verificando endpoint HTTPS público..."
curl -fsSI https://novaconnect.novateam.tech/ | head -n 1 || echo "Nota: Si el DNS o SSL aún no están configurados, valida primero Nginx y Certbot."
echo "==> Despliegue de NovaConnect finalizado con éxito."

