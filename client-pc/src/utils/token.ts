import { useUserStore } from '@/store' // 引入你的 store

// 1. 获取 Token
export const getToken = () => {
  //  getState() 可以读取当前最新的状态
  return useUserStore.getState().token
}

// 2. 设置 Token
export const setToken = (token: string) => {
  //  直接调用 store 里的 action，Zustand 会自动帮你同步到 localStorage
  // 而且还会触发 React 组件更新！
  useUserStore.getState().setToken(token)
}

// 3. 删除 Token (退出登录)
export const removeToken = () => {
  //  调用 store 里的 logout 方法
  // 它会把 token 设为 null，并且自动更新 localStorage
  useUserStore.getState().logout() // 假设你在 store 里定义了 logout action

  // 如果没定义 logout，也可以这样写：
  // useUserStore.getState().setToken(null)
}
