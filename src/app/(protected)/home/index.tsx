import { NImage } from "@/components/custom/NImage";
import { Text } from "@/components/ui/text";
import { AlertHelper } from "@/lib/alert";
import { sanitizePrimaryColor } from "@/lib/colorUtils";
import {
  trainingAttendanceService,
  type TrainingAttendance,
} from "@/services/trainingAttendanceService";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  HardDrive,
  HelpCircle,
  IdCard,
  LogOut,
  Mail,
  Phone,
  Settings,
  X,
} from "lucide-react-native";
import { DateTime } from "luxon";
import * as React from "react";
import { Modal, Platform, Pressable, ScrollView, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, { FadeInDown, FadeOut, ZoomIn } from "react-native-reanimated";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const [photoVisible, setPhotoVisible] = React.useState(false);
  const [pendingTrainings, setPendingTrainings] = React.useState<
    TrainingAttendance[]
  >([]);
  const [trainingDismissed, setTrainingDismissed] = React.useState(false);
  const [expandedSession, setExpandedSession] = React.useState<string | null>(
    null,
  );
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor = sanitizePrimaryColor(storePrimaryColor);
  const pendingTrainingCount = new Set(
    pendingTrainings.map((training) => training.TneName.trim().toLowerCase()),
  ).size;
  const currentTraining = pendingTrainings[0];
  const currentTrainingKey = currentTraining?.TneName.trim().toLowerCase();
  const currentSessions = currentTraining
    ? Array.from(
        new Map(
          pendingTrainings
            .filter(
              (training) =>
                training.TneName.trim().toLowerCase() === currentTrainingKey,
            )
            .map((training) => [
              training.TnsStartDateTime + "|" + training.TnsEndDateTime,
              training,
            ]),
        ).values(),
      )
    : [];

  React.useEffect(() => {
    const loadPendingTraining = async () => {
      try {
        const pending = await trainingAttendanceService.getPending();
        setPendingTrainings(pending);
      } catch {
        setPendingTrainings([]);
      }
    };

    void loadPendingTraining();
  }, []);

  const handleSettings = () => {
    router.push("/(protected)/home/settings");
  };

  const handleLogout = async () => {
    AlertHelper.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar tu sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-lg self-center px-5 gap-8 mt-4">
          {/* Profile Hero */}
          <Animated.View entering={FadeInDown.duration(400).springify()}>
            <View className="items-center w-full gap-4">
              <Pressable
                onPress={() => setPhotoVisible(true)}
                className="w-28 h-28 rounded-full border-4 overflow-hidden items-center justify-center bg-muted/30 shadow-sm active:opacity-80"
                style={{ borderColor: `${primaryColor}` }}
              >
                <NImage
                  personId={user?.PrsID}
                  className="w-full h-full"
                  fallbackText={user?.PrsName?.[0] || "U"}
                />
              </Pressable>
              <View className="items-center gap-1.5 w-full">
                <Text className="text-2xl font-poppins-bold text-foreground tracking-tight text-center leading-tight">
                  {user?.FullName || "Usuario"}
                </Text>
                <View className="flex-row items-center gap-2 bg-secondary/60 px-3 py-1 rounded-full border border-border/40 self-center">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: primaryColor || "#002aff" }}
                  />
                  <Text className="text-xs font-poppins-semibold text-muted-foreground uppercase tracking-wider text-center">
                    {user?.PstName || user?.TypeWorkerName || "No registrado"}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {pendingTrainings.length > 0 && !trainingDismissed && (
            <Modal
              visible
              transparent
              animationType="fade"
              statusBarTranslucent
              onRequestClose={() => setTrainingDismissed(true)}
            >
  <View className="flex-1 bg-black/70 items-center justify-center px-4 py-4">
      <Animated.View
        entering={ZoomIn.duration(300).springify()}
    className="max-h-[84%]"
    style={{ width: "92%", maxWidth: 420, maxHeight: "84%" }}
      >
                  <View className="rounded-[20px] bg-[#17191f] shadow-sm overflow-hidden border border-white/10">
                    <View className="flex-row items-center px-4 py-3 border-b border-white/10">
                      <View className="flex-1 flex-row items-center gap-2">
                        <View className="w-8 h-8 rounded-lg bg-white/15 items-center justify-center">
                          <GraduationCap size={18} color="#ffffff" />
                        </View>
                        <Text className="font-poppins-bold text-white text-xs uppercase tracking-widest">
                          {currentTraining?.TneEventTypeName || "Evento"}
                        </Text>
                      </View>
                      {pendingTrainingCount > 1 ? (
                        <Text className="font-poppins-semibold text-white/70 text-xs">
                          1 de {pendingTrainingCount}
                        </Text>
                      ) : null}
                      <Pressable
                        onPress={() => setTrainingDismissed(true)}
                        className="ml-3 p-1.5 active:opacity-70"
                        accessibilityLabel="Cerrar aviso de evento"
                      >
                        <X size={18} color="#ffffff" />
                      </Pressable>
                    </View>
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ padding: 14, paddingBottom: 16 }}
                      style={{ maxHeight: 470 }}
                    >
                      <Text
                        className="font-poppins-bold text-white text-lg leading-tight"
                        numberOfLines={3}
                      >
                        {currentTraining?.TneName}
                      </Text>
                      <Text className="font-poppins-medium text-white/75 text-sm mt-2">
                        Invitación pendiente
                      </Text>
                      {currentTraining?.TneFlyerFilID ? (
                        <View
                          className="mt-3 self-center rounded-xl bg-black/25 p-1 overflow-hidden border border-white/[0.06]"
                          style={{ width: "82%", height: 300 }}
                        >
                          <NImage
                            fileId={currentTraining.TneFlyerFilID}
                            className="w-full h-full rounded-lg"
                            contentFit="contain"
                          />
                        </View>
                      ) : null}
                      <Text className="font-poppins-medium text-white/70 text-xs mt-4 uppercase tracking-wider">
                        {currentSessions.length}{" "}
                        {currentSessions.length === 1 ? "sesión" : "sesiones"}
                      </Text>
                      <View className="mt-2">
                        {currentSessions.map((session) => {
                          const sessionKey =
                            session.TnsStartDateTime + session.TnsEndDateTime;
                          const isExpanded = expandedSession === sessionKey;

                          return (
                            <Pressable
                              key={sessionKey}
                              onPress={() =>
                                setExpandedSession((current) =>
                                  current === sessionKey ? null : sessionKey,
                                )
                              }
                              className="flex-row items-center border-b border-white/10 py-2 active:opacity-75"
                            >
                              <View className="flex-1">
                                <Text className="font-poppins-semibold text-white/90 text-xs">
                                  {session.TnsTopicName}
                                </Text>
                                {isExpanded ? (
                                  <View className="mt-1 gap-0.5">
                                    <Text className="font-poppins-medium text-white/65 text-[11px]">
                                      {DateTime.fromISO(
                                        session.TnsStartDateTime,
                                      ).toFormat("dd/LL/yyyy · HH:mm")}{" "}
                                      –{" "}
                                      {DateTime.fromISO(
                                        session.TnsEndDateTime,
                                      ).toFormat("HH:mm")}
                                    </Text>
                                    {session.TsiInstructorName ? (
                                      <Text
                                        className="font-poppins-medium text-white/65 text-[11px]"
                                        numberOfLines={1}
                                      >
                                        Instructor: {session.TsiInstructorName}
                                      </Text>
                                    ) : null}
                                  </View>
                                ) : null}
                              </View>
                              <ChevronDown
                                size={15}
                                color="#ffffff"
                                style={{
                                  transform: [
                                    { rotate: isExpanded ? "180deg" : "0deg" },
                                  ],
                                }}
                              />
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                    <View className="px-4 py-2.5 border-t border-white/10">
                      <Pressable
                        onPress={async () => {
                          try {
                            if (!currentTraining) return;
                            await trainingAttendanceService.confirm(
                              currentTraining.TnpID,
                            );
                            setPendingTrainings((current) =>
                              current.filter(
                                (training) =>
                                  training.TneName !== currentTraining.TneName,
                              ),
                            );
                          } catch {
                            AlertHelper.alert(
                              "No se pudo confirmar",
                              "Intenta nuevamente en unos segundos.",
                            );
                          }
                        }}
                        className="rounded-xl py-3 items-center active:opacity-80"
                        style={{ backgroundColor: primaryColor || "#315efb" }}
                      >
                        <Text
                          className="font-poppins-bold text-sm"
                          style={{ color: "#ffffff" }}
                        >
                          ✓ Asistiré
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>
              </View>
            </Modal>
          )}

          {/* Personal Info */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
            className="bg-card rounded-[20px] border border-border/40 overflow-hidden shadow-sm"
          >
            <View className="flex-row items-center gap-3 px-4 py-2.5">
              <View
                className="w-8 h-8 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: primaryColor
                    ? `${primaryColor}15`
                    : "#002aff15",
                }}
              >
                <IdCard size={16} color={primaryColor || "#002aff"} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-poppins-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Documento de Identidad
                </Text>
                <Text className="text-sm font-poppins-semibold text-foreground">
                  {user?.PrsDocumentNumber || "No registrado"}
                </Text>
              </View>
            </View>
            <View className="h-[1px] bg-border/40 mx-4" />
            <View className="flex-row items-center gap-3 px-4 py-2.5">
              <View
                className="w-8 h-8 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: primaryColor
                    ? `${primaryColor}15`
                    : "#002aff15",
                }}
              >
                <Building2 size={16} color={primaryColor || "#002aff"} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-poppins-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Área
                </Text>
                <Text className="text-sm font-poppins-medium text-foreground capitalize">
                  {(user?.AreName || "No registrado").toLowerCase()}
                </Text>
              </View>
            </View>
            <View className="h-[1px] bg-border/40 mx-4" />
            <View className="flex-row items-center gap-3 px-4 py-2.5">
              <View
                className="w-8 h-8 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: primaryColor
                    ? `${primaryColor}15`
                    : "#002aff15",
                }}
              >
                <Mail size={16} color={primaryColor || "#002aff"} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-poppins-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Correo Electrónico
                </Text>
                <Text className="text-sm font-poppins-medium text-foreground">
                  {user?.UsrEmail || "No registrado"}
                </Text>
              </View>
            </View>
            <View className="h-[1px] bg-border/40 mx-4" />
            <View className="flex-row items-center gap-3 px-4 py-2.5">
              <View
                className="w-8 h-8 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: primaryColor
                    ? `${primaryColor}15`
                    : "#002aff15",
                }}
              >
                <Phone size={16} color={primaryColor || "#002aff"} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-poppins-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Teléfono
                </Text>
                <Text className="text-sm font-poppins-medium text-foreground">
                  {user?.PrsPhone || "No registrado"}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* QR Code Card */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(150).springify()}
          >
            <View className="bg-card rounded-[24px] border border-border/40 overflow-hidden shadow-sm items-center p-6 w-full">
              <Text className="text-[11px] font-poppins-semibold text-muted-foreground uppercase tracking-widest mb-4 text-center">
                Fotocheck QR
              </Text>
              <View className="bg-white p-3 rounded-2xl shadow-sm border border-border/20 self-center">
                <QRCode
                  value={user?.PrsDocumentNumber || "No registrado"}
                  size={140}
                  color="#000000"
                  backgroundColor="#ffffff"
                  logo={require("../../../../assets/images/icons/icon.png")}
                  logoSize={30}
                  logoBackgroundColor="transparent"
                />
              </View>
              <Text className="font-poppins-medium text-sm text-muted-foreground mt-4 text-center">
                Escanea este código para validar tu identidad
              </Text>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200).springify()}
          >
            <View className="gap-2.5">
              <Text className="text-[11px] font-poppins-bold text-muted-foreground uppercase tracking-widest px-2 mb-1">
                Acciones Rápidas
              </Text>

              {Platform.OS !== "web" && (
                <Pressable
                  onPress={() =>
                    router.push({ pathname: "/(protected)/home/vault" })
                  }
                  className="flex-row items-center gap-3.5 py-2 px-4 rounded-[16px] bg-card border border-border/40 active:bg-secondary/50"
                >
                  <View className="w-9 h-9 rounded-[12px] bg-secondary/80 items-center justify-center">
                    <HardDrive size={18} color={primaryColor || "#002aff"} />
                  </View>
                  <Text className="flex-1 font-poppins-semibold text-foreground text-sm">
                    Bóveda Offline
                  </Text>
                  <ChevronRight size={18} color={primaryColor || "#002aff"} />
                </Pressable>
              )}

              <Pressable
                onPress={() => router.push("/(protected)/home/help")}
                className="flex-row items-center gap-3.5 py-2 px-4 rounded-[16px] bg-card border border-border/40 active:bg-secondary/50"
              >
                <View className="w-9 h-9 rounded-[12px] bg-secondary/80 items-center justify-center">
                  <HelpCircle size={18} color={primaryColor || "#002aff"} />
                </View>
                <Text className="flex-1 font-poppins-semibold text-foreground text-sm">
                  Centro de Ayuda
                </Text>
                <ChevronRight size={18} color={primaryColor || "#002aff"} />
              </Pressable>

              <Pressable
                onPress={handleSettings}
                className="flex-row items-center gap-3.5 py-2 px-4 rounded-[16px] bg-card border border-border/40 active:bg-secondary/50"
              >
                <View className="w-9 h-9 rounded-[12px] bg-secondary/80 items-center justify-center">
                  <Settings size={18} color={primaryColor || "#002aff"} />
                </View>
                <Text className="flex-1 font-poppins-semibold text-foreground text-sm">
                  Configuración
                </Text>
                <ChevronRight size={18} color={primaryColor || "#002aff"} />
              </Pressable>
            </View>
          </Animated.View>

          {/* Logout */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(300).springify()}
          >
            <Pressable
              onPress={handleLogout}
              className="mt-2 active:opacity-80 rounded-[16px] overflow-hidden shadow-sm border border-red-500/20"
            >
              <LinearGradient
                colors={["#ef4444", "#dc2626"]} // Red-500 to Red-600
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center justify-center gap-2.5 py-4"
              >
                <LogOut size={18} color="#ffffff" />
                <Text className="font-poppins-semibold text-sm text-white">
                  Cerrar Sesión
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Photo Modal */}
      <Modal
        visible={photoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoVisible(false)}
      >
        <View className="flex-1 bg-black/90 items-center justify-center p-8">
          <Pressable
            className="absolute top-0 bottom-0 left-0 right-0"
            onPress={() => setPhotoVisible(false)}
          />
          {photoVisible && (
            <Animated.View
              entering={ZoomIn.duration(400).springify()}
              exiting={FadeOut.duration(200)}
              className="overflow-hidden bg-muted/20 border-4 shadow-2xl items-center justify-center"
              style={{
                borderColor: `${primaryColor}50`,
                width: 320,
                height: 320,
                borderRadius: 160,
              }}
            >
              <NImage
                personId={user?.PrsID}
                className="w-full h-full rounded-lg"
                fallbackText={user?.PrsName?.[0] || "U"}
              />
            </Animated.View>
          )}
        </View>
      </Modal>
    </View>
  );
}
