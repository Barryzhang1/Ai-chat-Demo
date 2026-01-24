import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List } from 'antd-mobile';
import './MerchantDashboard.css';

function OrderList() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const ordersData = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(ordersData);
  }, []);

  return (
    <div className="merchant-dashboard">
      <NavBar onBack={() => navigate('/merchant')}>订单列表</NavBar>
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
    </div>
  );
}

export default OrderList;
