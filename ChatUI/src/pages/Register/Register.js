import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Input, Toast } from 'antd-mobile';
import './Register.css';

function Register() {
  const [name, setName] = useState('');
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();

  const handleRegister = () => {
    if (!name.trim()) {
      Toast.show({
        content: '请输入您的名字',
        position: 'center',
      });
      return;
    }

    // 保存用户名到 localStorage
    localStorage.setItem('userName', name.trim());
    
    Toast.show({
      icon: 'success',
      content: '注册成功！',
      position: 'center',
    });

    // 跳转到角色选择页面
    setTimeout(() => {
      navigate('/role-select');
    }, 500);
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
