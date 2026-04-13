import React from 'react'
import Svg, { Circle, Line, Path } from 'react-native-svg'

interface IconProps {
  size?: number
  color?: string
}

export function EyeIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  )
}

export function EyeOffIcon({ size = 20, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1="3" y1="3" x2="21" y2="21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M10.58 10.58A3 3 0 0 0 13.42 13.42M6.36 6.36A10.45 10.45 0 0 0 1 12C1 12 5 20 12 20C13.97 20 15.76 19.44 17.28 18.53M9.9 4.24A10 10 0 0 1 12 4C19 4 23 12 23 12C23 12 21.74 14.37 19.5 16.3"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function ClearIcon({ size = 16, color = '#94A3B8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} opacity={0.2} />
      <Line
        x1="8" y1="8" x2="16" y2="16"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="16" y1="8" x2="8" y2="16"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  )
}
