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
} from 'antd-mobile';
import { LeftOutline, ExclamationCircleOutline } from 'antd-mobile-icons';
import { inventoryApi } from '../../api/inventory';
import { authUtils } from '../../utils/auth';
import './InventoryManagement.css';

function InventoryList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      Toast.show({ content: '请先登录', icon: 'fail' });
      navigate('/');
      return;
    }
  }, [navigate]);

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
        Toast.show({ content: '登录已过期，请重新登录', icon: 'fail' });
        authUtils.removeToken();
        navigate('/');
      }
    } catch (error) {
      console.error('获取库存列表失败:', error);
      Toast.show({ content: '获取库存列表失败', icon: 'fail' });
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
      return <Tag color="danger">缺货</Tag>;
    }
    if (status === 'low') {
      return (
        <Tag color="warning">
          <ExclamationCircleOutline /> 低库存
        </Tag>
      );
    }
    return <Tag color="success">正常</Tag>;
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
      const response = await inventoryApi.updateInventory(editingItem._id, values);

      if (response.code === 0) {
        Toast.show({ content: '更新成功', icon: 'success' });
        setShowEditPopup(false);
        fetchInventory();
      }
    } catch (error) {
      if (error.errorFields) {
        Toast.show({ content: '请填写必填项', icon: 'fail' });
      } else {
        Toast.show({ content: '更新失败', icon: 'fail' });
      }
    }
  };

  const handleViewHistory = (item) => {
    console.log('查看库存历史，商品:', item.productName, 'ID:', item._id);
    if (!item._id) {
      Toast.show({ content: '库存ID无效', icon: 'fail' });
      return;
    }
    navigate(`/merchant/inventory/history?inventoryId=${item._id}&productName=${encodeURIComponent(item.productName)}`);
  };

  const renderInventoryItem = (item) => (
    <List.Item
      key={item._id}
      onClick={() => handleViewHistory(item)}
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>当前库存: {item.quantity}</div>
          <div>最新单价: ¥{item.lastPrice?.toFixed(2) || '0.00'}</div>
          <div>库存总值: ¥{item.totalValue?.toFixed(2) || '0.00'}</div>
          {item.lowStockThreshold > 0 && (
            <div>预警阈值: {item.lowStockThreshold}</div>
          )}
          <div style={{ fontSize: 12, color: '#999' }}>
            更新时间: {new Date(item.updatedAt).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </Space>
      }
      extra={
        <Space direction="vertical" align="end">
          {getStatusTag(item)}
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(item);
            }}
          >
            编辑
          </Button>
        </Space>
      }
    >
      <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
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
        库存列表
      </NavBar>

      <div style={{ padding: 12, background: '#f5f5f5' }}>
        <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1677ff' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>商品总数</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
              ¥{stats.totalValue.toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>库存总值</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4d4f' }}>
              {stats.lowStock}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>低库存预警</div>
          </div>
        </Space>
      </div>

      <SearchBar
        placeholder="搜索商品名称"
        onSearch={handleSearch}
        onClear={() => setSearchText('')}
      />

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <Tabs.Tab title="全部" key="all" />
        <Tabs.Tab title={`低库存 ${stats.lowStock > 0 ? `(${stats.lowStock})` : ''}`} key="low" />
      </Tabs>

      <PullToRefresh onRefresh={handleRefresh}>
        <div style={{ minHeight: '50vh' }}>
          {inventory.length === 0 && !loading ? (
            <Empty description="暂无库存数据" />
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
          <h3>编辑库存项目</h3>
          <Form form={form} layout="horizontal">
            <Form.Item
              name="productName"
              label="商品名称"
              rules={[
                { required: true, message: '请输入商品名称' },
                { max: 100, message: '商品名称不能超过100字符' },
              ]}
            >
              <Input placeholder="请输入商品名称" />
            </Form.Item>
            <Form.Item
              name="lowStockThreshold"
              label="预警阈值"
              rules={[
                { type: 'number', min: 0, message: '预警阈值必须大于等于0' },
              ]}
            >
              <Input type="number" placeholder="请输入预警阈值" />
            </Form.Item>
          </Form>
          <Space style={{ marginTop: 20, width: '100%' }}>
            <Button block onClick={() => setShowEditPopup(false)}>
              取消
            </Button>
            <Button block color="primary" onClick={handleSaveEdit}>
              保存
            </Button>
          </Space>
        </div>
      </Popup>
    </div>
  );
}

export default InventoryList;
