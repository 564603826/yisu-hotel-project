// src/store/index.ts

// 直接导出所有的 Hooks
export * from './userStore'

// 💡 架构师提示：
// 如果你非要一个大对象包裹（虽然不推荐，因为不利于 Tree Shaking），
// 只能导出纯函数引用，不能在组件外调用 Hook。
// 但我强烈建议直接使用上面的 export * 写法。
