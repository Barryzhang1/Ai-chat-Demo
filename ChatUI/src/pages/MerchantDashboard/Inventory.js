import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List, Button, Toast, Popup, Form, SideBar, Divider, Empty, Tag, Space, SearchBar } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { dishApi } from '../../api/dishApi';
import { categoryApi } from '../../api/categoryApi';
import inventoryApi from '../../api/inventory/inventoryApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import DishFormPopup from '../../components/DishFormPopup';
import './MerchantDashboard.css';

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingDish, setEditingDish] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [activeKey, setActiveKey] = useState('');
  const [inventoryList, setInventoryList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const contentRef = useRef(null);
  const categoryRefs = useRef({});
  const { language } = useLanguage();

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
      // Failed to fetch categories
    }
  };

  const fetchDishes = async () => {
    try {
      const params = {};
      if (searchKeyword) {
        params.keyword = searchKeyword;
      }
      if (activeKey && searchKeyword) {
        params.categoryId = activeKey;
      }
      
      const dishes = await dishApi.getDishes(params);
      if (Array.isArray(dishes)) {
        setInventory(dishes);
      } else {
        setInventory([]);
      }
    } catch (error) {
      setInventory([]); // 在API调用失败时也确保是数组
    }
  };

  const fetchInventoryList = async () => {
    try {
      const response = await inventoryApi.getInventoryList();
      
      // 后端返回格式: { code: 0, message: '查询成功', data: { list: [...], total, page, pageSize } }
      if (response && response.code === 0 && response.data && Array.isArray(response.data.list)) {
        setInventoryList(response.data.list);
      } else {
        setInventoryList([]);
      }
    } catch (error) {
      setInventoryList([]);
    }
  };

  // 搜索关键词变化时重新获取菜品
  useEffect(() => {
    fetchDishes();
  }, [searchKeyword]);

  useEffect(() => {
    fetchDishes();
    fetchCategories();
    fetchInventoryList();
  }, []);

  const handleStatusChange = async (dish) => {
    try {
      const updatedDish = await dishApi.updateDishStatus(dish._id, { isDelisted: !dish.isDelisted });
      setInventory(inventory.map(item => item._id === dish._id ? updatedDish : item));
      Toast.show({
        content: !dish.isDelisted
          ? t('dishOffShelfSuccess', language)
          : t('dishOnShelfSuccess', language),
        position: 'top',
      })
    } catch (error) {
      // 显示后端返回的具体错误信息
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      Toast.show({
        content: errorMessage,
        position: 'top',
        duration: 3000,
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
      Toast.show({ icon: 'fail', content: '操作失败，请重试' });
    }
  };

  // 检查菜品的食材是否有数量为0的
  const hasOutOfStockIngredient = (dish) => {
    if (!dish.ingredients || dish.ingredients.length === 0) {
      return false;
    }
    
    const result = dish.ingredients.some(ingredientId => {
      const ingredient = inventoryList.find(item => item._id === ingredientId);
      return ingredient && ingredient.quantity === 0;
    });
    
    return result;
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
        {t('dishInventoryTitle', language)}
      </NavBar>

      {/* 搜索栏 */}
      <div className="inventory-search">
        <SearchBar
          placeholder={t('searchDishes', language)}
          value={searchKeyword}
          onChange={setSearchKeyword}
          onClear={() => setSearchKeyword('')}
        />
      </div>

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
            <Empty description={t('noCategoriesForInventory', language)} />
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
                      {t('noDishes', language)}
                    </div>
                  ) : (
                    <List className="inventory-dishes-list">
                      {categoryDishes.map(item => {
                        const isOutOfStock = hasOutOfStockIngredient(item);
                        return (
                          <List.Item
                            key={item._id}
                            style={isOutOfStock ? {
                              border: '3px solid #ff4d4f',
                              borderRadius: '12px',
                              marginBottom: '12px',
                              padding: '8px',
                              backgroundColor: '#fff1f0',
                              boxShadow: '0 2px 8px rgba(255, 77, 79, 0.15)'
                            } : {
                              marginBottom: '8px'
                            }}
                            description={
                              <div>
                                <div style={{ marginBottom: '8px' }}>{item.description}</div>
                                {/* 食材不足警告 */}
                                {isOutOfStock && (
                                  <Tag color="danger" style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                                    {t('ingredientInsufficient', language)}
                                  </Tag>
                                )}
                                {/* 显示标签 */}
                                {item.tags && item.tags.length > 0 && (
                                  <Space wrap style={{ marginTop: '8px' }}>
                                    {item.tags.map((tag, index) => (
                                      <Tag
                                        key={index}
                                        color="primary"
                                        fill="outline"
                                        style={{ fontSize: '12px' }}
                                      >
                                        {tag}
                                      </Tag>
                                    ))}
                                  </Space>
                                )}
                              </div>
                            }
                            extra={
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '8px' }}>
                                {/* 出售价格 */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                  <div style={{ fontSize: '12px', color: '#999' }}>{t('salePriceLabel', language)}</div>
                                  <div className="item-price" style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>¥{item.price.toFixed(2)}</div>
                                </div>
                                {/* 成本价 */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                  <div style={{ fontSize: '12px', color: '#999' }}>{t('costLabel', language)}</div>
                                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#52c41a' }}>
                                    ¥{(item.costPrice !== undefined ? item.costPrice : 0).toFixed(2)}
                                  </div>
                                </div>
                                {/* 利润 */}
                                {item.costPrice !== undefined && (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <div style={{ fontSize: '12px', color: '#999' }}>{t('profitLabel', language)}</div>
                                    <div style={{ fontSize: '14px', fontWeight: '500', color: item.price - item.costPrice > 0 ? '#1890ff' : '#ff4d4f' }}>
                                      ¥{(item.price - item.costPrice).toFixed(2)}
                                    </div>
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(item);
                                    }}
                                  >
                                    {t('edit', language)}
                                  </Button>
                                  <Button
                                    size="small"
                                    color={item.isDelisted ? 'primary' : 'danger'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(item);
                                    }}
                                  >
                                    {item.isDelisted ? t('onShelfStatus', language) : t('offShelf', language)}
                                  </Button>
                                </div>
                              </div>
                            }
                          >
                            {item.name}
                          </List.Item>
                        );
                      })}
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
            _id: editingDish._id,
            name: editingDish.name,
            price: editingDish.price,
            categoryId: editingDish.categoryId,
            description: editingDish.description,
            tags: editingDish.tags || [],
            ingredients: editingDish.ingredients || [],
          } : {
            categoryId: categories.length > 0 ? categories[0]._id : undefined,
            tags: [],
            ingredients: [],
          }}
        />
      </Popup>
    </div>
  );
}

export default Inventory;
