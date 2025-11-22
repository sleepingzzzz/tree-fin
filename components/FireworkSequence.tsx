import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, getParticleTexture } from '../constants';

interface FireworkProps {
  trigger: boolean;
  name: string;
}

// Helper to sample text coordinates from a 2D canvas
const generateTextParticles = (text: string): THREE.Vector3[] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  // Canvas size - high resolution for crisp text
  const width = 1024;
  const height = 512;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  // Use the cursive font
  ctx.font = 'bold 200px "Great Vibes", cursive';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const points: THREE.Vector3[] = [];

  // Scan pixels
  // Density step
  const step = 4; 
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      // If pixel is bright enough
      if (data[index] > 128) {
        // Map 2D x,y to 3D world space
        const pX = (x - width / 2) * 0.03;
        const pY = -(y - height / 2) * 0.03;
        points.push(new THREE.Vector3(pX, pY + 12, 0)); // +12 to be clearly above tree
      }
    }
  }
  return points;
};

const FireworkSequence: React.FC<FireworkProps> = ({ trigger, name }) => {
  const [stage, setStage] = useState<'idle' | 'launch' | 'explode' | 'forming'>('idle');
  const rocketRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const particleTexture = useMemo(() => getParticleTexture(), []);

  // Configuration
  const launchHeight = 12;
  const MAX_PARTICLES = 7000; // Increased for denser explosion

  // Pre-calculate text targets
  const textTargets = useMemo(() => {
    if (!trigger || !name) return [];
    return generateTextParticles(name);
  }, [trigger, name]);

  // Particle State
  const particleData = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const velocities = new Float32Array(MAX_PARTICLES * 3);
    const targetPositions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const baseColors = new Float32Array(MAX_PARTICLES * 3); // Store initial explosion colors
    
    // Initialize off-screen
    for(let i=0; i<MAX_PARTICLES; i++) {
        positions[i*3+1] = -1000; 
    }

    return { positions, velocities, targetPositions, colors, baseColors };
  }, []);

  useEffect(() => {
    if (trigger && stage === 'idle') {
      const timer = setTimeout(() => setStage('launch'), 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger, stage]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // --- STAGE 1: LAUNCH ---
    if (stage === 'launch' && rocketRef.current) {
      rocketRef.current.position.y += delta * 12;
      rocketRef.current.position.x = Math.sin(time * 20) * 0.05; // Subtle wobble
      
      if (rocketRef.current.position.y >= launchHeight) {
        setStage('explode');
        
        // Initialize Explosion
        const count = MAX_PARTICLES;
        const origin = new THREE.Vector3(0, launchHeight, 0);
        
        // Richer Palette from constants
        const palette = [...COLORS.firework, COLORS.gold, '#ffffff', COLORS.treeHighlight];

        for (let i = 0; i < count; i++) {
           const i3 = i * 3;
           
           // Start at center
           particleData.positions[i3] = origin.x;
           particleData.positions[i3+1] = origin.y;
           particleData.positions[i3+2] = origin.z;

           // Velocity: Sphere + Spikes for variety
           const theta = Math.random() * Math.PI * 2;
           const phi = Math.acos((Math.random() * 2) - 1);
           
           // Base speed - varied
           let speed = Math.random() * 0.6 + 0.2;
           
           // Add "spikes" (faster particles in random directions)
           if (Math.random() > 0.85) speed *= 1.8;

           particleData.velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
           particleData.velocities[i3+1] = speed * Math.sin(phi) * Math.sin(theta);
           particleData.velocities[i3+2] = speed * Math.cos(phi);

           // Random vibrant color
           const col = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
           
           // Add variation to the color itself so not all reds are identical
           col.offsetHSL(0, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.2);

           particleData.colors[i3] = col.r;
           particleData.colors[i3+1] = col.g;
           particleData.colors[i3+2] = col.b;
           
           particleData.baseColors[i3] = col.r;
           particleData.baseColors[i3+1] = col.g;
           particleData.baseColors[i3+2] = col.b;
        }
        
        // Prepare Target Positions for text
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            if (i < textTargets.length) {
                particleData.targetPositions[i3] = textTargets[i].x;
                particleData.targetPositions[i3+1] = textTargets[i].y;
                particleData.targetPositions[i3+2] = textTargets[i].z;
            } else {
                particleData.targetPositions[i3] = 9999; // Fall away
            }
        }

        // Longer explosion hang time before forming text
        setTimeout(() => setStage('forming'), 1500);
      }
    }

    // --- PARTICLE UPDATE LOOP ---
    if (particlesRef.current && (stage === 'explode' || stage === 'forming')) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const colorAttr = particlesRef.current.geometry.attributes.color.array as Float32Array;

        for(let i=0; i < MAX_PARTICLES; i++) {
            const i3 = i * 3;
            
            if (stage === 'explode') {
                // Move
                positions[i3] += particleData.velocities[i3];
                positions[i3+1] += particleData.velocities[i3+1];
                positions[i3+2] += particleData.velocities[i3+2];

                // Physics
                particleData.velocities[i3+1] -= 0.006; // Gravity
                
                // Drag - Fast deceleration for "pop" effect
                particleData.velocities[i3] *= 0.95;
                particleData.velocities[i3+1] *= 0.95;
                particleData.velocities[i3+2] *= 0.95;
                
                // Twinkle / Shimmer
                // Randomly flicker particles to white
                if (Math.random() > 0.95) {
                     colorAttr[i3] = 1.0;
                     colorAttr[i3+1] = 1.0;
                     colorAttr[i3+2] = 1.0;
                } else {
                    // Revert to base color
                     colorAttr[i3] = particleData.baseColors[i3];
                     colorAttr[i3+1] = particleData.baseColors[i3+1];
                     colorAttr[i3+2] = particleData.baseColors[i3+2];
                }

            } else if (stage === 'forming') {
                // Morph Logic
                const isTextParticle = i < textTargets.length;
                
                if (isTextParticle) {
                    const tx = particleData.targetPositions[i3];
                    const ty = particleData.targetPositions[i3+1];
                    const tz = particleData.targetPositions[i3+2];

                    // Smooth Lerp
                    positions[i3] += (tx - positions[i3]) * 0.04;
                    positions[i3+1] += (ty - positions[i3+1]) * 0.04;
                    positions[i3+2] += (tz - positions[i3+2]) * 0.04;

                    // Color transition to Gold/Peach for text
                    const targetColor = new THREE.Color(COLORS.text);
                    colorAttr[i3] = THREE.MathUtils.lerp(colorAttr[i3], targetColor.r, 0.05);
                    colorAttr[i3+1] = THREE.MathUtils.lerp(colorAttr[i3+1], targetColor.g, 0.05);
                    colorAttr[i3+2] = THREE.MathUtils.lerp(colorAttr[i3+2], targetColor.b, 0.05);
                    
                } else {
                    // Dissolve unused particles
                    positions[i3+1] -= 0.1; 
                    if (positions[i3+1] < -10) positions[i3+1] = -1000;
                }
            }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <group>
      {stage === 'launch' && (
        <mesh ref={rocketRef} position={[0, -2, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color={COLORS.gold} />
          <pointLight intensity={5} distance={10} color="#ffaa00" />
        </mesh>
      )}
      
      {/* Bright Flash during explosion start */}
      {stage === 'explode' && (
          <pointLight position={[0, launchHeight, 0]} intensity={8} distance={30} color="white" decay={2} />
      )}

      <points ref={particlesRef}>
        <bufferGeometry>
            <bufferAttribute
                attach="attributes-position"
                count={MAX_PARTICLES}
                array={particleData.positions}
                itemSize={3}
            />
            <bufferAttribute
                attach="attributes-color"
                count={MAX_PARTICLES}
                array={particleData.colors}
                itemSize={3}
            />
        </bufferGeometry>
        <pointsMaterial 
            map={particleTexture}
            vertexColors
            size={0.3} 
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            opacity={1}
            alphaTest={0.01}
        />
      </points>
    </group>
  );
};

export default FireworkSequence;