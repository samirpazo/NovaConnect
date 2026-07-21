import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/useAuthStore";
import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, PanResponder, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

const TIMEOUT_MINUTES = Number(
  process.env.EXPO_PUBLIC_INACTIVITY_TIMEOUT_MINUTES || 2,
);
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000;

export default function SessionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);

  const performLogout = () => {
    if (user) {
      logout();
      showToast.error(
        "Sesión expirada",
        "Tu sesión se cerró automáticamente por seguridad tras inactividad prolongada.",
      );
    }
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (user) {
      timerRef.current = setTimeout(performLogout, TIMEOUT_MS);
    }
  };

  useEffect(() => {
    if (!user) {
      setIsBlurred(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Iniciar temporizador inicial
    resetTimer();

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState.match(/inactive|background/)) {
          // App fue enviada a segundo plano
          backgroundTimeRef.current = Date.now();
          if (user) setIsBlurred(true);
        } else if (nextAppState === "active") {
          // App volvió al primer plano
          if (backgroundTimeRef.current) {
            const timeElapsed = Date.now() - backgroundTimeRef.current;
            if (timeElapsed >= TIMEOUT_MS) {
              performLogout();
              // Mantenemos el blur si vamos a desloguear
            } else {
              setIsBlurred(false);
              resetTimer();
            }
            backgroundTimeRef.current = null;
          } else {
            setIsBlurred(false);
          }
        }
      },
    );

    return () => {
      subscription.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimer();
        return false; // Devuelve false para no bloquear los toques de los hijos
      },
      onMoveShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;

  // Envolvemos toda la aplicación en un View que capta los toques globalmente
  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
      {isBlurred && user && (
        <BlurView 
          intensity={100} 
          tint="dark" 
          style={StyleSheet.absoluteFill} 
          className="z-50"
        />
      )}
    </View>
  );
}
