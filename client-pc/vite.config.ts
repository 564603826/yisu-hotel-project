import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 给每个 scss 文件头部注入 import
          additionalData: `@use "@/styles/_variables.scss" as *;`,
        },
      },
    },
    server: {
      host: true, // 监听所有地址，方便手机局域网测试
      port: 5173, // 默认端口
      proxy: {
        // 字符串简写写法：http://localhost:5173/api -> http://localhost:3000/api
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3000', // 后端 Node.js 服务地址 (假设运行在3000端口)
          changeOrigin: true, // 允许跨域
          // rewrite: (path) => path.replace(/^\/api/, '') // 如果后端接口不带 /api 前缀，需要把这就话取消注释
        },
      },
    },
  }
})
