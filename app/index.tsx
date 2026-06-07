import * as React from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert, Image, Pressable, Animated } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/stores/useAuthStore';
import { hashPassword } from '@/lib/security';
import { secCollaboratorPreferenceService } from '@/services/secCollaboratorPreferenceService';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { ChevronLeft } from 'lucide-react-native';

export default function LoginScreen() {
  const { login, isAuthenticating } = useAuthStore();
  const { setPreferences } = usePreferenceStore();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [document, setDocument] = React.useState('');
  const [pin, setPin] = React.useState('');

  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const handleNextStep = () => {
    if (!document || document.length < 8) {
      Alert.alert('Error', 'Ingrese un documento válido.');
      return;
    }

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

  const handleBack = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 50, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setStep(1);
      setPin('');
      slideAnim.setValue(-50);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start();
    });
  };

  const handleLogin = async () => {
    if (!document || pin.length < 4) {
      Alert.alert('Error', 'Ingrese credenciales válidas.');
      return;
    }

    const hashedPassword = hashPassword(pin);

    const result = await login({
      DocumentNumber: document,
      Password: hashedPassword,
    });

    if (result.success) {
      try {
        const pref = await secCollaboratorPreferenceService.getMyPreferences();
        if (pref) {
          setPreferences(
            (pref.Theme as any) || 'system',
            pref.PrimaryColor || '#002aff'
          );
        }
      } catch (e) {}
      router.replace('/home');
    } else {
      Alert.alert('Error de autenticación', result.error || 'PIN o documento incorrecto');
      setPin(''); // Reset PIN on error
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white dark:bg-zinc-950"
      >
        <ScrollView contentContainerClassName="flex-grow items-center justify-center p-6">
          
          {step === 2 && (
            <View className="absolute top-12 left-6 z-10">
               <Pressable onPress={handleBack} className="p-2">
                  <ChevronLeft size={28} className="text-zinc-800 dark:text-zinc-200" />
               </Pressable>
            </View>
          )}

          <View className="items-center mb-10 mt-8">
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
                <Text className="text-3xl font-bold font-poppins text-center text-zinc-900 dark:text-zinc-50 mb-2">
                  ¡Bienvenido!
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
                  <Text className="text-white text-lg font-semibold font-poppins">Continuar</Text>
                </Button>

                <Pressable onPress={() => router.push('/register' as any)} className="mt-8 items-center p-2">
                  <Text className="text-zinc-600 dark:text-zinc-400 font-poppins">
                    ¿No tienes una cuenta? <Text className="text-[#002aff] font-semibold">Regístrate aquí</Text>
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="w-full items-center gap-6">
                <Text className="text-2xl font-bold font-poppins text-center text-zinc-900 dark:text-zinc-50 mb-2">
                  Introduce tu PIN
                </Text>
                
                <View className="flex-row gap-4 mb-2">
                  {[...Array(6)].map((_, i) => (
                    <View 
                      key={i} 
                      className={`size-4 rounded-full ${i < pin.length ? 'bg-[#002aff]' : 'bg-zinc-200 dark:bg-zinc-800'}`} 
                    />
                  ))}
                </View>

                {/* Keypad */}
                <View className="w-full flex-row flex-wrap justify-center gap-4 px-2 mb-4">
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
                  onPress={handleLogin} 
                  disabled={isAuthenticating || pin.length < 4}
                  className="w-full h-14 rounded-xl"
                  style={{ backgroundColor: '#002aff', opacity: (isAuthenticating || pin.length < 4) ? 0.7 : 1 }}
                >
                  <Text className="text-white text-lg font-semibold font-poppins">
                    {isAuthenticating ? 'Cargando...' : 'Iniciar Sesión'}
                  </Text>
                </Button>

                <View className="flex-row w-full justify-between mt-4 px-2">
                  <Pressable className="p-2">
                    <Text className="text-[#002aff] font-medium font-poppins">¿Olvidaste tu PIN?</Text>
                  </Pressable>
                  <Pressable onPress={handleBack} className="p-2">
                    <Text className="text-[#002aff] font-medium font-poppins">Cambiar DNI</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
