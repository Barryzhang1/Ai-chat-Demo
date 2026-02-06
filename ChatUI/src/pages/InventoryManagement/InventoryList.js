import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  Tabs,
  List,
  Tag,
  Toast,
  Empty,
  PullToRefresh,
  SearchBar,
  Space,
  Dialog,
  Form,
  Input,
  Button,
  Popup,
  ActionSheet,
} from 'antd-mobile';
import { LeftOutline, ExclamationCircleOutline } from 'antd-mobile-icons';
import { inventoryApi, inventoryLossApi } from '../../api/inventory';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import { authUtils } from '../../utils/auth';
import InventoryLossFormPopup from '../../components/InventoryLossFormPopup';
import './InventoryManagement.css';

function InventoryList() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showLossPopup, setShowLossPopup] = useState(false);
  const [form] = Form.useForm();
  const [lossForm] = Form.useForm();

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      Toast.show({ content: t('loginFirst', language), icon: 'fail' });
      navigate('/');
      return;
    }
  }, [navigate, language]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await inventoryApi.getInventoryList({
        status: activeTab,
        productName: searchText,
        page: 1,
        pageSize: 100,
      });

      if (response.code === 0) {
        setInventory(response.data.list || []);
      } else if (response.code === 401) {
        Toast.show({ content: t('loginExpired', language), icon: 'fail' });
        authUtils.removeToken();
        navigate('/');
      }
    } catch (error) {
      console.error('获取库存列表失败:', error);
      Toast.show({ content: t('fetchInventoryListFailed', language) || t('operationFailedRetry', language), icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      fetchInventory();
    }
  }, [activeTab, searchText]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleRefresh = async () => {
    await fetchInventory();
  };

  const getStatusTag = (item) => {
    const status = item.status || 'normal';
    if (status === 'out') {
      return <Tag color="danger">{t('outOfStock', language)}</Tag>;
    }
    if (status === 'low') {
      return (
        <Tag color="warning">
          <ExclamationCircleOutline /> {t('lowStockStatus', language)}
        </Tag>
      );
    }
    return <Tag color="success">{t('normalStockStatus', language)}</Tag>;
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      productName: item.productName,
      lowStockThreshold: item.lowStockThreshold,
    });
    setShowEditPopup(true);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      
      // 将 lowStockThreshold 转换为数字类型
      if (values.lowStockThreshold !== undefined && values.lowStockThreshold !== null && values.lowStockThreshold !== '') {
        values.lowStockThreshold = Number(values.lowStockThreshold);
      }
      
      const response = await inventoryApi.updateInventory(editingItem._id, values);

      if (response.code === 0) {
        Toast.show({ content: t('updateSuccess', language), icon: 'success' });
        setShowEditPopup(false);
        fetchInventory();
      }
    } catch (error) {
      if (error.errorFields) {
        Toast.show({ content: t('fillRequiredFields', language), icon: 'fail' });
      } else {
        Toast.show({ content: t('updateFailed', language), icon: 'fail' });
      }
    }
  };

  const handleViewHistory = (item) => {
    console.log('查看库存历史，商品:', item.productName, 'ID:', item._id);
    if (!item._id) {
      Toast.show({ content: t('invalidInventoryId', language), icon: 'fail' });
      return;
    }
    navigate(`/merchant/inventory/history?inventoryId=${item._id}&productName=${encodeURIComponent(item.productName)}`);
  };

  const handleViewConsumeHistory = (item) => {
    console.log('查看消耗记录，商品:', item.productName, 'ID:', item._id);
    if (!item._id) {
      Toast.show({ content: t('invalidInventoryId', language), icon: 'fail' });
      return;
    }
    navigate(`/merchant/inventory/${item._id}/consume-history`);
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowActionSheet(true);
  };

  const handleAddLoss = (item) => {
    setSelectedItem(item);
    lossForm.resetFields();
    setShowLossPopup(true);
    setShowActionSheet(false);
  };

  const handleSubmitLoss = async (values) => {
    try {
      console.log('提交损耗，参数:', {
        inventoryId: selectedItem._id,
        quantity: parseFloat(values.quantity),
        reason: values.reason,
        remark: values.remark,
      });

      const response = await inventoryLossApi.createInventoryLoss({
        inventoryId: selectedItem._id,
        quantity: parseFloat(values.quantity),
        reason: values.reason,
        remark: values.remark,
      });

      console.log('损耗录入响应:', response);

      if (response.code === 0) {
        Toast.show({ content: t('recordLossSuccess', language), icon: 'success' });
        setShowLossPopup(false);
        setSelectedItem(null);
        lossForm.resetFields();
        fetchInventory(); // 刷新库存列表
      } else if (response.statusCode === 400 || response.statusCode === 401) {
        Toast.show({ 
          content: response.message || t('operationFailedSimple', language), 
          icon: 'fail' 
        });
      } else {
        Toast.show({ content: response.message || t('recordLossFailed', language), icon: 'fail' });
      }
    } catch (error) {
      console.error('损耗录入失败:', error);
      if (error.errorFields) {
        Toast.show({ content: t('fillRequiredFields', language), icon: 'fail' });
      } else {
        const message = error.response?.data?.message || error.message || t('recordLossFailed', language);
        Toast.show({ content: message, icon: 'fail' });
      }
    }
  };

  const actionSheetActions = [
    { text: '录入损耗', key: 'addLoss', danger: true },
    { text: '查看变更历史', key: 'history' },
    { text: '编辑库存信息', key: 'edit' },
  ];

  const handleActionSheetAction = (action) => {
    if (!selectedItem) return;
    
    switch (action.key) {
      case 'addLoss':
        handleAddLoss(selectedItem);
        break;
      case 'history':
        handleViewHistory(selectedItem);
        setShowActionSheet(false);
        setSelectedItem(null);
        break;
      case 'consume':
        handleViewConsumeHistory(selectedItem);
        setShowActionSheet(false);
        setSelectedItem(null);
        break;
      case 'edit':
        handleEdit(selectedItem);
        setShowActionSheet(false);
        setSelectedItem(null);
        break;
      default:
        break;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    if (language === 'en') {
      // 英文格式：MM/dd HH:mm
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');
    } else {
      // 中文格式：MM/dd HH:mm
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderInventoryItem = (item) => (
    <List.Item
      key={item._id}
      onClick={() => handleItemClick(item)}
      className="inventory-list-item"
      description={
        <div className="inventory-item-description">
          <div className="inventory-item-info-row">
            {t('currentStock', language)}: {item.quantity}
          </div>
          <div className="inventory-item-info-row">
            {t('latestPrice', language)}: ¥{item.lastPrice?.toFixed(2) || '0.00'}
          </div>
          <div className="inventory-item-info-row">
            {t('totalValueLabel', language)}: ¥{item.totalValue?.toFixed(2) || '0.00'}
          </div>
          {item.lowStockThreshold > 0 && (
            <div className="inventory-item-info-row">
              {t('threshold', language)}: {item.lowStockThreshold}
            </div>
          )}
          <div className="inventory-item-time">
            {t('updatedAt', language)}: {formatTime(item.updatedAt)}
          </div>
        </div>
      }
      extra={
        <div className="inventory-item-extra">
          {getStatusTag(item)}
        </div>
      }
    >
      <div className="inventory-item-title">{item.productName}</div>
    </List.Item>
  );

  const calculateStats = () => {
    const total = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const lowStock = inventory.filter((item) => item.status === 'low' || item.status === 'out').length;
    return { total, totalValue, lowStock };
  };

  const stats = calculateStats();

  return (
    <div className="page-container">
      <NavBar backArrow={<LeftOutline />} onBack={() => navigate('/merchant')}>
        {t('inventoryListTitle', language)}
      </NavBar>

      <div style={{ padding: 12, background: '#f5f5f5' }}>
        <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1677ff' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>{t('totalProducts', language)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
              ¥{stats.totalValue.toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>{t('totalInventoryValue', language)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4d4f' }}>
              {stats.lowStock}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>{t('lowStockWarning', language)}</div>
          </div>
        </Space>
      </div>

      <SearchBar
        placeholder={t('searchIngredient', language)}
        onSearch={handleSearch}
        onClear={() => setSearchText('')}
      />

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <Tabs.Tab title={t('all', language)} key="all" />
        <Tabs.Tab
          title={`${t('lowStockTab', language)}${stats.lowStock > 0 ? ` (${stats.lowStock})` : ''}`}
          key="low"
        />
      </Tabs>

      <PullToRefresh onRefresh={handleRefresh}>
        <div style={{ minHeight: '50vh' }}>
          {inventory.length === 0 && !loading ? (
            <Empty description={t('noInventoryData', language)} />
          ) : (
            <List>{inventory.map(renderInventoryItem)}</List>
          )}
        </div>
      </PullToRefresh>

      {/* 编辑弹窗 */}
      <Popup
        visible={showEditPopup}
        onMaskClick={() => setShowEditPopup(false)}
        bodyStyle={{ height: '50vh' }}
      >
        <div style={{ padding: 20 }}>
          <h3>{t('editInventoryItem', language)}</h3>
          <Form form={form} layout="horizontal">
            <Form.Item
              name="productName"
              label={t('productNameLabel', language)}
              rules={[
                { required: true, message: t('enterProductName', language) },
                { max: 100, message: t('productNameTooLong', language) },
              ]}
            >
              <Input placeholder={t('enterProductName', language)} />
            </Form.Item>
            <Form.Item
              name="lowStockThreshold"
              label={t('threshold', language)}
              rules={[
                {
                  validator: (_, value) => {
                    if (value === undefined || value === null || value === '') {
                      return Promise.resolve();
                    }
                    const numValue = Number(value);
                    if (isNaN(numValue)) {
                      return Promise.reject(new Error(t('enterValidNumber', language)));
                    }
                    if (numValue < 0) {
                      return Promise.reject(new Error(t('thresholdNonNegative', language)));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input type="number" placeholder={t('enterThreshold', language)} />
            </Form.Item>
          </Form>
          <Space style={{ marginTop: 20, width: '100%' }}>
            <Button block onClick={() => setShowEditPopup(false)}>
              {t('cancel', language)}
            </Button>
            <Button block color="primary" onClick={handleSaveEdit}>
              {t('save', language)}
            </Button>
          </Space>
        </div>
      </Popup>

      {/* 操作菜单 */}
      <ActionSheet
        visible={showActionSheet}
        actions={actionSheetActions}
        onAction={handleActionSheetAction}
        onClose={() => {
          setShowActionSheet(false);
          setSelectedItem(null);
        }}
        cancelText={t('cancel', language)}
      />

      {/* 损耗录入弹窗 */}
      <Popup
        visible={showLossPopup}
        onMaskClick={() => {
          setShowLossPopup(false);
          setSelectedItem(null);
          lossForm.resetFields();
        }}
        bodyStyle={{
          backgroundColor: '#ffffff',
          maxHeight: '70vh',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <InventoryLossFormPopup
          form={lossForm}
          onFinish={handleSubmitLoss}
          onCancel={() => {
            setShowLossPopup(false);
            setSelectedItem(null);
            lossForm.resetFields();
          }}
          inventoryItem={selectedItem || {}}
        />
      </Popup>
    </div>
  );
}

export default InventoryList;
