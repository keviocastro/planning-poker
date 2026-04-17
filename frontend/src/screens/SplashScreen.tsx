import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { Spade, Diamond, Club, Heart } from 'lucide-react-native';
import { useIntl } from 'react-intl';

export default function SplashScreen() {
  const intl = useIntl();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Bouncing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -20,
          duration: 600,
          easing: Easing.bezier(0.33, 1, 0.68, 1),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.bezier(0.32, 0, 0.67, 0),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in text
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.cardContainer, { transform: [{ translateY: bounceAnim }] }]}>
        <Animated.View style={[styles.card, { transform: [{ rotate: spin }] }]}>
          <View style={styles.suitRow}>
            <Spade size={24} color="#2c3e50" />
            <Heart size={24} color="#e74c3c" />
          </View>
          <Text style={styles.cardCenter}>P</Text>
          <View style={styles.suitRow}>
            <Diamond size={24} color="#e74c3c" />
            <Club size={24} color="#2c3e50" />
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.View style={{ opacity: opacityAnim, alignItems: 'center' }}>
        <Text style={styles.title}>{intl.formatMessage({ id: 'splash.title' })}</Text>
        <Text style={styles.subtitle}>{intl.formatMessage({ id: 'splash.subtitle' })}</Text>
        <View style={styles.loadingDots}>
          {[0, 1, 2].map((i) => (
            <Dot key={i} delay={i * 200} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.dot, 
        { 
          opacity: anim,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }]
        }
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    marginBottom: 40,
  },
  card: {
    width: 100,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  suitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardCenter: {
    fontSize: 40,
    fontWeight: '900',
    color: '#4a90e2',
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#eef6ff',
    opacity: 0.8,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});
