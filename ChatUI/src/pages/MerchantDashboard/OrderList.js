import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List, Tabs, Tag, Toast, Empty, InfiniteScroll, PullToRefresh, Button, Dialog } from 'antd-mobile';
import { io } from 'socket.io-client';
import { orderApi } from '../../api/orderApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import { config } from '../../config';
import './MerchantDashboard.css';

let socket = null;

function OrderList() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 订单状态配置
  const statusConfig = {
    pending: { text: t('statusPending', language), color: 'warning' },
    paid: { text: t('statusPaid', language), color: 'success' },
    preparing: { text: t('statusPreparing', language), color: 'primary' },
    completed: { text: t('statusCompleted', language), color: 'default' },
    cancelled: { text: t('statusCancelled', language), color: 'danger' },
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
      Toast.show({ icon: 'fail', content: t('loadFailed', language) });
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

  // 初始化 Socket.IO 连接用于实时订单更新
  useEffect(() => {
    console.log('初始化订单 Socket 连接...');
    
    // 连接到订单 Socket namespace
    socket = io(`${config.socketUrl}/order`, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('订单 Socket 已连接:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('订单 Socket 已断开');
    });

    // 监听订单更新事件（创建或状态变更）
    socket.on('orderUpdated', (data) => {
      console.log('收到订单更新通知:', data);
      const { event, order } = data;
      
      // 播放提示音（可选）
      // new Audio('/notification.mp3').play().catch(e => console.log('无法播放提示音'));
      
      // 显示提示消息
      if (event === 'created') {
        Toast.show({
          icon: 'success',
          content: t('newOrder', language) || '新订单',
          duration: 2000,
        });
      } else if (event === 'statusChanged') {
        Toast.show({
          icon: 'success',
          content: t('orderUpdated', language) || '订单已更新',
          duration: 1500,
        });
      }
      
      // 刷新订单列表
      loadOrders(true);
    });

    // 清理函数：断开连接
    return () => {
      if (socket) {
        console.log('清理订单 Socket 连接');
        socket.disconnect();
        socket = null;
      }
    };
  }, [language]); // 依赖 language 以便在切换语言时重新设置提示消息

  // 格式化时间
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return t('justNow', language);
    if (minutes < 60) return t('minutesAgo', language, { n: minutes });
    if (hours < 24) return t('hoursAgo', language, { n: hours });
    if (days < 7) return t('daysAgo', language, { n: days });
    return date.toLocaleDateString();
  };

  // 修改订单状态
  const handleUpdateStatus = async (orderId, currentStatus, newStatus, statusText) => {
    const result = await Dialog.confirm({
      content: t('confirmStatusChange', language, { status: statusText }),
      confirmText: t('confirm', language),
      cancelText: t('cancel', language),
    });

    if (result) {
      try {
        await orderApi.updateOrderStatus(orderId, newStatus);
        Toast.show({ icon: 'success', content: t('orderStatusUpdated', language) });
        // 刷新订单列表
        await loadOrders(true);
      } catch (error) {
        console.error('更新订单状态失败:', error);
        Toast.show({ icon: 'fail', content: error.message || t('updateFailed', language) });
      }
    }
  };

  return (
    <div className="merchant-dashboard">
      <NavBar onBack={() => navigate('/merchant')}>{t('orderList', language)}</NavBar>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{
          '--title-font-size': '14px',
          '--content-padding': '0',
        }}
      >
        <Tabs.Tab title={t('allOrders', language)} key="all" />
        <Tabs.Tab title={t('pendingOrders', language)} key="pending" />
        <Tabs.Tab title={t('preparing', language)} key="preparing" />
        <Tabs.Tab title={t('completedOrders', language)} key="completed" />
      </Tabs>

      <div className="tab-content" style={{ paddingTop: '0' }}>
        <PullToRefresh onRefresh={onRefresh}>
          {orders.length === 0 && !loading ? (
            <Empty description={t('noOrders', language)} />
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
                            {t('user', language)}：{order.userName || t('unknownUser', language)}
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            {t('orderNumber', language)}：{order._id}
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>{t('orderDetails', language)}：</div>
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
                              onClick={() => handleUpdateStatus(order._id, 'pending', 'preparing', t('statusPreparing', language))}
                            >
                              {t('acceptOrder', language)}
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              color="warning"
                              size="small"
                              onClick={() => handleUpdateStatus(order._id, 'preparing', 'completed', t('statusCompleted', language))}
                            >
                              {t('completeOrder', language)}
                            </Button>
                          )}
                        </div>
                      }
                    >
                      <div style={{ fontWeight: 500 }}>
                        {t('totalQuantity', language, { total: order.dishes.reduce((sum, d) => sum + d.quantity, 0) })}
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
