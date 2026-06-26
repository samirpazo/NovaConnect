# Nova Connect

App móvil del ecosistema **Nova Core Platform** — construida con [Expo](https://expo.dev/) + [React Native](https://reactnative.dev/) y [Nativewind](https://www.nativewind.dev/).

- **Bundle ID iOS**: `com.novateam.novaconnect`
- **Package Android**: `com.novateam.novaconnect`
- **EAS Project ID**: `8da81d81-4793-4bcd-b2c2-bf4771f0c1a7`

---

## 🚀 Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (Expo Go)
npx expo start

# Iniciar en dispositivo/emulador específico
npx expo start --android
npx expo start --ios
```

---

## 📦 Compilar para Producción

### 🤖 Android — APK (instalación directa)

Genera un `.apk` que puedes instalar directamente en el dispositivo sin pasar por la Play Store:

```bash
# 1. Pre-build nativo (genera la carpeta android/)
npx expo prebuild --platform android --clean

# 2. Compilar APK en modo Release
cd android && ./gradlew assembleRelease && cd ..

# El APK queda en:
# android/app/build/outputs/apk/release/app-release.apk
```

### 🤖 Android — AAB (Google Play Store)

Genera un `.aab` optimizado para subir a la Play Store:

```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew bundleRelease && cd ..

# El AAB queda en:
# android/app/build/outputs/bundle/release/app-release.aab
```

### 🍎 iOS — Build local (requiere Mac + Xcode)

```bash
npx expo prebuild --platform ios --clean
cd ios && xcodebuild -workspace NovaConnect.xcworkspace -scheme NovaConnect -configuration Release -archivePath build/NovaConnect.xcarchive archive && cd ..
```

---

## ☁️ Compilar con EAS Build (Recomendado)

[EAS Build](https://docs.expo.dev/build/introduction/) compila en la nube sin necesidad de Android Studio ni Xcode:

```bash
# Instalar EAS CLI (solo la primera vez)
npm install -g eas-cli

# Login en Expo
eas login

# APK para pruebas (sin firma de Play Store)
eas build --platform android --profile preview

# AAB firmado para Play Store
eas build --platform android --profile production

# IPA para App Store
eas build --platform ios --profile production

# Ambas plataformas a la vez
eas build --platform all --profile production
```

> Los perfiles (`preview`, `production`) se configuran en `eas.json`.

---

## 🔄 Actualización OTA con EAS Update

Actualiza el código JS sin necesidad de publicar una nueva versión en las tiendas:

```bash
eas update --branch production --message "Fix: descripción del cambio"
```

---

## 🌐 Compilar para Web (SmarterASP / Hosting estático)

El proyecto usa `"output": "static"` en `app.json`, lo que genera archivos HTML/JS/CSS estáticos listos para cualquier hosting.

### Exportar y comprimir

```bash
# 1. Exportar la versión web estática (genera la carpeta dist/)
npx expo export --platform web

# 2. Comprimir el contenido de dist/ directamente (sin carpeta dist/ envolvente)
cd dist && zip -r ../nova-connect-web.zip . && cd ..
```

> El archivo `nova-connect-web.zip` se guarda en la raíz del proyecto.  
> Descomprimir en la **raíz del sitio web** en SmarterASP (donde va el `index.html`).

### Verificar localmente antes de subir

```bash
# Previsualizar el build estático con un servidor local
npx serve dist
# o
npx http-server dist -p 8080
```

---

## 📋 Stack Técnico

- ⚛️ [Expo Router](https://expo.dev/router) — navegación basada en archivos
- 🎨 [Nativewind](https://www.nativewind.dev/) — Tailwind CSS para React Native
- 📦 [React Native Reusables](https://reactnativereusables.com) — componentes UI
- 🔐 `expo-local-authentication` — Face ID / Huella dactilar
- 💾 `expo-secure-store` — almacenamiento seguro de tokens
- 🆕 New Architecture habilitada
