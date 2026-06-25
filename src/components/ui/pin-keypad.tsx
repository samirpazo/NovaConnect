import React from "react";
import { View, Pressable, Text, Platform } from "react-native";
import { Delete, Fingerprint, ScanFace } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface PinKeypadProps {
  pin: string;
  onPinChange: (pin: string) => void;
  primaryColor: string;
  maxLength?: number;
  showBiometric?: boolean;
  isBiometricSupported?: boolean;
  isBiometricEnabled?: boolean;
  onBiometric?: () => void;
  shuffle?: boolean;
}

export function PinKeypad({
  pin,
  onPinChange,
  primaryColor,
  maxLength = 6,
  showBiometric = false,
  isBiometricSupported = false,
  isBiometricEnabled = false,
  onBiometric,
  shuffle = false,
}: PinKeypadProps) {
  const { colorScheme } = useAppTheme();
  const [shuffledNumbers, setShuffledNumbers] = React.useState<number[]>([]);

  React.useEffect(() => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    if (shuffle) {
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }
    }
    setShuffledNumbers(nums);
  }, [shuffle]);

  const handlePinPress = (num: string) => {
    if (pin.length < maxLength) {
      onPinChange(pin + num);
    }
  };

  const handleDeletePin = () => {
    onPinChange(pin.slice(0, -1));
  };

  const keypadItems = shuffledNumbers.length > 0 ? [
    ...shuffledNumbers.slice(0, 3),
    ...shuffledNumbers.slice(3, 6),
    ...shuffledNumbers.slice(6, 9),
    showBiometric ? "bio" : "",
    shuffledNumbers[9],
    "del",
  ] : [];

  return (
    <View className="w-full max-w-[280px] self-center">
      {/* PIN Dots */}
      <View className="flex-row gap-2.5 mb-4 justify-center">
        {[...Array(maxLength)].map((_, i) => (
          <View
            key={i}
            className={`size-2.5 rounded-full ${i < pin.length ? "" : "bg-muted"}`}
            style={
              i < pin.length ? { backgroundColor: primaryColor || "#002aff" } : {}
            }
          />
        ))}
      </View>

      {/* Keypad */}
      <View className="w-full flex-row flex-wrap justify-center gap-2 mb-2">
        {keypadItems.map((item, i) => {
          if (item === "" && !showBiometric) {
            return <View key={i} className="w-[30%] h-11" />; // Empty placeholder
          }

          return (
            <Pressable
              key={i}
              onPress={() => {
                if (item === "del") handleDeletePin();
                else if (item === "bio") {
                  if (onBiometric) onBiometric();
                } else if (item !== "") {
                  handlePinPress(item.toString());
                }
              }}
              disabled={item === "bio" && !isBiometricSupported}
              className={`w-[30%] h-11 items-center justify-center rounded-xl ${
                item !== "bio" && item !== "" ? "bg-secondary/60 active:bg-muted" : ""
              } ${item === "bio" && !isBiometricSupported ? "opacity-0" : ""}`}
            >
              {item === "del" ? (
                <Delete size={20} color={colorScheme === "dark" ? "#a1a1aa" : "#71717a"} />
              ) : item === "bio" ? (
                isBiometricSupported ? (
                  Platform.OS === "ios" ? (
                    <ScanFace
                      size={24}
                      color={
                        isBiometricEnabled ? primaryColor || "#002aff" : (colorScheme === "dark" ? "#a1a1aa" : "#71717a")
                      }
                    />
                  ) : (
                    <Fingerprint
                      size={24}
                      color={
                        isBiometricEnabled ? primaryColor || "#002aff" : (colorScheme === "dark" ? "#a1a1aa" : "#71717a")
                      }
                    />
                  )
                ) : null
              ) : item !== "" ? (
                <Text className="text-xl font-poppins-semibold text-foreground select-none">
                  {item}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
