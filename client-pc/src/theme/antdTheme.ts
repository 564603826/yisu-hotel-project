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
    colorBgBase: '#fbf8f1',
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
      bodyBg: '#fbf8f1',
      headerBg: '#ffffff',
      siderBg: '#292524',
    },
    Menu: {
      // 深色菜单的选中色
      darkItemBg: '#2B2623',
      darkItemSelectedBg: colors.primary,
      darkItemColor: '#78716c', // stone-400
      darkItemSelectedColor: '#fff',
    },
    Table: {
      // 表格配色：表头灰色，内容暖白
      headerBg: '#fafaf9', // 表头背景：暖灰色 (stone-50)
      headerColor: '#292524', // 表头文字：深色
      rowHoverBg: 'rgba(197, 142, 83, 0.06)', // 行悬浮背景：淡金色
      borderColor: 'rgba(231, 229, 228, 0.8)', // 边框颜色：淡灰色
      headerSplitColor: 'rgba(214, 211, 209, 0.6)', // 表头分割线
      rowSelectedBg: 'rgba(197, 142, 83, 0.08)', // 选中行背景
      rowSelectedHoverBg: 'rgba(197, 142, 83, 0.12)', // 选中行悬浮背景
      cellPaddingBlock: 16, // 单元格垂直内边距
      cellPaddingInline: 16, // 单元格水平内边距
    },
  },
}
