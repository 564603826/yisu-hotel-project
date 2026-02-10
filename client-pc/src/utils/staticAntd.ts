// src/utils/staticAntd.ts
import type { MessageInstance } from 'antd/es/message/interface'
import type { ModalStaticFunctions } from 'antd/es/modal/confirm'
import type { NotificationInstance } from 'antd/es/notification/interface'

// 1. 定义全局变量 (初始为空)
let message: MessageInstance = null as any
let notification: NotificationInstance = null as any
let modal: ModalStaticFunctions = null as any

// 2. 导出一个 Setter 函数，专门给组件调用来赋值
export const setGlobalConfig = (staticFunctions: {
  message: MessageInstance
  notification: NotificationInstance
  modal: ModalStaticFunctions
}) => {
  message = staticFunctions.message
  notification = staticFunctions.notification
  modal = staticFunctions.modal
}

// 3. 导出这些全局变量供业务代码使用
export { message, notification, modal }
