import { useEffect } from 'react'
import { Button, Form, Input, Checkbox } from 'antd'
import { UserOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useUserStore } from '@/store'
import layoutStyles from '@/layouts/AuthLayout/AuthLayout.module.scss' // 引入刚才定义的动画样式
import { useAuthTransition } from '@/hooks/useAuthTransition' // 引入 Hook
import type { UserLoginRequest } from '@/types'
import { useNavigate, useSearchParams } from 'react-router-dom'

const Login = () => {
  const login = useUserStore((state) => state.login)
  const { isExiting, switchPage } = useAuthTransition()
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

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
  // 【提交逻辑】onFinish
  const onFinish = async (values: UserLoginRequest & { remember: boolean }) => {
    if (values.remember) {
      // 如果勾选了，存入 LocalStorage
      localStorage.setItem(
        'yisu-login-info',
        JSON.stringify({
          username: values.username,
        })
      )
    } else {
      localStorage.removeItem('yisu-login-info')
    }
    const loginData = { username: values.username, password: values.password }
    const res = await login(loginData)

    // 判断 redirect 是否可用（是否属于当前用户角色）
    const userRole = res.userInfo?.role
    const isRedirectValid =
      redirect &&
      redirect !== '/' &&
      ((userRole === 'admin' && redirect.startsWith('/admin')) ||
        (userRole === 'merchant' && redirect.startsWith('/merchant')))

    // 如果 redirect 有效则跳转到原页面，否则跳转到角色对应首页
    const targetRoute = isRedirectValid
      ? redirect
      : userRole === 'admin'
        ? '/admin/dashboard'
        : '/merchant/dashboard'
    navigate(targetRoute, { replace: true })
  }

  return (
    <div
      className={`${layoutStyles.transitionWrapper} ${isExiting ? layoutStyles.exiting : ''}`}
      style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
    >
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
          <Input prefix={<UserOutlined style={{ color: '#a8a29e' }} />} placeholder="用户名 " />
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
