# Resumen de Endpoints de Nova Connect

Este documento lista todas las rutas de la API del backend que actualmente son consumidas por la aplicación móvil/web (Nova Connect) en sus respectivos servicios.

## 1. Autenticación y Seguridad (`authService.ts` / `lib/axios.ts`)
- **`POST /Token/AuthenticationCollaborator`**
  - **Uso:** Iniciar sesión por primera vez con DNI/Código y Contraseña para obtener el token JWT.
  - **Modelo de tokens:** El backend entrega `nova_access_token` y `nova_refresh_token` como cookies HttpOnly. En **native** se leen del header `Set-Cookie` de la respuesta (`fetchTokensFromResponse`) y se envían como `Authorization: Bearer`. En **web** (site3) la auth es por cookies (`withCredentials: true`), el navegador filtra `Set-Cookie` y no se guarda token en storage.
- **`POST /Token/Refresh`**
  - **Uso:** Renovar el access token cuando expira (5 min). En web se llama sin body (el backend lee `nova_refresh_token` de la cookie); en native se envía el refresh token guardado en SecureStore. La respuesta vuelve a entregar los tokens en cookies.
- **`POST /Token/Logout`**
  - **Uso:** Revocar la sesión activa en el servidor antes del logout local.
- **`GET /Token/CsrfToken`**
  - **Uso:** Inicializar CSRF (Double Submit Cookie). Devuelve un token en el body y lo guarda en la cookie `nova-csrf-token`. Se llama en `initializeAuth` (arranque) y tras cada login. En toda mutación (POST/PUT/DELETE/PATCH) la app envía `X-CSRF-TOKEN` + (native) la cookie manualmente. Exento de `[Authorize]`.
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
- **`GET /GenFiles/{fileId}/download`**
  - **Uso:** Descargar o previsualizar el archivo PDF binario de la boleta desde el servidor.
- **`GET /GenPerson/GetPhotoHistory/{prsId}`** y **`GET /GenFiles/{fileId}/preview`**
  - **Uso:** Obtener la foto de perfil de la persona (base64 en JSON). Se dispara vía `NImage` en la pantalla Home (primer request tras el login). Endpoint `[Authorize]` — requiere token válido (Bearer en native / cookie en web).

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

## 6. Comedor / Concesionario (`dinMenu...Service.ts`)
- **`POST /DinMenuProgram/List`** (`dinMenuProgramService.ts`)
  - **Uso:** Obtener la lista de programas de menú.
- **`GET /DinMenuProgram/GetAssignedMobile?targetDate={targetDate}`** (`dinMenuProgramService.ts`)
  - **Uso:** Obtener el menú móvil asignado para una fecha específica.
- **`POST /DinMenuProgramDetail/List`** (`dinMenuProgramDetailService.ts`)
  - **Uso:** Obtener los detalles de los programas de menú.
- **`POST /DinMenuType/List`** (`dinMenuTypeService.ts`)
  - **Uso:** Obtener la lista de tipos de menú.
- **`POST /DinMenuService/List`** (`dinMenuServiceService.ts`)
  - **Uso:** Obtener la lista de servicios de menú (desayuno, almuerzo, cena, etc.).
- **`POST /DinMenuRating/Save`** (`dinMenuRatingService.ts`)
  - **Uso:** Guardar la calificación (rating) o retroalimentación sobre un menú consumido.
- **`PUT /DinMenuRating/Update?id={id}`** (`dinMenuRatingService.ts`)
  - **Uso:** Actualizar la calificación o comentario sobre un menú previamente calificado.

## 7. Estado del Sistema (`healthService.ts`)
- **`GET /health/ready`**
  - **Uso:** Comprobar si el backend está listo (ready) para recibir peticiones.
- **`GET /health/live`**
  - **Uso:** Comprobar si la aplicación backend está viva (liveness).
