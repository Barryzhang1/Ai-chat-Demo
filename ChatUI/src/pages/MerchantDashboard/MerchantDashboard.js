import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  List,
  Card,
  Button,
  Dialog,
  Form,
  Input,
  Toast,
  Tabs,
} from 'antd-mobile';
import {
  UnorderedListOutline,
  AppstoreOutline,
  TrophyOutline,
  BarChartOutline,
  AddCircleOutline,
} from 'antd-mobile-icons';
import './MerchantDashboard.css';

const MOCK_ORDERS = [
  { id: 'ORD001', items: '宫保鸡丁, 红烧肉', total: 86, status: '已完成', time: '12:30' },
  { id: 'ORD002', items: '清蒸鲈鱼, 麻婆豆腐', total: 86, status: '进行中', time: '13:15' },
  { id: 'ORD003', items: '酸菜鱼', total: 68, status: '已完成', time: '13:45' },
];

const MOCK_INVENTORY = [
  { id: 1, name: '宫保鸡丁', stock: 45, price: 38 },
  { id: 2, name: '红烧肉', stock: 32, price: 48 },
  { id: 3, name: '清蒸鲈鱼', stock: 28, price: 58 },
  { id: 4, name: '麻婆豆腐', stock: 56, price: 28 },
  { id: 5, name: '西红柿炒鸡蛋', stock: 42, price: 22 },
  { id: 6, name: '酸菜鱼', stock: 25, price: 68 },
];

const MOCK_RANKINGS = [
  { rank: 1, player: '玩家001', score: 9850 },
  { rank: 2, player: '玩家002', score: 9620 },
  { rank: 3, player: '玩家003', score: 9380 },
  { rank: 4, player: '玩家004', score: 9150 },
  { rank: 5, player: '玩家005', score: 8920 },
];

const TOP_DISHES = [
  { name: '酸菜鱼', sales: 156 },
  { name: '宫保鸡丁', sales: 142 },
  { name: '红烧肉', sales: 128 },
  { name: '清蒸鲈鱼', sales: 115 },
  { name: '麻婆豆腐', sales: 98 },
  { name: '西红柿炒鸡蛋', sales: 87 },
  { name: '水煮鱼', sales: 76 },
  { name: '糖醋排骨', sales: 65 },
  { name: '鱼香肉丝', sales: 54 },
  { name: '回锅肉', sales: 43 },
];

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');

  const handleAddDish = () => {
    Dialog.confirm({
      title: '上新菜品',
      content: (
        <Form
          layout="horizontal"
          footer={null}
        >
          <Form.Item label="菜品名称" name="name">
            <Input placeholder="请输入菜品名称" />
          </Form.Item>
          <Form.Item label="价格" name="price">
            <Input placeholder="请输入价格" type="number" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input placeholder="请输入描述" />
          </Form.Item>
          <Form.Item label="库存" name="stock">
            <Input placeholder="请输入库存" type="number" />
          </Form.Item>
        </Form>
      ),
      confirmText: '确认',
      onConfirm: () => {
        Toast.show({
          icon: 'success',
          content: '上新成功！',
        });
      },
    });
  };

  const renderOrders = () => (
    <div className="tab-content">
      <List header="订单列表">
        {MOCK_ORDERS.map((order) => (
          <List.Item
            key={order.id}
            description={`时间: ${order.time}`}
            extra={
              <span className={`status ${order.status === '已完成' ? 'completed' : 'pending'}`}>
                {order.status}
              </span>
            }
          >
            <div className="order-info">
              <div className="order-id">{order.id}</div>
              <div className="order-items">{order.items}</div>
              <div className="order-total">¥{order.total}</div>
            </div>
          </List.Item>
        ))}
      </List>
    </div>
  );

  const renderInventory = () => (
    <div className="tab-content">
      <div className="inventory-header">
        <h3>菜品库存</h3>
        <Button
          color="primary"
          size="small"
          onClick={handleAddDish}
        >
          <AddCircleOutline /> 上新菜
        </Button>
      </div>
      <List>
        {MOCK_INVENTORY.map((item) => (
          <List.Item
            key={item.id}
            extra={
              <span className={`stock ${item.stock < 30 ? 'low' : ''}`}>
                库存: {item.stock}
              </span>
            }
          >
            <div className="inventory-item">
              <span className="item-name">{item.name}</span>
              <span className="item-price">¥{item.price}</span>
            </div>
          </List.Item>
        ))}
      </List>
    </div>
  );

  const renderRankings = () => (
    <div className="tab-content">
      <List header="游戏排行榜">
        {MOCK_RANKINGS.map((item) => (
          <List.Item
            key={item.rank}
            prefix={
              <div className={`rank-badge rank-${item.rank}`}>
                {item.rank}
              </div>
            }
            extra={<span className="score">{item.score}分</span>}
          >
            {item.player}
          </List.Item>
        ))}
      </List>
    </div>
  );

  const renderReports = () => (
    <div className="tab-content">
      <Card title="今日营收" className="revenue-card">
        <div className="revenue-amount">¥8,640</div>
        <div className="revenue-subtitle">较昨日增长 12%</div>
      </Card>

      <Card title="销售前十菜品" className="chart-card">
        <div className="bar-chart">
          {TOP_DISHES.map((dish, index) => (
            <div key={index} className="bar-item">
              <div className="bar-label">{dish.name}</div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${(dish.sales / TOP_DISHES[0].sales) * 100}%` }}
                />
                <span className="bar-value">{dish.sales}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="merchant-dashboard">
      <NavBar onBack={() => navigate('/home')}>商家后台</NavBar>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="dashboard-tabs"
      >
        <Tabs.Tab title="订单" key="orders">
          {renderOrders()}
        </Tabs.Tab>
        <Tabs.Tab title="库存" key="inventory">
          {renderInventory()}
        </Tabs.Tab>
        <Tabs.Tab title="排行榜" key="rankings">
          {renderRankings()}
        </Tabs.Tab>
        <Tabs.Tab title="报表" key="reports">
          {renderReports()}
        </Tabs.Tab>
      </Tabs>
    </div>
  );
};

export default MerchantDashboard;
