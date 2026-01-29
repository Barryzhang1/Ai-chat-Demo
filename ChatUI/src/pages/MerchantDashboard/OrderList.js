import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List, Tabs, Tag, Toast, Empty, InfiniteScroll, PullToRefresh, Button, Dialog } from 'antd-mobile';
import { orderApi } from '../../api/orderApi';
import './MerchantDashboard.css';

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  // 订单状态配置
  const statusConfig = {
    pending: { text: '待制作', color: 'warning' },
    paid: { text: '已支付', color: 'success' },
    preparing: { text: '制作中', color: 'primary' },
    completed: { text: '已完成', color: 'default' },
    cancelled: { text: '已取消', color: 'danger' },
  };

  // 加载订单列表
  const loadOrders = async (isRefresh = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const currentPage = isRefresh ? 1 : page;
      const params = {
        page: currentPage,
        limit: 10,
      };
      
      // 如果选择了特定状态，添加状态筛选
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      
      const res = await orderApi.getOrders(params);
      // 后端返回: { code: 0, message: '获取成功', data: { orders, total, page, limit, totalPages } }
      const { orders: newOrders, totalPages } = res.data;
      
      if (isRefresh) {
        setOrders(newOrders);
        setPage(2);
        setHasMore(totalPages > 1);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
        setPage(currentPage + 1);
        setHasMore(currentPage < totalPages);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      Toast.show({ icon: 'fail', content: '加载失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  // 下拉刷新
  const onRefresh = async () => {
    await loadOrders(true);
  };

  // 切换标签时重新加载
  useEffect(() => {
    setOrders([]);
    setPage(1);
    setHasMore(true);
    loadOrders(true);
  }, [activeTab]);

  // 格式化时间
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  // 修改订单状态
  const handleUpdateStatus = async (orderId, currentStatus, newStatus, statusText) => {
    const result = await Dialog.confirm({
      content: `确认将订单状态改为"${statusText}"吗？`,
    });

    if (result) {
      try {
        await orderApi.updateOrderStatus(orderId, newStatus);
        Toast.show({ icon: 'success', content: '订单状态已更新' });
        // 刷新订单列表
        await loadOrders(true);
      } catch (error) {
        console.error('更新订单状态失败:', error);
        Toast.show({ icon: 'fail', content: error.message || '更新失败，请重试' });
      }
    }
  };

  return (
    <div className="merchant-dashboard">
      <NavBar onBack={() => navigate('/merchant')}>订单列表</NavBar>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{
          '--title-font-size': '14px',
          '--content-padding': '0',
        }}
      >
        <Tabs.Tab title="全部订单" key="all" />
        <Tabs.Tab title="待接单" key="pending" />
        <Tabs.Tab title="制作中" key="preparing" />
        <Tabs.Tab title="已完成" key="completed" />
      </Tabs>

      <div className="tab-content" style={{ paddingTop: '0' }}>
        <PullToRefresh onRefresh={onRefresh}>
          {orders.length === 0 && !loading ? (
            <Empty description="暂无订单" />
          ) : (
            <>
              <List>
                {orders.map(order => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <List.Item
                      key={order._id}
                      description={
                        <div>
                          <div style={{ marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#333' }}>
                            用户：{order.userName || '未知用户'}
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            订单号：{order._id}
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>订单详情：</div>
                            {order.dishes.map((dish, index) => (
                              <div key={index} style={{ marginLeft: '8px', color: '#666', fontSize: '13px' }}>
                                · {dish.name} × {dish.quantity} <span style={{ color: '#ff6430' }}>¥{dish.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ color: '#999', fontSize: '12px' }}>
                            {formatTime(order.createdAt)}
                          </div>
                        </div>
                      }
                      extra={
                        <div style={{ textAlign: 'right' }}>
                          <Tag color={status.color} style={{ marginBottom: '8px' }}>
                            {status.text}
                          </Tag>
                          <div className="order-price" style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff6430', marginBottom: '8px' }}>
                            ¥{order.totalPrice.toFixed(2)}
                          </div>
                          {/* 根据订单状态显示不同按钮 */}
                          {order.status === 'pending' && (
                            <Button
                              color="primary"
                              size="small"
                              onClick={() => handleUpdateStatus(order._id, 'pending', 'preparing', '制作中')}
                            >
                              接单
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              color="warning"
                              size="small"
                              onClick={() => handleUpdateStatus(order._id, 'preparing', 'completed', '已完成')}
                            >
                              上菜
                            </Button>
                          )}
                        </div>
                      }
                    >
                      <div style={{ fontWeight: 500 }}>
                        共 {order.dishes.reduce((sum, d) => sum + d.quantity, 0)} 件商品
                      </div>
                    </List.Item>
                  );
                })}
              </List>
              <InfiniteScroll loadMore={() => loadOrders(false)} hasMore={hasMore} />
            </>
          )}
        </PullToRefresh>
      </div>
    </div>
  );
}

export default OrderList;
