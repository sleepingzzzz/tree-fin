
import React, { useMemo, useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, getParticleTexture } from '../constants';

// 3D Heart Topper
const ParticleTopper: React.FC = () => {
  const count = 1200; // Denser for the heart
  const particleTexture = useMemo(() => getParticleTexture(), []);

  const { positions } = useMemo(() => {
    const pos = [];
    // Rejection sampling for a 3D Heart volume
    
    let i = 0;
    while (i < count) {
      const x = (Math.random() - 0.5) * 3;
      const y = (Math.random() - 0.5) * 3;
      const z = (Math.random() - 0.5) * 3;

      const xx = x;
      const yy = y; 
      const zz = z;

      const a = xx;
      const c = yy * 1.2; // Stretch vertically slightly
      const b = zz; 

      const p = (a * a + (9 / 4) * b * b + c * c - 1);
      const value = p * p * p - a * a * c * c * c - (9 / 80) * b * b * c * c * c;

      if (value < 0) {
        pos.push(x * 0.6, y * 0.6 + 0.2, z * 0.6); // Scale down final result
        i++;
      }
    }
    return { positions: new Float32Array(pos) };
  }, []);

  const meshRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Heartbeat Pulse
    const beat = Math.pow(Math.sin(t * 3), 2) * 0.1 + 1;
    
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 1.0;
      meshRef.current.scale.set(beat, beat, beat);
    }
  });

  return (
    <group>
      <points ref={meshRef} position={[0, 9.8, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#ff3366" // Pinkish/Red Heart
          map={particleTexture}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

// Ornaments Component
const Ornaments: React.FC = () => {
  const largeRef = useRef<THREE.Points>(null);
  const smallRef = useRef<THREE.Points>(null);
  const particleTexture = useMemo(() => getParticleTexture(), []);
  
  // Configuration
  const largeCount = 140;
  const smallCount = 250;
  const treeHeight = 12;
  const maxBaseRadius = 7.5; // WIDER TREE
  const layers = 8;

  // Helper to generate ornament positions on branch tips
  const generateOrnamentData = (count: number) => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Random height on tree
      const y = Math.random() * (treeHeight - 1) + 0.5; // Avoid extreme bottom/top
      const relY = y / treeHeight;
      
      // Calculate branch tip radius at this height
      const layerPhase = (relY * layers) % 1; 
      const coneRadius = (1 - relY) * maxBaseRadius;
      
      // Focus on the "bulge" of the layer (the branch tip)
      const branchExtension = 0.6 + 0.4 * Math.pow(1 - layerPhase, 1.5);
      
      // Place slightly outside the main foliage for visibility
      let radius = coneRadius * branchExtension * (0.9 + Math.random() * 0.15);
      
      const theta = Math.random() * Math.PI * 2;
      
      const droop = (radius / maxBaseRadius) * 1.5;

      pos[i3] = Math.cos(theta) * radius;
      pos[i3 + 1] = y - 2.5 - droop;
      pos[i3 + 2] = Math.sin(theta) * radius;

      // Pick random color
      const colorHex = COLORS.ornaments[Math.floor(Math.random() * COLORS.ornaments.length)];
      const c = new THREE.Color(colorHex);
      
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  };

  const largeData = useMemo(() => generateOrnamentData(largeCount), []);
  const smallData = useMemo(() => generateOrnamentData(smallCount), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Gentle sway
    if (largeRef.current) {
      largeRef.current.rotation.y = Math.sin(t * 0.5) * 0.05 - t * 0.1;
      // Bob up and down slightly
      largeRef.current.position.y = Math.sin(t * 1) * 0.05;
    }
    if (smallRef.current) {
      smallRef.current.rotation.y = Math.cos(t * 0.5) * 0.05 - t * 0.1;
      smallRef.current.position.y = Math.cos(t * 1.2) * 0.03;
    }
  });

  return (
    <group>
      {/* Large Ornaments */}
      <points ref={largeRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={largeCount}
            array={largeData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={largeCount}
            array={largeData.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.35} // Large
          map={particleTexture}
          transparent
          opacity={1.0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Small Ornaments */}
      <points ref={smallRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={smallCount}
            array={smallData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={smallCount}
            array={smallData.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.2} // Small
          map={particleTexture}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

const Tree: React.FC<{ isActivated: boolean }> = ({ isActivated }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  
  const particleCount = 32000; // More particles for wider tree
  const particleTexture = useMemo(() => getParticleTexture(), []);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    
    const colorRed = new THREE.Color(COLORS.treePrimary);
    const colorGold = new THREE.Color(COLORS.treeSecondary);
    const colorWhite = new THREE.Color(COLORS.treeHighlight);

    const treeHeight = 12;
    const maxBaseRadius = 7.5; // WIDER TREE
    const layers = 8; 

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // 1. Height distribution
      const y = Math.random() * treeHeight; 
      const relY = y / treeHeight; // 0 (bottom) to 1 (top)

      // 2. Layer logic for "Pine Tree" shape
      const layerPhase = (relY * layers) % 1; 
      
      // General conical taper
      const coneRadius = (1 - relY) * maxBaseRadius;
      
      // Branch extension
      const branchExtension = 0.6 + 0.4 * Math.pow(1 - layerPhase, 1.5);
      
      let radius = coneRadius * branchExtension;

      // 3. Volume - distribute particles inside the branch volume
      radius *= Math.pow(Math.random(), 0.35); // Slightly denser

      const theta = Math.random() * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      
      // 4. Droop effect
      const droop = (radius / maxBaseRadius) * 1.5;
      
      pos[i3] = x;
      pos[i3 + 1] = y - 2.5 - droop; 
      pos[i3 + 2] = z;

      // Colors
      let targetColor;
      const rand = Math.random();
      
      if (rand > 0.4) {
        targetColor = colorRed;
      } else if (rand > 0.15) {
        targetColor = colorGold;
      } else {
        targetColor = colorWhite;
      }
      
      const c = targetColor.clone();
      // Variation
      if (targetColor === colorRed) {
         c.offsetHSL(0, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.2);
      }

      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current || !materialRef.current) return;

    const time = clock.getElapsedTime();
    pointsRef.current.rotation.y = -time * 0.1; // Rotate slowly

    // Twinkle effect
    if (isActivated) {
       materialRef.current.size = 0.14;
       materialRef.current.opacity = 0.95;
    } else {
       materialRef.current.size = 0.12;
       materialRef.current.opacity = 0.8;
    }
  });

  return (
    <group>
        {/* Main Tree Particles */}
        <points ref={pointsRef}>
        <bufferGeometry>
            <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
            />
            <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={colors}
            itemSize={3}
            />
        </bufferGeometry>
        <pointsMaterial
            ref={materialRef}
            vertexColors
            size={0.12}
            map={particleTexture}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            alphaTest={0.01}
        />
        </points>
        
        <Ornaments />
        
        <ParticleTopper />
        
        {/* Inner glow light */}
        <pointLight position={[0, 3, 0]} intensity={2} distance={10} color="#ff4040" />
        {/* Top light for Heart */}
        <pointLight position={[0, 9.5, 0]} intensity={4} distance={8} color="#ff3366" />
    </group>
  );
};

export default Tree;
