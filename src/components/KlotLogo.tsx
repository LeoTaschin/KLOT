import React from 'react'
import Svg, { Path } from 'react-native-svg'

interface KlotLogoProps {
  size?: number
  color?: string
}

export function KlotLogo({ size = 48, color = '#0D9488' }: KlotLogoProps) {
  // Viewbox original: 168x155
  const aspectRatio = 155 / 168
  const width = size
  const height = size * aspectRatio

  return (
    <Svg width={width} height={height} viewBox="0 0 168 155" fill="none">
      <Path
        d="M8.09091 124V30.9091H27.7727V71.9545H29L62.5 30.9091H86.0909L51.5455 72.5909L86.5 124H62.9545L37.4545 85.7273L27.7727 97.5455V124H8.09091Z"
        fill={color}
      />
      <Path
        d="M159.909 124V30.9091H140.227V71.9545H139L105.5 30.9091H81.9091L116.455 72.5909L81.5 124H105.045L130.545 85.7273L140.227 97.5455V124H159.909Z"
        fill={color}
      />
    </Svg>
  )
}
