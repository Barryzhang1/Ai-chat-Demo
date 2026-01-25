import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Form, Input, Button, Toast, Switch, Stepper } from 'antd-mobile';
import { dishApi } from '../../api/dishApi';
import './MerchantDashboard.css';

function AddDish() {
  const navigate = useNavigate();

  const handleAddDish = async (values) => {
    try {
      const dishData = {
        name: values.name,
        price: parseFloat(values.price),
        description: values.description,
        isSpicy: values.isSpicy || false,
        hasScallions: values.hasScallions || false,
        hasCilantro: values.hasCilantro || false,
        hasGarlic: values.hasGarlic || false,
        cookingTime: values.cookingTime || 0,
      };

      await dishApi.createDish(dishData);

      Toast.show({
        icon: 'success',
        content: '上新成功！',
      });
      navigate('/merchant/inventory');
    } catch (error) {
      console.error('Failed to create dish:', error);
      Toast.show({
        icon: 'fail',
        content: '上新失败，请重试',
      });
    }
  };

  return (
    <div>
      <NavBar onBack={() => navigate('/merchant')}>上新菜</NavBar>
      <div className="tab-content">
        <Form
          onFinish={handleAddDish}
          footer={
            <Button block type="submit" color="primary" size="large">
              上新菜品
            </Button>
          }
        >
          <Form.Item
            name="name"
            label="菜品名称"
            rules={[{ required: true, message: '请输入菜品名称' }]}
          >
            <Input placeholder="请输入菜品名称" />
          </Form.Item>

          <Form.Item
            name="price"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <Input type="number" placeholder="请输入价格" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input placeholder="请输入菜品描述" />
          </Form.Item>

          <Form.Item
            name="isSpicy"
            label="是否辣"
            initialValue={false}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="hasScallions"
            label="是否有葱"
            initialValue={false}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="hasCilantro"
            label="是否有香菜"
            initialValue={false}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="hasGarlic"
            label="是否有蒜"
            initialValue={false}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="cookingTime"
            label="出餐时间（分钟）"
            initialValue={15}
          >
            <Stepper min={0} max={120} />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default AddDish;
