import { useEffect } from 'react'
import { Button, Form, Input, Checkbox, message } from 'antd'
import { UserOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useUserStore } from '@/store'
import layoutStyles from '@/layouts/AuthLayout/AuthLayout.module.scss' // 引入刚才定义的动画样式
import { useAuthTransition } from '@/hooks/useAuthTransition' // 引入 Hook
import type { UserLoginRequest } from '@/types'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const login = useUserStore((state) => state.login)
  const { isExiting, switchPage } = useAuthTransition()
  const [form] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => {
    const savedInfo = localStorage.getItem('yisu-login-info')
    if (savedInfo) {
      const parsedInfo = JSON.parse(savedInfo)
      form.setFieldsValue({
        username: parsedInfo.username,
        remember: true,
      })
    }
  }, [form])
  // 3. 【提交逻辑】onFinish
  const onFinish = async (values: UserLoginRequest & { remember: boolean }) => {
    // ✨ 核心：处理“记住我”
    if (values.remember) {
      // 如果勾选了，存入 LocalStorage
      localStorage.setItem(
        'yisu-login-info',
        JSON.stringify({
          username: values.username,
        })
      )
    } else {
      // 如果没勾选，记得把旧的删掉，防止下次误填
      localStorage.removeItem('yisu-login-info')
    }
    const loginData = { username: values.username, password: values.password }
    console.log('表单验证通过，数据是：', loginData)
    const res = await login(loginData)
    console.log(res)
    message.success('登录逻辑触发')
    navigate('/')
  }

  return (
    <div
      className={`${layoutStyles.transitionWrapper} ${isExiting ? layoutStyles.exiting : ''}`}
      style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
    >
      {/* 标题区 */}
      <div style={{ marginBottom: 40 }}>
        <h2
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '2.25rem',
            color: '#292524',
            marginBottom: '8px',
          }}
        >
          欢迎回来
        </h2>
        <p style={{ color: '#78716c' }}>请输入您的账户信息以访问管理后台。</p>
      </div>

      <Form
        form={form}
        name="login"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
          <Input prefix={<UserOutlined style={{ color: '#a8a29e' }} />} placeholder="用户名 " />
        </Form.Item>

        <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
          <Input.Password
            prefix={<LockOutlined style={{ color: '#a8a29e' }} />}
            placeholder="密码"
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox style={{ color: '#78716c' }}>记住我</Checkbox>
          </Form.Item>
        </div>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            立即登录 <ArrowRightOutlined />
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', color: '#78716c' }}>
        还没有账户？
        <a
          onClick={() => switchPage('/register')} // 点击触发动画 -> 跳转
          style={{ color: '#c58e53', fontWeight: 'bold', marginLeft: 8, cursor: 'pointer' }}
        >
          立即注册
        </a>
      </div>
    </div>
  )
}

export default Login
