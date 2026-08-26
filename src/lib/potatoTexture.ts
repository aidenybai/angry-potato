import { useMemo } from 'react'
import * as THREE from 'three'

export function usePotatoTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not create the potato texture')
    }

    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font =
      '205px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
    context.fillText('🥔', 128, 134)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false

    return texture
  }, [])
}
