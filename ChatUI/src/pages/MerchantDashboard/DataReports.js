import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card } from 'antd-mobile';

function DataReports() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const ordersData = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(ordersData);
  }, []);

  const calculateTodayRevenue = () => {
    const today = new Date().toDateString();
    return orders
      .filter(order => new Date(order.timestamp).toDateString() === today)
      .reduce((sum, order) => sum + order.totalPrice, 0);
  };

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

  return (
    <div>
      <NavBar onBack={() => navigate('/merchant')}>数据报表</NavBar>
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
                      width: `${(item.count / (getTopTenDishes()[0]?.count || 1)) * 100}%` 
                    }}
                  />
                  <span className="bar-value">{item.count}份</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DataReports;
