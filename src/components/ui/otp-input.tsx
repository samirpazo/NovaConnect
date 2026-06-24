import React, { useRef, useState } from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { usePreferenceStore } from "@/stores/usePreferenceStore";

interface OtpInputProps {
  value: string;
  onChangeText: (val: string) => void;
  length?: number;
  secureTextEntry?: boolean;
}

export function OtpInput({
  value,
  onChangeText,
  length = 6,
  secureTextEntry = false,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { primaryColor: storePrimaryColor } = usePreferenceStore();
  
  const primaryColor =
    storePrimaryColor?.toLowerCase() === "#ff0000" ||
    storePrimaryColor?.toLowerCase() === "ff0000"
      ? "#002aff"
      : storePrimaryColor || "#002aff";

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View className="w-full relative py-1">
      <Pressable
        onPress={handlePress}
        className="flex-row justify-center gap-2 w-full"
      >
        {Array(length)
          .fill(0)
          .map((_, index) => {
            const isCurrentBox = value.length === index || (index === length - 1 && value.length === length);
            const isActive = isFocused && isCurrentBox;
            const hasValue = !!value[index];

            return (
              <View
                key={index}
                className="flex-1 max-w-[45px] h-12 rounded-xl border items-center justify-center bg-secondary"
                style={{
                  borderColor: isActive ? primaryColor : "rgba(150, 150, 150, 0.2)",
                  borderWidth: isActive ? 2 : 1,
                }}
              >
                <Text className="text-xl font-poppins-bold text-foreground">
                  {hasValue ? (secureTextEntry ? "•" : value[index]) : ""}
                </Text>
              </View>
            );
          })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        maxLength={length}
        keyboardType="numeric"
        className="absolute opacity-0 w-full h-full"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        caretHidden
      />
    </View>
  );
}
