/// <reference types="@react-three/fiber" />
import React, { useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
    OrbitControls,
    OrthographicCamera,
    Environment,
    Grid,
    ContactShadows,
    useGLTF
} from '@react-three/drei';
import * as THREE from 'three';
import { getComponent } from './ComponentRegistry';

// Type declarations for Three.js JSX elements
declare global {
    namespace JSX {
        interface IntrinsicElements {
            group: any;
            mesh: any;
            primitive: any;
            boxGeometry: any;
            planeGeometry: any;
            sphereGeometry: any;
            cylinderGeometry: any;
            meshStandardMaterial: any;
            meshBasicMaterial: any;
            meshPhysicalMaterial: any;
            ambientLight: any;
            directionalLight: any;
            pointLight: any;
            spotLight: any;
        }
    }
}

// Also declare for React namespace (needed for TSX files)
declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            group: any;
            mesh: any;
            primitive: any;
            boxGeometry: any;
            planeGeometry: any;
            sphereGeometry: any;
            cylinderGeometry: any;
            meshStandardMaterial: any;
            meshBasicMaterial: any;
            meshPhysicalMaterial: any;
            ambientLight: any;
            directionalLight: any;
            pointLight: any;
            spotLight: any;
        }
    }
}


interface ProceduralObject {
    id: string;
    type: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    props?: Record<string, any>;
}

interface Generic3DViewerProps {
    modelUrl?: string; // Optional for GLB mode
    mapping: Record<string, string>; // NodeName -> DeviceID
    values: Record<string, any>; // DeviceID -> Device Data
    visualizationConfig?: {
        strategy: 'glb' | 'procedural';
        objects?: ProceduralObject[];
    };
}

interface ErrorBoundaryProps {
    fallback: React.ReactNode;
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class SimpleErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Generic3DViewer Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

const ModelLoader: React.FC<Generic3DViewerProps> = ({ modelUrl, mapping, values }) => {
    if (!modelUrl) return null;
    // Cast to any to avoid type issues with GLTF return type
    const { scene } = useGLTF(modelUrl) as any;

    // Clone scene to avoid mutating cached GLTF if used elsewhere
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    useEffect(() => {
        clonedScene.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                // Apply Materials based on Name/Type
                const name = child.name.toLowerCase();

                if (name.includes('hopper')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: '#C0C0C0', // Silver
                        metalness: 0.6,
                        roughness: 0.2
                    });
                } else if (name.includes('water_wall') || name.includes('ww_')) {
                    child.material = new THREE.MeshPhysicalMaterial({
                        color: '#3b82f6', // Blue
                        transmission: 0.6, // Glass-like
                        opacity: 0.8,
                        transparent: true,
                        roughness: 0.1,
                        metalness: 0.1
                    });
                } else if (name.includes('fan')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: '#475569', // Industrial Grey
                        metalness: 0.5,
                        roughness: 0.5
                    });
                } else if (name.includes('rack')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: '#1e293b', // Dark Frame
                        emissive: '#10b981', // Green hints
                        emissiveIntensity: 0.2
                    });
                } else if (name.includes('pipe')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: '#94a3b8', // Pipe Grey
                        metalness: 0.4,
                        roughness: 0.3
                    });
                } else if (name.includes('valve')) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: '#ef4444', // Red Valve
                        metalness: 0.5,
                        roughness: 0.5
                    });
                }

                // Dynamic Status Overrides
                const deviceId = mapping[child.name];
                if (deviceId) {
                    const deviceData = values[deviceId];
                    if (deviceData) {
                        let isActive = false;
                        if (deviceData.status === 'ON' || deviceData.status === 'RUNNING') {
                            isActive = true;
                        } else if (typeof deviceData.value === 'number' && deviceData.value > 0) {
                            isActive = true;
                        }

                        // Clone material to avoid affecting others sharing it
                        const mat = (child.material as THREE.Material).clone();
                        if (isActive) {
                            if ('emissive' in mat) {
                                (mat as THREE.MeshStandardMaterial).emissive.set('#22c55e');
                                (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
                            } else if ('color' in mat) {
                                (mat as THREE.MeshStandardMaterial).color.set('#22c55e');
                            }
                        }
                        child.material = mat;
                    }
                }
            }
        });
    }, [clonedScene, mapping, values]);

    return <primitive object={clonedScene} />;
};

const ProceduralLoader: React.FC<Generic3DViewerProps> = ({ visualizationConfig, values }) => {
    if (!visualizationConfig?.objects) return null;

    return (
        <group>
            {visualizationConfig.objects.map((obj: ProceduralObject) => {
                const Component = getComponent(obj.type);
                if (!Component) {
                    console.warn(`Component type ${obj.type} not found in registry.`);
                    return null;
                }

                return (
                    <group key={obj.id} position={obj.position} rotation={obj.rotation ? new THREE.Euler(...obj.rotation) : undefined}>
                        <Component {...obj.props} id={obj.id} values={values} />
                    </group>
                );
            })}
            {/* Floor Grid for Procedural Mode */}
            <Grid position={[0, 0.01, 0]} args={[120, 120]} cellColor="#334155" sectionColor="#64748b" fadeDistance={150} infiniteGrid />
        </group>
    );
};

export const Generic3DViewer: React.FC<Generic3DViewerProps> = (props: Generic3DViewerProps) => {
    const Fallback = () => (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry args={[100, 100]} />
                {/* @ts-ignore - Color type mismatch between three and r3f types */}
                <meshStandardMaterial color={new THREE.Color("#1e293b")} />
            </mesh>
            <Grid position={[0, 0.01, 0]} args={[100, 100]} cellColor="#ef4444" sectionColor="#ef4444" />
        </group>
    );

    // Respect explicit strategy, otherwise default to 'glb' if modelUrl is provided
    const strategy = props.visualizationConfig?.strategy || (props.modelUrl ? 'glb' : 'procedural');

    // If strategy is 'procedural', ignore modelUrl even if it exists
    const shouldUseGLB = strategy === 'glb' && props.modelUrl;

    return (
        <div className="w-full h-full">
            <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
                <OrthographicCamera
                    makeDefault
                    position={[-50, 50, 50]} // 拉遠距離
                    zoom={20}                // 縮小 zoom 值 (值越小，視野越大)
                    near={-200}
                    far={2000}               // 增加可視距離
                    onUpdate={(c) => c.lookAt(0, 0, 0)}
                />
                <OrbitControls makeDefault target={[0, 0, 0]} enableRotate={true} enableZoom={true} enablePan={true} minZoom={10} maxZoom={100} />

                <Environment preset="city" />
                {/* <ambientLight intensity={0.5} />
                <directionalLight position={[30, 60, 30]} intensity={1} castShadow shadow-mapSize={[4096, 4096]} /> */}
                <ambientLight intensity={2.0} /> {/* 大幅增加環境光 */}
                <pointLight position={[0, 50, 0]} intensity={3000} distance={200} /> {/* 增加一盞強力的點光源 */}
                <directionalLight position={[50, 50, 25]} intensity={2.5} castShadow />
                <group position={[0, -5, 0]}>
                    <SimpleErrorBoundary fallback={<Fallback />}>
                        <Suspense fallback={null}>
                            {shouldUseGLB ? (
                                <ModelLoader {...props} />
                            ) : (
                                <ProceduralLoader {...props} />
                            )}
                        </Suspense>
                    </SimpleErrorBoundary>

                    <ContactShadows resolution={1024} scale={150} blur={2} opacity={0.25} far={5} color="#000000" />
                </group>
            </Canvas>
        </div>
    );
};
