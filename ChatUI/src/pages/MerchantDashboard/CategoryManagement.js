import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List, Button, Toast, Popup, Form, Input, SwipeAction, Dialog, Switch } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { categoryApi } from '../../api/categoryApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import './MerchantDashboard.css';

function CategoryManagement() {
  const navigate = useNavigate();
  const { language } = useLanguage();
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
      Toast.show({ icon: 'fail', content: t('getCategoryFailed', language) });
    }
  };

  const handleValuesChange = (changedValues, allValues) => {
      // 可以在这里处理表单变化
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory._id, values);
        Toast.show({ icon: 'success', content: t('updateSuccess', language) });
      } else {
        await categoryApi.createCategory(values);
        Toast.show({ icon: 'success', content: t('createSuccess', language) });
      }
      setShowPopup(false);
      setEditingCategory(null);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      Toast.show({ icon: 'fail', content: t('operationFailed', language) });
    }
  };

  const handleDelete = async (id) => {
    const result = await Dialog.confirm({
      content: t('confirmDelete', language),
      confirmText: t('confirm', language),
      cancelText: t('cancel', language),
    });
    if (result) {
      try {
        await categoryApi.deleteCategory(id);
        Toast.show({ icon: 'success', content: t('deleteSuccess', language) });
        fetchCategories();
      } catch (error) {
        Toast.show({ icon: 'fail', content: t('deleteFailed', language) });
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
        {t('categoryManagement', language)}
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
                   <span style={{ fontSize: '12px', color: '#999' }}>{t('sortLabel', language)}: {category.sortOrder}</span>
                       <span style={{ color: category.isActive ? '#52c41a' : '#ff4d4f' }}>
                     {category.isActive ? t('enabled', language) : t('disabled', language)}
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
                {editingCategory ? t('editCategory', language) : t('createCategoryTitle', language)}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    footer={null}
                >
                    <Form.Item
                        name="name"
                    label={t('categoryNameLabel', language)}
                    rules={[{ required: true, message: t('enterCategoryName', language) }]}
                    >
                    <Input placeholder={t('enterCategoryName', language)} />
                    </Form.Item>
                    <Form.Item
                        name="sortOrder"
                    label={t('sortWeightLabel', language)}
                    >
                    <Input type="number" placeholder={t('zeroPlaceholder', language)} />
                    </Form.Item>
                    <Form.Item
                         name="isActive"
                     label={t('isActiveLabel', language)}
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
                  {t('cancel', language)}
                </Button>
                <Button block type="submit" color="primary" onClick={() => form.submit()}>
                  {t('confirm', language)}
                </Button>
            </div>
        </div>
      </Popup>
    </div>
  );
}

export default CategoryManagement;
