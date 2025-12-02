/// <reference types="vite/client" />

import type { ThreeElements } from '@react-three/fiber'

// Extend JSX IntrinsicElements to include Three.js elements from React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements { }
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_USE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}