/// <reference types="vite/client" />

import type { ThreeElements } from '@react-three/fiber'

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_USE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 擴充 JSX.IntrinsicElements 以支援 R3F 元素 (mesh, group, etc.)
// 同時宣告 React 命名空間與全域 JSX 命名空間，以相容不同的 TS 設定
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
  
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}