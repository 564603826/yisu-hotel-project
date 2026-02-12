import { useState } from 'react'
import { Button, Form, Input } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import styles from './Register.module.scss'
import layoutStyles from '@/layouts/AuthLayout/AuthLayout.module.scss'
import { useAuthTransition } from '@/hooks/useAuthTransition'
import type { UserRole, UserRegisterRequest } from '@/types'
import { useUserStore } from '@/store'
import { useNavigate } from 'react-router-dom'

const Register = () => {
  const [role, setRole] = useState<UserRole>('merchant')
  const { isExiting, switchPage } = useAuthTransition()
  const register = useUserStore((state) => state.register)
  const navigate = useNavigate()

  const onFinish = async (values: {
    username: string
    password: string
    confirmPassword: string
  }) => {
    // 提交时带上 role
    const submitData: UserRegisterRequest = {
      username: values.username,
      password: values.password,
      role,
    }
    await register(submitData)
    navigate('/login')
  }

  return (
    <div
      className={`${layoutStyles.transitionWrapper} ${isExiting ? layoutStyles.exiting : ''}`}
      style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
    >
      {/* 1. 标题区 */}
      <div className={styles.titleSection}>
        <h2>加入 易宿</h2>
        <p>创建账户以开始管理酒店信息或进行审核工作。</p>
      </div>

      {/* 2. 角色选择卡片 */}
      <div className={styles.roleSelector}>
        <div
          className={`${styles.roleCard} ${role === 'merchant' ? styles.active : ''}`}
          onClick={() => setRole('merchant')}
        >
          <BankOutlined
            style={{ fontSize: 24, color: role === 'merchant' ? '#b87544' : '#a8a29e' }}
          />
          <span>商户入驻</span>
        </div>

        <div
          className={`${styles.roleCard} ${role === 'admin' ? styles.active : ''}`}
          onClick={() => setRole('admin')}
        >
          <SafetyCertificateOutlined
            style={{ fontSize: 24, color: role === 'admin' ? '#b87544' : '#a8a29e' }}
          />
          <span>后台管理</span>
        </div>
      </div>

      {/* 3. 表单区域 */}
      <Form
        name="register"
        onFinish={onFinish}
        layout="vertical"
        size="large"
        initialValues={{ role: 'merchant' }}
      >
        <Form.Item
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            {
              pattern: /^[a-zA-Z0-9_]{3,20}$/,
              message: '用户名必须是3-20位的字母、数字或下划线',
            },
          ]}
        >
          <Input prefix={<UserOutlined style={{ color: '#a8a29e' }} />} placeholder="用户名" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            {
              min: 6,
              max: 20,
              message: '密码长度必须是6-20位',
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#a8a29e' }} />}
            placeholder="设置密码"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致!'))
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#a8a29e' }} />}
            placeholder="确认密码"
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 32 }}>
          <Button type="primary" htmlType="submit" block>
            创建账户 <ArrowRightOutlined />
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', color: '#78716c' }}>
        已有账户？
        <a
          onClick={() => switchPage('/login')}
          style={{ color: '#c58e53', fontWeight: 'bold', marginLeft: 8, cursor: 'pointer' }}
        >
          立即登录
        </a>
      </div>
    </div>
  )
}

export default Register
