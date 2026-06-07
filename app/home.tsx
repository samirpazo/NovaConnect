import * as React from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/stores/useAuthStore';
import { SettingsIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Inicio', 
          headerLeft: () => null,
          headerRight: () => (
            <Button variant="ghost" size="icon" onPress={() => router.push('/settings' as any)} className="mr-2">
              <Icon as={SettingsIcon} className="text-foreground" />
            </Button>
          )
        }} 
      />
      <View className="flex-1 items-center justify-center gap-8 p-4 bg-background">
        <View className="items-center gap-2">
          <Text className="text-2xl font-bold text-foreground">
            ¡Hola, {user?.PrsName || 'Colaborador'}!
          </Text>
          <Text className="text-muted-foreground">
            Bienvenido a Nova Connect.
          </Text>
        </View>

        <Button onPress={handleLogout} variant="destructive">
          <Text>Cerrar Sesión</Text>
        </Button>
      </View>
    </>
  );
}
