import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'

import { Text } from './ui'
import { Colors, Radius, Spacing } from '../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export interface BalanceData {
  theyOweMe: number
  iOweThem: number
}

interface SlideData {
  label: string
  rawValue: number
  valueColor: string
  prefix?: string
  sub?: string
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const CARD_WIDTH = Dimensions.get('window').width - Spacing.lg * 2

function buildSlides(data: BalanceData): SlideData[] {
  const { theyOweMe, iOweThem } = data
  const net = theyOweMe - iOweThem
  const isPositive = net >= 0
  const isZero = net === 0

  return [
    {
      label: 'Saldo líquido',
      rawValue: Math.abs(net),
      prefix: (!isZero && !isPositive) ? '−' : undefined,
      valueColor: isZero
        ? Colors.neutral.secondary
        : isPositive
          ? Colors.status.credit
          : Colors.status.debt,
      sub: undefined,
    },
    {
      label: 'A receber',
      rawValue: theyOweMe,
      valueColor: Colors.status.credit,
      sub: undefined,
    },
    {
      label: 'A pagar',
      rawValue: iOweThem,
      valueColor: Colors.status.debt,
      sub: undefined,
    },
  ]
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE COM COUNT-UP
// ═══════════════════════════════════════════════════════════════════

interface SlideItemProps {
  slide: SlideData
  isActive: boolean
}

function SlideItem({ slide, isActive }: SlideItemProps) {
  const animated = useRef(new Animated.Value(0)).current
  const [displayed, setDisplayed] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isActive) return
    // Reseta e anima cada vez que o slide fica ativo
    animated.setValue(0)
    setDisplayed(0)
    hasAnimated.current = true

    const listener = animated.addListener(({ value }) => {
      setDisplayed(value)
    })

    Animated.timing(animated, {
      toValue: slide.rawValue,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      animated.removeListener(listener)
    })

    return () => {
      animated.removeListener(listener)
    }
  }, [isActive, slide.rawValue])

  const formatted = `${slide.prefix ?? ''}${formatBRL(displayed)}`

  return (
    <View style={styles.slide}>
      <Text variant="caption" color={Colors.neutral.secondary} style={styles.label}>
        {slide.label}
      </Text>
      <Text variant="display" color={slide.valueColor} weight="800" style={styles.value}>
        {formatted}
      </Text>
      {slide.sub ? (
        <Text variant="caption" color={Colors.neutral.placeholder} style={styles.sub}>
          {slide.sub}
        </Text>
      ) : null}
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

export function BalanceCard({ data }: BalanceCardProps) {
  const slides = buildSlides(data)
  const [activeIndex, setActiveIndex] = useState(0)

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH)
    if (index !== activeIndex) setActiveIndex(index)
  }

  return (
    <View style={styles.wrapper}>
      {/* ── Carrossel ── */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="center"
      >
        {slides.map((slide, i) => (
          <SlideItem key={i} slide={slide} isActive={i === activeIndex} />
        ))}
      </ScrollView>

      {/* ── Indicadores ── */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
    </View>
  )
}

interface BalanceCardProps {
  data: BalanceData
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },

  slide: {
    width: CARD_WIDTH,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    marginTop: Spacing.xs,
  },
  sub: {
    textAlign: 'center',
    marginTop: 2,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: Spacing.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.brand.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: Colors.neutral.border,
  },
})
