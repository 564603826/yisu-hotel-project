// src/utils/AntdGlobal.tsx
import { useEffect } from 'react'
import { App } from 'antd'
import type { ModalStaticFunctions } from 'antd/es/modal/confirm'
import { setGlobalConfig } from './staticAntd' // 👈 引入 Setter

const AntdGlobal = () => {
  const staticFunction = App.useApp()

  useEffect(() => {
    // 调用另一个文件的方法来设置全局变量
    setGlobalConfig({
      message: staticFunction.message,
      notification: staticFunction.notification,
      // 这里依然需要断言来解决 warn/warning 的类型问题
      modal: staticFunction.modal as unknown as ModalStaticFunctions,
    })
  }, [staticFunction])

  // 这个组件不渲染 UI，只负责干活
  return null
}

export default AntdGlobal
