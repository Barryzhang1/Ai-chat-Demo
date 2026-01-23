import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, NavBar } from 'antd-mobile';
import { UserOutline, TeamOutline } from 'antd-mobile-icons';
import './RoleSelect.css';

const RoleSelect = () => {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (!name) {
      navigate('/');
    } else {
      setUserName(name);
    }
  }, [navigate]);

  const handleUserRole = () => {
    navigate('/user-order');
  };

  const handleMerchantRole = () => {
    navigate('/merchant');
  };

  return (
    <div className="role-select-container">
      <NavBar backArrow={false}>点餐系统</NavBar>
      
      <div className="role-select-content">
        <div className="welcome-section">
          <h1 className="welcome-text">欢迎，{userName}！</h1>
          <p className="welcome-subtitle">请选择您的身份</p>
        </div>

        <div className="role-buttons">
          <div className="role-card user-card" onClick={handleUserRole}>
            <div className="role-icon">
              <UserOutline fontSize={48} />
            </div>
            <h2 className="role-title">我是用户</h2>
            <p className="role-description">开始点餐，享受美食</p>
          </div>

          <div className="role-card merchant-card" onClick={handleMerchantRole}>
            <div className="role-icon">
              <TeamOutline fontSize={48} />
            </div>
            <h2 className="role-title">我是商家</h2>
            <p className="role-description">管理订单，查看数据</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
