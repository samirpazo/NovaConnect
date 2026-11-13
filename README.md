# Nova Connect

App móvil del colaborador. Permite autenticarse con documento y PIN (con acceso biométrico
opcional), recibir documentos, consultar el historial y gestionar capacitaciones.

- **Expo SDK 56** · React Native 0.85 · expo-router · NativeWind · Zustand
- **Backend**: NovaApi (`/Users/edinson/Documents/Desarrollo/Nova`), endpoints bajo `/Token/*`,
  `/SecCollaborator/*`, `/MpwProcessedDocument/*` y `/MpwTraining*`.

## Configuración

El archivo `.env` **no se versiona**. Copiar `.env.example` y completar:

```bash
cp .env.example .env
```

| Variable | Para qué sirve |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL del backend. En el emulador de Android usar `http://10.0.2.2:8080`. |
| `EXPO_PUBLIC_PASSWORD_SECRET` | Pepper con el que se hashea el PIN antes de enviarlo. Debe coincidir con `SecuritySettings:PasswordSecret` del backend. |
| `EXPO_PUBLIC_MOBILE_API_KEY` | Clave para los endpoints previos al login. Debe coincidir con `MobileApi:ApiKey` del backend. |

> `EXPO_PUBLIC_*` viaja **dentro del bundle**: son públicos para quien tenga el APK o el IPA.
> No son un secreto, solo una primera barrera contra la fuerza bruta del PIN.

## Verificación

```bash
npm run typecheck   # TypeScript estricto
npm test            # transporte de cookies/CSRF y ciclo de vida de la sesión
npx expo-doctor     # compatibilidad con el SDK
```

`npm test` no necesita framework externo: los scripts de `scripts/` cargan los módulos con
`vm.runInNewContext` y verifican el comportamiento con dobles de prueba.

## Proyectos nativos

`ios/` y `android/` se generan con `npx expo prebuild` y **no se versionan**.

```bash
npx expo prebuild          # regenera ios/ y android/
cd ios && pod install      # dependencias iOS
npm run ios                # compila y levanta en el simulador
npm run android            # compila y levanta en el emulador
```

### Requisito de JDK 17 en Android

React Native 0.85 pide `jvmToolchain(17)`. Si Gradle no encuentra un JDK 17 local intenta
descargarlo con el resolver de Foojay, incompatible con Gradle 9, y la compilación aborta con
`JvmVendorSpec does not have member field IBM_SEMERU`. Se resuelve declarando la ruta del JDK 17
en `android/gradle.properties` y en `~/.gradle/gradle.properties`:

```properties
org.gradle.java.installations.paths=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
org.gradle.java.installations.auto-download=false
```

El SDK location de Android va en `android/local.properties`:

```properties
sdk.dir=/Users/<usuario>/Library/Android/sdk
```

### Plugins propios

`plugins/withPodDeploymentTarget.js` eleva el deployment target de los pods de terceros a 16.4.
Xcode 26+ rechaza los targets antiguos que traen algunos pods (12.4, 13.4) y la compilación
falla antes de empezar.

## Sesión

La renovación vive en `src/lib/axios.ts`:

1. Un `401` renueva contra `POST /Token/Refresh` y **reintenta** la petición original.
2. Las renovaciones simultáneas comparten un único vuelo: el backend rota el refresh token, así que
   dos a la vez harían que la segunda usara un token ya invalidado.
3. Solo se cierra la sesión si la renovación falla de verdad. Los endpoints `/Token*` quedan fuera
   del interceptor para que el propio `POST /Token/Logout` (que responde `401` con el token
   vencido) no dispare una cascada de cierres.
4. En nativo el access y el refresh token se guardan en SecureStore; en web viajan en cookies
   HttpOnly y el cliente no los toca.

Las ventanas de sesión las define el backend (`Authentication:Mobile*`): access token de 60
minutos, refresh token y ventana de inactividad de 30 días.

## Estructura

```text
src/
  app/                 Rutas de expo-router (el router usa src/app, no app/)
  components/          Componentes de interfaz
  lib/                 Cliente HTTP, almacenamiento seguro, tema, formato
  services/            Clientes de los endpoints del backend
  stores/              Estado de sesión y de preferencias
  types/               Contratos
scripts/               Pruebas ejecutables con node
plugins/               Plugins de prebuild
```

## Despliegue a Producción (Web / PWA)

La versión web está desplegada en `https://novaconnect.novateam.tech` mediante un contenedor Podman servido por Nginx.

Para volver a desplegar tras realizar cambios:
```bash
bash scripts/deploy-prod.sh
```

Consulta [DEPLOYMENT.md](DEPLOYMENT.md) para detalles de arquitectura, puertos, variables de entorno y rollback.

## Pendiente conocido

- **Sin soporte offline.** No hay base de datos local, caché ni cola de operaciones pendientes: la
  app necesita red para funcionar, incluido el login. Además, si la carga de documentos falla por
  red la pantalla muestra "Todo al día" en lugar del error.
- El hash del PIN se guarda en SecureStore sin `requireAuthentication`, y el pepper viaja en el
  bundle: quien tenga acceso al keychain puede forzar el PIN en bruto.

## Documentos y archivos

NovaApi guarda los documentos en el servicio unificado de archivos (`GenFiles`). La relación con la
persona la mantiene `MpwProcessedDocument.PdcFilID`:

- `GET /MpwProcessedDocument/GetByPrsID?PdcIsReceived={bool}` devuelve los documentos del
  colaborador con su `PdcFilID`. Los campos `PdcFileName` y `PdcFilePath` ya no existen.
- `GET /GenFiles/{PdcFilID}/preview` devuelve el contenido. Para PDF devuelve el archivo crudo.

La URL de `GenFiles` exige `Authorization`, así que **no se puede abrir directamente en el navegador
del sistema**: la app lo descarga con la sesión (`src/services/documentDownload.native.ts`) y lo
entrega al visor de PDF que elija el usuario (`expo-sharing`). No se usa visor PDF nativo.

El botón "Guardar para ver sin conexion" deja el documento en la cache del dispositivo y la lista
muestra la insignia "Listo offline".
