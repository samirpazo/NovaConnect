import { showToast } from "@/lib/toast";
import { trainingService } from "@/services/trainingService";
import { TrainingEventFile, TrainingInvitation } from "@/types/training";
import { api, API_URL } from "@/lib/axios";
import CryptoJS from "crypto-js";
import { storage } from "@/lib/storage";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  Platform,
  RefreshControl,
  ScrollView,
  Switch,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Award, CalendarDays, ChevronDown, ChevronUp, FileText, MapPin, Video } from "lucide-react-native";

type TrainingCard = TrainingInvitation;
type SurveyAnswers = {
  TnvObjectivesMet: boolean;
  TnvExamplesWereUseful: boolean;
  TnvTopicsWereCovered: boolean;
  TnvUsefulForWork: boolean;
  TnvTimeWasSufficient: boolean;
};

const toBase64 = (bytes: Uint8Array) => {
  const words: number[] = [];
  for (let offset = 0; offset < bytes.length; offset += 4) {
    words.push(
      ((bytes[offset] ?? 0) << 24) |
        ((bytes[offset + 1] ?? 0) << 16) |
        ((bytes[offset + 2] ?? 0) << 8) |
        (bytes[offset + 3] ?? 0),
    );
  }
  return CryptoJS.enc.Base64.stringify(
    CryptoJS.lib.WordArray.create(words, bytes.length),
  );
};

const emptySurvey: SurveyAnswers = {
  TnvObjectivesMet: true,
  TnvExamplesWereUseful: true,
  TnvTopicsWereCovered: true,
  TnvUsefulForWork: true,
  TnvTimeWasSufficient: true,
};

const eventEnd = (item: TrainingCard) =>
  new Date(item.TneEndDate ?? item.TneStartDate ?? 0).getTime();

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Fecha por confirmar";

