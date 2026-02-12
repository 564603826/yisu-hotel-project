import { redirect } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import { getToken } from '@/utils/token'
import { message } from 'antd'

const getUserRole = () => useUserStore.getState().userInfo?.role
/**
 * 角色鉴权 Loader 工厂 (核心逻辑)
 * 作用：生成一个专门检查特定角色的 Loader
 * @param allowedRoles 允许访问的角色数组
 */
export const checkRoleLoader = (allowedRoles: string[]) => {
  // 返回一个标准的 Loader 函数
  return () => {
    const token = getToken()

    // 1. 没登录则去登录
    if (!token) {
      message.error('请先登录')
      return redirect('/login')
    }

    const currentRole = getUserRole()

    // 2. 角色在不在白名单里？
    if (currentRole && !allowedRoles.includes(currentRole)) {
      console.warn(`[Loader拦截] 角色 ${currentRole} 试图访问受限资源`)

      // 如果你是管理员走错了房间 -> 回管理员大厅
      if (currentRole === 'admin') {
        return redirect('/admin/dashboard')
      }
      // 如果你是商户走错了房间 -> 回商户大厅
      if (currentRole === 'merchant') {
        return redirect('/merchant/dashboard')
      }
      // 角色不明踢回登录页
      return redirect('/login')
    }

    // 3. 通过
    return null
  }
}
/**
 * 客人 Loader
 * 作用：已登录 -> 踢回主页
 */
export const requireGuestLoader = () => {
  const token = getToken()
  const role = getUserRole()
  if (token) {
    // 已登录，根据角色踢回去
    const target = role === 'admin' ? '/admin/dashboard' : '/merchant/dashboard'
    return redirect(target)
  }
  return null
}
