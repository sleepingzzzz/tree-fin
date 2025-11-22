
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, getParticleTexture } from '../constants';

interface SideNameProps {
  name: string;
}

const SideName: React.FC<SideNameProps> = ({ name }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleTexture = useMemo(() => getParticleTexture(), []);

  // Generate particles from text
  const { positions, initialPositions } = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { positions: new Float32Array(0), initialPositions: new Float32Array(0) };

    const width = 1024;
    const height = 512;
    canvas.width = width;
    canvas.height = height;

    // Use the cursive font
    ctx.font = 'bold 150px "Great Vibes", cursive';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, width / 2, height / 2);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const points: number[] = [];

    // Scan for pixels
    const step = 3; // Density
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        if (data[index] > 128) {
          // Center the text
          const pX = (x - width / 2) * 0.04; // Scale
          const pY = -(y - height / 2) * 0.04;
          points.push(pX, pY, 0);
        }
      }
    }

    const posArray = new Float32Array(points);
    return { positions: posArray, initialPositions: new Float32Array(points) };
  }, [name]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    
    const t = clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const init = initialPositions;

    for (let i = 0; i < pos.length / 3; i++) {
      const i3 = i * 3;
      
      // Gentle floating animation
      // Use the initial position as a base
      const ix = init[i3];
      const iy = init[i3 + 1];
      
      // Sine wave offset based on x position and time
      const waveY = Math.sin(t * 1.5 + ix * 0.5) * 0.1;
      const waveZ = Math.cos(t * 1.2 + iy * 0.5) * 0.05;

      pos[i3] = ix; // Keep X relative
      pos[i3 + 1] = iy + waveY;
      pos[i3 + 2] = waveZ;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (positions.length === 0) return null;

  return (
    <group position={[9, 8, 0]} rotation={[0, -0.2, 0]}>
       {/* Positioned to the right (x=9), up (y=8), slight rotation to face camera */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          map={particleTexture}
          size={0.25}
          color={COLORS.text} // Peach/Gold
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      {/* Add a subtle glow light near the name */}
      <pointLight position={[0, 0, 2]} distance={5} intensity={2} color={COLORS.text} />
    </group>
  );
};

export default SideName;
