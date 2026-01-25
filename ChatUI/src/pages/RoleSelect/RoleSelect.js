import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd-mobile';
import { UserOutline, TeamOutline } from 'antd-mobile-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import './RoleSelect.css';

function RoleSelect() {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const { language, toggleLanguage, isEn } = useLanguage();

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
                localStorage.removeItem('userName');
                localStorage.removeItem('userAuth');
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
        </div>

        <div className="role-buttons">
          <div className="role-card user-card" onClick={handleUserRole}>
            <div className="role-icon">
              <UserOutline fontSize={48} />
            </div>
            <h2 className="role-title">{t('imUser', language)}</h2>
            <p className="role-description">{t('userDesc', language)}</p>
          </div>

          <div className="role-card merchant-card" onClick={handleMerchantRole}>
            <div className="role-icon">
              <TeamOutline fontSize={48} />
            </div>
            <h2 className="role-title">{t('imMerchant', language)}</h2>
            <p className="role-description">{t('merchantDesc', language)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleSelect;
