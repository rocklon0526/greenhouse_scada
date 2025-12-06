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

interface VisualizationStyle {
    color?: string;
    emissive?: string;
    emissiveIntensity?: number;
    roughness?: number;
    metalness?: number;
    transmission?: number;
    opacity?: number;
    transparent?: boolean;
}

interface StyleRule {
    pattern: string; // Substring match
    style: VisualizationStyle;
}

const DEFAULT_STYLES: StyleRule[] = [
    { pattern: 'hopper', style: { color: '#C0C0C0', metalness: 0.6, roughness: 0.2 } },
    { pattern: 'water_wall', style: { color: '#3b82f6', transmission: 0.6, opacity: 0.8, transparent: true, roughness: 0.1, metalness: 0.1 } },
    { pattern: 'ww_', style: { color: '#3b82f6', transmission: 0.6, opacity: 0.8, transparent: true, roughness: 0.1, metalness: 0.1 } },
    { pattern: 'fan', style: { color: '#475569', metalness: 0.5, roughness: 0.5 } },
    { pattern: 'rack', style: { color: '#1e293b', emissive: '#10b981', emissiveIntensity: 0.2 } },
    { pattern: 'pipe', style: { color: '#94a3b8', metalness: 0.4, roughness: 0.3 } },
    { pattern: 'valve', style: { color: '#ef4444', metalness: 0.5, roughness: 0.5 } }
];

const ModelLoader: React.FC<Generic3DViewerProps> = ({ modelUrl, mapping, values, visualizationConfig }) => {
    if (!modelUrl) return null;
    // Cast to any to avoid type issues with GLTF return type
    const { scene } = useGLTF(modelUrl) as any;

    // Clone scene to avoid mutating cached GLTF if used elsewhere
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // Merge default styles with config styles
    const styleRules = useMemo(() => {
        const configStyles = (visualizationConfig as any)?.styles || [];
        return [...DEFAULT_STYLES, ...configStyles];
    }, [visualizationConfig]);

    useEffect(() => {
        clonedScene.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                const name = child.name.toLowerCase();

                // 1. Apply Base Style from Config
                const matchedRule = styleRules.find(rule => name.includes(rule.pattern));
                if (matchedRule) {
                    const { style } = matchedRule;

                    // Determine material type based on properties
                    if (style.transmission || style.transparent) {
                        child.material = new THREE.MeshPhysicalMaterial({
                            color: style.color,
                            transmission: style.transmission,
                            opacity: style.opacity,
                            transparent: style.transparent,
                            roughness: style.roughness,
                            metalness: style.metalness
                        });
                    } else {
                        child.material = new THREE.MeshStandardMaterial({
                            color: style.color,
                            metalness: style.metalness,
                            roughness: style.roughness,
                            emissive: style.emissive,
                            emissiveIntensity: style.emissiveIntensity
                        });
                    }
                }

                // 2. Dynamic Status Overrides
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
    }, [clonedScene, mapping, values, styleRules]);

    return <primitive object={clonedScene} />;
};

const ProceduralLoader: React.FC<Generic3DViewerProps> = ({ visualizationConfig, values }) => {
    return (
        <group>
            {/* 1. 渲染物件 */}
            {visualizationConfig?.objects?.map((obj: ProceduralObject) => {
                const Component = getComponent(obj.type);
                if (!Component) return null;

                return (
                    <group key={obj.id} position={obj.position} rotation={obj.rotation ? new THREE.Euler(...obj.rotation) : undefined}>
                        <Component {...obj.props} id={obj.id} values={values} />
                    </group>
                );
            })}

            {/* 2. 永遠顯示地板網格 (作為參考基準) */}
            <Grid position={[0, -0.1, 0]} args={[200, 200]} cellColor="#475569" sectionColor="#64748b" fadeDistance={200} infiniteGrid />
            {/* [調試用] 座標軸輔助：紅=X, 綠=Y, 藍=Z */}
            {/* <axesHelper args={[50]} /> */}
        </group>
    );
};

export const Generic3DViewer: React.FC<Generic3DViewerProps> = (props: Generic3DViewerProps) => {
    // 雖然我們移除了 modelUrl，但保留這行以防萬一
    const strategy = props.visualizationConfig?.strategy || (props.modelUrl ? 'glb' : 'procedural');
    const shouldUseGLB = strategy === 'glb' && props.modelUrl;

    return (
        <div className="w-full h-full bg-slate-950"> {/* 確保背景色 */}
            <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
                {/* 1. 攝影機：拉遠一點，視野設大 */}
                <OrthographicCamera
                    makeDefault
                    position={[30, 60, 50]}
                    zoom={8}
                    near={-500}
                    far={2000}
                    onUpdate={(c) => c.lookAt(0, 0, 0)}
                />
                <OrbitControls makeDefault target={[0, 0, 0]} enableRotate={false} />

                {/* 2. 環境：提供基礎反射 */}
                <Environment preset="city" />

                {/* 3. 燈光：增強亮度 */}
                <ambientLight intensity={-1} />
                <directionalLight position={[50, 80, 30]} intensity={3.0} castShadow />
                <pointLight position={[-20, 20, -20]} intensity={1000} distance={200} color="#ffffff" />

                <group position={[0, -5, 0]}>
                    <Suspense fallback={null}>
                        {shouldUseGLB ? (
                            // @ts-ignore
                            <ModelLoader {...props} />
                        ) : (
                            <ProceduralLoader {...props} />
                        )}
                    </Suspense>
                    <ContactShadows resolution={1024} scale={200} blur={2} opacity={0.4} far={10} color="#000000" />
                </group>
            </Canvas>
        </div>
    );
};
