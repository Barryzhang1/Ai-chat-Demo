import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Grid, Popup, Form, Toast } from 'antd-mobile';
import { 
  UnorderedListOutline, 
  AppstoreOutline, 
  HistogramOutline, 
  PieOutline,
  AddCircleOutline 
} from 'antd-mobile-icons';
import { dishApi } from '../../api/dishApi';
import DishFormPopup from '../../components/DishFormPopup';
import './MerchantDashboard.css';

function MerchantDashboard() {
  const navigate = useNavigate();
  const [showAddDishPopup, setShowAddDishPopup] = useState(false);
  const [form] = Form.useForm();

  const menuItems = [
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
      key: 'add-dish',
      title: '新品上架',
      icon: <AddCircleOutline fontSize={32} />,
      action: () => setShowAddDishPopup(true),
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
      key: 'reports',
      title: '数据报表',
      icon: <PieOutline fontSize={32} />,
      path: '/merchant/reports',
      color: '#eb2f96'
    },
  ];

  const handleAddDish = async (values) => {
    try {
      await dishApi.createDish(values);
      Toast.show({ icon: 'success', content: '上新成功！' });
      form.resetFields();
      setShowAddDishPopup(false);
    } catch (error) {
      Toast.show({ icon: 'fail', content: '上新失败，请重试' });
    }
  };

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

      <Popup
        visible={showAddDishPopup}
        onMaskClick={() => setShowAddDishPopup(false)}
        position='bottom'
        bodyStyle={{ backgroundColor: '#ffffff' }}
      >
        <DishFormPopup
          form={form}
          onFinish={handleAddDish}
          onCancel={() => {
            form.resetFields();
            setShowAddDishPopup(false);
          }}
          editMode={false}
          initialValues={{
            isSpicy: false,
            hasScallions: false,
            hasCilantro: false,
            hasGarlic: false,
            cookingTime: 15,
          }}
        />
      </Popup>
    </div>
  );
}

export default MerchantDashboard;
