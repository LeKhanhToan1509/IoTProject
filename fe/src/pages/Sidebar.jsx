import React from 'react';
import { Menu } from 'antd';
import { HomeOutlined, HistoryOutlined, ProfileOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hook';
import IoTLogo from '../components/IoTLogo';

const { Item } = Menu;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { key: '/overview', path: '/overview', icon: <HomeOutlined style={{ fontSize: '18px', color: '#1890ff' }} />, label: 'Overview' },
    { key: '/device-history', path: '/device-history', icon: <HistoryOutlined style={{ fontSize: '18px', color: '#1890ff' }} />, label: 'Device History' },
    { key: '/sensor-history', path: '/sensor-history', icon: <HistoryOutlined style={{ fontSize: '18px', color: '#1890ff' }} />, label: 'Sensor History' },
    { key: '/profile', path: '/profile', icon: <ProfileOutlined style={{ fontSize: '18px', color: '#1890ff' }} />, label: 'User Profile' },
    { key: '/settings', path: '/settings', icon: <SettingOutlined style={{ fontSize: '18px', color: '#1890ff' }} />, label: 'Settings' },
  ];

  const getSelectedKey = () => {
    if (location.pathname === '/') return '/overview';
    return location.pathname;
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        // Redirect về trang login hoặc trang chủ sau khi logout thành công
        navigate('/login'); // Hoặc '/' tùy theo logic của bạn
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Có thể hiển thị thông báo lỗi nếu cần
    }
  };

  return (
    <div style={{ 
      width: 240, 
      height: '100vh', 
      background: 'linear-gradient(180deg, #ffffff 0%, #f0f2f5 100%)', 
      borderRight: '1px solid #e8e8e8',
      boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <IoTLogo size="large" />

      {/* Menu items container */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginTop: 16,
        marginLeft: 16,
        marginRight: 16,
        overflow: 'hidden'
      }}>
        {/* Main menu items */}
        <div style={{ flex: 1 }}>
          <Menu 
            theme="light" 
            selectedKeys={[getSelectedKey()]} 
            mode="inline" 
            style={{ 
              borderRight: 'none', 
              background: 'transparent',
              height: '100%'
            }}
            inlineIndent={24}
          >
            {menuItems.map(item => (
              <Item 
                key={item.key} 
                icon={item.icon}
                style={{ 
                  margin: '4px 0', 
                  borderRadius: '6px', 
                  height: '44px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.domEvent.currentTarget.style.backgroundColor = 'rgba(24, 144, 255, 0.04)';
                  e.domEvent.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.domEvent.currentTarget.style.backgroundColor = 'transparent';
                  e.domEvent.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <Link to={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {item.label}
                </Link>
              </Item>
            ))}
          </Menu>
        </div>

        <div style={{ flexShrink: 0, marginBottom: 24 }}>
          <Menu 
            theme="light" 
            mode="inline" 
            style={{ 
              borderRight: 'none', 
              background: 'transparent'
            }}
            inlineIndent={24}
          >
            <Item 
              key="logout" 
              icon={<LogoutOutlined style={{ fontSize: '18px', color: '#ff4d4f' }} />} 
              style={{ 
                borderRadius: '6px',
                color: '#ff4d4f',
                height: '44px'
              }}
              onMouseEnter={(e) => {
                e.domEvent.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.domEvent.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={handleLogout}
            >
              Logout
            </Item>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;