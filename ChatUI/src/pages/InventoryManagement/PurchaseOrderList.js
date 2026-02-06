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
import { authUtils } from '../../utils/auth';
import { isBoss } from '../../utils/permission';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import './InventoryManagement.css';

const statusConfig = (language) => ({
  pending: { text: t('purchaseStatusPending', language), color: 'warning' },
  approved: { text: t('purchaseStatusApproved', language), color: 'primary' },
  completed: { text: t('purchaseStatusCompleted', language), color: 'success' },
  cancelled: { text: t('purchaseStatusCancelled', language), color: 'default' },
});

function PurchaseOrderList() {
  const navigate = useNavigate();
  const { language } = useLanguage();
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
      Toast.show({ content: t('fetchPurchaseOrderListFailed', language) || t('operationFailedRetry', language), icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, activeTab);
  }, [activeTab, language]);

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
        content: t('approvePurchaseOrderConfirm', language),
        confirmText: t('confirm', language),
        cancelText: t('cancel', language),
        onConfirm: async () => {
          try {
            const response = await purchaseOrderApi.approvePurchaseOrder(order._id, {
              approve: true,
              remark: t('approveRemarkDefault', language) || '',
            });
            if (response.code === 0) {
              Toast.show({ content: t('approveSuccess', language), icon: 'success' });
              fetchOrders(1, activeTab);
            }
          } catch (error) {
            Toast.show({ content: t('approveFailed', language), icon: 'fail' });
          }
        },
      });
    } else {
      setShowApprovePopup(true);
    }
  };

  const handleReject = async () => {
    if (!approveRemark.trim()) {
      Toast.show({ content: t('enterRejectReason', language), icon: 'fail' });
      return;
    }

    try {
      const response = await purchaseOrderApi.approvePurchaseOrder(selectedOrder._id, {
        approve: false,
        remark: approveRemark,
      });
      if (response.code === 0) {
        Toast.show({ content: t('rejected', language), icon: 'success' });
        setShowApprovePopup(false);
        setApproveRemark('');
        fetchOrders(1, activeTab);
      }
    } catch (error) {
      Toast.show({ content: t('operationFailedSimple', language), icon: 'fail' });
    }
  };

  const handleReceive = (order) => {
    setSelectedOrder(order);
    setShowReceivePopup(true);
  };

  const handleConfirmReceive = async () => {
    try {
      const response = await purchaseOrderApi.receivePurchaseOrder(selectedOrder._id, {
        remark: receiveRemark || t('receiveRemarkDefault', language) || '',
      });
      if (response.code === 0) {
        Toast.show({ content: t('receiveSuccess', language), icon: 'success' });
        setShowReceivePopup(false);
        setReceiveRemark('');
        fetchOrders(1, activeTab);
      }
    } catch (error) {
      Toast.show({ content: t('receiveFailed', language), icon: 'fail' });
    }
  };

  const handleViewDetail = (order) => {
    Dialog.alert({
      title: `${t('purchaseOrderDetails', language)} - ${order.orderNo}`,
      confirmText: t('confirm', language),
      content: (
        <div style={{ textAlign: 'left' }}>
          <p><strong>{t('supplier', language)}:</strong> {order.supplierName}</p>
          <p><strong>{t('totalAmountLabel', language)}:</strong> ¥{order.totalAmount.toFixed(2)}</p>
          <p><strong>{t('statusLabel', language)}:</strong> {statusConfig(language)[order.status]?.text}</p>
          <p><strong>{t('createdAtLabel', language)}:</strong> {new Date(order.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'zh-CN')}</p>
          {order.items && order.items.length > 0 && (
            <>
              <p><strong>{t('purchaseItems', language)}:</strong></p>
              <div style={{ marginLeft: 10, fontSize: 13 }}>
                {order.items.map((item, index) => (
                  <div key={index} style={{ marginBottom: 8, lineHeight: '1.6' }}>
                    {item.productName}：¥{item.price?.toFixed(2)} × {item.quantity} = ¥{(item.price * item.quantity).toFixed(2)}
                  </div>
                ))}
              </div>
            </>
          )}
          {order.remark && <p><strong>{t('remarkLabel', language)}:</strong> {order.remark}</p>}
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
          <div>{t('supplier', language)}: {order.supplierName}</div>
          <div>{t('totalAmountLabel', language)}: ¥{order.totalAmount.toFixed(2)}</div>
          {order.items && order.items.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{t('goodsDetails', language)}：</div>
              {order.items.map((item, index) => (
                <div key={index} style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                  • {item.productName} - {t('quantityLabel', language)}: {item.quantity}，{t('unitPriceLabel', language)}: ¥{item.price?.toFixed(2)}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#999' }}>
            {t('createdAtLabel', language)}: {new Date(order.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'zh-CN', { 
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
          <Tag color={statusConfig(language)[order.status]?.color}>
            {statusConfig(language)[order.status]?.text}
          </Tag>
          {order.status === 'pending' && isBoss() && (
            <Space>
              <Button
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(order, true);
                }}
              >
                {t('approve', language)}
              </Button>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(order, false);
                }}
              >
                {t('reject', language)}
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
              {t('receive', language)}
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
            <AddOutline /> {t('createPurchaseOrder', language)}
          </Button>
        }
      >
        {t('purchaseManagementTitle', language)}
      </NavBar>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        style={{ '--fixed-active-line-width': '20px' }}
      >
        <Tabs.Tab title={t('all', language)} key="all" />
        <Tabs.Tab title={t('purchaseStatusPending', language)} key="pending" />
        <Tabs.Tab title={t('purchaseStatusApproved', language)} key="approved" />
        <Tabs.Tab title={t('purchaseStatusCompleted', language)} key="completed" />
        <Tabs.Tab title={t('purchaseStatusCancelled', language)} key="cancelled" />
      </Tabs>

      <PullToRefresh onRefresh={handleRefresh}>
        <div style={{ minHeight: '60vh' }}>
          {orders.length === 0 && !loading ? (
            <Empty description={t('noPurchaseOrders', language)} />
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
          <h3>{t('rejectReasonTitle', language)}</h3>
          <TextArea
            placeholder={t('approveRemarkPlaceholder', language)}
            value={approveRemark}
            onChange={setApproveRemark}
            rows={5}
            showCount
            maxLength={200}
          />
          <Space style={{ marginTop: 20, width: '100%' }}>
            <Button block onClick={() => setShowApprovePopup(false)}>
              {t('cancel', language)}
            </Button>
            <Button block color="primary" onClick={handleReject}>
              {t('confirmReject', language)}
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
          <h3>{t('receiveConfirmTitle', language)}</h3>
          <TextArea
            placeholder={t('receiveRemarkPlaceholder', language)}
            value={receiveRemark}
            onChange={setReceiveRemark}
            rows={5}
            showCount
            maxLength={200}
          />
          <Space style={{ marginTop: 20, width: '100%' }}>
            <Button block onClick={() => setShowReceivePopup(false)}>
              {t('cancel', language)}
            </Button>
            <Button block color="success" onClick={handleConfirmReceive}>
              {t('confirmReceive', language)}
            </Button>
          </Space>
        </div>
      </Popup>
    </div>
  );
}

export default PurchaseOrderList;
