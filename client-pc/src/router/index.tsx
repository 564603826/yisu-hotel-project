import { createBrowserRouter, Navigate } from 'react-router-dom'
import React from 'react'
import LazyLoad from './LazyLoad'
import { requireGuestLoader, checkRoleLoader } from './loaders'
import AuthLayout from '@/layouts/AuthLayout' // 登录注册的布局

// 懒加载组件引入
const Login = React.lazy(() => import('@/pages/Login'))
const Register = React.lazy(() => import('@/pages/Register'))
const HomeLayout = React.lazy(() => import('@/layouts/HomeLayout'))
const MerchantDashboard = React.lazy(() => import('@/pages/Home/Merchant'))
const AdminDashboard = React.lazy(() => import('@/pages/Home/Admin'))
const NotFound = React.lazy(() => import('@/pages/404'))

const router = createBrowserRouter([
  // 1. 公开路由 (无需登录)
  {
    path: '/',
    element: <AuthLayout />,
    loader: requireGuestLoader,
    children: [
      { path: '', element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LazyLoad component={Login} /> },
      { path: 'register', element: <LazyLoad component={Register} /> },
    ],
  },

  // 2. 商户端路由 (需要 Merchant 权限)
  {
    path: '/merchant',
    // 整个 /merchant 路径都被 AuthGuard 保护
    element: <LazyLoad component={HomeLayout} />,
    loader: checkRoleLoader(['merchant']),
    children: [
      {
        path: '',
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <LazyLoad component={MerchantDashboard} />,
      },
      // 后续在这里添加更多商户页面，比如：
      // { path: 'hotels', element: LazyLoad(MyHotels) },
    ],
  },

  // 3. 管理员端路由 (需要 Admin 权限)
  {
    path: '/admin',
    element: <LazyLoad component={HomeLayout} />,
    loader: checkRoleLoader(['admin']),
    children: [
      {
        path: '',
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <LazyLoad component={AdminDashboard} />,
      },
    ],
  },

  // 4. 404
  {
    path: '*',
    element: <LazyLoad component={NotFound} />,
  },
])

export default router
