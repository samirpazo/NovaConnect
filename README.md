# Nova Connect

App móvil del ecosistema **Nova Core Platform** — construida con [Expo](https://expo.dev/) + [React Native](https://reactnative.dev/) + [Nativewind](https://www.nativewind.dev/). Es el canal digital para que colaboradores accedan a sus documentos, recibos, historial y herramientas de identidad desde cualquier dispositivo (iOS, Android, Web).

- **Bundle ID iOS**: `com.novateam.novaconnect`
- **Package Android**: `com.novateam.novaconnect`
- **EAS Project ID**: `8da81d81-4793-4bcd-b2c2-bf4771f0c1a7`

## 🚀 Stack Técnico

| Capa | Tecnología |
|---|---|
| Framework | Expo SDK 55 + React Native 0.83 + React 19 |
| Navegación | Expo Router (file-based) |
| Estilos | NativeWind 4 (Tailwind CSS v3) + CSS variables HSL |
| Estado global | Zustand 5 + TanStack React Query 5 |
| HTTP | Axios 1.17 con interceptors JWT + API Key |
| UI | shadcn/ui (reactnativereusables.com) + lucide-react-native + sonner-native |
| Seguridad | expo-secure-store, expo-local-authentication, crypto-js (SHA512 + pepper) |
| Fuente | Poppins (4 pesos vía Google Fonts) |
| Animaciones | react-native-reanimated 4 |

## 📁 Estructura del Proyecto

```
nova-connect/
├── src/
│   ├── app/              → Rutas (Expo Router): login, register, recover + tabs protegidas
│   ├── components/       → ui/ (button, text, input, card, pin-keypad, otp-input)
│   │                       custom/ (NImage, PDFViewer, SessionWrapper)
│   ├── hooks/            → useAppTheme, useProcessedDocuments, usePushNotifications, useVault
│   ├── lib/              → axios, security, storage, toast, alert, theme, colorUtils, utils
│   ├── services/         → authService, processedDocumentService, fileService, healthService
│   ├── stores/           → useAuthStore, usePreferenceStore
│   ├── types/            → auth.ts, document.ts
│   └── global.css        → Tailwind base + variables CSS
├── app/                  → Legado (placeholder, no usado en producción)
├── assets/               → Imágenes, iconos, splash screens
├── android/              → Proyecto nativo Android (gradle)
├── ios/                  → Proyecto nativo iOS (Xcode)
├── dist/                 → Build web estático (generado por `npx expo export`)
├── public/               → Archivos estáticos web (opengraph, web.config)
└── scripts/              → Utilidades (reset-project.js)
```

## 🔧 Requisitos Previos

- Node.js >= 18
- npm >= 9
- Expo CLI (`npx expo`)
- _(Opcional)_ EAS CLI para builds en la nube: `npm install -g eas-cli`

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Limpiar caché e iniciar servidor de desarrollo
npm run dev

# O en plataforma específica
npm run android
npm run ios
npm run web
```

## 📦 Compilar para Producción

Los ZIPs generados se guardan en la raíz del proyecto (`/nova-connect/`). Al descomprimirlos en el servidor, los archivos quedan directamente en la carpeta destino, **sin subcarpetas envolventes**.

### 🌐 Web — Exportar Estático y Comprimir (SmarterASP)

> **Antes de compilar**: verifica que `.env` tenga la URL del backend correcta:
> ```env
> EXPO_PUBLIC_API_URL=https://novateam-001-site2.itempurl.com
> EXPO_PUBLIC_PASSWORD_SECRET=nova_premium_pepper_2026_x77
> EXPO_PUBLIC_MOBILE_API_KEY=NC-2026-a8f3d1e7b2c94f05ad6e82b7f31c9d4a
> EXPO_PUBLIC_INACTIVITY_TIMEOUT_MINUTES=2
> ```

```bash
# 1. Exportar la versión web estática (genera la carpeta dist/)
npx expo export --platform web

# 2. Comprimir el contenido de dist/ directamente (sin carpeta dist/ envolvente)
cd dist && zip -r ../nova-connect-web.zip . && cd ..
```

> El archivo `nova-connect-web.zip` se guarda en la raíz del proyecto.  
> Descomprimir en la **raíz del sitio web** en SmarterASP (donde va el `index.html`).

#### Verificar localmente antes de subir

```bash
npx serve dist
# o
npx http-server dist -p 8080
```

---

### 🤖 Android — APK (instalación directa)

```bash
# 1. Pre-build nativo (genera la carpeta android/)
npx expo prebuild --platform android --clean

# 2. Compilar APK en modo Release
cd android && ./gradlew assembleRelease && cd ..

# El APK queda en:
# android/app/build/outputs/apk/release/app-release.apk
```

Para empaquetar el APK:

```bash
cp android/app/build/outputs/apk/release/app-release.apk nova-connect-android.apk
# o comprimir directo
cd android/app/build/outputs/apk/release && zip -r ../../../../../../nova-connect-android.zip app-release.apk && cd ../../../../../..
```

### 🤖 Android — AAB (Google Play Store)

```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew bundleRelease && cd ..

# El AAB queda en:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

### 🍎 iOS — Build local (requiere Mac + Xcode)

```bash
npx expo prebuild --platform ios --clean
cd ios && xcodebuild -workspace NovaConnect.xcworkspace -scheme NovaConnect -configuration Release -archivePath build/NovaConnect.xcarchive archive && cd ..
```

---

### ☁️ EAS Build (Nube — Recomendado)

Compila en la nube sin necesidad de Android Studio ni Xcode:

```bash
# Login en Expo (solo la primera vez)
npx eas login

# APK para pruebas
npx eas build --platform android --profile preview

# AAB firmado para Play Store
npx eas build --platform android --profile production

# IPA para App Store
npx eas build --platform ios --profile production

# Ambas plataformas a la vez
npx eas build --platform all --profile production
```

> Los perfiles (`preview`, `production`) se configuran en `eas.json`.

---

### 🔄 Actualización OTA con EAS Update

Actualiza el código JS sin necesidad de publicar nueva versión en las tiendas:

```bash
npx eas update --branch production --message "Fix: descripción del cambio"
```

---

### ⚡ Compilar Web de Una Sola Vez

```bash
npx expo export --platform web && cd dist && zip -r ../nova-connect-web.zip . && cd .. && echo "✅ Listo: nova-connect-web.zip en /nova-connect/"
```

## 🌐 Navegación (Rutas)

| Ruta | Pantalla |
|---|---|
| `/` | Login (PIN + biometría) |
| `/register` | Registro de nuevo colaborador |
| `/recover` | Recuperación de PIN vía OTP |
| `/(protected)/home` | Perfil y dashboard |
| `/(protected)/home/settings` | Configuración (tema, color, PIN, biometría) |
| `/(protected)/home/help` | Centro de ayuda |
| `/(protected)/home/vault` | Bóveda offline de documentos |
| `/(protected)/documents` | Documentos pendientes |
| `/(protected)/documents/viewer` | Visor PDF |
| `/(protected)/history` | Historial por años |
| `/(protected)/history/[year]` | Meses de un año |
| `/(protected)/history/[year]/[month]` | Documentos de un mes |
| `/(protected)/history/viewer` | Visor PDF (historial) |
| `/(protected)/dining` | Comedor (Coming Soon) |

## 🔐 Variables de Entorno (`.env`)

```
EXPO_PUBLIC_API_URL=            # URL del backend (https://...)
EXPO_PUBLIC_PASSWORD_SECRET=    # Pepper para hash de PIN
EXPO_PUBLIC_MOBILE_API_KEY=     # API Key para endpoints pre-login
EXPO_PUBLIC_INACTIVITY_TIMEOUT_MINUTES=  # Minutos de inactividad antes de auto-logout
EXPO_PUBLIC_OTP_RESEND_INTERVALS=       # Intervalos de reenvío OTP (backoff exponencial)
```

## 📄 Licencia

Propietaria — Nova Team
