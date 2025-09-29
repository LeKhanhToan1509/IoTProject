import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ChevronDown, User, Mail, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

interface AuthFormProps {
  mode?: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ mode = 'login' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(mode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [language, setLanguage] = useState('English');
  const [registrationStep, setRegistrationStep] = useState(1); // 1: form, 2: verification
  const [verificationSent, setVerificationSent] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    if (activeTab === 'register') {
      if (!formData.name.trim()) {
        setError('Name is required');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!termsAccepted) {
        setError('Please accept the Terms and Privacy policy');
        return false;
      }
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'login') {
        console.log('Starting login...');
        await login(formData.email, formData.password);
        console.log('Login successful, navigating to dashboard...');
        navigate('/dashboard');
      } else {
        // Register logic with email verification
        if (registrationStep === 1) {
          // Step 1: Send registration request directly
          try {
            await authService.register({
              name: formData.name,
              email: formData.email,
              password: formData.password,
            });
            console.log('Registration successful, verification code sent');
            setRegistrationStep(2);
            setVerificationSent(true);
            setError('Verification code sent to your email. Please check your inbox.');
          } catch (error: any) {
            console.error('Registration failed:', error);
            // Handle specific error messages from backend
            if (error.response?.data?.message?.includes('already exists') || 
                error.response?.data?.message?.includes('already registered')) {
              setError('Email already exists. Please use a different email or login.');
            } else {
              setError(error.response?.data?.message || 'Registration failed. Please try again.');
            }
          }
        } else {
          // Step 2: Verify code and complete registration
          if (!formData.verificationCode.trim()) {
            setError('Please enter the verification code');
            setLoading(false);
            return;
          }
          
          try {
            await authService.verifyEmail(formData.email, formData.verificationCode);
            console.log('Email verification successful');
            
            // Reset states and go back to login
            setActiveTab('login');
            setRegistrationStep(1);
            setVerificationSent(false);
            setError('');
            setFormData({ 
              name: '', 
              email: formData.email, // Keep email for login
              password: '', 
              confirmPassword: '',
              verificationCode: ''
            });
            // Show success message
            setError('Registration successful! Please sign in with your credentials.');
            setTimeout(() => setError(''), 3000);
          } catch (error: any) {
            console.error('Email verification failed:', error);
            setError(error.response?.data?.message || 'Invalid verification code. Please try again.');
          }
        }
      }
    } catch (error: any) {
      console.error(`${activeTab} failed:`, error);
      setError(error.response?.data?.message || `${activeTab} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
  };

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setError('');
    setRegistrationStep(1);
    setVerificationSent(false);
    setFormData({ name: '', email: '', password: '', confirmPassword: '', verificationCode: '' });
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ backgroundColor: '#2A2A2A' }}>
      {/* Enhanced Background Effects with #2A2A2A theme */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated gradient orbs with darker theme */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-pulse"
             style={{
               background: 'radial-gradient(circle, rgba(191, 207, 192, 0.4) 0%, rgba(74, 144, 226, 0.3) 50%, transparent 80%)',
             }}>
        </div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 rounded-full mix-blend-screen filter blur-xl opacity-25 animate-pulse" 
             style={{ 
               animationDelay: '2s',
               background: 'radial-gradient(circle, rgba(139, 69, 255, 0.3) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 80%)',
             }}>
        </div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-pulse" 
             style={{ 
               animationDelay: '4s',
               background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(191, 207, 192, 0.2) 50%, transparent 80%)',
             }}>
        </div>
        
        {/* Floating particles with #2A2A2A theme */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(191, 207, 192, 0.2) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(74, 144, 226, 0.2) 0%, transparent 50%),
                             radial-gradient(circle at 40% 40%, rgba(139, 69, 255, 0.15) 0%, transparent 50%)`,
          }} />
        </div>
      </div>

      {/* Language Selector */}
      <div className="absolute top-6 right-6 z-20">
        <div className="relative">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-700/50 backdrop-blur-md text-white border border-gray-600/50 rounded-lg px-4 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          >
            <option value="English" className="text-black">English</option>
            <option value="Vietnamese" className="text-black">Vietnamese</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
        </div>
      </div>

