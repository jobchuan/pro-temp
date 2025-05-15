// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 表单验证
    if (!email.trim()) {
      setFormError('请输入邮箱');
      return;
    }
    
    if (!password) {
      setFormError('请输入密码');
      return;
    }
    
    // 清除表单错误
    setFormError('');
    
    // 提交登录
    const success = await login(email, password);
    
    if (success) {
      navigate('/creator/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>登录</h1>
        
        {(formError || error) && (
          <div className="error-message">
            {formError || error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="primary-button" 
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            还没有账号？ <Link to="/register">注册账号</Link>
          </p>
          <p>
            <Link to="/forgot-password">忘记密码？</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;