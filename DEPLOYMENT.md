# Despliegue de NovaConnect (Web / PWA)

NovaConnect es la aplicación para colaboradores que consume el backend central de Nova (`https://api.novateam.tech`).

## Entorno de Producción
- **URL pública:** `https://novaconnect.novateam.tech`
- **Contenedor Podman en VPS:** `novaconnect-web`
- **Puerto interno VPS:** `127.0.0.1:3004 -> 80`
- **Proxy Inverso:** Nginx con certificado SSL Let's Encrypt (Certbot).

## Variables de Entorno de Compilación
Inyectadas en tiempo de build (`Dockerfile`):
- `EXPO_PUBLIC_API_URL=https://api.novateam.tech`
- `EXPO_PUBLIC_PASSWORD_SECRET=nova_premium_pepper_2026_x77`
- `EXPO_PUBLIC_MOBILE_API_KEY=NC-1415969ce95efbe2eb99ee6356369431ee7ada0a8c501389`

## Procedimiento de Despliegue
Desde la máquina de desarrollo:
```bash
bash scripts/deploy-prod.sh
```

El script realiza:
1. Sincronización incremental vía `rsync` hacia `/opt/nova/novaconnect-src` en el VPS (excluyendo `.git`, `node_modules`, `android`, `ios`).
2. Resguardo de la imagen previa como `localhost/novaconnect-web:previous` para permitir rollback inmediato.
3. Compilación con Podman multi-stage (`node:22-alpine` para `npx expo export -p web` y `nginx:1.27-alpine` para servir los estáticos).
4. Reemplazo del contenedor `novaconnect-web` en el puerto `3004`.
5. Purgado de imágenes intermedias huérfanas (`podman image prune -f`).
6. Verificación de salud HTTP y HTTPS.

## Rollback
En caso de requerir volver a la versión anterior de inmediato en el VPS:
```bash
ssh root@5.183.8.172 "podman rm -f novaconnect-web && podman run -d --name novaconnect-web --network nova-internal --restart always -p 127.0.0.1:3004:80 localhost/novaconnect-web:previous"
```

