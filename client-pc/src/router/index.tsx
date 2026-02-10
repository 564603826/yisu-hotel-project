import { createHashRouter } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Home from '@/pages/Home'

const router = createHashRouter([
  {
    path: '/home',
    element: <Home />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
    ],
  },
])

export default router
