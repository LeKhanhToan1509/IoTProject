import React from 'react';
import { Button, Space, Card, Typography } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  DeleteOutlined, 
  EditOutlined,
  SaveOutlined,
  LoginOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ButtonTest = () => {
  return (
    <div style={{ padding: '20px', background: '#f5f7fa' }}>
      <Card>
        <Title level={3}>🎨 Button Hover Test</Title>
        <Text type="secondary">
          Hover over các button dưới đây để kiểm tra xem chữ có bị mất không
        </Text>
        
        <div style={{ marginTop: '20px' }}>
          <Title level={4}>Primary Buttons</Title>
          <Space wrap>
            <Button type="primary" icon={<UserOutlined />}>
              Đăng nhập
            </Button>
            <Button type="primary" icon={<SaveOutlined />}>
              Lưu thay đổi
            </Button>
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: '20px' }}>
          <Title level={4}>Default Buttons</Title>
          <Space wrap>
            <Button icon={<EditOutlined />}>
              Chỉnh sửa
            </Button>
            <Button icon={<SettingOutlined />}>
              Cài đặt
            </Button>
            <Button icon={<LoginOutlined />}>
              Đăng xuất
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: '20px' }}>
          <Title level={4}>Other Button Types</Title>
          <Space wrap>
            <Button type="dashed">
              Dashed Button
            </Button>
            <Button type="text">
              Text Button
            </Button>
            <Button type="link">
              Link Button
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: '20px' }}>
          <Title level={4}>Button States</Title>
          <Space wrap>
            <Button loading>
              Loading Button
            </Button>
            <Button disabled>
              Disabled Button
            </Button>
            <Button type="primary" size="large">
              Large Button
            </Button>
            <Button size="small">
              Small Button
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: '30px', padding: '15px', background: '#f0f2f5', borderRadius: '6px' }}>
          <Title level={5}>✅ Test Instructions:</Title>
          <ul>
            <li>Hover từ từ qua từng button</li>
            <li>Chữ phải luôn nhìn thấy được (không bị trắng trên trắng hoặc xanh trên xanh)</li>
            <li>Button phải có hiệu ứng hover mượt mà</li>
            <li>Kiểm tra trên cả light theme và dark theme (nếu có)</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ButtonTest;