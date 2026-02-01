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
  PayCircleOutline
} from 'antd-mobile-icons';
import { dishApi } from '../../api/dishApi';
import DishFormPopup from '../../components/DishFormPopup';
import { canAccessMerchant, isBoss } from '../../utils/permission';
import './MerchantDashboard.css';

function MerchantDashboard() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // 权限检查：进入商家后台时验证权限
  useEffect(() => {
    if (!canAccessMerchant()) {
      Toast.show({
        content: '权限不足，只有老板和员工可以访问商家后台',
        icon: 'fail',
        duration: 2000
      });
      navigate('/role-select');
    }
  }, [navigate]);

  // 权限检查：进入商家后台时验证权限
  useEffect(() => {
    if (!canAccessMerchant()) {
      Toast.show({
        content: '权限不足，只有老板和员工可以访问商家后台',
        icon: 'fail',
        duration: 2000
      });
      navigate('/role-select');
    }
  }, [navigate]);

  // 基础菜单项（BOSS 和 STAFF 都可以访问）
  const baseMenuItems = [
    {
      key: 'orders',
      title: '订单列表',
      icon: <UnorderedListOutline fontSize={32} />,
      path: '/merchant/orders',
      color: '#1677ff'
    },
    {
      key: 'inventory',
      title: '菜品列表',
      icon: <AppstoreOutline fontSize={32} />,
      path: '/merchant/inventory',
      color: '#52c41a'
    },
    {
      key: 'inventory-management',
      title: '库存管理',
      icon: <FileOutline fontSize={32} />,
      path: '/merchant/inventory/list',
      color: '#13c2c2'
    },
    {
      key: 'purchase-order',
      title: '进货管理',
      icon: <FileOutline fontSize={32} />,
      path: '/merchant/inventory/purchase-order',
      color: '#fa8c16'
    },
    {
      key: 'seats',
      title: '座位管理',
      icon: <TeamOutline fontSize={32} />,
      path: '/merchant/seats',
      color: '#722ed1'
    },
    {
      key: 'rankings',
      title: '游戏排行',
      icon: <HistogramOutline fontSize={32} />,
      path: '/merchant/rankings',
      color: '#faad14'
    },
    {
      key: 'categories', 
      title: '类别管理',
      icon: <TagOutline fontSize={32} />, 
      path: '/merchant/categories',
      color: '#ff8c00' 
    },
  ];

  // BOSS 专属菜单项
  const bossOnlyMenuItems = [
    {
      key: 'reports',
      title: '数据报表',
      icon: <PieOutline fontSize={32} />,
      path: '/merchant/reports',
      color: '#eb2f96'
    },
    {
      key: 'revenue',
      title: '收入管理',
      icon: <PayCircleOutline fontSize={32} />,
      path: '/revenue',
      color: '#52c41a'
    },
    {
      key: 'permissions',
      title: '权限管理',
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
        商家后台
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
