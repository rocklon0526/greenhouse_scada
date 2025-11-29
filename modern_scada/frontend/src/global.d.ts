/// <reference types="vite/client" />

import { ThreeElements } from '@react-three/fiber'

// 針對 React 18+ 的 JSX 型別擴充
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

// 備用：針對舊版或特定環境的全域 JSX
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_USE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}