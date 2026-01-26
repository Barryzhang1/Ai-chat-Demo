import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List, Button, Toast, Popup, Form } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { dishApi } from '../../api/dishApi';
import { categoryApi } from '../../api/categoryApi';
import DishFormPopup from '../../components/DishFormPopup';
import './MerchantDashboard.css';

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingDish, setEditingDish] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    try {
      const cats = await categoryApi.getCategories();
      setCategories(cats || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchDishes = async () => {
    try {
      const dishes = await dishApi.getDishes();
      if (Array.isArray(dishes)) {
        setInventory(dishes);
      } else {
        console.warn('API did not return an array for dishes, setting to empty array.');
        setInventory([]);
      }
    } catch (error) {
      console.error('Failed to fetch dishes:', error);
      setInventory([]); // 在API调用失败时也确保是数组
    }
  };

  useEffect(() => {
    fetchDishes();
    fetchCategories();
  }, []);

  const handleStatusChange = async (dish) => {
    try {
      const updatedDish = await dishApi.updateDishStatus(dish._id, { isDelisted: !dish.isDelisted });
      setInventory(inventory.map(item => item._id === dish._id ? updatedDish : item));
      Toast.show({
        content: `已${!dish.isDelisted ? '下架' : '上架'}`,
        position: 'top',
      })
    } catch (error) {
      console.error('Failed to update dish status:', error);
      Toast.show({
        content: '操作失败',
        position: 'top',
      })
    }
  };

  const handleEdit = (dish) => {
    setEditingDish(dish);
    setShowEditPopup(true);
  };

  const handleAdd = () => {
    setEditingDish(null);
    form.resetFields();
    setShowEditPopup(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingDish) {
        // 更新逻辑
        const updatedDish = await dishApi.updateDish(editingDish._id, values);
        setInventory(inventory.map(item => item._id === editingDish._id ? updatedDish : item));
        Toast.show({ icon: 'success', content: '修改成功！' });
      } else {
        // 新增逻辑
        await dishApi.createDish(values);
        Toast.show({ icon: 'success', content: '上新成功！' });
        fetchDishes(); // 刷新列表
      }
      form.resetFields();
      setShowEditPopup(false);
      setEditingDish(null);
    } catch (error) {
      console.error('Operation failed:', error);
      Toast.show({ icon: 'fail', content: '操作失败，请重试' });
    }
  };

  return (
    <div className="page-container">
      <NavBar 
        onBack={() => navigate('/merchant')}
        right={<AddOutline fontSize={24} onClick={handleAdd} />}
      >
        菜品库存
      </NavBar>
      <div className="content-area">
        <List>
          {inventory.map(item => (
            <List.Item
              key={item._id}
              description={
                <div>
                  <div>{item.description}</div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    {item.isSpicy && <span style={{ marginRight: '8px', color: '#ff4d4f' }}>🌶️ 辣</span>}
                    {item.hasScallions && <span style={{ marginRight: '8px' }}>🧅 有葱</span>}
                    {item.hasCilantro && <span style={{ marginRight: '8px' }}>🌿 有香菜</span>}
                    {item.hasGarlic && <span style={{ marginRight: '8px' }}>🧄 有蒜</span>}
                    {item.cookingTime && <span>⏱️ {item.cookingTime}分钟</span>}
                  </div>
                </div>
              }
              extra={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '12px' }}>
                  <div className="item-price" style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>¥{item.price}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(item);
                      }}
                    >
                      编辑
                    </Button>
                    <Button
                      size="small"
                      color={item.isDelisted ? 'primary' : 'danger'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(item);
                      }}
                    >
                      {item.isDelisted ? '上架' : '下架'}
                    </Button>
                  </div>
                </div>
              }
            >
              {item.name}
            </List.Item>
          ))}
        </List>
      </div>

      <Popup
        visible={showEditPopup}
        onMaskClick={() => {
          setShowEditPopup(false);
          setEditingDish(null);
        }}
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
        <DishFormPopup
          form={form}
          categories={categories}
          onFinish={handleSubmit}
          onCancel={() => {
            form.resetFields();
            setShowEditPopup(false);
            setEditingDish(null);
          }}
          editMode={!!editingDish}
          initialValues={editingDish ? {
            name: editingDish.name,
            price: editingDish.price,
            categoryId: editingDish.categoryId,
            description: editingDish.description,
            isSpicy: editingDish.isSpicy || false,
            hasScallions: editingDish.hasScallions || false,
            hasCilantro: editingDish.hasCilantro || false,
            hasGarlic: editingDish.hasGarlic || false,
            cookingTime: editingDish.cookingTime || 15,
          } : {
            categoryId: categories.length > 0 ? categories[0]._id : undefined,
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

export default Inventory;
