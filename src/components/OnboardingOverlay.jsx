import React, {useEffect, useRef, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const {height: SH} = Dimensions.get('window');

// ─── DESIGN TOKENS ───────────────────────────
const C = {
  blue:        '#2563EB',
  blueSoft:    '#EFF6FF',
  borderBlue:  '#DBEAFE',
  cardBg:      '#FFFFFF',
  pageBg:      '#F1F5F9',
  textPrimary: '#0F172A',
  textSecond:  '#475569',
  textMuted:   '#94A3B8',
  textWhite:   '#FFFFFF',
  border:      '#E2E8F0',
};

export default function OnboardingOverlay({visible, steps, onFinish}) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const step   = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  useEffect(() => {
    if (visible) animateIn();
  }, [visible, currentStep]);

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    scaleAnim.setValue(0.92);
    Animated.parallel([
      Animated.timing(fadeAnim,  {toValue: 1,    duration: 300, useNativeDriver: true}),
      Animated.spring(slideAnim, {toValue: 0,    damping: 14,   useNativeDriver: true}),
      Animated.spring(scaleAnim, {toValue: 1,    damping: 14,   useNativeDriver: true}),
    ]).start();
  };

  const animateOut = cb => {
    Animated.parallel([
      Animated.timing(fadeAnim,  {toValue: 0,    duration: 200, useNativeDriver: true}),
      Animated.timing(scaleAnim, {toValue: 0.92, duration: 200, useNativeDriver: true}),
    ]).start(cb);
  };

  const next = () => {
    if (isLast) {
      animateOut(() => {onFinish(); setCurrentStep(0);});
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const skip = () => {
    animateOut(() => {onFinish(); setCurrentStep(0);});
  };

  // Position card based on step.position
  const positionStyle = {
    top:    {justifyContent: 'flex-start', paddingTop: SH * 0.12},
    center: {justifyContent: 'center'},
    bottom: {justifyContent: 'flex-end',   paddingBottom: SH * 0.14},
  }[step?.position || 'center'];

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={skip}
      statusBarTranslucent>

      <Animated.View style={[styles.backdrop, {opacity: fadeAnim}]}>
        <View style={[styles.posWrap, positionStyle]}>
          <Animated.View style={[
            styles.card,
            {transform: [{translateY: slideAnim}, {scale: scaleAnim}]},
          ]}>

            {/* Progress dots */}
            <View style={styles.dotsRow}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === currentStep && styles.dotActive]}
                />
              ))}
            </View>

            {/* Emoji icon */}
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{step?.emoji}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{step?.title}</Text>

            {/* Body */}
            <Text style={styles.body}>{step?.body}</Text>

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={skip}
                activeOpacity={0.8}>
                <Text style={styles.skipTxt}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextBtn}
                onPress={next}
                activeOpacity={0.85}>
                <Text style={styles.nextTxt}>
                  {isLast ? 'Get Started ✓' : 'Next →'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Step counter */}
            <Text style={styles.counter}>
              {currentStep + 1} of {steps.length}
            </Text>

          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  posWrap: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 22,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.border,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.blue,
  },
  emojiWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: C.borderBlue,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    color: C.textSecond,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 28,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  skipBtn: {
    flex: 1,
    backgroundColor: C.pageBg,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  skipTxt: {
    fontSize: 14,
    color: C.textSecond,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 2,
    backgroundColor: C.blue,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: C.blue,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextTxt: {
    fontSize: 15,
    color: C.textWhite,
    fontWeight: '800',
  },
  counter: {
    marginTop: 14,
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '600',
  },
});