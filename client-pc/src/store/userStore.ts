import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import useUserAPI from '@/api/auth' // 👈 引入你封装好的 API
import type {
  UserLoginRequest,
  UserInfo,
  UserRegisterRequest,
  RegisterResponseData,
  LoginResponseData,
} from '@/types' // 引入你的类型定义
import { message } from 'antd'

const { userLogin, userRegister } = useUserAPI
// 1. 定义数据 (State)
interface UserState {
  token: string | null
  userInfo: UserInfo | null
}

// 2. 定义动作 (Action)
interface UserActions {
  setToken: (token: string) => void
  setUserInfo: (info: UserInfo) => void
  login: (params: UserLoginRequest) => Promise<LoginResponseData>
  register: (params: UserRegisterRequest) => Promise<RegisterResponseData>
  logout: () => void
}

// 3. 创建 Store
export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set) => ({
      // --- 初始状态 ---
      token: null,
      userInfo: null,

      // --- 同步方法 ---
      setToken: (token) => set({ token }),
      setUserInfo: (userInfo) => set({ userInfo }),

      // --- 异步业务逻辑 (这是重点) ---
      login: async (params) => {
        // 1. 调用 API (你封装好的)
        const res = await userLogin(params)
        // 2. 拿到数据，更新 Store (Zustand 会自动同步到 LocalStorage)
        set({
          token: res.token,
          userInfo: {
            userId: res.userId,
            username: res.username,
            role: res.role,
          },
        })

        return res
      },

      register: async (params) => {
        const res = await userRegister(params)
        message.success('注册成功')
        return res
      },

      logout: () => {
        set({ token: null, userInfo: null })
        // 如果需要调用后端登出接口，也可以在这里写 await authApi.logout()
      },
    }),
    {
      name: 'yisu-auth-storage-userInfo', // LocalStorage 的 Key
    }
  )
)
