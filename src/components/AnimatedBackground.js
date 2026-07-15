import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const ORB_SIZE = width * 0.8;

export default function AnimatedBackground() {
  const orb1X = useSharedValue(-ORB_SIZE / 2);
  const orb1Y = useSharedValue(-ORB_SIZE / 2);

  const orb2X = useSharedValue(width - ORB_SIZE / 2);
  const orb2Y = useSharedValue(height / 2);

  useEffect(() => {
    // Orb 1 moves in a slow oval/diagonal
    orb1X.value = withRepeat(
      withSequence(
        withTiming(width / 3, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-ORB_SIZE / 2, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(height / 4, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-ORB_SIZE / 2, { duration: 10000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Orb 2 moves opposite
    orb2X.value = withRepeat(
      withSequence(
        withTiming(width / 4, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
        withTiming(width - ORB_SIZE / 2, { duration: 9000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(height - ORB_SIZE, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
        withTiming(height / 2, { duration: 11000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base Background Color (so it's not totally white) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF0F0' }]} />

      {/* Orb 1: Coral */}
      <Animated.View
        style={[
          styles.orb,
          { backgroundColor: COLORS.primary },
          orb1Style,
        ]}
      />

      {/* Orb 2: Orange */}
      <Animated.View
        style={[
          styles.orb,
          { backgroundColor: COLORS.primaryLight },
          orb2Style,
        ]}
      />

      {/* Heavy Blur to create the Glass/Mesh Gradient effect */}
      <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    opacity: 0.6, // Semi-transparent to blend nicely
  },
});
