import type {
  UserLoginRequest,
  LoginResponseData,
  UserRegisterRequest,
  RegisterResponseData,
} from '@/types'
import service from '@/utils/request.ts'

const URL = {
  USER_LOGIN: '/auth/login',
  USER_REGISTER: '/auth/register',
}

export default {
  userLogin: (data: UserLoginRequest) => service.post<any, LoginResponseData>(URL.USER_LOGIN, data),
  userRegister: (data: UserRegisterRequest) =>
    service.post<any, RegisterResponseData>(URL.USER_REGISTER, data),
}
