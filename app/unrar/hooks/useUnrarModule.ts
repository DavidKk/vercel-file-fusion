import { getUnrarModule } from '@unrar-browser/core'
import { useEffect, useState } from 'react'

export interface UnrarModule {
  Archive: any
  CommandData: any
  setPassword: (password: string) => void
  FS: any
  HeaderType: {
    HEAD_FILE: number
    HEAD_ENDARC: number
  }
}

interface UseUnrarModuleResult {
  module: UnrarModule | null
  loading: boolean
  progress: number
  error: Error | null
}

export function useUnrarModule(): UseUnrarModuleResult {
  const [module, setModule] = useState<UnrarModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // 确保只在浏览器环境中运行
    if (typeof window === 'undefined') {
      return
    }

    let mounted = true
    let progressInterval: NodeJS.Timeout | null = null

    const loadModule = async () => {
      try {
        setLoading(true)
        setProgress(0)

        // 模拟进度增长到 90%
        let currentProgress = 0
        progressInterval = setInterval(() => {
          if (currentProgress < 90) {
            currentProgress += Math.random() * 15
            if (currentProgress > 90) currentProgress = 90
            if (mounted) {
              setProgress(currentProgress)
            }
          }
        }, 200)

        // 获取 base URL - 支持不同的部署环境
        // 从当前页面的路径自动检测 basePath
        const runtimeBasePath =
          process.env.NEXT_PUBLIC_UNRAR_BASE_PATH ||
          (typeof window !== 'undefined'
            ? (() => {
                const { pathname } = window.location
                const match = pathname.match(/^(.*?\/nextjs-demo)/)
                if (match) {
                  return `${match[1]}/`
                }
                return '/'
              })()
            : '/')

        const loadedModule = await getUnrarModule(runtimeBasePath)

        if (progressInterval) {
          clearInterval(progressInterval)
        }

        if (mounted) {
          setProgress(100)
          setModule(loadedModule)
          setError(null)
        }
      } catch (err) {
        if (progressInterval) {
          clearInterval(progressInterval)
        }
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setProgress(0)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadModule()

    return () => {
      mounted = false
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [])

  return { module, loading, progress, error }
}
