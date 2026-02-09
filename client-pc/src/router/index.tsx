import { createHashRouter } from 'react-router-dom'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Home from '@/pages/Home'

const router = createHashRouter([
  {
    path: '/home',
    element: <Home />,
  },
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
])

export default router
