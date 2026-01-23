import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Tabs, List, Card, Button, Form, Input, Toast, Dialog } from 'antd-mobile';
import './MerchantDashboard.css';

function MerchantDashboard() {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [gameRankings, setGameRankings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // 加载订单
    const ordersData = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(ordersData);

    // 加载库存
    const inventoryData = JSON.parse(localStorage.getItem('inventory') || JSON.stringify([
      { id: 1, name: '宫保鸡丁', price: 38, stock: 50, description: '经典川菜' },
      { id: 2, name: '鱼香肉丝', price: 35, stock: 45, description: '酸甜可口' },
      { id: 3, name: '麻婆豆腐', price: 28, stock: 60, description: '麻辣鲜香' },
      { id: 4, name: '水煮鱼', price: 68, stock: 30, description: '麻辣鲜香' },
      { id: 5, name: '回锅肉', price: 42, stock: 40, description: '肥而不腻' },
    ]));
    setInventory(inventoryData);

    // 加载游戏排行榜
    const rankingsData = JSON.parse(localStorage.getItem('gameRankings') || JSON.stringify([
      { rank: 1, userName: '张三', score: 1500 },
      { rank: 2, userName: '李四', score: 1200 },
      { rank: 3, userName: '王五', score: 1000 },
      { rank: 4, userName: '赵六', score: 800 },
      { rank: 5, userName: '钱七', score: 600 },
    ]));
    setGameRankings(rankingsData);
  };

  // 计算今日营收
  const calculateTodayRevenue = () => {
    const today = new Date().toDateString();
    return orders
      .filter(order => new Date(order.timestamp).toDateString() === today)
      .reduce((sum, order) => sum + order.totalPrice, 0);
  };

  // 计算销售前十的菜品
  const getTopTenDishes = () => {
    const dishSales = {};
    
    orders.forEach(order => {
      order.dishes.forEach(dish => {
        if (dishSales[dish.name]) {
          dishSales[dish.name]++;
        } else {
          dishSales[dish.name] = 1;
        }
      });
    });

    return Object.entries(dishSales)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // 上新菜
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
  };

  return (
    <div className="merchant-dashboard">
      <NavBar onBack={() => navigate('/role-select')}>
        商家后台
      </NavBar>

      <Tabs className="dashboard-tabs">
        {/* 订单列表 */}
        <Tabs.Tab title="订单列表" key="orders">
          <div className="tab-content">
            {orders.length === 0 ? (
              <div className="empty-state">暂无订单</div>
            ) : (
              <List>
                {orders.map(order => (
                  <List.Item
                    key={order.id}
                    description={
                      <div>
                        <div>用户：{order.userName}</div>
                        <div>
                          菜品：{order.dishes.map(d => d.name).join('、')}
                        </div>
                        <div>时间：{new Date(order.timestamp).toLocaleString()}</div>
                      </div>
                    }
                    extra={
                      <div className="order-price">¥{order.totalPrice}</div>
                    }
                  >
                    {order.id}
                  </List.Item>
                ))}
              </List>
            )}
          </div>
        </Tabs.Tab>

        {/* 菜品库存 */}
        <Tabs.Tab title="菜品库存" key="inventory">
          <div className="tab-content">
            <List>
              {inventory.map(item => (
                <List.Item
                  key={item.id}
                  description={item.description}
                  extra={
                    <div>
                      <div className="item-price">¥{item.price}</div>
                      <div className={`stock ${item.stock < 20 ? 'low' : ''}`}>
                        库存: {item.stock}
                      </div>
                    </div>
                  }
                >
                  {item.name}
                </List.Item>
              ))}
            </List>
          </div>
        </Tabs.Tab>

        {/* 游戏排行榜 */}
        <Tabs.Tab title="游戏排行榜" key="rankings">
          <div className="tab-content">
            <List>
              {gameRankings.map(item => (
                <List.Item
                  key={item.rank}
                  prefix={
                    <div className={`rank-badge rank-${item.rank}`}>
                      {item.rank}
                    </div>
                  }
                  extra={
                    <div className="score">{item.score}分</div>
                  }
                >
                  {item.userName}
                </List.Item>
              ))}
            </List>
          </div>
        </Tabs.Tab>

        {/* 数据报表 */}
        <Tabs.Tab title="数据报表" key="reports">
          <div className="tab-content">
            <Card title="今日营收" className="revenue-card">
              <div className="revenue-amount">¥{calculateTodayRevenue()}</div>
            </Card>

            <Card title="销售前十菜品" className="chart-card">
              <div className="bar-chart">
                {getTopTenDishes().map(item => (
                  <div key={item.name} className="bar-item">
                    <div className="bar-label">{item.name}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${(item.count / getTopTenDishes()[0]?.count || 1) * 100}%` 
                        }}
                      />
                      <span className="bar-value">{item.count}份</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Tabs.Tab>

        {/* 上新菜 */}
        <Tabs.Tab title="上新菜" key="add-dish">
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
        </Tabs.Tab>
      </Tabs>
    </div>
  );
}

export default MerchantDashboard;
