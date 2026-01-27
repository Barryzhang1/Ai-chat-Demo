import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List, Button, Toast, Popup, Form, Input, SwipeAction, Dialog, Switch } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { categoryApi } from '../../api/categoryApi';
import './MerchantDashboard.css';

function CategoryManagement() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getCategories();
      setCategories(data);
    } catch (error) {
      Toast.show({ icon: 'fail', content: '获取类别失败' });
    }
  };

  const handleValuesChange = (changedValues, allValues) => {
      // 可以在这里处理表单变化
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory._id, values);
        Toast.show({ icon: 'success', content: '更新成功' });
      } else {
        await categoryApi.createCategory(values);
        Toast.show({ icon: 'success', content: '创建成功' });
      }
      setShowPopup(false);
      setEditingCategory(null);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      Toast.show({ icon: 'fail', content: '操作失败' });
    }
  };

  const handleDelete = async (id) => {
    const result = await Dialog.confirm({
      content: '确定要删除这个类别吗？',
    });
    if (result) {
      try {
        await categoryApi.deleteCategory(id);
        Toast.show({ icon: 'success', content: '删除成功' });
        fetchCategories();
      } catch (error) {
        Toast.show({ icon: 'fail', content: '删除失败' });
      }
    }
  };

  const openEditPopup = (category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      sortOrder: category.sortOrder,
      isActive: category.isActive
    });
    setShowPopup(true);
  };

    const openAddPopup = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({
        isActive: true, // 默认启用
        sortOrder: 0
    });
    setShowPopup(true);
  };


  return (
    <div className="category-management">
      <NavBar onBack={() => navigate('/merchant')} right={<AddOutline fontSize={24} onClick={openAddPopup} />}>
        类别管理
      </NavBar>

      <List mode="card">
        {categories.map(category => (
          <SwipeAction
            key={category._id}
            rightActions={[
              {
                key: 'delete',
                text: '删除',
                color: 'danger',
                onClick: () => handleDelete(category._id),
              },
            ]}
          >
            <List.Item
              onClick={() => openEditPopup(category)}
              extra={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <span style={{ fontSize: '12px', color: '#999' }}>排序: {category.sortOrder}</span>
                       <span style={{ color: category.isActive ? '#52c41a' : '#ff4d4f' }}>
                           {category.isActive ? '启用' : '禁用'}
                       </span>
                  </div>
              }
            >
              {category.name}
            </List.Item>
          </SwipeAction>
        ))}
      </List>

      <Popup
        visible={showPopup}
        onMaskClick={() => setShowPopup(false)}
        position="bottom"
        bodyStyle={{ 
            backgroundColor: '#ffffff',
            maxHeight: '70vh',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ 
                flexShrink: 0,
                fontSize: '18px', 
                fontWeight: 'bold', 
                padding: '20px 20px 16px 20px',
                textAlign: 'center',
                backgroundColor: '#fff',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                {editingCategory ? '编辑类别' : '新建类别'}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    footer={null}
                >
                    <Form.Item
                        name="name"
                        label="类别名称"
                        rules={[{ required: true, message: '请输入类别名称' }]}
                    >
                        <Input placeholder="请输入类别名称" />
                    </Form.Item>
                    <Form.Item
                        name="sortOrder"
                        label="排序权重 (越大越靠前)"
                    >
                        <Input type="number" placeholder="0" />
                    </Form.Item>
                    <Form.Item
                         name="isActive"
                         label="是否启用"
                         valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </div>

            <div style={{
                padding: '16px 20px',
                backgroundColor: '#fff',
                flexShrink: 0,
                display: 'flex',
                gap: '12px'
            }}>
                <Button block onClick={() => setShowPopup(false)}>
                    取消
                </Button>
                <Button block type="submit" color="primary" onClick={() => form.submit()}>
                    确定
                </Button>
            </div>
        </div>
      </Popup>
    </div>
  );
}

export default CategoryManagement;
