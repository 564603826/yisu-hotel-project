import React, { useState } from 'react'
import { Layout, Menu, Avatar, Badge, Button, Tag, message } from 'antd'
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  ClipboardList,
  Users,
  FileCheck,
  Bell,
  Menu as MenuIcon,
  LogOut,
} from 'lucide-react'
import styles from './DashboardLayout.module.scss'
import logo from '@/assets/logo.svg'
import { useUserStore } from '@/store'
import { Outlet } from 'react-router-dom'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout

interface DashboardLayoutProps {
  children?: React.ReactNode
  role?: 'merchant' | 'admin'
}

const DashboardLayout: React.FC<DashboardLayoutProps> = () => {
  const [collapsed, setCollapsed] = useState(false)
  const userInfo = useUserStore((state) => state.userInfo)
  const role = userInfo?.role
  const navigate = useNavigate()
  const location = useLocation()

  // 处理退出登录
  const logout = useUserStore((state) => state.logout)
  const handleLogout = () => {
    logout()
    message.success('退出成功')
  }

  // ... (菜单配置 items 代码不变) ...
  const menuItems =
    role === 'merchant'
      ? [
          {
            key: '/merchant/dashboard',
            icon: <LayoutDashboard size={20} />,
            label: '仪表盘',
          },
          {
            key: '/merchant/hotels',
            icon: <Building2 size={20} />,
            label: '酒店信息管理',
          },
          { key: 'rooms', icon: <BedDouble size={20} />, label: '房型管理' },
          { key: 'orders', icon: <ClipboardList size={20} />, label: '订单管理' },
        ]
      : [
          {
            key: '/admin/dashboard',
            icon: <LayoutDashboard size={20} />,
            label: '平台概览',
          },
          {
            key: '/admin/audit',
            icon: <FileCheck size={20} />,
            label: '审核与管理',
          },
          { key: 'users', icon: <Users size={20} />, label: '用户管理', path: '/admin/users' },
        ]

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 1. 左侧深色侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        className={styles.sidebar}
      >
        <div className={styles.logoContainer}>
          {!collapsed ? (
            <div style={{ width: '100%', display: 'flex', height: 64 }}>
              <img src={logo} alt="YISU" style={{ width: 40, height: 40, margin: '12px 20px' }} />
              <h1 className={styles.logoText}>YiSu</h1>
            </div>
          ) : (
            <img src={logo} alt="YISU" style={{ width: 40, height: 40 }} />
          )}
        </div>
        <Menu
          className={styles.menu}
          onClick={({ key }) => navigate(key)}
          selectedKeys={[location.pathname]}
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          items={menuItems}
          style={{ background: 'transparent', borderRight: 0, marginTop: 16 }}
        />
        <div className={styles.sidebarFooter}>
          <Button
            type="text"
            icon={<LogOut size={18} style={{ color: '#a8a29e' }} />}
            block
            className={styles.logoutBtn}
            onClick={handleLogout}
          >
            {!collapsed && '退出登录'}
          </Button>
        </div>
      </Sider>

      {/* 2. 右侧布局 (应用浅黄色背景的关键位置) */}
      <Layout className={styles.siteLayout}>
        {/* 3. 白色顶部栏 */}
        <Header className={styles.header}>
          <Button
            type="text"
            icon={<MenuIcon size={22} />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <div className={styles.headerRight}>
            <Tag color={role === 'merchant' ? 'gold' : 'geekblue'}>
              {role === 'merchant' ? '商户模式' : '管理员模式'}
            </Tag>
            <Badge dot offset={[-10, 18]} color="#ff4d4f">
              <Button type="text" shape="circle" icon={<Bell size={20} />} />
            </Badge>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                paddingLeft: 16,
                borderLeft: '1px solid #e7e5e4',
              }}
            >
              <Avatar src="https://picsum.photos/40/40" style={{ border: '2px solid #c58e53' }} />
              <div style={{ lineHeight: 1.2 }}>
                <div
                  style={{ fontWeight: 'bold', fontFamily: 'Playfair Display', color: '#292524' }}
                >
                  {userInfo?.username || (role === 'merchant' ? '商户' : '管理员')}
                </div>
                <div style={{ fontSize: 12, color: '#78716c' }}>
                  {role === 'merchant' ? '商户' : '管理员'}
                </div>
              </div>
            </div>
          </div>
        </Header>

        {/* 4. 内容区域 (背景透明，透出父级的浅黄) */}
        <Content className={styles.content}>
          <div className={styles.contentInner}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default DashboardLayout
