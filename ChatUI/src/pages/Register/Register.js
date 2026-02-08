import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Toast } from 'antd-mobile';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import { userApi } from '../../api/userApi';
import { authUtils } from '../../utils/auth';
import './Register.css';

function Register() {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { language, toggleLanguage, isEn } = useLanguage();

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
        content: t('pleaseEnterName', language),
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
          content: t('loginSuccess', language),
          position: 'center',
        });

        // 跳转到角色选择页面
        setTimeout(() => {
          navigate('/role-select');
        }, 500);
      } else {
        Toast.show({
          icon: 'fail',
          content: response.message || t('loginFailed', language),
          position: 'center',
        });
      }
    } catch (error) {
      console.error('Register/Login failed:', error);
      Toast.show({
        icon: 'fail',
        content: t('loginError', language),
        position: 'center',
      });
    }
  };

  return (
    <div className="register-container">
      <div className="register-bg-anim" aria-hidden="true"></div>
      <div className="register-topbar">
        <Button
          className="register-lang-btn"
          fill="outline"
          size="small"
          onClick={toggleLanguage}
          aria-label={isEn ? '切换语言到中文' : 'Switch language to English'}
        >
          {isEn ? '中文' : 'EN'}
        </Button>
      </div>
      <div className="register-dialog">
        <h2>{t('welcome', language)}</h2>
        <p className="register-subtitle">{t('enterName', language)}</p>
        <div className="register-input-area">
          <Input
            placeholder={t('namePlaceholder', language)}
            value={name}
            onChange={setName}
            clearable
            className="register-input"
            data-testid="register-name-input"
          />
        </div>
        <button
          className="register-btn"
          onClick={handleRegister}
          data-testid="register-submit"
        >
          {t('startUsing', language)}
        </button>
      </div>
    </div>
  );
}

export default Register;
