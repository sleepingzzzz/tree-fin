
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, getParticleTexture } from '../constants';

const Floor: React.FC<{ isActivated: boolean }> = ({ isActivated }) => {
  const ref = useRef<THREE.Points>(null);
  const count = 35000; // Significantly increased density (was 15000)
  const particleTexture = useMemo(() => getParticleTexture(), []);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    // Brighter white for the core ripples
    const colorWhite = new THREE.Color('#ffffff');
    const colorBlue = new THREE.Color('#88ccff'); // Slightly brighter blue for contrast

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Distribution: More dense in the center, fading out
      const radius = Math.random() * 30 + 1; // Expanded radius slightly
      const theta = Math.random() * Math.PI * 2;
      
      pos[i3] = Math.cos(theta) * radius;
      pos[i3 + 1] = -3; // Floor level
      pos[i3 + 2] = Math.sin(theta) * radius;

      // Color variation based on radius
      // Keep it whiter near the center/waves
      const mixRatio = Math.min(1, radius / 35);
      const mixedColor = colorWhite.clone().lerp(colorBlue, mixRatio);
      
      col[i3] = mixedColor.r;
      col[i3 + 1] = mixedColor.g;
      col[i3 + 2] = mixedColor.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    
    // Dynamic parameters based on activation
    const speed = isActivated ? 2.0 : 1.0; // Slightly slower speed for elegance
    // Reduced amplitude for less "ups and downs", just a shimmer
    const ampBase = isActivated ? 0.25 : 0.1; 
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = pos[i3];
      const z = pos[i3 + 2];
      const dist = Math.sqrt(x * x + z * z);
      
      // Ripple Wave Equation
      // Slower decay (0.03) so ripples are visible further out
      const amplitude = ampBase * Math.exp(-dist * 0.03);
      
      // Sharp sine wave
      const wave = Math.sin(dist * 1.5 - t * speed);
      
      pos[i3 + 1] = -3 + wave * amplitude;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12} // Slightly smaller to compensate for high density
        vertexColors
        map={particleTexture}
        transparent
        opacity={isActivated ? 0.8 : 0.5} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default Floor;