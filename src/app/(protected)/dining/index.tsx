import { Text } from "@/components/ui/text";
import { View, Pressable, ScrollView, Modal, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { dinMenuProgramService } from "@/services/dinMenuProgramService";
import { DinMenuProgramDetailCe } from "@/types/dining";
import { Utensils, Star } from "lucide-react-native";
import { useAuthStore } from "@/stores/useAuthStore";
import { AlertHelper } from "@/lib/alert";
import { dinMenuRatingService } from "@/services/dinMenuRatingService";

export default function DiningScreen() {
  const [selectedDay, setSelectedDay] = useState<"Hoy" | "Mañana">("Hoy");
  const [details, setDetails] = useState<DinMenuProgramDetailCe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [currentMrtID, setCurrentMrtID] = useState<number | null>(null);
  const [isSavingRating, setIsSavingRating] = useState(false);
  const { user } = useAuthStore();
  
  const [selectedDetail, setSelectedDetail] = useState<DinMenuProgramDetailCe | null>(null);

  useEffect(() => {
    loadMenuForDay(selectedDay);
  }, [selectedDay]);

  const loadMenuForDay = async (day: "Hoy" | "Mañana") => {
    setIsLoading(true);
    setDetails([]);
    try {
      const targetDate = day === "Hoy" ? DateTime.now() : DateTime.now().plus({ days: 1 });
      const targetDateStr = targetDate.startOf('day').toISO();
      
      const programDetails = await dinMenuProgramService.getAssignedMobile(targetDateStr);
      setDetails(programDetails.filter(d => !!d.MpdDishName));
    } catch (error) {
      console.error("Error loading menu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRating = () => {
    if (rating === 0) {
      AlertHelper.alert("Aviso", "Por favor selecciona al menos una estrella.", [{ text: "OK" }]);
      return;
    }
    AlertHelper.alert(
      "Confirmar", 
      "¿Estás seguro de guardar esta calificación?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Guardar", onPress: saveRatingToBackend }
      ]
    );
  };

  const saveRatingToBackend = async () => {
    if (!selectedDetail || !user) return;
    setIsSavingRating(true);
    try {
      const payload = {
        MpdID: selectedDetail.MpdID,
        PrsID: user.PrsID,
        MrtRating: rating,
        MrtComment: comment
      };
      
      if (currentMrtID) {
        await dinMenuRatingService.update(currentMrtID, payload);
      } else {
        await dinMenuRatingService.save(payload);
      }
      
      setRatingModalVisible(false);
      loadMenuForDay(selectedDay);
    } catch (error) {
      AlertHelper.alert("Error", "Ocurrió un error al guardar la calificación.", [{ text: "OK" }]);
    } finally {
      setIsSavingRating(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-6 pt-4">
      
      {/* Selector Hoy / Mañana */}
      <View className="flex-row mx-auto bg-card rounded-full border border-border mb-4 overflow-hidden">
        <Pressable 
          onPress={() => setSelectedDay("Hoy")}
          className={`px-6 py-1.5 transition-all ${selectedDay === "Hoy" ? "bg-primary/20" : "bg-transparent"}`}
        >
          <Text className={`font-poppins-semibold text-sm ${selectedDay === "Hoy" ? "text-primary" : "text-muted-foreground"}`}>
            Hoy
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => setSelectedDay("Mañana")}
          className={`px-6 py-1.5 transition-all ${selectedDay === "Mañana" ? "bg-primary/20" : "bg-transparent"}`}
        >
          <Text className={`font-poppins-semibold text-sm ${selectedDay === "Mañana" ? "text-primary" : "text-muted-foreground"}`}>
            Mañana
          </Text>
        </Pressable>
      </View>

      <Text className="text-center text-muted-foreground text-xs font-poppins mb-4">
        Mantén presionado el menú para poder calificar.
      </Text>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="pb-10">
            {[1, 2, 3].map((i) => (
              <View key={i} className="mb-3 bg-card p-3.5 rounded-2xl border-l-4 border-l-muted/40 border-y border-r border-border shadow-sm">
                <View className="flex-row justify-between items-center mb-1">
                  <View className="h-4 bg-muted/40 rounded w-20" />
                  <View className="h-3 bg-muted/40 rounded w-16" />
                </View>
                <View className="h-3 bg-muted/40 rounded w-full mb-1 mt-2" />
                <View className="h-3 bg-muted/40 rounded w-2/3" />
              </View>
            ))}
          </View>
        ) : details.length === 0 ? (
          <View className="py-10 items-center justify-center">
            <Utensils size={34} color="#888" className="mb-4 opacity-50" />
            <Text className="text-muted-foreground font-poppins text-center">
              No hay un menú programado para este día.
            </Text>
          </View>
        ) : (
          <View className="pb-10">
            {details.map(detail => {
              const title = detail.MsvName?.toUpperCase() || "MENÚ";
              const badgeText = detail.MtpName?.toUpperCase() || "NORMAL";
              
              const customStyle = detail.MtpColor ? { borderLeftColor: detail.MtpColor } : {};
              const badgeStyle = detail.MtpColor ? { backgroundColor: `${detail.MtpColor}33` } : {};
              const badgeTextStyle = detail.MtpColor ? { color: detail.MtpColor } : {};
              
              const borderColorClass = detail.MtpColor ? '' : 'border-l-primary';
              const badgeBgClass = detail.MtpColor ? '' : 'bg-primary/20';
              const badgeTextClass = detail.MtpColor ? '' : 'text-primary';

              return (
                <Pressable
                  key={detail.MpdID}
                  onLongPress={() => {
                    setSelectedDetail(detail);
                    setRating(detail.MrtRating || 0);
                    setComment(detail.MrtComment || "");
                    setCurrentMrtID(detail.MrtID || null);
                    setRatingModalVisible(true);
                  }}
                  className="mb-3"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View 
                    className={`bg-card p-3.5 rounded-2xl border-l-4 ${borderColorClass} border-y border-r border-border shadow-sm`}
                    style={customStyle}
                  >
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="font-poppins-semibold text-sm uppercase text-foreground">
                        {title}
                      </Text>
                      <View className="items-end">
                        <View 
                          className={`px-2 py-[2px] rounded-md ${badgeBgClass}`}
                          style={badgeStyle}
                        >
                          <Text 
                            className={`text-[9px] font-poppins-bold tracking-wider ${badgeTextClass}`}
                            style={badgeTextStyle}
                          >
                            {badgeText}
                          </Text>
                        </View>
                        {!!detail.MrtRating && detail.MrtRating > 0 && (
                          <View className="flex-row items-center mt-1">
                            <Star size={12} color="#f59e0b" fill="#f59e0b" />
                            <Text className="text-[10px] font-poppins-bold text-[#f59e0b] ml-1">
                              {detail.MrtRating}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text className="text-muted-foreground font-poppins text-xs leading-4">
                      {detail.MpdDishName}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal Rating */}
      <Modal
        visible={ratingModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-4">
          <View className="bg-card border border-border w-full max-w-sm rounded-2xl p-5 shadow-xl">
            <Text className="text-foreground text-lg font-poppins-bold text-center mb-4">
              Califica este menú
            </Text>
            
            {selectedDetail && (
              <View 
                className={`bg-secondary p-3 rounded-xl border-l-4 mb-4 ${!selectedDetail.MtpColor ? 'border-l-primary' : ''}`}
                style={selectedDetail.MtpColor ? { borderLeftColor: selectedDetail.MtpColor } : {}}
              >
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="font-poppins-bold text-sm uppercase text-foreground">
                    {selectedDetail.MsvName?.toUpperCase()}
                  </Text>
                  <View 
                    className={`px-2 py-0.5 rounded-md ${!selectedDetail.MtpColor ? 'bg-primary/20' : ''}`}
                    style={selectedDetail.MtpColor ? { backgroundColor: `${selectedDetail.MtpColor}33` } : {}}
                  >
                    <Text 
                      className={`text-[9px] font-poppins-bold tracking-wider ${!selectedDetail.MtpColor ? 'text-primary' : ''}`}
                      style={selectedDetail.MtpColor ? { color: selectedDetail.MtpColor } : {}}
                    >
                      {selectedDetail.MtpName?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text className="text-foreground/90 font-poppins text-xs leading-4" numberOfLines={2}>
                  {selectedDetail.MpdDishName}
                </Text>
              </View>
            )}

            <Text className="text-foreground font-poppins-semibold text-sm mb-3">Calificación</Text>
            <View className="flex-row justify-between mb-6 px-6">
              {[1,2,3,4,5].map(star => (
                <Pressable key={star} onPress={() => setRating(star)}>
                  <Star 
                    size={28} 
                    color={star <= rating ? "#f59e0b" : "#a0aec0"} 
                    fill={star <= rating ? "#f59e0b" : "transparent"} 
                  />
                </Pressable>
              ))}
            </View>

            <View className="flex-row justify-between items-end mb-2">
              <Text className="text-foreground font-poppins-semibold text-sm">Comentario (Opcional)</Text>
              <Text className="text-muted-foreground font-poppins text-[10px]">
                {comment.length}/255
              </Text>
            </View>
            <TextInput
              className="bg-secondary/50 text-foreground font-poppins text-sm px-4 py-3 rounded-xl border border-border mb-6 min-h-[80px]"
              placeholder="¿Qué te pareció el menú?"
              placeholderTextColor="#888"
              multiline
              textAlignVertical="top"
              maxLength={255}
              value={comment}
              onChangeText={setComment}
            />

            <View className="flex-row justify-between gap-3">
              <Pressable 
                onPress={() => setRatingModalVisible(false)}
                className="flex-1 bg-secondary border border-border py-2.5 rounded-xl items-center"
                disabled={isSavingRating}
              >
                <Text className="text-foreground font-poppins-semibold text-sm">Cancelar</Text>
              </Pressable>
              <Pressable 
                onPress={handleSaveRating}
                className={`flex-1 py-2.5 rounded-xl items-center ${isSavingRating ? 'bg-primary/50' : 'bg-primary'}`}
                disabled={isSavingRating}
              >
                <Text className="text-primary-foreground font-poppins-semibold text-sm">
                  {isSavingRating ? 'Guardando...' : 'Guardar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
