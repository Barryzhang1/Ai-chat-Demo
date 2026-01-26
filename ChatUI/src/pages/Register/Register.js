import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Input, Toast } from 'antd-mobile';
import { userApi } from '../../api/userApi';
import { authUtils } from '../../utils/auth';
import './Register.css';

function Register() {
  const [name, setName] = useState('');
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();

  // 检查是否已经登录
  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      // 已登录，直接跳转到角色选择页面
      navigate('/role-select');
    }
  }, [navigate]);

  const handleRegister = async () => {
    if (!name.trim()) {
      Toast.show({
        content: '请输入您的名字',
        position: 'center',
      });
      return;
    }

    try {
      const response = await userApi.register({ nickname: name.trim() });
      if (response.code === 0 && response.data && response.data.token) {
        // 保存 token 到 cookie
        authUtils.setToken(response.data.token);
        
        // 保存用户名到 localStorage (保持现有逻辑兼容性)
        localStorage.setItem('userName', response.data.user.nickname);
        
        // 保存完整用户信息到 localStorage（用于座位管理等功能）
        localStorage.setItem('userInfo', JSON.stringify({
          nickname: response.data.user.nickname,
          userId: response.data.user._id
        }));
        
        Toast.show({
          icon: 'success',
          content: '登录成功！',
          position: 'center',
        });

        // 跳转到角色选择页面
        setTimeout(() => {
          navigate('/role-select');
        }, 500);
      } else {
        Toast.show({
          icon: 'fail',
          content: response.message || '登录失败',
          position: 'center',
        });
      }
    } catch (error) {
      console.error('Register/Login failed:', error);
      Toast.show({
        icon: 'fail',
        content: '登录出错，请重试',
        position: 'center',
      });
    }
  };

  return (
    <div className="register-container">
      <div className="register-bg-anim" aria-hidden="true"></div>
      <div className="register-dialog">
        <h2>欢迎使用点餐系统</h2>
        <div className="register-input-area">
          <Input
            placeholder="请输入您的名字"
            value={name}
            onChange={setName}
            clearable
            className="register-input"
          />
        </div>
        <button className="register-btn" onClick={handleRegister}>
          开始使用
        </button>
      </div>
    </div>
  );
}

export default Register;
