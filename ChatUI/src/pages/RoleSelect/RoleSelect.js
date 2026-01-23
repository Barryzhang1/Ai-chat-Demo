import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserOutline, TeamOutline } from 'antd-mobile-icons';
import './RoleSelect.css';

function RoleSelect() {
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
      <div className="role-select-content">
        <div className="welcome-section">
          <h1 className="welcome-text">你好，{userName}！</h1>
          <p className="welcome-subtitle">请选择您的身份</p>
        </div>

        <div className="role-buttons">
          <div className="role-card user-card" onClick={handleUserRole}>
            <div className="role-icon">
              <UserOutline fontSize={48} />
            </div>
            <h2 className="role-title">我是用户</h2>
            <p className="role-description">我要点餐，查看菜单</p>
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
}

export default RoleSelect;
