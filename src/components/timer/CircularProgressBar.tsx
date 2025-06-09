import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressBarProps {
  progress: Animated.SharedValue<number>;
  size?: number;
  strokeWidth?: number;
  gradientColors?: string[];
  bgColor?: string;
  children?: React.ReactNode;
  isActive?: boolean;
}

export const CircularProgressBar = ({
  progress,
  size = 240,
  strokeWidth = 15,
  gradientColors = ['#4FC3F7', '#00B0FF', '#0091EA'],
  bgColor = 'rgba(255, 255, 255, 0.1)',
  children,
  isActive = true
}: CircularProgressBarProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference * (1 - progress.value),
    };
  });

  const containerStyle = {
    width: size,
    height: size,
    ...styles.container
  };

  return (
    <View style={containerStyle}>
      <ExpoGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)']}
        style={[StyleSheet.absoluteFill, styles.backgroundGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradientColors[0]} stopOpacity="1" />
            <Stop offset="0.5" stopColor={gradientColors[1]} stopOpacity="1" />
            <Stop offset="1" stopColor={gradientColors[2]} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* Arka plan çemberi */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* İlerleme çemberi */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={isActive ? strokeWidth : 0}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          fill="transparent"
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      
      {/* İçerik - zamanı veya diğer bileşenleri göstermek için */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  svg: {
    position: 'absolute',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  backgroundGradient: {
    borderRadius: 999,
  }
}); 