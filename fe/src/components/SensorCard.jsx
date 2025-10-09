import React from 'react';
import { Card, Row, Col, Typography, Badge, Alert } from 'antd';
import { FireOutlined, CloudOutlined, BulbOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useWebSocketSensor } from '../hooks/useWebSocketSensor'; // Import hook như trước

const { Title } = Typography;


const SensorCard = ({ activeTab = 'temperature', onTabChange }) => {
  const { sensorData, isConnected, isLoading, error } = useWebSocketSensor();
  const [maxValue, setMaxValue] = React.useState({
    temperature: 100,
    humidity: 100,
    light: 3000,
  });
  const [minValue, setMinValue] = React.useState({
    temperature: 0,
    humidity: 0,
    light: 0,
  });
  // Cấu hình cho từng tab (giữ nguyên)
  const sensorConfig = {
    temperature: { title: 'Temperature', icon: <FireOutlined /> },
    humidity: { title: 'Humidity', icon: <CloudOutlined /> },
    light: { title: 'Light', icon: <BulbOutlined /> },
  };

  const currentData = {
    ...sensorData[activeTab],
    ...sensorConfig[activeTab],
    min: minValue[activeTab],
    max: maxValue[activeTab],
  };

  // Nếu đang loading, hiển thị spinner
  if (isLoading) {
    return (
      <Card style={{ height: '400px', width: '100%', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography.Text>Đang tải dữ liệu...</Typography.Text>
        </div>
      </Card>
    );
  }

  // Nếu có error (từ fallback API), hiển thị alert
  if (error) {
    return (
      <Card style={{ height: '400px', width: '100%', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Alert
          message="Lỗi kết nối"
          description={error.message || 'Không thể lấy dữ liệu sensor.'}
          type="error"
          showIcon
          style={{ margin: '20px' }}
        />
      </Card>
    );
  }

  // Tính percentage chỉ khi connected (không dùng khi offline)
  const percentage = isConnected ? ((currentData.value - currentData.min) / (currentData.max - currentData.min)) * 100 : 0;
  const isHigh = isConnected ? percentage > 70 : false;
  const indicatorColor = isHigh ? '#ff4d4f' : 'rgba(0,0,0,0.1)';
  
  // Gradient (chỉ dùng khi connected)
  const textGradient = `linear-gradient(45deg, 
    #52c41a 0%, 
    #faad14 30%, 
    #fa8c16 60%, 
    #ff4d4f 100%)`;
  const progressGradient = `linear-gradient(90deg, 
    #52c41a 0%, 
    #faad14 30%, 
    #fa8c16 60%, 
    #ff4d4f 100%)`;

  return (
    <Card 
      style={{ 
        height: '400px', 
        width: '100%', 
        borderRadius: 12, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        color: '#333',
        border: `1px solid ${isConnected ? '#f0f0f0' : '#ff4d4f'}`,
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {/* Header title - luôn hiển thị */}
      <div style={{ 
        padding: '20px 24px 12px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Title level={4} style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '500' }}>
            {currentData.title}
          </Title>
          <Badge 
            status={isConnected ? 'success' : 'error'}
            text={isConnected ? 'Live' : 'Offline'}
            style={{ fontSize: '12px' }}
          />
        </div>
        <span style={{ color: '#999', fontSize: '14px' }}>{currentData.icon}</span>
      </div>

      {/* Nội dung chính: Phân biệt connected vs offline */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 24px' }}>
        {isConnected ? (
          // Hiển thị dữ liệu khi connected
          <>
            <div style={{ 
              fontSize: '64px', 
              fontWeight: '500',
              background: textGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 8,
              transition: 'all 0.3s ease'
            }}>
              {currentData.value}{currentData.unit}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#666', 
              marginBottom: 24,
              letterSpacing: '0.5px'
            }}>
              Range: {currentData.min} - {currentData.max}{currentData.unit}
            </div>
            
            {/* Thanh progress */}
            <div style={{ width: '80%', marginBottom: 16 }}>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${percentage}%`, 
                  height: '100%', 
                  background: progressGradient,
                  borderRadius: '4px',
                  transition: 'all 0.3s ease'
                }} />
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '4px',
                fontSize: '12px',
                color: '#999'
              }}>
                <span>{currentData.min}</span>
                <span>{Math.round(percentage)}%</span>
                <span>{currentData.max}</span>
              </div>
            </div>
          </>
        ) : (
          // Hiển thị cảnh báo khi offline
          <div style={{ 
            textAlign: 'center', 
            color: '#ff4d4f', 
            fontSize: '18px', 
            fontWeight: '500',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '8px'
          }}>
            <DisconnectOutlined style={{ fontSize: '48px', color: '#ff4d4f' }} />
            <span>Mất kết nối</span>
            <span style={{ fontSize: '14px', color: '#999', fontWeight: 'normal' }}>
              Không có dữ liệu mới. Vui lòng kiểm tra kết nối.
            </span>
          </div>
        )}
      </div>

      {/* Icons clickable - luôn hiển thị */}
      <Row gutter={8} style={{ padding: '0 24px 16px', justifyContent: 'center' }}>
        {Object.keys(sensorConfig).map(tab => (
          <Col key={tab}>
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                cursor: 'pointer',
                padding: 8,
                borderRadius: 8,
                transition: 'all 0.3s ease',
                backgroundColor: activeTab === tab ? '#f0f0f0' : 'transparent',
                color: activeTab === tab ? '#1890ff' : '#999',
                border: activeTab === tab ? '1px solid #d9d9d9' : 'none'
              }}
              onClick={() => onTabChange && onTabChange(tab)}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.backgroundColor = '#fafafa';
                  e.currentTarget.style.color = '#666';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#999';
                }
              }}
            >
              <div style={{ fontSize: '20px' }}>{sensorConfig[tab].icon}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Thanh indicator dưới cùng */}
      <div style={{ 
        height: '4px', 
        width: '100%', 
        backgroundColor: indicatorColor,
        transition: 'backgroundColor 0.3s ease'
      }} />
    </Card>
  );
};

export default SensorCard;