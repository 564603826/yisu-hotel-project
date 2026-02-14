import { useEffect, useRef, useCallback } from 'react'

interface UseAutoRefreshOptions {
  /** 刷新间隔（毫秒），默认 30000ms (30秒) */
  interval?: number
  /** 页面可见时是否立即刷新，默认 true */
  refreshOnVisible?: boolean
  /** 是否启用自动刷新，默认 true */
  enabled?: boolean
}

/**
 * 自动刷新 Hook
 * 功能：
 * 1. 定时轮询刷新数据
 * 2. 页面从后台切换到前台时立即刷新
 * 3. 组件卸载时自动清理
 *
 * 注意：fetchFn 应该使用 useCallback 包裹，避免无限循环
 */
export function useAutoRefresh(fetchFn: () => Promise<void>, options: UseAutoRefreshOptions = {}) {
  const { interval = 30000, refreshOnVisible = true, enabled = true } = options

  const intervalRef = useRef<number | null>(null)
  const isFetchingRef = useRef(false)
  // 使用 ref 存储 fetchFn，避免依赖变化导致无限循环
  const fetchFnRef = useRef(fetchFn)

  // 更新 ref
  fetchFnRef.current = fetchFn

  // 包装 fetchFn，防止重复请求
  const safeFetch = useCallback(async () => {
    if (isFetchingRef.current) return

    isFetchingRef.current = true
    try {
      await fetchFnRef.current()
    } catch (error) {
      console.error('自动刷新失败:', error)
    } finally {
      isFetchingRef.current = false
    }
  }, []) // 不依赖 fetchFn，避免无限循环

  // 设置定时器 - 只在 interval 或 enabled 变化时重新设置
  useEffect(() => {
    if (!enabled) return

    // 延迟执行第一次，避免组件挂载时立即执行
    const timeoutId = setTimeout(() => {
      safeFetch()
    }, 100)

    // 设置定时轮询
    intervalRef.current = setInterval(safeFetch, interval)

    return () => {
      clearTimeout(timeoutId)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [interval, enabled, safeFetch])

  // 监听页面可见性变化
  useEffect(() => {
    if (!enabled || !refreshOnVisible) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 页面变为可见时立即刷新
        safeFetch()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, refreshOnVisible, safeFetch])

  // 返回手动刷新方法
  return {
    refresh: safeFetch,
  }
}

export default useAutoRefresh
