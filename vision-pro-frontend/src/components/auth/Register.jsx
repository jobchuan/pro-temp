// src/components/auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.name.trim()) {
      setFormError('请输入用户名');
      return;
    }
    
    if (!formData.email.trim()) {
      setFormError('请输入邮箱');
      return;
    }
    
    if (!formData.password) {
      setFormError('请输入密码');
      return;
    }
    
    if (formData.password.length < 6) {
      setFormError('密码至少需要6个字符');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('两次输入的密码不一致');
      return;
    }
    
    // 清除表单错误
    setFormError('');
    
    // 提交注册
    const success = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });
    
    if (success) {
      navigate('/creator/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>注册账号</h1>
        
        {(formError || error) && (
          <div className="error-message">
            {formError || error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">用户名</label>
            <input 
              type="text" 
              id="name" 
              name="name"
              value={formData.name} 
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              value={formData.email} 
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              value={formData.password} 
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">确认密码</label>
            <input 
              type="password" 
              id="confirmPassword" 
              name="confirmPassword"
              value={formData.confirmPassword} 
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="primary-button" 
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            已有账号？ <Link to="/login">登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;