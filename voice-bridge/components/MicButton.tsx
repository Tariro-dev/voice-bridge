import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

type Props = {
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
  size?: number;
  testID?: string;
};

export function MicButton({
  active,
  disabled,
  onPress,
  size = 56,
  testID,
}: Props) {
  const c = useColors();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.55, { duration: 600 }),
          withTiming(0, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1);
      opacity.value = withTiming(0);
    }
  }, [active, scale, opacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: size + 24, height: size + 24, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: c.primary,
          },
          ringStyle,
        ]}
      />
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.btn,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: active ? c.surface2 : c.primary,
            borderWidth: active ? 2 : 0,
            borderColor: c.destructive,
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons
          name={active ? "stop" : "mic"}
          size={size * 0.42}
          color={active ? c.destructive : c.primaryForeground}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: "center", justifyContent: "center" },
});
