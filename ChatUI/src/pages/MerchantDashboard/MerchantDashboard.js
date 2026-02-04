import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Grid, Popup, Form, Toast } from 'antd-mobile';
import { 
  UnorderedListOutline, 
  AppstoreOutline, 
  HistogramOutline, 
  PieOutline,
  TagOutline,
  TeamOutline,
  FileOutline,
  UserOutline,
  PayCircleOutline,
  PlayOutline
} from 'antd-mobile-icons';
import { dishApi } from '../../api/dishApi';
import DishFormPopup from '../../components/DishFormPopup';
import { canAccessMerchant, isBoss } from '../../utils/permission';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import './MerchantDashboard.css';

function MerchantDashboard() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { language } = useLanguage();

  // 权限检查：进入商家后台时验证权限
  useEffect(() => {
    if (!canAccessMerchant()) {
      Toast.show({
        content: t('accessDenied', language),
        icon: 'fail',
        duration: 2000
      });
      navigate('/role-select');
    }
  }, [navigate, language]);

  // 基础菜单项（BOSS 和 STAFF 都可以访问）
  const baseMenuItems = [
    {
      key: 'orders',
      title: t('orderList', language),
      icon: <UnorderedListOutline fontSize={32} />,
      path: '/merchant/orders',
      color: '#1677ff'
    },
    {
      key: 'inventory',
      title: t('dishList', language),
      icon: <AppstoreOutline fontSize={32} />,
      path: '/merchant/inventory',
      color: '#52c41a'
    },
    {
      key: 'inventory-management',
      title: t('inventoryManagement', language),
      icon: <FileOutline fontSize={32} />,
      path: '/merchant/inventory/list',
      color: '#13c2c2'
    },
    {
      key: 'purchase-order',
      title: t('purchaseManagement', language),
      icon: <FileOutline fontSize={32} />,
      path: '/merchant/inventory/purchase-order',
      color: '#fa8c16'
    },
    {
      key: 'seats',
      title: t('seatManagement', language),
      icon: <TeamOutline fontSize={32} />,
      path: '/merchant/seats',
      color: '#722ed1'
    },
    {
      key: 'rankings',
      title: t('gameRankings', language),
      icon: <HistogramOutline fontSize={32} />,
      path: '/merchant/rankings',
      color: '#faad14'
    },
    {
      key: 'play-game',
      title: t('playGame', language),
      icon: <PlayOutline fontSize={32} />,
      action: () => {
        // 获取当前登录用户名
        const userName = localStorage.getItem('userName');
        console.log('当前localStorage.userName:', userName);
        
        const finalUserName = userName || '游客';
        const gameUrl = `/game/?playerName=${encodeURIComponent(finalUserName)}`;
        
        console.log('打开游戏 URL:', gameUrl);
        
        // 在新标签页打开游戏，通过URL参数传递用户名
        window.open(gameUrl, '_blank');
      },
      color: '#f759ab'
    },
    {
      key: 'categories', 
      title: t('categoryManagement', language),
      icon: <TagOutline fontSize={32} />, 
      path: '/merchant/categories',
      color: '#ff8c00' 
    },
  ];

  // BOSS 专属菜单项
  const bossOnlyMenuItems = [
    {
      key: 'revenue',
      title: t('revenueManagement', language),
      icon: <PayCircleOutline fontSize={32} />,
      path: '/revenue',
      color: '#52c41a'
    },
    {
      key: 'permissions',
      title: t('permissionManagement', language),
      icon: <UserOutline fontSize={32} />,
      path: '/merchant/permissions',
      color: '#1890ff'
    },
  ];

  // 根据用户角色动态生成菜单
  const menuItems = isBoss() 
    ? [...baseMenuItems, ...bossOnlyMenuItems]
    : baseMenuItems;

  return (
    <div className="merchant-dashboard">
      <NavBar onBack={() => navigate('/role-select')}>
        {t('merchantBackend', language)}
      </NavBar>
      
      <div className="dashboard-grid-container">
        <Grid columns={2} gap={16}>
          {menuItems.map(item => (
            <Grid.Item key={item.key} onClick={() => item.action ? item.action() : navigate(item.path)}>
              <div 
                className="dashboard-card"
                style={{ '--item-color': item.color, borderColor: item.color }}
              >
                <div className="dashboard-content">
                  <div className="dashboard-icon" style={{ color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="dashboard-title">{item.title}</div>
                </div>
              </div>
            </Grid.Item>
          ))}
        </Grid>
      </div>
    </div>
  );
}

export default MerchantDashboard;
