"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Shape, ExtrudeGeometry } from 'three';
import * as THREE from 'three';

const Box = ({ position, rotation, index }: { position: [number, number, number], rotation: [number, number, number], index: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    const shape = new Shape();
    const angleStep = Math.PI * 0.5;
    const radius = 1;

    shape.absarc(2, 2, radius, angleStep * 0, angleStep * 1);
    shape.absarc(-2, 2, radius, angleStep * 1, angleStep * 2);
    shape.absarc(-2, -2, radius, angleStep * 2, angleStep * 3);
    shape.absarc(2, -2, radius, angleStep * 3, angleStep * 4);

    const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 20,
        curveSegments: 20
    };

    const geometry = useMemo(() => {
        const geo = new ExtrudeGeometry(shape, extrudeSettings);
        geo.center();
        return geo;
    }, []);

    // Individual box animation
    useFrame((state) => {
        if (meshRef.current) {
            const time = state.clock.getElapsedTime();
            // Subtle individual rotation
            meshRef.current.rotation.z = Math.sin(time * 0.3 + index * 0.1) * 0.1;
            // Subtle scale pulsing
            const scale = 1 + Math.sin(time * 0.5 + index * 0.2) * 0.05;
            meshRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            position={position}
            rotation={rotation}
        >
            <meshPhysicalMaterial
                color="#232323"
                metalness={1}
                roughness={0.3}
                reflectivity={0.5}
                ior={1.5}
                emissive="#1a1a2e"
                emissiveIntensity={0.2}
                transparent={false}
                opacity={1.0}
                transmission={0.0}
                thickness={0.5}
                clearcoat={0.3}
                clearcoatRoughness={0.2}
                sheen={0.5}
                sheenRoughness={0.8}
                sheenColor="#8b5cf6"
                specularIntensity={1.0}
                specularColor="#ffffff"
                iridescence={1}
                iridescenceIOR={1.3}
                iridescenceThicknessRange={[100, 400]}
                flatShading={false}
                side={0}
                alphaTest={0}
                depthWrite={true}
                depthTest={true}
            />
        </mesh>
    );
};

const AnimatedBoxes = () => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Smooth continuous rotation
            groupRef.current.rotation.x += delta * 0.08;
            groupRef.current.rotation.y += delta * 0.02;

            // Gentle floating motion
            const time = state.clock.getElapsedTime();
            groupRef.current.position.y = Math.sin(time * 0.3) * 0.5;
        }
    });

    const boxes = useMemo(() =>
        Array.from({ length: 50 }, (_, index) => ({
            position: [(index - 25) * 0.75, 0, 0] as [number, number, number],
            rotation: [
                (index - 10) * 0.1,
                Math.PI / 2,
                0
            ] as [number, number, number],
            id: index
        })), []
    );

    return (
        <group ref={groupRef}>
            {boxes.map((box) => (
                <Box
                    key={box.id}
                    position={box.position}
                    rotation={box.rotation}
                    index={box.id}
                />
            ))}
        </group>
    );
};

// Particle system for added visual interest
const Particles = () => {
    const particlesRef = useRef<THREE.Points>(null);

    const particles = useMemo(() => {
        const count = 200;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }

        return positions;
    }, []);

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(particles, 3));
        return geo;
    }, [particles]);

    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        }
    });

    return (
        <points ref={particlesRef} geometry={geometry}>
            <pointsMaterial
                size={0.05}
                color="#8b5cf6"
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
};

export const Scene = () => {
    const cameraPosition: [number, number, number] = [5, 5, 20];

    return (
        <div className="w-full h-full z-0">
            <Canvas
                camera={{ position: cameraPosition, fov: 40 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance"
                }}
            >
                {/* Enhanced Lighting */}
                <ambientLight intensity={12} />
                <directionalLight position={[10, 10, 5]} intensity={15} color="#ffffff" />
                <directionalLight position={[-10, -10, -5]} intensity={5} color="#8b5cf6" />
                <pointLight position={[0, 0, 10]} intensity={10} color="#3b82f6" />

                {/* Fog for depth */}
                <fog attach="fog" args={['#000000', 15, 40]} />

                {/* 3D Elements */}
                <AnimatedBoxes />
                <Particles />
            </Canvas>
        </div>
    );
};
