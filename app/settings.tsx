import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { secCollaboratorPreferenceService } from '@/services/secCollaboratorPreferenceService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoonStarIcon, SunIcon, MonitorIcon, CheckIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Alert } from 'react-native';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: SunIcon },
  { value: 'dark', label: 'Oscuro', icon: MoonStarIcon },
  { value: 'system', label: 'Sistema', icon: MonitorIcon },
] as const;

const COLORS = [
  { value: '#002aff', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f43f5e', label: 'Rojo' },
  { value: '#8b5cf6', label: 'Púrpura' },
  { value: '#f97316', label: 'Naranja' },
  { value: '#14b8a6', label: 'Teal' },
] as const;

export default function SettingsScreen() {
  const { theme, primaryColor, setPreferences } = usePreferenceStore();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await secCollaboratorPreferenceService.savePreferences({
        Theme: theme,
        PrimaryColor: primaryColor,
      });
      Alert.alert('Éxito', 'Preferencias guardadas en la nube correctamente.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Hubo un error al guardar las preferencias en la nube.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Configuración' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>
                Personaliza cómo se ve la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-6">
              <View className="gap-3">
                <Text className="text-sm font-medium text-foreground">Tema</Text>
                <View className="flex-row flex-wrap gap-2">
                  {THEME_OPTIONS.map((option) => {
                    const isSelected = theme === option.value;
                    return (
                      <Button
                        key={option.value}
                        variant={isSelected ? 'default' : 'outline'}
                        onPress={() => setPreferences(option.value, primaryColor)}
                        className="flex-1 min-w-[100px] flex-row gap-2"
                      >
                        <Icon 
                          as={option.icon} 
                          className={`size-4 ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`} 
                        />
                        <Text className={isSelected ? 'text-primary-foreground' : 'text-foreground'}>
                          {option.label}
                        </Text>
                      </Button>
                    );
                  })}
                </View>
              </View>

              <View className="gap-3">
                <Text className="text-sm font-medium text-foreground">Color Principal</Text>
                <View className="flex-row flex-wrap gap-3">
                  {COLORS.map((color) => {
                    const isSelected = primaryColor === color.value;
                    return (
                      <Button
                        key={color.value}
                        onPress={() => setPreferences(theme, color.value)}
                        className={`size-12 rounded-full border-2 p-0 items-center justify-center ${isSelected ? 'border-foreground' : 'border-transparent'}`}
                        style={{ 
                          backgroundColor: color.value,
                        }}
                      >
                        {isSelected && (
                          <Icon as={CheckIcon} className="size-6 text-white" />
                        )}
                      </Button>
                    );
                  })}
                </View>
              </View>
            </CardContent>
          </Card>

          <Button 
            onPress={handleSave} 
            disabled={isSaving}
            className="w-full"
          >
            <Text>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</Text>
          </Button>
        </View>
      </ScrollView>
    </>
  );
}
