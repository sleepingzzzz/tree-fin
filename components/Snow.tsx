import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getParticleTexture } from '../constants';

const Snow: React.FC<{ count?: number }> = ({ count = 2500 }) => {
  const mesh = useRef<THREE.Points>(null);
  const particleTexture = useMemo(() => getParticleTexture(), []);
  
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      temp[i3] = (Math.random() - 0.5) * 50; // x wide
      temp[i3 + 1] = Math.random() * 30 + 5; // y high
      temp[i3 + 2] = (Math.random() - 0.5) * 50; // z wide
      speeds[i] = Math.random() * 0.05 + 0.02;
    }
    return { positions: temp, speeds };
  }, [count]);

  useFrame(() => {
    if (!mesh.current) return;
    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Move down
      positions[i3 + 1] -= particles.speeds[i];
      
      // Wobble x and z
      positions[i3] += Math.sin(positions[i3 + 1]) * 0.01;
      
      // Reset if below ground
      if (positions[i3 + 1] < -5) {
        positions[i3 + 1] = 25;
        positions[i3] = (Math.random() - 0.5) * 50;
        positions[i3 + 2] = (Math.random() - 0.5) * 50;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color="white"
        map={particleTexture}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  );
};

export default Snow;