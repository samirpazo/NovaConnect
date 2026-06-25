import { Stack } from "expo-router";

export default function DocumentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: {
          fontFamily: "Poppins_600SemiBold",
        },
        headerShadowVisible: false,
        headerBackTitle: "",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="viewer" options={{ headerShown: false }} />
    </Stack>
  );
}
