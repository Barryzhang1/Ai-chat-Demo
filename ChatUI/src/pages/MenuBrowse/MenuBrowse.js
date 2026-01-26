import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, SideBar, Toast, Divider, Empty } from 'antd-mobile';
import { dishApi } from '../../api/dishApi';
import { categoryApi } from '../../api/categoryApi';
import './MenuBrowse.css';

function MenuBrowse() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [activeKey, setActiveKey] = useState('');
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);
  const categoryRefs = useRef({});

  // 获取分类和菜品数据
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 并行获取分类和菜品
      const [categoriesData, dishesData] = await Promise.all([
        categoryApi.getCategories(),
        dishApi.getDishes()
      ]);

      // 按权重排序分类（sortOrder越大越靠前）
      const sortedCategories = (categoriesData || [])
        .filter(cat => cat.isActive)
        .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));

      setCategories(sortedCategories);

      // 过滤掉已下架的菜品
      const availableDishes = (dishesData || []).filter(dish => !dish.isDelisted);
      setDishes(availableDishes);

      // 设置默认选中第一个分类
      if (sortedCategories.length > 0) {
        setActiveKey(sortedCategories[0]._id);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      Toast.show({ icon: 'fail', content: '加载数据失败' });
    } finally {
      setLoading(false);
    }
  };

  // 按分类分组菜品
  const groupDishesByCategory = () => {
    const grouped = {};
    
    categories.forEach(category => {
      grouped[category._id] = {
        category,
        dishes: dishes.filter(dish => dish.categoryId === category._id)
      };
    });

    return grouped;
  };

  // 处理分类切换
  const handleCategoryChange = (key) => {
    setActiveKey(key);
    
    // 滚动到对应分类
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

    // 找到当前滚动位置对应的分类
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
    <div className="menu-browse-container">
      <NavBar onBack={() => navigate(-1)}>
        菜品浏览
      </NavBar>

      {loading ? (
        <div className="loading-container">加载中...</div>
      ) : (
        <div className="menu-browse-content">
          {/* 左侧分类栏 */}
          <div className="sidebar-wrapper">
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
            className="dishes-content"
            ref={contentRef}
            onScroll={handleScroll}
          >
            {categories.length === 0 ? (
              <Empty description="暂无分类" />
            ) : (
              categories.map(category => {
                const categoryDishes = groupedDishes[category._id]?.dishes || [];
                
                return (
                  <div
                    key={category._id}
                    ref={el => categoryRefs.current[category._id] = el}
                    className="category-section"
                  >
                    {/* 分类标题分割线 */}
                    <Divider 
                      className="category-divider"
                      contentPosition="left"
                    >
                      {category.name}
                    </Divider>

                    {/* 该分类下的菜品 */}
                    {categoryDishes.length === 0 ? (
                      <div className="empty-category">
                        暂无菜品
                      </div>
                    ) : (
                      <div className="dishes-list">
                        {categoryDishes.map(dish => (
                          <div key={dish._id} className="dish-card">
                            <div className="dish-info">
                              <div className="dish-name">{dish.name}</div>
                              {dish.description && (
                                <div className="dish-description">
                                  {dish.description}
                                </div>
                              )}
                              <div className="dish-tags">
                                {dish.isSpicy && (
                                  <span className="tag spicy">🌶️ 辣</span>
                                )}
                                {dish.hasScallions && (
                                  <span className="tag">🧅 葱</span>
                                )}
                                {dish.hasCilantro && (
                                  <span className="tag">🌿 香菜</span>
                                )}
                                {dish.hasGarlic && (
                                  <span className="tag">🧄 蒜</span>
                                )}
                              </div>
                              <div className="dish-price">
                                ¥{dish.price}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuBrowse;
