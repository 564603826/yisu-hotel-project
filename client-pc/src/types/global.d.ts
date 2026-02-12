import 'vite/client'

declare module '@amap/amap-jsapi-loader' {
  interface AMapLoaderOptions {
    key: string
    version: string
    plugins?: string[]
  }

  interface AMapLoader {
    load(options: AMapLoaderOptions): Promise<any>
  }

  const AMapLoader: AMapLoader
  export default AMapLoader
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_BACKEND_URL: string
  readonly VITE_AMAP_KEY: string
  readonly VITE_AMAP_SECURITY_KEY: string
}

export interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    AMap: any
    _AMapSecurityConfig: {
      securityJsCode: string
    }
  }
}

export {}
