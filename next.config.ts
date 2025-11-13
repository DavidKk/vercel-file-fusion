import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  webpack: (config, { isServer }) => {
    // 支持 WASM 文件
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    // 在客户端构建时，排除 Node.js 核心模块
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        module: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        url: false,
        zlib: false,
      }
    }

    return config
  },
  // 添加对 @unrar-browser/core 的特殊处理
  transpilePackages: ['@unrar-browser/core'],
}

export default nextConfig
