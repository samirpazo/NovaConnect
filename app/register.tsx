import * as React from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { AlertHelper } from '@/lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authService } from '@/services/authService';
import { hashPassword } from '@/lib/security';
import { ChevronLeft, Delete } from 'lucide-react-native';
import { useAuthStore } from "@/stores/useAuthStore";
import { usePreferenceStore } from "@/stores/usePreferenceStore";
import { secCollaboratorPreferenceService } from "@/services/secCollaboratorPreferenceService";
import { storage } from "@/lib/storage";

export default function RegisterScreen() {
  const { doc, prsId } = useLocalSearchParams();
  const { login } = useAuthStore();
  const { setPreferences } = usePreferenceStore();
  const [step, setStep] = React.useState(1);
  const [firstPin, setFirstPin] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Parse prsId to number, since URL params are strings
  const parsedPrsId = prsId ? parseInt(prsId as string, 10) : null;

  const handleContinue = () => {
    if (pin.length < 6) {
      AlertHelper.alert('Error', 'El PIN debe tener 6 dígitos.');
      return;
    }
    setFirstPin(pin);
    setPin('');
    setStep(2);
  };

  const handleRegister = async () => {
    if (pin.length < 6) {
      AlertHelper.alert('Error', 'El PIN debe tener 6 dígitos.');
      return;
    }

    if (pin !== firstPin) {
      AlertHelper.alert('Error', 'Los PINs no coinciden. Por favor, inténtalo de nuevo.');
      setPin('');
      return;
    }

    if (!parsedPrsId) {
      AlertHelper.alert('Error', 'No se ha proporcionado un ID válido.');
      return;
    }

    setIsLoading(true);
    
    // Hash in frontend just like Login
    const hashedPin = hashPassword(pin);

    // Call the Save flow
    const result = await authService.registerCollaborator(parsedPrsId, hashedPin);

    setIsLoading(false);

    if (result.success) {
      // Auto login!
      const loginResult = await login({
        DocumentNumber: doc as string,
        Password: hashedPin,
      });

      if (loginResult.success) {
        await storage.setItem("savedDocumentNumber", doc as string);
        
        try {
          const pref = await secCollaboratorPreferenceService.getMyPreferences();
          if (pref) {
            setPreferences(
              (pref.Theme as any) || "system",
              pref.PrimaryColor || "#002aff",
            );
          }
        } catch (e) {
          console.log("Failed to load user preferences", e);
        }

        AlertHelper.alert('¡Éxito!', 'Te has registrado correctamente.', [
          { text: 'Comenzar', onPress: () => router.replace('/(protected)/home') }
        ]);
      } else {
        AlertHelper.alert('¡Éxito!', 'Te has registrado correctamente. Por favor inicia sesión.', [
          { text: 'Ir al Login', onPress: () => router.replace('/') }
        ]);
      }
    } else {
      AlertHelper.alert('Error', result.error || 'No se pudo completar el registro.');
    }
  };

  const handlePinPress = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handleDeletePin = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setPin(firstPin);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  };

  const keypadItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "del"];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow items-center justify-center p-6">
          
          <View className="absolute top-12 left-6 z-10">
             <Pressable onPress={handleBack} className="p-2">
                <ChevronLeft size={28} className="text-muted-foreground" />
             </Pressable>
          </View>

          <View className="items-center mb-8 mt-10">
            <Image 
              source={require('@/assets/images/logo-nova.svg')} 
              style={{ width: 60, height: 60, resizeMode: 'contain' }}
              className="mb-4"
            />
            <Text className="text-2xl font-bold font-poppins text-foreground">
              Nova Connect
            </Text>
          </View>

          <Animated.View key={step} entering={FadeInDown.duration(400).springify()} className="bg-card w-full max-w-[300px] mt-2 self-center rounded-3xl p-6 shadow-sm dark:shadow-xl">
            <View className="items-center mb-3">
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-[10px] font-bold text-primary font-poppins uppercase tracking-widest">
                  Paso {step} de 2
                </Text>
              </View>
            </View>
            <Text className="text-xl font-bold font-poppins text-center text-foreground mb-4">
              {step === 1 ? 'Crea tu PIN' : 'Confirma tu PIN'}
            </Text>
                
                {/* Custom PIN Dots */}
                <View className="flex-row gap-3 mb-6 justify-center">
                  {[...Array(6)].map((_, i) => (
                    <View 
                      key={i} 
                      className={`size-3 rounded-full ${i < pin.length ? 'bg-primary' : 'bg-muted'}`} 
                    />
                  ))}
                </View>

                {/* Custom Keypad */}
                <View className="w-full flex-row flex-wrap justify-center gap-3 mb-5">
                  {keypadItems.map((item, i) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        if (item === 'del') handleDeletePin();
                        else if (item !== '') handlePinPress(item.toString());
                      }}
                      className={`w-[30%] h-10 items-center justify-center rounded-lg ${item !== "" ? "bg-secondary active:bg-muted" : "opacity-0"}`}
                      disabled={item === ""}
                    >
                      {item === 'del' ? (
                        <Delete size={20} className="text-muted-foreground" />
                      ) : item !== '' ? (
                        <Text className="text-xl font-bold text-foreground font-poppins select-none">{item}</Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>

                {step === 1 ? (
                  <Button 
                    onPress={handleContinue} 
                    disabled={pin.length < 6}
                    className="w-full h-12 rounded-xl"
                  >
                    <Text className="text-primary-foreground font-poppins text-base font-medium">
                      Continuar
                    </Text>
                  </Button>
                ) : (
                  <Button 
                    onPress={handleRegister} 
                    disabled={isLoading || pin.length < 6}
                    className="w-full h-12 rounded-xl"
                  >
                    <Text className="text-primary-foreground font-poppins text-base font-medium">
                      {isLoading ? 'Registrando...' : 'Finalizar Registro'}
                    </Text>
                  </Button>
                )}
              </Animated.View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
