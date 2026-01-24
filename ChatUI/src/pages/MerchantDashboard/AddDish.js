import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Form, Input, Button, Toast } from 'antd-mobile';

function AddDish() {
  const [inventory, setInventory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const inventoryData = JSON.parse(localStorage.getItem('inventory') || '[]');
    setInventory(inventoryData);
  }, []);

  const handleAddDish = (values) => {
    const newDish = {
      id: Date.now(),
      name: values.name,
      price: parseFloat(values.price),
      stock: parseInt(values.stock),
      description: values.description,
    };

    const updatedInventory = [...inventory, newDish];
    setInventory(updatedInventory);
    localStorage.setItem('inventory', JSON.stringify(updatedInventory));

    Toast.show({
      icon: 'success',
      content: '上新成功！',
    });
    navigate('/merchant/inventory');
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
            name="stock"
            label="库存"
            rules={[{ required: true, message: '请输入库存' }]}
          >
            <Input type="number" placeholder="请输入库存数量" />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default AddDish;
