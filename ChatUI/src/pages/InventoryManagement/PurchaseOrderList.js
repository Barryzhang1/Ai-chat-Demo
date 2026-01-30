import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  Tabs,
  List,
  Button,
  Toast,
  Dialog,
  Tag,
  Space,
  Empty,
  PullToRefresh,
  InfiniteScroll,
  Popup,
  TextArea,
} from 'antd-mobile';
import { AddOutline, LeftOutline } from 'antd-mobile-icons';
import { purchaseOrderApi } from '../../api/inventory';
import './InventoryManagement.css';

const statusConfig = {
  pending: { text: '待审批', color: 'warning' },
  approved: { text: '已审批', color: 'primary' },
  completed: { text: '已完成', color: 'success' },
  cancelled: { text: '已取消', color: 'default' },
};

function PurchaseOrderList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [approveRemark, setApproveRemark] = useState('');
  const [showReceivePopup, setShowReceivePopup] = useState(false);
  const [receiveRemark, setReceiveRemark] = useState('');

  const fetchOrders = async (currentPage = 1, status = activeTab) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await purchaseOrderApi.getPurchaseOrderList({
        status,
        page: currentPage,
        pageSize: 10,
      });

      if (response.code === 0) {
        const newOrders = response.data.list || [];
        if (currentPage === 1) {
          setOrders(newOrders);
        } else {
          setOrders([...orders, ...newOrders]);
        }
        setHasMore(newOrders.length === 10);
        setPage(currentPage);
      }
    } catch (error) {
      console.error('获取进货单列表失败:', error);
      Toast.show({ content: '获取进货单列表失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, activeTab);
  }, [activeTab]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
    setOrders([]);
  };

  const loadMore = async () => {
    await fetchOrders(page + 1, activeTab);
  };

  const handleRefresh = async () => {
    await fetchOrders(1, activeTab);
  };

  const handleApprove = (order, approve) => {
    setSelectedOrder(order);
    if (approve) {
      Dialog.confirm({
        content: '确认批准该进货单？',
        onConfirm: async () => {
          try {
            const response = await purchaseOrderApi.approvePurchaseOrder(order._id, {
              approve: true,
              remark: '同意采购',
            });
            if (response.code === 0) {
              Toast.show({ content: '审批成功', icon: 'success' });
              fetchOrders(1, activeTab);
            }
          } catch (error) {
            Toast.show({ content: '审批失败', icon: 'fail' });
          }
        },
      });
    } else {
      setShowApprovePopup(true);
    }
  };

  const handleReject = async () => {
    if (!approveRemark.trim()) {
      Toast.show({ content: '请填写拒绝原因', icon: 'fail' });
      return;
    }

    try {
      const response = await purchaseOrderApi.approvePurchaseOrder(selectedOrder._id, {
        approve: false,
        remark: approveRemark,
      });
      if (response.code === 0) {
        Toast.show({ content: '已拒绝', icon: 'success' });
        setShowApprovePopup(false);
        setApproveRemark('');
        fetchOrders(1, activeTab);
      }
    } catch (error) {
      Toast.show({ content: '操作失败', icon: 'fail' });
    }
  };

  const handleReceive = (order) => {
    setSelectedOrder(order);
    setShowReceivePopup(true);
  };

  const handleConfirmReceive = async () => {
    try {
      const response = await purchaseOrderApi.receivePurchaseOrder(selectedOrder._id, {
        remark: receiveRemark || '货物已清点入库',
      });
      if (response.code === 0) {
        Toast.show({ content: '入库成功', icon: 'success' });
        setShowReceivePopup(false);
        setReceiveRemark('');
        fetchOrders(1, activeTab);
      }
    } catch (error) {
      Toast.show({ content: '入库失败', icon: 'fail' });
    }
  };

  const handleViewDetail = (order) => {
    Dialog.alert({
      title: `进货单详情 - ${order.orderNo}`,
      content: (
        <div style={{ textAlign: 'left' }}>
          <p><strong>供应商:</strong> {order.supplierName}</p>
          <p><strong>总金额:</strong> ¥{order.totalAmount.toFixed(2)}</p>
          <p><strong>状态:</strong> {statusConfig[order.status]?.text}</p>
          <p><strong>创建时间:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          {order.items && order.items.length > 0 && (
            <>
              <p><strong>采购明细:</strong></p>
              <div style={{ marginLeft: 10, fontSize: 13 }}>
                {order.items.map((item, index) => (
                  <div key={index} style={{ marginBottom: 8, lineHeight: '1.6' }}>
                    {item.productName}：¥{item.price?.toFixed(2)} × {item.quantity} = ¥{(item.price * item.quantity).toFixed(2)}
                  </div>
                ))}
              </div>
            </>
          )}
          {order.remark && <p><strong>备注:</strong> {order.remark}</p>}
        </div>
      ),
    });
  };

  const renderOrderItem = (order) => (
    <List.Item
      key={order._id}
      onClick={() => handleViewDetail(order)}
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>供应商: {order.supplierName}</div>
          <div>总金额: ¥{order.totalAmount.toFixed(2)}</div>
          {order.items && order.items.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>商品明细：</div>
              {order.items.map((item, index) => (
                <div key={index} style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                  • {item.productName} - 数量: {item.quantity}，单价: ¥{item.price?.toFixed(2)}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#999' }}>
            创建时间: {new Date(order.createdAt).toLocaleString('zh-CN', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </Space>
      }
      extra={
        <Space direction="vertical" align="end">
          <Tag color={statusConfig[order.status]?.color}>
            {statusConfig[order.status]?.text}
          </Tag>
          {order.status === 'pending' && (
            <Space>
              <Button
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(order, true);
                }}
              >
                批准
              </Button>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(order, false);
                }}
              >
                拒绝
              </Button>
            </Space>
          )}
          {order.status === 'approved' && (
            <Button
              size="small"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                handleReceive(order);
              }}
            >
              入库
            </Button>
          )}
        </Space>
      }
    >
      <div style={{ fontWeight: 'bold' }}>{order.orderNo}</div>
    </List.Item>
  );

  return (
    <div className="page-container">
      <NavBar
        backArrow={<LeftOutline />}
        onBack={() => navigate('/merchant')}
        right={
          <Button
            size="small"
            color="primary"
            fill="none"
            onClick={() => navigate('/merchant/inventory/purchase-order/create')}
          >
            <AddOutline /> 创建进货单
          </Button>
        }
      >
        进货管理
      </NavBar>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        style={{ '--fixed-active-line-width': '20px' }}
      >
        <Tabs.Tab title="全部" key="all" />
        <Tabs.Tab title="待审批" key="pending" />
        <Tabs.Tab title="已审批" key="approved" />
        <Tabs.Tab title="已完成" key="completed" />
        <Tabs.Tab title="已取消" key="cancelled" />
      </Tabs>

      <PullToRefresh onRefresh={handleRefresh}>
        <div style={{ minHeight: '60vh' }}>
          {orders.length === 0 && !loading ? (
            <Empty description="暂无进货单" />
          ) : (
            <List>
              {orders.map(renderOrderItem)}
            </List>
          )}
          <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
        </div>
      </PullToRefresh>

      {/* 拒绝原因弹窗 */}
      <Popup
        visible={showApprovePopup}
        onMaskClick={() => setShowApprovePopup(false)}
        bodyStyle={{ height: '40vh' }}
      >
        <div style={{ padding: 20 }}>
          <h3>拒绝原因</h3>
          <TextArea
            placeholder="请输入拒绝原因"
            value={approveRemark}
            onChange={setApproveRemark}
            rows={5}
            showCount
            maxLength={200}
          />
          <Space style={{ marginTop: 20, width: '100%' }}>
            <Button block onClick={() => setShowApprovePopup(false)}>
              取消
            </Button>
            <Button block color="primary" onClick={handleReject}>
              确认拒绝
            </Button>
          </Space>
        </div>
      </Popup>

      {/* 入库确认弹窗 */}
      <Popup
        visible={showReceivePopup}
        onMaskClick={() => setShowReceivePopup(false)}
        bodyStyle={{ height: '40vh' }}
      >
        <div style={{ padding: 20 }}>
          <h3>入库确认</h3>
          <TextArea
            placeholder="请输入入库备注（可选）"
            value={receiveRemark}
            onChange={setReceiveRemark}
            rows={5}
            showCount
            maxLength={200}
          />
          <Space style={{ marginTop: 20, width: '100%' }}>
            <Button block onClick={() => setShowReceivePopup(false)}>
              取消
            </Button>
            <Button block color="success" onClick={handleConfirmReceive}>
              确认入库
            </Button>
          </Space>
        </div>
      </Popup>
    </div>
  );
}

export default PurchaseOrderList;
