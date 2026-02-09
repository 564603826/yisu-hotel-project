import { type ThemeConfig } from 'antd'

// 这里的色值必须和 SCSS 保持一致
export const antdTheme: ThemeConfig = {
  token: {
    // 1. 品牌主色 (影响按钮、链接、Switch等)
    colorPrimary: '#C6A87C',

    // 2. 圆角 (直角显得严谨，小圆角显得现代，建议 4-6px)
    borderRadius: 6,

    // 3. 基础背景
    colorBgLayout: '#F9F7F5', // Layout 组件的背景色 (对应 $color-bg-body)
    colorBgContainer: '#FFFFFF', // Card, Content 的背景色

    // 4. 文字颜色
    colorTextBase: '#2E2A25',
    colorTextSecondary: '#8C8680',

    // 5. 字体 (建议加上 Lato 或 Roboto 提升数字显示的高级感)
    fontFamily:
      '"Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
  },

  // 针对特定组件的微调
  components: {
    Layout: {
      // 侧边栏背景色 (覆盖 Antd 默认的深蓝色)
      siderBg: '#2B2623',
      triggerBg: '#3E3834',
    },
    Menu: {
      // 深色模式下的菜单背景
      darkItemBg: '#2B2623',
      darkSubMenuItemBg: '#221E1C',
      // 选中项的背景色 (稍微亮一点的深色)
      darkItemSelectedBg: '#C6A87C',
      // 选中项的文字颜色 (反白)
      darkItemSelectedColor: '#FFFFFF',
    },
    Button: {
      // 按钮加一点点阴影更有质感
      boxShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
      fontWeight: 500,
    },
    Table: {
      headerBg: '#FAF8F6', // 表头用极淡的暖灰色
      headerColor: '#8C8680',
    },
  },
}
