import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Toast } from 'antd-mobile';
import { UserOutline, TeamOutline } from 'antd-mobile-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import { authUtils } from '../../utils/auth';
import { canAccessMerchant, getUserRole } from '../../utils/permission';
import './RoleSelect.css';

function RoleSelect() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const { language, toggleLanguage, isEn } = useLanguage();

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (!name) {
      navigate('/');
    } else {
      setUserName(name);
    }
    
    // 获取用户角色
    const role = getUserRole();
    setUserRole(role);
  }, [navigate]);

  const handleUserRole = () => {
    navigate('/user-order');
  };

  const handleMerchantRole = () => {
    // 检查权限：只有 BOSS 和 STAFF 可以访问商家后台
    if (!canAccessMerchant()) {
      Toast.show({
        content: isEn ? 'Access denied. Only BOSS and STAFF can access merchant dashboard.' : '权限不足，只有老板和员工可以访问商家后台',
        icon: 'fail',
        duration: 2000
      });
      return;
    }
    navigate('/merchant');
  };

  return (
    <div className="role-select-container">
      <div className="role-select-content">
        <div className="role-select-topbar">
          <div className="role-select-brand">{t('orderingSystem', language)}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              className="lang-switch-btn"
              fill="outline"
              size="small"
              onClick={toggleLanguage}
              aria-label={isEn ? '切换语言到中文' : 'Switch language to English'}
            >
              {isEn ? '中文' : 'EN'}
            </Button>
            <Button
              fill="outline"
              size="small"
              color="danger"
              onClick={() => {
                authUtils.removeToken();
                navigate('/');
              }}
            >
              {isEn ? 'Logout' : '退出'}
            </Button>
          </div>
        </div>

        <div className="welcome-section">
          <h1 className="welcome-text">{t('welcomeUser', language, { name: userName })}</h1>
          <p className="welcome-subtitle">{t('selectRole', language)}</p>
          {userRole && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#999' }}>
              {t('currentRole', language)}{t(userRole === 'BOSS' ? 'roleBoss' : userRole === 'STAFF' ? 'roleStaff' : 'roleUser', language)}
            </div>
          )}
        </div>

        <div className="role-buttons">
          <div className="role-card user-card" onClick={handleUserRole}>
            <div className="role-icon">
              <UserOutline fontSize={48} />
            </div>
            <h2 className="role-title">{t('imUser', language)}</h2>
            <p className="role-description">{t('userDesc', language)}</p>
          </div>

          <div 
            className={`role-card merchant-card ${!canAccessMerchant() ? 'disabled' : ''}`}
            onClick={handleMerchantRole}
            style={{ 
              opacity: !canAccessMerchant() ? 0.5 : 1,
              cursor: !canAccessMerchant() ? 'not-allowed' : 'pointer'
            }}
          >
            <div className="role-icon">
              <TeamOutline fontSize={48} />
            </div>
            <h2 className="role-title">{t('imMerchant', language)}</h2>
            <p className="role-description">{t('merchantDesc', language)}</p>
            {!canAccessMerchant() && (
              <div style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                color: '#ff4d4f',
                textAlign: 'center'
              }}>
                {t('bossStaffOnly', language)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleSelect;
