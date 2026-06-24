import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";
import { AlertHelper } from "@/lib/alert";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#002aff",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      AlertHelper.alert(
        "Permiso denegado",
        "Para recibir alertas importantes sobre tus documentos, debes habilitar las notificaciones en la configuración de tu dispositivo.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Ir a Configuración",
            onPress: () => {
              if (Platform.OS !== "web") {
                Linking.openSettings();
              }
            },
          },
        ]
      );
      return;
    }
    
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
        
      if (!projectId) {
        console.warn("Project ID not found. Ensure app.json has expo.extra.eas.projectId");
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      
    } catch (error) {
      console.error("Error al obtener el push token de Expo", error);
    }
  } else {
    console.log("Las notificaciones Push requieren un dispositivo físico.");
  }

  return token;
}
