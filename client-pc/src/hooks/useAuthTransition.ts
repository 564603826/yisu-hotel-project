import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const useAuthTransition = () => {
  const [isExiting, setIsExiting] = useState(false)
  const navigate = useNavigate()

  // 专门用来处理带动画的页面跳转
  const switchPage = (path: string) => {
    setIsExiting(true)
    navigate(path)
  }

  return {
    isExiting,
    switchPage,
  }
}
