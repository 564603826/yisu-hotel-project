import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import { message } from '@/utils/staticAntd'
import { useUserStore } from '@/store'
import { type ApiResponse } from '@/types'
import { getToken, clearAuth } from '@/utils/auth'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, msg } = response.data
    // 全局处理：根据业务状态码判断是否成功
    if (code !== 200 && code !== 201) {
      message.error(msg || '请求失败')
      console.error('API Error:', response.data)
      return Promise.reject(response.data)
    }

    // 2xx 范围内的状态码都会触发该函数。
    // 这里可以直接剥离一层 data，让组件里少写一个 .data
    return response.data.data as any
  },
  (error) => {
    // 超出 2xx 范围的状态码都会触发该函数。
    const { response } = error

    // ----------------------------------------------------
    // 情况 A：没有响应 (网络断了，或者服务器挂了没返回)
    // ----------------------------------------------------
    if (!response) {
      message.error('网络连接异常，请检查您的网络')
      return Promise.reject(error)
    }

    const status = response.status
    const errorMessage = response.data?.msg || '请求失败'

    // ----------------------------------------------------
    // 情况 B：特定状态码处理 (全局处理)
    // ----------------------------------------------------
    switch (status) {
      case 401:
        //  核心需求：401 未授权
        clearAuth() // 清除 Token 和用户信息
        useUserStore.getState().logout() // 触发状态更新和跳转
        message.error(errorMessage || '登录已过期，请重新登录')
        break

      case 403:
        message.warning('您没有权限执行此操作，请重新登录')
        break

      case 500:
        message.error(errorMessage || '服务器内部错误，请联系管理员')
        break

      default:
        message.error(errorMessage || '请求失败，请联系管理员')
    }

    return Promise.reject(error)
  }
)

export default service
