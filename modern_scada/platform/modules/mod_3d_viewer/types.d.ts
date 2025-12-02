import type * as THREE from 'three'
import type { Object3DNode } from '@react-three/fiber'

declare module '@react-three/fiber' {
    interface ThreeElements {
        // Objects
        group: Object3DNode<THREE.Group, typeof THREE.Group>
        mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>
        primitive: Object3DNode<THREE.Object3D, typeof THREE.Object3D> & { object: THREE.Object3D }

        // Geometries
        boxGeometry: Object3DNode<THREE.BoxGeometry, typeof THREE.BoxGeometry>
        planeGeometry: Object3DNode<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>
        sphereGeometry: Object3DNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>
        cylinderGeometry: Object3DNode<THREE.CylinderGeometry, typeof THREE.CylinderGeometry>

        // Materials
        meshStandardMaterial: Object3DNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>
        meshBasicMaterial: Object3DNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>
        meshPhysicalMaterial: Object3DNode<THREE.MeshPhysicalMaterial, typeof THREE.MeshPhysicalMaterial>

        // Lights
        ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>
        directionalLight: Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>
        pointLight: Object3DNode<THREE.PointLight, typeof THREE.PointLight>
        spotLight: Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>
    }
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            // Objects
            group: any
            mesh: any
            primitive: any

            // Geometries
            boxGeometry: any
            planeGeometry: any
            sphereGeometry: any
            cylinderGeometry: any

            // Materials
            meshStandardMaterial: any
            meshBasicMaterial: any
            meshPhysicalMaterial: any

            // Lights
            ambientLight: any
            directionalLight: any
            pointLight: any
            spotLight: any
        }
    }
}

export { }
