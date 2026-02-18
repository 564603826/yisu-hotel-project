// 统一认证工具函数
// 所有认证相关操作都通过这里，避免多处直接操作 localStorage

const STORAGE_KEY = 'yisu-auth-storage-userInfo'

interface AuthData {
  state: {
    token: string | null
    userInfo: {
      userId: number
      username: string
      role: 'admin' | 'merchant'
    } | null
  }
}

// 同步读取认证信息
export const getAuth = (): AuthData['state'] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: AuthData = JSON.parse(stored)
      return parsed.state
    }
  } catch (e) {
    console.error('读取认证信息失败:', e)
  }
  return { token: null, userInfo: null }
}

// 获取 token
export const getToken = (): string | null => {
  return getAuth().token
}

// 获取用户角色
export const getUserRole = (): 'admin' | 'merchant' | null => {
  return getAuth().userInfo?.role || null
}

// 获取用户信息
export const getUserInfo = () => {
  return getAuth().userInfo
}

// 清除认证信息（退出登录）
export const clearAuth = () => {
  localStorage.removeItem(STORAGE_KEY)
}

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  return !!getToken()
}
