import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Input, Button, Toast } from 'antd-mobile';
import './Register.css';

const Register = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleRegister = useCallback(() => {
    if (name.trim() === '') {
      Toast.show({
        icon: 'fail',
        content: '请输入您的名字',
      });
      return;
    }

    // 保存用户名到 localStorage
    localStorage.setItem('userName', name.trim());
    
    Toast.show({
      icon: 'success',
      content: '注册成功！',
    });

    // 跳转到主页
    setTimeout(() => {
      navigate('/home');
    }, 500);
  }, [name, navigate]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      handleRegister();
    }
  }, [handleRegister]);

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">欢迎使用点餐系统</h1>
        <p className="register-subtitle">请输入您的名字开始使用</p>
        
        <div className="register-form">
          <Input
            placeholder="请输入您的名字"
            value={name}
            onChange={setName}
            onKeyPress={handleKeyPress}
            clearable
            className="register-input"
          />
          
          <Button
            color="primary"
            size="large"
            block
            onClick={handleRegister}
            className="register-button"
          >
            开始使用
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Register;
