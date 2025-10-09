import React from 'react';
import { Card, Switch, Select, Button, Divider, Typography, Space } from 'antd';
import { SettingOutlined, NotificationOutlined, GlobalOutlined, SecurityScanOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Settings = () => {
  return (
    <div style={{ padding: '0', maxWidth: '1200px' }}>
      <Title level={2} style={{ marginBottom: 24, color: '#333' }}>
        <SettingOutlined style={{ marginRight: 8 }} />
        Settings
      </Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* General Settings */}
        <Card title="General Settings" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Language</Text>
                <br />
                <Text type="secondary">Select your preferred language</Text>
              </div>
              <Select defaultValue="en" style={{ width: 150 }}>
                <Option value="en">English</Option>
                <Option value="vn">Tiếng Việt</Option>
              </Select>
            </div>
            
            <Divider />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Theme</Text>
                <br />
                <Text type="secondary">Choose between light and dark mode</Text>
              </div>
              <Select defaultValue="light" style={{ width: 150 }}>
                <Option value="light">Light</Option>
                <Option value="dark">Dark</Option>
              </Select>
            </div>
          </Space>
        </Card>

        {/* Notification Settings */}
        <Card 
          title={
            <span>
              <NotificationOutlined style={{ marginRight: 8 }} />
              Notifications
            </span>
          } 
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Email Notifications</Text>
                <br />
                <Text type="secondary">Receive notifications via email</Text>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Divider />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Device Alerts</Text>
                <br />
                <Text type="secondary">Get alerts when devices go offline</Text>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Divider />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Sensor Alerts</Text>
                <br />
                <Text type="secondary">Get alerts for sensor threshold violations</Text>
              </div>
              <Switch defaultChecked />
            </div>
          </Space>
        </Card>

        {/* Security Settings */}
        <Card 
          title={
            <span>
              <SecurityScanOutlined style={{ marginRight: 8 }} />
              Security
            </span>
          } 
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Two-Factor Authentication</Text>
                <br />
                <Text type="secondary">Add an extra layer of security to your account</Text>
              </div>
              <Switch />
            </div>
            
            <Divider />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Session Timeout</Text>
                <br />
                <Text type="secondary">Automatically log out after inactivity</Text>
              </div>
              <Select defaultValue="30" style={{ width: 150 }}>
                <Option value="15">15 minutes</Option>
                <Option value="30">30 minutes</Option>
                <Option value="60">1 hour</Option>
                <Option value="never">Never</Option>
              </Select>
            </div>
          </Space>
        </Card>

        {/* Action Buttons */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Space>
            <Button type="primary" size="large">
              Save Changes
            </Button>
            <Button size="large">
              Reset to Default
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default Settings;