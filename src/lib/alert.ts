import { Alert as NativeAlert, Platform } from "react-native";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export const AlertHelper = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    if (Platform.OS === "web") {
      // Fallback for Web since React Native's Alert doesn't support buttons well on web
      if (buttons && buttons.length > 0) {
        if (buttons.length === 1) {
          window.alert(`${title}\n\n${message || ""}`);
          if (buttons[0].onPress) {
            buttons[0].onPress();
          }
        } else {
          // If there are multiple buttons, use confirm
          const okButton =
            buttons.find((b) => b.style !== "cancel") ||
            buttons[buttons.length - 1];
          const cancelButton =
            buttons.find((b) => b.style === "cancel") || buttons[0];

          const result = window.confirm(`${title}\n\n${message || ""}`);
          if (result && okButton?.onPress) {
            okButton.onPress();
          } else if (!result && cancelButton?.onPress) {
            cancelButton.onPress();
          }
        }
      } else {
        window.alert(`${title}\n\n${message || ""}`);
      }
    } else {
      // Native platforms use the standard Alert API
      NativeAlert.alert(title, message, buttons as any);
    }
  },
};