      {/* Left Section - Welcome */}
      <div className="flex-1 flex items-center justify-center px-8 lg:px-16 relative z-10">
        <div className="max-w-lg w-full space-y-8 text-center lg:text-left">
          <div className="relative">
            <div className="absolute -top-4 -left-4">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h1 className="text-6xl lg:text-7xl font-extrabold leading-tight mb-8">
              <span className="bg-gradient-to-r from-white via-gray-200 to-blue-200 bg-clip-text text-transparent">
                Welcome to
              </span><br />
              <span className="bg-gradient-to-r from-blue-400 via-green-400 to-blue-500 bg-clip-text text-transparent">
                Smart Home
              </span><br />
              <span className="text-white">IoT</span>
            </h1>
            <div className="absolute -bottom-2 -right-4">
              <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
            </div>
          </div>
          
          <p className="text-xl text-gray-300 leading-relaxed">
            {activeTab === 'login' ? (
              <>
                {language === 'Vietnamese' ? 'Nếu bạn chưa có tài khoản' : 'If you don\'t have an account'}<br />
                {language === 'Vietnamese' ? 'bạn có thể' : 'you can'}{' '}
                <button 
                  onClick={() => switchTab('register')}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 underline hover:no-underline transition-all duration-300 hover:scale-105 inline-block"
                >
                  {language === 'Vietnamese' ? 'đăng ký tại đây!' : 'register here!'}
                </button>
              </>
            ) : (
              <>
                {language === 'Vietnamese' ? 'Nếu bạn đã có tài khoản' : 'If you have an account'}<br />
                {language === 'Vietnamese' ? 'bạn có thể' : 'you can'}{' '}
                <button 
                  onClick={() => switchTab('login')}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 underline hover:no-underline transition-all duration-300 hover:scale-105 inline-block"
                >
                  {language === 'Vietnamese' ? 'đăng nhập tại đây!' : 'login here!'}
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right Section - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-8 lg:px-16 relative z-10">
        <div className="max-w-md w-full">
          {/* Glassmorphism Container */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            {/* Tab Navigation */}
            <div className="flex mb-8 relative bg-white/5 rounded-2xl p-1">
              <button
                onClick={() => switchTab('login')}
                className={`flex-1 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative overflow-hidden ${
                  activeTab === 'login'
                    ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="relative z-10">
                  {language === 'Vietnamese' ? 'Đăng nhập' : 'Sign in'}
                </span>
              </button>
              <button
                onClick={() => switchTab('register')}
                className={`flex-1 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative overflow-hidden ${
                  activeTab === 'register'
                    ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="relative z-10">
                  {language === 'Vietnamese' ? 'Đăng ký' : 'Register'}
                </span>
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field - Only for Register Step 1 */}
              {activeTab === 'register' && registrationStep === 1 && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <input
                    type="text"
                    placeholder={language === 'Vietnamese' ? 'Nhập họ tên' : 'Enter Name'}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="relative w-full px-5 py-4 pl-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  />
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                </div>
              )}

              {/* Email Field - Always show for login, step 1 for register, readonly step 2 for register */}
              {(activeTab === 'login' || (activeTab === 'register' && registrationStep === 1)) && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <input
                    type="email"
                    placeholder={language === 'Vietnamese' ? 'Nhập email' : 'Enter Email'}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="relative w-full px-5 py-4 pl-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                </div>
              )}

              {/* Email Display - Only for Register Step 2 */}
              {activeTab === 'register' && registrationStep === 2 && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative w-full px-5 py-4 pl-12 bg-white/5 border border-white/10 rounded-xl text-gray-300 backdrop-blur-sm">
                    {formData.email}
                  </div>
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                </div>
              )}

              {/* Password Field - Only for login and register step 1 */}
              {(activeTab === 'login' || (activeTab === 'register' && registrationStep === 1)) && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={language === 'Vietnamese' ? 'Nhập mật khẩu' : 'Enter Password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="relative w-full px-5 py-4 pl-12 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              )}

              {/* Confirm Password Field - Only for Register Step 1 */}
              {activeTab === 'register' && registrationStep === 1 && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={language === 'Vietnamese' ? 'Xác nhận mật khẩu' : 'Confirm Password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    className="relative w-full px-5 py-4 pl-12 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              )}

              {/* Verification Code Field - Only for Register Step 2 */}
              {activeTab === 'register' && registrationStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center text-gray-300 text-sm">
                    {language === 'Vietnamese' 
                      ? 'Vui lòng nhập mã xác thực đã được gửi tới email của bạn' 
                      : 'Please enter the verification code sent to your email'}
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <input
                      type="text"
                      placeholder={language === 'Vietnamese' ? 'Nhập mã xác thực (6 chữ số)' : 'Enter verification code (6 digits)'}
                      value={formData.verificationCode}
                      onChange={(e) => handleInputChange('verificationCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      className="relative w-full px-5 py-4 pl-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm text-center text-2xl tracking-widest font-mono"
                    />
                    <Sparkles className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      // Resend verification code logic
                      setLoading(true);
                      try {
                        await authService.resendVerification(formData.email);
                        setError('Verification code resent to your email.');
                        setTimeout(() => setError(''), 3000);
                      } catch (error: any) {
                        console.error('Resend verification failed:', error);
                        setError(error.response?.data?.message || 'Failed to resend verification code. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200 underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {language === 'Vietnamese' ? 'Gửi lại mã xác thực' : 'Resend verification code'}
                  </button>
                </div>
              )}

              {/* Terms and Privacy - Only for Register Step 1 */}
              {activeTab === 'register' && registrationStep === 1 && (
                <div className="flex items-start space-x-3 mt-6">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 bg-white/10 border border-white/30 rounded focus:ring-2 focus:ring-purple-500 accent-purple-500"
                    />
                  </div>
                  <label htmlFor="terms" className="text-sm text-gray-300 leading-5">
                    {language === 'Vietnamese' ? 'Tôi đồng ý với' : 'I agree with'}{' '}
                    <button type="button" className="text-purple-400 underline hover:no-underline transition-all duration-200">
                      {language === 'Vietnamese' ? 'Điều khoản' : 'Terms'}
                    </button>
                    {' '}{language === 'Vietnamese' ? 'và' : 'and'}{' '}
                    <button type="button" className="text-purple-400 underline hover:no-underline transition-all duration-200">
                      {language === 'Vietnamese' ? 'Quyền riêng tư' : 'Privacy'}
                    </button>
                  </label>
                </div>
              )}

              {error && (
                <div className={`px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                  error.includes('successful') 
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
                    : 'bg-red-500/20 border border-red-500/30 text-red-200'
                }`}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="relative z-10">
                    {activeTab === 'login' 
                      ? (language === 'Vietnamese' ? 'Đăng nhập' : 'Sign In')
                      : registrationStep === 1
                        ? (language === 'Vietnamese' ? 'Gửi mã xác thực' : 'Send Verification Code')
                        : (language === 'Vietnamese' ? 'Xác thực & Đăng ký' : 'Verify & Register')
                    }
                  </span>
                )}
              </button>

              {/* Divider - Only for login and register step 1 */}
              {(activeTab === 'login' || (activeTab === 'register' && registrationStep === 1)) && (
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 text-gray-400 bg-slate-900/50 backdrop-blur-sm rounded-lg">
                      {language === 'Vietnamese' ? 'Hoặc tiếp tục với' : 'Or continue with'}
                    </span>
                  </div>
                </div>
              )}

              {/* Social Login Buttons - Only for login and register step 1 */}
              {(activeTab === 'login' || (activeTab === 'register' && registrationStep === 1)) && (
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Google')}
                  className="flex items-center justify-center py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-white/20"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('Apple')}
                  className="flex items-center justify-center py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-white/20"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('Facebook')}
                  className="flex items-center justify-center py-4 bg-blue-600/20 backdrop-blur-sm hover:bg-blue-600/30 text-blue-300 font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-blue-500/30"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
              </div>
              )}

              {/* Back Button - Only for Register Step 2 */}
              {activeTab === 'register' && registrationStep === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationStep(1);
                    setVerificationSent(false);
                    setFormData(prev => ({ ...prev, verificationCode: '' }));
                  }}
                  className="w-full py-3 text-gray-400 hover:text-white transition-colors duration-200 text-sm underline"
                >
                  {language === 'Vietnamese' ? '← Quay lại thay đổi thông tin' : '← Back to edit information'}
                </button>
              )}

              {/* Switch Tab Link - Only for login and register step 1 */}
              {(activeTab === 'login' || (activeTab === 'register' && registrationStep === 1)) && (
              <div className="text-center mt-8">
                <span className="text-gray-400 text-sm">
                  {activeTab === 'login' 
                    ? (language === 'Vietnamese' ? "Chưa có tài khoản? " : "Don't have an account? ")
                    : (language === 'Vietnamese' ? "Đã có tài khoản? " : "Already have an account? ")
                  }
                  <button
                    type="button"
                    onClick={() => switchTab(activeTab === 'login' ? 'register' : 'login')}
                    className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 underline hover:no-underline transition-all duration-300 hover:scale-105 inline-block"
                  >
                    {activeTab === 'login' 
                      ? (language === 'Vietnamese' ? 'Đăng ký tại đây' : 'Register here')
                      : (language === 'Vietnamese' ? 'Đăng nhập tại đây' : 'Sign in here')
                    }
                  </button>
                </span>
              </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;