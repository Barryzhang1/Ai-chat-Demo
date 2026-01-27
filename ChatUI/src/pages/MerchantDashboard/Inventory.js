import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List, Button, Toast, Popup, Form, SideBar, Divider, Empty } from 'antd-mobile';
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
  const [activeKey, setActiveKey] = useState('');
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const contentRef = useRef(null);
  const categoryRefs = useRef({});

  const fetchCategories = async () => {
    try {
      const cats = await categoryApi.getCategories();
      // 按权重排序分类（sortOrder越大越靠前）
      const sortedCategories = (cats || [])
        .filter(cat => cat.isActive)
        .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
      setCategories(sortedCategories);
      
      // 设置默认选中第一个分类
      if (sortedCategories.length > 0 && !activeKey) {
        setActiveKey(sortedCategories[0]._id);
      }
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

  // 按分类分组菜品
  const groupDishesByCategory = () => {
    const grouped = {};
    
    categories.forEach(category => {
      grouped[category._id] = {
        category,
        dishes: inventory.filter(dish => dish.categoryId === category._id)
      };
    });

    return grouped;
  };

  // 处理分类切换
  const handleCategoryChange = (key) => {
    setActiveKey(key);
    
    const element = categoryRefs.current[key];
    if (element && contentRef.current) {
      const container = contentRef.current;
      const offsetTop = element.offsetTop - container.offsetTop - 10;
      
      container.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  // 监听滚动，更新当前激活的分类
  const handleScroll = () => {
    if (!contentRef.current) return;

    const container = contentRef.current;
    const scrollTop = container.scrollTop;

    for (let i = categories.length - 1; i >= 0; i--) {
      const category = categories[i];
      const element = categoryRefs.current[category._id];
      
      if (element) {
        const offsetTop = element.offsetTop - container.offsetTop - 100;
        if (scrollTop >= offsetTop) {
          setActiveKey(category._id);
          break;
        }
      }
    }
  };

  const groupedDishes = groupDishesByCategory();

  return (
    <div className="inventory-container">
      <NavBar 
        onBack={() => navigate('/merchant')}
        right={<AddOutline fontSize={24} onClick={handleAdd} />}
      >
        菜品库存
      </NavBar>

      <div className="inventory-content">
        {/* 左侧分类栏 */}
        <div className="inventory-sidebar">
          <SideBar
            activeKey={activeKey}
            onChange={handleCategoryChange}
          >
            {categories.map(category => (
              <SideBar.Item
                key={category._id}
                title={category.name}
              />
            ))}
          </SideBar>
        </div>

        {/* 右侧菜品列表 */}
        <div 
          className="inventory-dishes-content"
          ref={contentRef}
          onScroll={handleScroll}
        >
          {categories.length === 0 ? (
            <Empty description="暂无分类，请先添加分类" />
          ) : (
            categories.map(category => {
              const categoryDishes = groupedDishes[category._id]?.dishes || [];
              
              return (
                <div
                  key={category._id}
                  ref={el => categoryRefs.current[category._id] = el}
                  className="inventory-category-section"
                >
                  {/* 分类标题分割线 */}
                  <Divider 
                    className="inventory-category-divider"
                    contentPosition="left"
                  >
                    {category.name}
                  </Divider>

                  {/* 该分类下的菜品 */}
                  {categoryDishes.length === 0 ? (
                    <div className="inventory-empty-category">
                      暂无菜品
                    </div>
                  ) : (
                    <List className="inventory-dishes-list">
                      {categoryDishes.map(item => (
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
                  )}
                </div>
              );
            })
          )}
        </div>
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
