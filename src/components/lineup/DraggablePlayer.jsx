import React from "react";
import { Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

export default function DraggablePlayer({ player, onDrop }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(false);

  const gesture = Gesture.Pan()
    .onStart(() => {
      dragging.value = true;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
   .onEnd((e) => {
  dragging.value = false;

  if (onDrop) {
    runOnJS(onDrop)(player, {
      x: e.absoluteX,
      y: e.absoluteY,
    });
  }

  translateX.value = withSpring(0);
  translateY.value = withSpring(0);
});

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    zIndex: dragging.value ? 999 : 1,
    elevation: dragging.value ? 999 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.player, animatedStyle]}>
        <Text style={styles.number}>{player.jerseyNumber}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {player.name}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  player: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  number: {
    color: "#fff",
    fontWeight: "700",
  },
  name: {
    color: "#E5E7EB",
    fontSize: 10,
  },
});
