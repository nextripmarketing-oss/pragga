import React, { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, createPortal, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { AudioPlayer } from '../lib/audio';

const NeuralBrain = ({ isSpeaking, volume }: { isSpeaking: boolean, volume: number }) => {
    const brainRef = useRef<THREE.Group>(null);
    
    useFrame(({ clock }) => {
        if (brainRef.current) {
            // Pulsate and rotate the brain
            brainRef.current.rotation.y = clock.elapsedTime * 0.5;
            brainRef.current.rotation.x = Math.sin(clock.elapsedTime) * 0.2;
            
            const targetScale = 1 + (isSpeaking ? volume * 0.3 : Math.sin(clock.elapsedTime * 3) * 0.05);
            brainRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    return (
        <group ref={brainRef} position={[0, 0.05, 0.02]}>
            {/* Outer neural web */}
            <mesh>
                <icosahedronGeometry args={[0.08, 2]} />
                <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.6} />
            </mesh>
            {/* Inner core */}
            <mesh>
                <icosahedronGeometry args={[0.05, 1]} />
                <meshBasicMaterial color="#dc2626" transparent opacity={0.9} />
            </mesh>
            {/* Knowledge Particles / Data Streams */}
            <Sparkles count={80} scale={0.25} size={0.8} speed={0.4} opacity={0.8} color="#22c55e" />
            <Sparkles count={40} scale={0.4} size={1.5} speed={0.8} opacity={0.6} color="#ef4444" />
            
            {/* Glow light */}
            <pointLight color="#ef4444" intensity={10} distance={1.5} decay={2} />
        </group>
    );
};

const AnimatedAvatar = ({ isSpeaking, playerRef, isConnected }: { isSpeaking: boolean, playerRef: React.MutableRefObject<AudioPlayer | null>, isConnected: boolean }) => {
    const groupRef = useRef<THREE.Group>(null);

    let volume = 0;
    let normalizedVol = 0;

    useFrame((state) => {
        if (isSpeaking && playerRef.current) {
            volume = playerRef.current.getVolume(); // 0 to 255
        } else {
            volume = 0;
        }
        
        normalizedVol = Math.pow(volume / 255, 1.2); 

        if (groupRef.current) {
            // Idle breathing and slight body movement
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.05;
            
            // Look around slightly
            const targetX = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
            const targetY = Math.cos(state.clock.elapsedTime * 0.5) * 0.1;
            
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.02);
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetY, 0.02);
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <NeuralBrain isSpeaking={isSpeaking} volume={normalizedVol} />
        </group>
    );
};

class ModelErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: any) {
        console.warn("Avatar3D model load error handled:", error?.message || error);
    }
    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

const FallbackAvatar = ({ isSpeaking, playerRef }: { isSpeaking: boolean, playerRef: React.MutableRefObject<AudioPlayer | null> }) => {
    const orbRef = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        let volume = 0;
        if (isSpeaking && playerRef.current) {
            volume = playerRef.current.getVolume();
        }
        const normalizedVol = Math.pow(volume / 255, 1.2);
        if (orbRef.current) {
            orbRef.current.rotation.y = clock.elapsedTime * 0.8;
            orbRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.3;
            const scale = 1 + (isSpeaking ? normalizedVol * 0.4 : Math.sin(clock.elapsedTime * 2) * 0.05);
            orbRef.current.scale.setScalar(scale);
        }
    });

    return (
        <group ref={orbRef} position={[0, 1.65, 0]}>
            <mesh>
                <icosahedronGeometry args={[0.2, 2]} />
                <meshStandardMaterial color="#22c55e" wireframe emissive="#16a34a" emissiveIntensity={1} />
            </mesh>
            <mesh>
                <sphereGeometry args={[0.12, 32, 32]} />
                <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.8} />
            </mesh>
            <Sparkles count={60} scale={0.6} size={1.5} color="#22c55e" speed={1.2} />
        </group>
    );
};

export const Avatar3D = ({ isConnected, isSpeaking, playerRef }: { isConnected: boolean, isSpeaking: boolean, playerRef: React.MutableRefObject<AudioPlayer | null> }) => {
    return (
        <div className="w-full h-full relative z-10">
            {/* Centered camera for the Neural Brain hologram */}
            <Canvas camera={{ position: [0, 0, 1.2], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 10]} intensity={1.5} color="#22c55e" />
                <directionalLight position={[-10, -10, -10]} intensity={2} color="#ef4444" />
                <Environment preset="night" />
                
                <ModelErrorBoundary fallback={<FallbackAvatar isSpeaking={isSpeaking} playerRef={playerRef} />}>
                    <Suspense fallback={<FallbackAvatar isSpeaking={isSpeaking} playerRef={playerRef} />}>
                        <AnimatedAvatar isConnected={isConnected} isSpeaking={isSpeaking} playerRef={playerRef} />
                    </Suspense>
                </ModelErrorBoundary>
                
                <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={5} blur={2} far={4} color="#22c55e" />
                <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2 + 0.1} minPolarAngle={Math.PI / 2 - 0.2} target={[0, 0, 0]} />
            </Canvas>
            
            {/* Status Overlay */}
            {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-sm border border-red-500/50 text-red-500 px-4 py-2 rounded-none font-mono text-xs tracking-widest animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        [ SYSTEM OFFLINE ]
                    </div>
                </div>
            )}
        </div>
    );
};
