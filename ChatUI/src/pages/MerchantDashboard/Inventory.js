import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List } from 'antd-mobile';

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const inventoryData = JSON.parse(localStorage.getItem('inventory') || JSON.stringify([
      { id: 1, name: '宫保鸡丁', price: 38, stock: 50, description: '经典川菜' },
      { id: 2, name: '鱼香肉丝', price: 35, stock: 45, description: '酸甜可口' },
      { id: 3, name: '麻婆豆腐', price: 28, stock: 60, description: '麻辣鲜香' },
      { id: 4, name: '水煮鱼', price: 68, stock: 30, description: '麻辣鲜香' },
      { id: 5, name: '回锅肉', price: 42, stock: 40, description: '肥而不腻' },
    ]));
    setInventory(inventoryData);
  }, []);

  return (
    <div>
      <NavBar onBack={() => navigate('/merchant')}>菜品库存</NavBar>
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
    </div>
  );
}

export default Inventory;