export default function TrainingsScreen() {
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor = storePrimaryColor || "#002aff";
  const [items, setItems] = useState<TrainingInvitation[]>([]);
  const [materials, setMaterials] = useState<TrainingEventFile[]>([]);
  const [activeItem, setActiveItem] = useState<TrainingCard | null>(null);
  const [declineItem, setDeclineItem] = useState<TrainingCard | null>(null);
  const [surveyItem, setSurveyItem] = useState<TrainingCard | null>(null);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [survey, setSurvey] = useState<SurveyAnswers>(emptySurvey);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [history, setHistory] = useState(false);
  const [preview, setPreview] = useState<{ uri: string; mimeType: string } | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setItems(await trainingService.getInvitations());
    } catch {
      showToast.error("No se pudieron cargar las capacitaciones.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void storage.getItem("token").then(setToken);
  }, [load]);

  const cards = useMemo(
    () => [...items].sort((left, right) =>
      new Date(left.TneStartDate ?? 0).getTime() - new Date(right.TneStartDate ?? 0).getTime(),
    ),
    [items],
  );

  const visibleCards = cards.filter((item) =>
    history ? eventEnd(item) < Date.now() : eventEnd(item) >= Date.now(),
  );

  const openMaterials = async (item: TrainingCard) => {
    setActiveItem(item);
    try {
      setMaterials(await trainingService.getEventFiles(item.TneID));
    } catch {
      setMaterials([]);
      showToast.error("No se pudieron cargar los materiales.");
    }
  };

  const openFile = async (fileId: number) => {
    try {
      const response = await api.get(`/GenFiles/${fileId}/preview`, {
        responseType: "arraybuffer",
      });
      const mimeType = String(response.headers["content-type"] || "application/octet-stream");
      const bytes = new Uint8Array(response.data as ArrayBuffer);
      // ponytail: in-memory preview is capped at 30 MB; add streamed native downloads if file sizes grow.
      if (bytes.length > 30 * 1024 * 1024) throw new Error("Archivo demasiado grande para vista previa.");
      setPreview({ uri: `data:${mimeType};base64,${toBase64(bytes)}`, mimeType });
    } catch {
      showToast.error("No se pudo abrir el archivo.");
    }
  };

  const confirm = async (item: TrainingCard) => {
    setBusy(true);
    try {
      await trainingService.confirmInvitation(item.TnpID);
      showToast.success("Asistencia confirmada.");
      await load(true);
    } catch {
      showToast.error("No se pudo confirmar. El plazo pudo haber vencido.");
    } finally {
      setBusy(false);
    }
  };

  const saveDecline = async () => {
    if (!declineItem || !reason.trim()) return;
    setBusy(true);
    try {
      await trainingService.declineInvitation(declineItem.TnpID, reason.trim(), comment.trim());
      setDeclineItem(null);
      setReason("");
      setComment("");
      showToast.success("Invitación declinada.");
      await load(true);
    } catch {
      showToast.error("No se pudo declinar. El plazo pudo haber vencido.");
    } finally {
      setBusy(false);
    }
  };

  const saveSurvey = async () => {
    if (!surveyItem) return;
    setBusy(true);
    try {
      await trainingService.submitSurvey({
        TnpID: surveyItem.TnpID,
        ...survey,
        TnvComments: null,
      });
      setSurveyItem(null);
      setSurvey(emptySurvey);
      showToast.success("Encuesta registrada.");
      await load(true);
    } catch {
      showToast.error("No se pudo guardar la encuesta.");
    } finally {
      setBusy(false);
    }
  };

  const canRespond = (item: TrainingCard) =>
    item.TnpRegistrationStatus === 1 &&
    (!item.TneConfirmationDeadline || new Date(item.TneConfirmationDeadline).getTime() >= Date.now());

  const renderCard = (item: TrainingCard) => (
    <View key={item.TneID} className="mb-4 overflow-hidden rounded-3xl border border-border/50 bg-card">
      {item.TneFlyerFilID && (
        <Pressable onPress={() => void openFile(item.TneFlyerFilID!)}>
          <Image
            source={{
              uri: `${API_URL}/GenFiles/${item.TneFlyerFilID}/preview`,
              headers: Platform.OS !== "web" && token ? { Authorization: `Bearer ${token}`, "X-Nova-Client": "nova-connect", "X-Client-Platform": "native" } : undefined,
            }}
            resizeMode="cover"
            className="h-48 w-full bg-secondary"
          />
        </Pressable>
      )}
      <View className="gap-3 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-[11px] font-poppins-semibold uppercase tracking-widest text-primary" style={{ color: primaryColor }}>
              {item.TneEventTypeName || "Capacitación"}
            </Text>
            <Text className="text-lg font-poppins-semibold text-foreground">{item.TneName}</Text>
            <Text className="text-sm text-muted-foreground">{formatDate(item.TneStartDate)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={activeItem?.TneID === item.TneID ? "Cerrar detalle" : "Ver detalle"}
            onPress={() => void openMaterials(item)}
            className="rounded-xl bg-secondary p-2.5"
          >
            {activeItem?.TneID === item.TneID ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Pressable>
        </View>
        <View className="flex-row flex-wrap gap-x-4 gap-y-2">
          {item.TneLocation && <View className="flex-row items-center gap-1"><MapPin size={14} color={primaryColor} /><Text className="text-xs text-muted-foreground">{item.TneLocation}</Text></View>}
          {item.TneVirtualLink && <Pressable onPress={() => void Linking.openURL(item.TneVirtualLink!)} className="flex-row items-center gap-1"><Video size={14} color={primaryColor} /><Text className="text-xs" style={{ color: primaryColor }}>Enlace virtual</Text></Pressable>}
        </View>
        <View className="flex-row flex-wrap gap-2">
          {canRespond(item) && (
            <>
              <Pressable disabled={busy} onPress={() => void confirm(item)} className="rounded-xl px-4 py-3" style={{ backgroundColor: primaryColor }}>
                <Text className="font-poppins-semibold text-sm text-white">Confirmar</Text>
              </Pressable>
              <Pressable disabled={busy} onPress={() => setDeclineItem(item)} className="rounded-xl border border-border px-4 py-3">
                <Text className="font-poppins-semibold text-sm text-foreground">Declinar</Text>
              </Pressable>
            </>
          )}
          {item.TnpRegistrationStatus === 1 && !canRespond(item) && <Text className="py-3 text-xs text-muted-foreground">El plazo de respuesta venció.</Text>}
          {item.TnpRegistrationStatus === 2 && <Text className="py-3 text-xs font-poppins-semibold text-emerald-600">Inscripción confirmada</Text>}
          {item.TnpRegistrationStatus === 3 && <Text className="py-3 text-xs font-poppins-semibold text-muted-foreground">Invitación declinada</Text>}
        </View>
        {eventEnd(item) < Date.now() && item.TnpRegistrationStatus === 2 && !item.TnpHasSurvey && (
          <Pressable onPress={() => setSurveyItem(item)} className="flex-row items-center gap-2 self-start rounded-xl bg-secondary px-3 py-2.5">
            <CalendarDays size={16} color={primaryColor} />
            <Text className="text-sm font-poppins-semibold text-foreground">Responder encuesta</Text>
          </Pressable>
        )}
        {item.TnpCertificateFilID && (
          <Pressable onPress={() => void openFile(item.TnpCertificateFilID!)} className="flex-row items-center gap-2 self-start rounded-xl bg-secondary px-3 py-2.5">
            <Award size={16} color={primaryColor} />
            <Text className="text-sm font-poppins-semibold text-foreground">Ver constancia</Text>
          </Pressable>
        )}
        {activeItem?.TneID === item.TneID && (
          <View className="gap-3 border-t border-border/50 pt-3">
            <Text className="font-poppins-semibold text-sm text-foreground">Sesiones</Text>
            {item.sessions.map((session, index) => (
              <View key={`${session.TnsID ?? index}-${session.TnsStartDateTime}`} className="rounded-2xl bg-secondary/50 p-3">
                <Text className="font-poppins-semibold text-sm text-foreground">{session.TnsTopicName || item.TneName}</Text>
                <Text className="mt-1 text-xs text-muted-foreground">{formatDate(session.TnsStartDateTime)}{session.TnsEndDateTime ? ` · ${formatDate(session.TnsEndDateTime)}` : ""}</Text>
                {session.TsiInstructorName && <Text className="mt-1 text-xs text-muted-foreground">Capacitador: {session.TsiInstructorName}</Text>}
              </View>
            ))}
            <Text className="font-poppins-semibold text-sm text-foreground">Flyer y materiales</Text>
            {materials.length === 0 ? <Text className="text-xs text-muted-foreground">No hay materiales disponibles.</Text> : materials.map((file) => (
              <Pressable key={file.TefID} onPress={() => void openFile(file.FilID)} className="flex-row items-center gap-2 rounded-2xl bg-secondary/50 p-3">
                <FileText size={16} color={primaryColor} />
                <Text className="flex-1 text-sm text-foreground">{file.TefFileName || (file.TefIsFlyer ? "Flyer" : `Material ${file.TefID}`)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={primaryColor} />}
      >
        <View className="mx-auto w-full max-w-2xl gap-4 px-5 py-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-poppins-bold text-foreground">Capacitaciones</Text>
              <Text className="mt-1 text-sm text-muted-foreground">Invitaciones, materiales y constancias</Text>
            </View>
            <Pressable onPress={() => router.back()} className="rounded-xl bg-secondary px-3 py-2"><Text className="text-sm text-foreground">Volver</Text></Pressable>
          </View>
          <View className="flex-row gap-2 rounded-2xl bg-secondary p-1">
            {[false, true].map((isHistory) => (
              <Pressable key={String(isHistory)} onPress={() => setHistory(isHistory)} className="flex-1 rounded-xl px-3 py-2.5" style={!history === !isHistory ? { backgroundColor: "#ffffff" } : undefined}>
                <Text className="text-center text-sm font-poppins-semibold text-foreground">{isHistory ? "Históricas" : "Próximas"}</Text>
              </Pressable>
            ))}
          </View>
          {loading ? <ActivityIndicator color={primaryColor} className="mt-8" /> : visibleCards.length ? visibleCards.map(renderCard) : (
            <View className="items-center rounded-3xl border border-border/50 bg-card px-6 py-12">
              <CalendarDays size={28} color={primaryColor} />
              <Text className="mt-3 text-base font-poppins-semibold text-foreground">No hay capacitaciones {history ? "históricas" : "próximas"}</Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">Las invitaciones aparecerán aquí cuando estén disponibles.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={declineItem !== null} transparent animationType="slide" onRequestClose={() => setDeclineItem(null)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="gap-3 rounded-t-3xl bg-background p-5 pb-10">
            <Text className="text-lg font-poppins-semibold text-foreground">Declinar invitación</Text>
            <TextInput value={reason} onChangeText={setReason} placeholder="Motivo" maxLength={200} className="rounded-xl border border-border px-4 py-3 text-foreground" />
            <TextInput value={comment} onChangeText={setComment} placeholder="Comentario (opcional)" maxLength={1000} multiline className="min-h-24 rounded-xl border border-border px-4 py-3 text-foreground" />
            <Pressable disabled={!reason.trim() || busy} onPress={() => void saveDecline()} className="items-center rounded-xl py-3" style={{ backgroundColor: primaryColor }}><Text className="font-poppins-semibold text-white">Enviar respuesta</Text></Pressable>
            <Pressable onPress={() => setDeclineItem(null)} className="items-center rounded-xl py-3"><Text className="text-foreground">Cancelar</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={surveyItem !== null} transparent animationType="slide" onRequestClose={() => setSurveyItem(null)}>
        <View className="flex-1 justify-end bg-black/40">
          <ScrollView className="max-h-[88%] rounded-t-3xl bg-background p-5" contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            <Text className="text-lg font-poppins-semibold text-foreground">Encuesta de capacitación</Text>
            {([
              ["TnvObjectivesMet", "Se cumplieron los objetivos"],
              ["TnvExamplesWereUseful", "Los ejemplos fueron útiles"],
              ["TnvTopicsWereCovered", "Se cubrieron los temas previstos"],
              ["TnvUsefulForWork", "Es útil para mi trabajo"],
              ["TnvTimeWasSufficient", "El tiempo fue suficiente"],
            ] as const).map(([key, label]) => (
              <View key={key} className="flex-row items-center justify-between rounded-xl bg-card px-4 py-3">
                <Text className="flex-1 pr-4 text-sm text-foreground">{label}</Text>
                <Switch value={survey[key]} onValueChange={(value) => setSurvey((current) => ({ ...current, [key]: value }))} trackColor={{ true: primaryColor }} />
              </View>
            ))}
            <Pressable disabled={busy} onPress={() => void saveSurvey()} className="items-center rounded-xl py-3" style={{ backgroundColor: primaryColor }}><Text className="font-poppins-semibold text-white">Enviar encuesta</Text></Pressable>
            <Pressable onPress={() => setSurveyItem(null)} className="items-center rounded-xl py-3"><Text className="text-foreground">Cancelar</Text></Pressable>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={preview !== null} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View className="flex-1 items-center justify-center bg-black/90 p-4">
          <Pressable onPress={() => setPreview(null)} className="absolute right-5 top-12 rounded-full bg-white/20 px-4 py-2"><Text className="text-white">Cerrar</Text></Pressable>
          {preview?.mimeType.startsWith("image/") ? <Image source={{ uri: preview.uri }} resizeMode="contain" className="h-[80%] w-full" /> : (
            <View className="mt-10 items-center gap-4 rounded-2xl bg-background p-5">
              <FileText size={32} color={primaryColor} />
              <Text className="text-center text-sm text-foreground">El archivo se descargó desde Nova. Ábrelo desde el navegador del dispositivo.</Text>
              <Pressable onPress={() => { if (preview) void Linking.openURL(preview.uri); }} className="rounded-xl px-4 py-3" style={{ backgroundColor: primaryColor }}><Text className="text-white">Abrir archivo</Text></Pressable>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
