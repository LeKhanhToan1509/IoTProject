import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Tabs, message, Card, Typography, Divider, Space, Typography as AntTypography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, BulbOutlined, KeyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../../features/auth/hook';
import { useNavigate } from 'react-router-dom';
import IoTLogo from '../components/IoTLogo';

const { TabPane } = Tabs;
const { Title } = Typography;
const { Link: AntLink } = AntTypography;

const AuthenPage = () => {
  const [currentTab, setCurrentTab] = useState('login');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const [verifyForm] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempData, setTempData] = useState(null); // Lưu dữ liệu tạm cho verify OTP
  const [view, setView] = useState('tabs'); // 'tabs' | 'forgot' | 'verify'

  const { login, register, registerOTP, isAuthenticated, isFetching, error } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/overview');
    }
  }, [isAuthenticated, navigate]);

  const onLoginFinish = async (values) => {
    setIsSubmitting(true);
    try {
      const result = await login({
        email: values.email,
        password: values.password
      });

      if (result.success) {
        message.success('Đăng nhập thành công! Chào mừng đến với hệ thống IoT.');
        loginForm.resetFields();
        // Navigation will be handled by useEffect
      } else {
        message.error(result.error || 'Đăng nhập thất bại!');
      }
    } catch (err) {
      message.error('Có lỗi xảy ra khi đăng nhập!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterFinish = async (values) => {
    setIsSubmitting(true);
    try {
      // First send OTP
      const otpResult = await registerOTP({
        name: values.name,
        email: values.email,
        password: values.password
      });

      if (otpResult.success) {
        // Lưu thông tin tạm: thêm password vào tempData
        const tempUserData = {
          ...otpResult.data, // { name, email, time }
          password: values.password
        };
        setTempData(tempUserData);
        message.success('OTP đã được gửi đến email của bạn! Vui lòng kiểm tra email để kích hoạt tài khoản.');
        registerForm.resetFields();
        // Chuyển sang view verify
        setView('verify');
      } else {
        message.error(otpResult.error || 'Đăng ký thất bại!');
      }
    } catch (err) {
      message.error('Có lỗi xảy ra khi đăng ký!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerifyFinish = async (values) => {
    if (!tempData) {
      message.error('Dữ liệu đăng ký không hợp lệ. Vui lòng thử lại từ đầu.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Tạo registerData đầy đủ: thêm otp vào tempData
      const registerData = {
        ...tempData,
        otp: values.otp
      };

      const result = await register(registerData);

      if (result.success) {
        message.success('Đăng ký thành công! Đang đăng nhập...');
        verifyForm.resetFields();
        setTempData(null); // Xóa tempData
        setView('tabs'); // Quay về tabs
        setCurrentTab('login'); // Quay về tab login
        // Navigation sẽ được xử lý bởi useEffect hoặc hook
        navigate('/overview');
      } else {
        message.error(result.error || 'Xác thực OTP thất bại!');
      }
    } catch (err) {
      message.error('Có lỗi xảy ra khi xác thực OTP!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onForgotFinish = async (values) => {
    setIsSubmitting(true);
    try {
      // TODO: Thêm mutation forgotPassword nếu có
      // Ví dụ: const forgotResult = await forgotPassword({ email: values.email });
      message.success('OTP đã được gửi đến email của bạn để khôi phục mật khẩu!');
      forgotForm.resetFields();
      // Có thể navigate đến trang reset password nếu cần, hoặc xử lý ở đây
    } catch (err) {
      message.error('Có lỗi xảy ra khi gửi OTP!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const compareToFirstPassword = (rule, value) => {
    if (value && value !== registerForm.getFieldValue('password')) {
      return Promise.reject('Hai mật khẩu không khớp!');
    }
    return Promise.resolve();
  };

  const handleShowForgot = () => {
    setView('forgot');
  };

  const handleBackToLoginFromForgot = () => {
    setView('tabs');
    setCurrentTab('login');
    forgotForm.resetFields();
  };

  const handleBackToRegisterFromVerify = () => {
    setTempData(null);
    setView('tabs');
    setCurrentTab('register');
    verifyForm.resetFields();
  };

  // Render tab login với link quên mật khẩu
  const renderLoginTab = () => (
    <Form
      form={loginForm}
      name="login"
      onFinish={onLoginFinish}
      layout="vertical"
      size="middle"
    >
      <Form.Item
        name="email"
        rules={[{ required: true, message: 'Vui lòng nhập email!', type: 'email' }]}
      >
        <Input 
          prefix={<MailOutlined style={{ color: '#1890ff' }} />} 
          placeholder="Email"
          disabled={isSubmitting || isFetching}
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
      >
        <Input.Password 
          prefix={<LockOutlined style={{ color: '#1890ff' }} />} 
          placeholder="Mật khẩu"
          disabled={isSubmitting || isFetching}
        />
      </Form.Item>
      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={isSubmitting || isFetching}
          style={{ width: '100%', borderRadius: '6px', height: '40px' }}
        >
          Đăng nhập
        </Button>
      </Form.Item>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <AntLink onClick={handleShowForgot} style={{ cursor: 'pointer', color: '#1890ff' }}>
          Quên mật khẩu?
        </AntLink>
      </div>
    </Form>
  );

  // Render tab register
  const renderRegisterTab = () => (
    <Form
      form={registerForm}
      name="register"
      onFinish={onRegisterFinish}
      layout="vertical"
      size="middle"
    >
      <Form.Item
        name="name"
        rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
      >
        <Input 
          prefix={<UserOutlined style={{ color: '#1890ff' }} />} 
          placeholder="Tên"
          disabled={isSubmitting || isFetching}
        />
      </Form.Item>
      <Form.Item
        name="email"
        rules={[{ required: true, message: 'Vui lòng nhập email!', type: 'email' }]}
      >
        <Input 
          prefix={<MailOutlined style={{ color: '#1890ff' }} />} 
          placeholder="Email"
          disabled={isSubmitting || isFetching}
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
      >
        <Input.Password 
          prefix={<LockOutlined style={{ color: '#1890ff' }} />} 
          placeholder="Mật khẩu"
          disabled={isSubmitting || isFetching}
        />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Vui lòng nhập lại mật khẩu!' },
          { validator: compareToFirstPassword }
        ]}
      >
        <Input.Password 
          prefix={<LockOutlined style={{ color: '#1890ff' }} />} 
          placeholder="Xác nhận mật khẩu"
          disabled={isSubmitting || isFetching}
        />
      </Form.Item>
      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={isSubmitting || isFetching}
          style={{ width: '100%', borderRadius: '6px', height: '40px' }}
        >
          Đăng ký
        </Button>
      </Form.Item>
    </Form>
  );

  // Render form forgot
  const renderForgotForm = () => (
    <>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Title level={4} style={{ color: '#000', margin: 0, fontWeight: 'normal' }}>Quên mật khẩu</Title>
        <p style={{ color: '#666', fontSize: '14px' }}>Nhập email để nhận OTP khôi phục</p>
      </div>
      <Form
        form={forgotForm}
        name="forgot"
        onFinish={onForgotFinish}
        layout="vertical"
        size="middle"
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Vui lòng nhập email!', type: 'email' }]}
        >
          <Input 
            prefix={<MailOutlined style={{ color: '#1890ff' }} />} 
            placeholder="Email"
            disabled={isSubmitting}
          />
        </Form.Item>
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isSubmitting}
            style={{ width: '100%', borderRadius: '6px', height: '40px' }}
          >
            Gửi OTP
          </Button>
        </Form.Item>
        <Divider style={{ margin: '15px 0', borderColor: '#e8e8e8' }} />
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
          OTP sẽ được gửi đến email để đặt lại mật khẩu.
        </p>
      </Form>
      <Space style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBackToLoginFromForgot}
          style={{ borderRadius: '6px' }}
        >
          Quay lại đăng nhập
        </Button>
      </Space>
    </>
  );

  // Render form verify
  const renderVerifyForm = () => (
    <>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Title level={4} style={{ color: '#000', margin: 0, fontWeight: 'normal' }}>Xác thực OTP</Title>
        <p style={{ color: '#666', fontSize: '14px' }}>Nhập mã OTP đã gửi đến {tempData?.email}</p>
      </div>
      <Form
        form={verifyForm}
        name="verifyOtp"
        onFinish={onVerifyFinish}
        layout="vertical"
        size="middle"
      >
        <Form.Item
          name="otp"
          rules={[{ required: true, message: 'Vui lòng nhập OTP!', len: 6 }]}
        >
          <Input 
            prefix={<KeyOutlined style={{ color: '#1890ff' }} />} 
            placeholder="Nhập mã OTP (6 chữ số)"
            maxLength={6}
            disabled={isSubmitting || isFetching}
          />
        </Form.Item>
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isSubmitting || isFetching}
            style={{ width: '100%', borderRadius: '6px', height: '40px' }}
          >
            Xác thực
          </Button>
        </Form.Item>
      </Form>
      <Space style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBackToRegisterFromVerify}
          style={{ borderRadius: '6px' }}
        >
          Quay lại đăng ký
        </Button>
      </Space>
    </>
  );

  // Nội dung chính dựa trên view
  const renderContent = () => {
    if (view === 'forgot') {
      return renderForgotForm();
    }
    if (view === 'verify' && tempData) {
      return renderVerifyForm();
    }
    // Mặc định: tabs với login và register
    return (
      <Tabs 
        activeKey={currentTab} 
        onChange={setCurrentTab}
        centered
        tabBarStyle={{ marginBottom: '20px' }}
        animated
      >
        <TabPane tab="Đăng nhập" key="login">
          {renderLoginTab()}
        </TabPane>
        <TabPane tab="Đăng ký" key="register">
          {renderRegisterTab()}
        </TabPane>
      </Tabs>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#f5f5f5',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Card 
        style={{ 
          width: 450, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: '12px',
          border: '1px solid #e8e8e8'
        }}
        bodyStyle={{ padding: '30px' }}
      >
        <IoTLogo size="large" />

        {error && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '15px', 
            backgroundColor: '#fff2f0', 
            border: '1px solid #ffccc7',
            borderRadius: '6px',
            color: '#ff4d4f',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {renderContent()}
      </Card>
    </div>
  );
};

export default AuthenPage;