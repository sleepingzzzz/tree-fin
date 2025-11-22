
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, getParticleTexture } from '../constants';

const SingleFirework: React.FC<{ position: THREE.Vector3, color: string, onComplete: () => void }> = ({ position, color, onComplete }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const particleCount = 300;
    const particleTexture = useMemo(() => getParticleTexture(), []);
    
    const { speeds, dirs } = useMemo(() => {
        const s = new Float32Array(particleCount);
        const d = new Float32Array(particleCount * 3);
        for(let i=0; i<particleCount; i++) {
            s[i] = Math.random() * 0.5 + 0.1;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            d[i*3] = Math.sin(phi) * Math.cos(theta);
            d[i*3+1] = Math.sin(phi) * Math.sin(theta);
            d[i*3+2] = Math.cos(phi);
        }
        return { speeds: s, dirs: d };
    }, []);

    const [timeAlive, setTimeAlive] = useState(0);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const t = timeAlive + delta;
        setTimeAlive(t);

        if (t > 2.0) {
            onComplete();
            return;
        }

        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
        
        for(let i=0; i<particleCount; i++) {
            const i3 = i*3;
            // Move outward
            positions[i3] += dirs[i3] * speeds[i] * (1 - t/2); // Slow down slightly
            positions[i3+1] += dirs[i3+1] * speeds[i] * (1 - t/2);
            positions[i3+2] += dirs[i3+2] * speeds[i] * (1 - t/2);
            
            // Gravity
            positions[i3+1] -= 0.05 * t;
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        
        // Fade out
        const material = pointsRef.current.material as THREE.PointsMaterial;
        material.opacity = Math.max(0, 1 - t / 2);
    });

    const initialPositions = useMemo(() => {
        const arr = new Float32Array(particleCount * 3);
        for(let i=0; i<particleCount; i++) {
            arr[i*3] = position.x;
            arr[i*3+1] = position.y;
            arr[i*3+2] = position.z;
        }
        return arr;
    }, [position]);

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={particleCount} array={initialPositions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial 
                map={particleTexture} 
                size={0.5} 
                color={color} 
                transparent 
                blending={THREE.AdditiveBlending} 
                depthWrite={false}
            />
        </points>
    );
};

const BackgroundFireworks: React.FC<{ isActivated: boolean }> = ({ isActivated }) => {
    const [fireworks, setFireworks] = useState<{id: number, pos: THREE.Vector3, color: string}[]>([]);
    const nextId = useRef(0);
    const lastLaunch = useRef(0);

    useFrame(({ clock }) => {
        if (!isActivated) return;

        const t = clock.getElapsedTime();
        // Launch randomly every 0.5 to 2 seconds
        if (t - lastLaunch.current > Math.random() * 1.5 + 0.5) {
            lastLaunch.current = t;
            
            const x = (Math.random() - 0.5) * 40;
            const y = 10 + Math.random() * 15;
            const z = (Math.random() - 0.5) * 20 - 10; // Generally behind the tree
            
            const color = COLORS.firework[Math.floor(Math.random() * COLORS.firework.length)];
            
            setFireworks(prev => [...prev, {
                id: nextId.current++,
                pos: new THREE.Vector3(x, y, z),
                color
            }]);
        }
    });

    const removeFirework = (id: number) => {
        setFireworks(prev => prev.filter(fw => fw.id !== id));
    };

    return (
        <group>
            {fireworks.map(fw => (
                <SingleFirework 
                    key={fw.id} 
                    position={fw.pos} 
                    color={fw.color} 
                    onComplete={() => removeFirework(fw.id)} 
                />
            ))}
        </group>
    );
};

export default BackgroundFireworks;
