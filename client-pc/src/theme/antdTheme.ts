import { type ThemeConfig } from 'antd'

// 从你的 variables.scss 中提取的色值
const colors = {
  primary: '#c58e53', // $gold-500
  primaryHover: '#b87544', // $b87544-600
  text: '#292524', // $stone-800
  bgBase: '#fbf8f1', // $gold-50
}

export const antdTheme: ThemeConfig = {
  token: {
    // 1. 品牌色 (影响所有按钮、链接、高亮)
    colorPrimary: colors.primary,
    colorError: '#cf3f46', // 主错误色 (比默认的柔和一点)
    colorErrorBg: '#fff1f0', // 错误背景色 (极淡的粉红)
    colorErrorBorder: '#ffa39e', // 错误边框色

    // 2. 基础圆角 (配合你的卡片设计，稍微圆润一点)
    borderRadius: 8,

    // 3. 字体 (配合设计稿)
    fontFamily:
      '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

    // 4. 文字颜色
    colorText: colors.text,
  },
  components: {
    Message: {
      borderRadiusLG: 12,
      contentPadding: '12px 20px',
    },
    Button: {
      // 按钮加高一点，更有质感
      controlHeight: 40,
      controlHeightLG: 48,
      algorithm: true, // 启用算法自动计算 hover 颜色
      colorPrimaryHover: colors.primaryHover,
      boxShadow: '0 4px 14px 0 rgba(197, 142, 83, 0.3)', // 金色阴影
    },
    Input: {
      controlHeight: 42,
      controlHeightLG: 50,
      activeBorderColor: colors.primary,
      hoverBorderColor: colors.primary,
    },
    Card: {
      borderRadiusLG: 16, // 卡片圆角更大
    },
    Layout: {
      // 侧边栏背景色 (深松露色)
      siderBg: '#2B2623',
    },
    Menu: {
      // 深色菜单的选中色
      darkItemBg: '#2B2623',
      darkItemSelectedBg: colors.primary,
      darkItemColor: '$stone-400', // stone-400
      darkItemSelectedColor: '#fff',
    },
  },
}
