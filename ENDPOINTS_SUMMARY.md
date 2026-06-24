# Resumen de Endpoints de Nova Connect

Este documento lista todas las rutas de la API del backend que actualmente son consumidas por la aplicación móvil/web (Nova Connect) en sus respectivos servicios.

## 1. Autenticación y Seguridad (`authService.ts`)
- **`POST /Token/AuthenticationCollaborator`**
  - **Uso:** Iniciar sesión por primera vez con DNI/Código y Contraseña para obtener el token JWT.
- **`POST /SecCollaborator/ValidateLogin`**
  - **Uso:** Acceso rápido del día a día usando el PIN de 4 dígitos.
- **`POST /SecCollaborator/RequestPinReset`**
  - **Uso:** Solicitar el código OTP al correo (Flujo de "Olvidé mi PIN").
- **`POST /SecCollaborator/ConfirmPinReset`**
  - **Uso:** Validar el código OTP de 6 dígitos que el usuario ingresa.
- **`POST /SecCollaborator/ChangePassword`**
  - **Uso:** Guardar el nuevo PIN en la base de datos después de la validación OTP exitosa.
- **`POST /SecCollaborator/Register`**
  - **Uso:** Registro o validación inicial de un colaborador en el sistema.
- **`POST /SecCollaborator/Save`**
  - **Uso:** Actualizar datos básicos del perfil del colaborador (celular, foto, etc.).

## 2. Documentos y Boletas (`processedDocumentService.ts` / `fileService.ts`)
- **`GET /MpwProcessedDocument/GetByPrsID?PdcIsReceived={bool}`**
  - **Uso:** Obtener la lista de documentos. Se llama con `false` para la pestaña "Documentos Nuevos" y `true` para el "Historial".
- **`PUT /MpwProcessedDocument/Update?id={id}`**
  - **Uso:** Se dispara cuando el usuario abre un documento nuevo para marcarlo como leído (cambia `PdcIsReceived` a `true`).
- **`GET /GenUploadFiles/downloadFile?genParameter=ROUTE_BOLETAS&nameFile={fileName}`**
  - **Uso:** Descargar o previsualizar el archivo PDF binario de la boleta desde el servidor.

## 3. Personalización (`secCollaboratorPreferenceService.ts`)
- **`GET /SecCollaboratorPreference/MyPreferences`**
  - **Uso:** Obtiene el color de acento (Primary Color) que el usuario guardó previamente para la interfaz.
- **`POST /SecCollaboratorPreference/Save`**
  - **Uso:** Guarda el nuevo color primario elegido desde la pantalla de Configuración.

## 4. Parámetros del Sistema (`genParameterService.ts`)
- **`GET /GenParameter/GetHelpInfo`**
  - **Uso:** Extrae los datos (teléfonos, correos, URL de WhatsApp) parametrizados para llenar la pantalla dinámica del "Centro de Ayuda".

## 5. Notificaciones Push (`pushNotificationService.ts`)
- **`POST /GenPushNotification/Save`**
  - **Uso:** Envía el token de Expo (`ExpoPushToken`) al backend cuando el usuario inicia sesión, permitiendo vincular su celular a su `PrsID` para enviarle notificaciones.
