/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_MODE_ENV: 'dev' | 'test' | 'prod'
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

interface Window {
  CanvasNest?: {
    destroy: () => void
  }
}

declare const LOCAL_BUILD_HASH: string
declare const LOCAL_BUILD_TIME: string
