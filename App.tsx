
import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Tree from './components/Tree';
import Floor from './components/Floor';
import Snow from './components/Snow';
import FireworkSequence from './components/FireworkSequence';
import BackgroundFireworks from './components/BackgroundFireworks';
import SideName from './components/SideName';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [step, setStep] = useState<'intro' | 'scene'>('intro');
  const [name, setName] = useState('');
  const [inputValue, setInputValue] = useState('');

  const handleStart = () => {
    if (inputValue.trim()) {
      setName(inputValue);
      setStep('scene');
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 2, 20], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={[COLORS.background]} />
          
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          {/* Post Processing for Glow */}
          <EffectComposer disableNormalPass>
             <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.2} radius={0.5} />
          </EffectComposer>

          {/* Global Environment - Always Visible (No Suspense) */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <group position={[0, -3, 0]}>
             <Snow count={2500} />
          </group>

          {/* Main Scene Elements */}
          {step === 'scene' && (
            <group position={[0, -3, 0]}>
                {/* Floor and Fireworks don't need to suspend */}
                <Floor isActivated={true} />
                <BackgroundFireworks isActivated={true} />
                <FireworkSequence trigger={true} name={name} />
                
                {/* Particle Text Name on the right side */}
                <SideName name={name} />
                
                {/* Tree handles its own internal suspense for any loading assets */}
                <Tree isActivated={true} />
            </group>
          )}

          <OrbitControls 
            enablePan={false} 
            enableZoom={step === 'scene'} 
            minPolarAngle={Math.PI / 2.5} 
            maxPolarAngle={Math.PI / 1.8}
            autoRotate={step === 'intro'}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* UI Overlay */}
      {step === 'intro' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all duration-700">
          <div className="p-8 rounded-2xl border border-white/10 bg-black/60 shadow-[0_0_50px_rgba(255,183,178,0.3)] text-center w-auto mx-4">
            <h1 className="text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-rose-400 mb-6 py-4 px-2 leading-relaxed cursive-font filter drop-shadow-lg whitespace-nowrap">
              Merry Christmas
            </h1>
            <p className="text-gray-300 mb-8 font-light tracking-widest text-sm">
              ENTER YOUR NAME TO BEGIN
            </p>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Your Name"
              className="w-full max-w-md bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all mb-6 text-center text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />
            
            <button
              onClick={handleStart}
              disabled={!inputValue.trim()}
              className={`
                px-8 py-3 rounded-full font-semibold tracking-wider transition-all duration-300
                ${inputValue.trim() 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(244,63,94,0.6)] cursor-pointer' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
              `}
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 text-white/30 text-xs pointer-events-none select-none">
        Created with React Three Fiber
      </div>
    </div>
  );
};

export default App;
