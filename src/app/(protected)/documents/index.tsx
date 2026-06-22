import { Text } from "@/components/ui/text";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { Calendar, ChevronRight, FileText } from "lucide-react-native";
import { View, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProcessedDocuments } from "@/hooks/useProcessedDocuments";
import { processedDocumentService } from "@/services/processedDocumentService";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ProcessedDocument } from "@/types/document";
import { AlertHelper } from "@/lib/alert";
import { showToast } from "@/lib/toast";

export default function DocumentsScreen() {
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  const primaryColor = storePrimaryColor || "#002aff";
  
  const { documents, isLoading, isRefreshing, refetch } = useProcessedDocuments(false);

  const handleOpenPdf = async (fileName: string) => {
    try {
      await processedDocumentService.openPdf(fileName, primaryColor);
    } catch (error) {
      showToast.error("Error", "No se pudo abrir el documento.");
    }
  };

  const handleDocumentPress = (item: ProcessedDocument) => {
    AlertHelper.alert(
      "Confirmar recepción",
      `¿Deseas recepcionar el documento de ${item.PdcPeriodMonth} ${item.PdcPeriodYear}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Recepcionar",
          style: "default",
          onPress: async () => {
            try {
              const success = await processedDocumentService.receiveDocument(item);
              if (success) {
                showToast.success(
                  "Documento recepcionado",
                  "El documento se ha movido a tu historial."
                );
                refetch();
                await handleOpenPdf(item.PdcFilePath);
              } else {
                showToast.error("Error", "No se pudo recepcionar el documento.");
              }
            } catch (error) {
              showToast.error("Error", "Ocurrió un problema al procesar la solicitud.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: ProcessedDocument; index: number }) => {
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <Pressable
          onPress={() => handleDocumentPress(item)}
          className="bg-card rounded-[18px] p-3.5 mb-3 border border-border/40 shadow-sm flex-row items-center active:opacity-70"
        >
          <View 
            className="w-11 h-11 rounded-[14px] items-center justify-center mr-3.5"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <FileText size={20} color={primaryColor} />
          </View>
          
          <View className="flex-1 justify-center">
            <Text className="text-sm font-poppins-semibold text-foreground mb-0.5 tracking-tight">
              Documento
            </Text>
            <View className="flex-row items-center">
              <Calendar size={12} className="text-muted-foreground mr-1" />
              <Text className="text-[11px] font-poppins-medium text-muted-foreground capitalize">
                {item.PdcPeriodMonth} {item.PdcPeriodYear}
              </Text>
            </View>
          </View>
          
          <View className="w-8 h-8 rounded-full bg-secondary/50 items-center justify-center border border-border/50">
            <ChevronRight size={16} className="text-muted-foreground" />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-3xl font-poppins-bold text-foreground tracking-tight">
          Pendientes
        </Text>
        <Text className="text-sm font-poppins-medium text-muted-foreground mt-1">
          Documentos listos para tu revisión.
        </Text>
      </View>

      {isLoading && !isRefreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="mt-4 font-poppins text-muted-foreground text-sm">
            Buscando documentos...
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.PdcID.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 24, paddingBottom: 100, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor={primaryColor}
              colors={[primaryColor]}
            />
          }
          ListEmptyComponent={
            <Animated.View 
              entering={FadeInDown.springify()} 
              style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 }}
            >
              <View
                className="w-24 h-24 rounded-[32px] items-center justify-center mb-6"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <FileText size={40} color={primaryColor} style={{ opacity: 0.6 }} />
              </View>
              <Text className="text-xl font-poppins-bold text-foreground text-center mb-2">
                Todo al día
              </Text>
              <Text className="text-sm font-poppins text-muted-foreground text-center max-w-[250px] leading-5">
                No tienes documentos pendientes por recepcionar en este momento.
              </Text>
            </Animated.View>
          }
        />
      )}
    </SafeAreaView>
  );
}
