import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Grid, Card, Popup, Form, Input, Button, Toast } from 'antd-mobile';
import { 
  UnorderedListOutline, 
  AppstoreOutline, 
  HistogramOutline, 
  PieOutline,
  AddCircleOutline 
} from 'antd-mobile-icons';
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
      title: '菜品管理',
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
        bodyStyle={{ minHeight: '60vh', backgroundColor: '#ffffff' }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '20px', 
            paddingBottom: '16px',
            textAlign: 'center',
          }}>
            新品上架
          </div>
          <Form
            form={form}
            onFinish={(values) => {
              const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
              const newDish = {
                id: Date.now(),
                name: values.name,
                price: parseFloat(values.price),
                stock: parseInt(values.stock),
                description: values.description,
              };
              const updatedInventory = [...inventory, newDish];
              localStorage.setItem('inventory', JSON.stringify(updatedInventory));
              Toast.show({ icon: 'success', content: '上新成功！' });
              form.resetFields();
              setShowAddDishPopup(false);
            }}
            footer={
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <Button
                  block
                  onClick={() => {
                    form.resetFields();
                    setShowAddDishPopup(false);
                  }}
                >
                  取消
                </Button>
                <Button block type="submit" color="primary">
                  确认上新
                </Button>
              </div>
            }
          >
            <Form.Item
              name="name"
              label="菜品名称"
              rules={[{ required: true, message: '请输入菜品名称' }]}
            >
              <Input placeholder="请输入菜品名称" clearable />
            </Form.Item>

            <Form.Item
              name="price"
              label="价格"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <Input type="number" placeholder="请输入价格" clearable />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
              rules={[{ required: true, message: '请输入描述' }]}
            >
              <Input placeholder="请输入菜品描述" clearable />
            </Form.Item>

            <Form.Item
              name="stock"
              label="库存"
              rules={[{ required: true, message: '请输入库存' }]}
            >
              <Input type="number" placeholder="请输入库存数量" clearable />
            </Form.Item>
          </Form>
        </div>
      </Popup>
    </div>
  );
}

export default MerchantDashboard;
