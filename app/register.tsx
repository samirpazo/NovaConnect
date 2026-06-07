import * as React from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert, Image, Pressable, Animated } from 'react-native';
import { router, Stack } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { authService } from '@/services/authService';
import { hashPassword } from '@/lib/security';
import { ChevronLeft } from 'lucide-react-native';

export default function RegisterScreen() {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [document, setDocument] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Animation values for transition
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const handleNextStep = () => {
    if (!document || document.length < 8) {
      Alert.alert('Error', 'Ingrese un documento válido.');
      return;
    }

    // Animate out step 1 and animate in step 2
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setStep(2);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start();
    });
  };

  const handleRegister = async () => {
    if (pin.length < 4) {
      Alert.alert('Error', 'El PIN debe tener al menos 4 dígitos.');
      return;
    }

    setIsLoading(true);
    
    // Hash in frontend just like Login
    const hashedPin = hashPassword(pin);

    const result = await authService.registerCollaborator({
      DocumentNumber: document,
      Password: hashedPin,
    });

    setIsLoading(false);

    if (result.success) {
      Alert.alert('¡Éxito!', 'Te has registrado correctamente. Ahora puedes iniciar sesión con tu DNI y tu nuevo PIN.', [
        { text: 'Ir al Login', onPress: () => router.replace('/') }
      ]);
    } else {
      Alert.alert('Error', result.error || 'No se pudo completar el registro.');
      // Regresar al paso 1 en caso de error para que corrija DNI si fuera necesario
      setStep(1);
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white dark:bg-zinc-950">
        <ScrollView contentContainerClassName="flex-grow items-center justify-center p-6">
          
          <View className="absolute top-12 left-6 z-10">
             <Pressable onPress={() => router.back()} className="p-2">
                <ChevronLeft size={28} className="text-zinc-800 dark:text-zinc-200" />
             </Pressable>
          </View>

          <View className="items-center mb-10 mt-10">
            <Image 
              source={require('@/assets/images/logo-nova.svg')} 
              style={{ width: 60, height: 60, resizeMode: 'contain' }}
              className="mb-4"
            />
            <Text className="text-2xl font-bold font-poppins text-zinc-900 dark:text-zinc-50">
              Nova Connect
            </Text>
          </View>

          <Animated.View 
            style={{ 
              opacity: fadeAnim, 
              transform: [{ translateX: slideAnim }],
              width: '100%',
              maxWidth: 320,
              alignItems: 'center'
            }}
          >
            {step === 1 ? (
              <View className="w-full gap-6">
                <Text className="text-3xl font-bold font-poppins text-center text-zinc-900 dark:text-zinc-50 mb-4">
                  Crea tu cuenta
                </Text>
                
                <View className="gap-2">
                  <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400">DNI</Text>
                  <Input
                    placeholder="Ingresa tu DNI"
                    value={document}
                    onChangeText={setDocument}
                    keyboardType="numeric"
                    className="h-14 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-lg font-poppins"
                  />
                </View>

                <Button 
                  onPress={handleNextStep} 
                  className="w-full h-14 rounded-xl mt-4"
                  style={{ backgroundColor: '#002aff' }} // Vibrant Blue
                >
                  <Text className="text-white text-lg font-semibold font-poppins">Validar DNI</Text>
                </Button>
              </View>
            ) : (
              <View className="w-full items-center gap-8">
                <Text className="text-2xl font-bold font-poppins text-center text-zinc-900 dark:text-zinc-50">
                  Crea tu PIN
                </Text>
                
                {/* Custom PIN Dots */}
                <View className="flex-row gap-4 mb-4">
                  {[...Array(6)].map((_, i) => (
                    <View 
                      key={i} 
                      className={`size-4 rounded-full ${i < pin.length ? 'bg-[#002aff]' : 'bg-zinc-200 dark:bg-zinc-800'}`} 
                    />
                  ))}
                </View>

                {/* Custom Keypad */}
                <View className="w-full flex-row flex-wrap justify-center gap-4 px-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((item, i) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        if (item === 'del') handleDeletePin();
                        else if (item !== '') handlePinPress(item.toString());
                      }}
                      className="w-[28%] aspect-square items-center justify-center rounded-full active:bg-zinc-100 dark:active:bg-zinc-900"
                    >
                      {item === 'del' ? (
                        <Text className="text-xl font-medium text-zinc-600 font-poppins">DEL</Text>
                      ) : item !== '' ? (
                        <Text className="text-3xl font-medium text-zinc-900 dark:text-zinc-100 font-poppins">{item}</Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>

                <Button 
                  onPress={handleRegister} 
                  disabled={isLoading || pin.length < 4}
                  className="w-full h-14 rounded-xl"
                  style={{ backgroundColor: '#002aff', opacity: (isLoading || pin.length < 4) ? 0.7 : 1 }}
                >
                  <Text className="text-white text-lg font-semibold font-poppins">
                    {isLoading ? 'Registrando...' : 'Finalizar Registro'}
                  </Text>
                </Button>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
