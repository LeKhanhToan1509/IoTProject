import { Layout, Avatar, Select } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useLocation, Outlet } from 'react-router-dom';
import Sidebar from '../pages/Sidebar';

const { Header, Content } = Layout;
const { Option } = Select;

const AppLayout = () => {
  const location = useLocation();
  
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/overview': return 'Overview';
      case '/device-history': return 'Device History';
      case '/sensor-history': return 'Sensor History';
      case '/profile': return 'User Profile';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', overflow: 'hidden' }}>
      {/* Sidebar riêng biệt - Fixed, không ảnh hưởng header */}
      <Sidebar />

      <Layout style={{ 
        marginLeft: 240, 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header duy nhất - Chỉ một lần */}
        <Header style={{ 
          padding: 0, 
          backgroundColor: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          height: '64px',
          flexShrink: 0,
          zIndex: 999
        }}>
          <div style={{ paddingLeft: 24, fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            {getPageTitle(location.pathname)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 24 }}>
            <Select defaultValue="English" style={{ width: 100, marginRight: 16 }}>
              <Option value="English">English</Option>
              <Option value="Tiếng Việt">Tiếng Việt</Option>
            </Select>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          </div>
        </Header>

        {/* Content - Sử dụng flex để fill remaining space */}
        <Content style={{ 
          flex: 1,
          margin: '16px', 
          padding: 24, 
          backgroundColor: '#fff', 
          borderRadius: 8, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'auto',
          minHeight: 0 // Important for flex scroll
        }}>
          <Outlet /> {/* Thay children bằng Outlet */}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;