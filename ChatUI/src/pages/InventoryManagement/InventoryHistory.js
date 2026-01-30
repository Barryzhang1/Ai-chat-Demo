import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  NavBar,
  Tabs,
  List,
  Toast,
  Empty,
  PullToRefresh,
  Tag,
  Space,
  Button,
  Popup,
  Form,
  Input,
  TextArea,
} from 'antd-mobile';
import { LeftOutline, AddOutline } from 'antd-mobile-icons';
import { inventoryApi, inventoryLossApi } from '../../api/inventory';
import './InventoryManagement.css';

const changeTypeConfig = {
  purchase: { text: '进货入库', color: 'success' },
  loss: { text: '损耗出库', color: 'danger' },
  manual_adjust: { text: '手动调整', color: 'warning' },
};

function InventoryHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inventoryId = searchParams.get('inventoryId');
  const productName = searchParams.get('productName');

  const [activeTab, setActiveTab] = useState('all');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLossPopup, setShowLossPopup] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!inventoryId) {
      Toast.show({ content: '缺少库存ID参数', icon: 'fail' });
      navigate(-1);
      return;
    }
  }, [inventoryId, navigate]);

  const fetchHistory = async () => {
    if (!inventoryId) {
      console.error('inventoryId is missing');
      return;
    }

    setLoading(true);
    try {
      console.log('获取库存历史，参数:', {
        inventoryId,
        changeType: activeTab,
        page: 1,
        pageSize: 100,
      });

      const response = await inventoryApi.getInventoryHistory({
        inventoryId,
        changeType: activeTab,
        page: 1,
        pageSize: 100,
      });

      console.log('库存历史响应:', response);

      if (response.code === 0) {
        setHistory(response.data.list || []);
        console.log('历史记录数量:', response.data.list?.length || 0);
      } else if (response.code === 401) {
        Toast.show({ content: '登录已过期，请重新登录', icon: 'fail' });
        navigate('/');
      } else {
        Toast.show({ content: response.message || '获取历史记录失败', icon: 'fail' });
      }
    } catch (error) {
      console.error('获取库存历史失败:', error);
      Toast.show({ content: '获取库存历史失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inventoryId) {
      fetchHistory();
    }
  }, [activeTab, inventoryId]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleRefresh = async () => {
    await fetchHistory();
  };

  const handleAddLoss = () => {
    form.resetFields();
    setShowLossPopup(true);
  };

  const handleSubmitLoss = async () => {
    try {
      const values = await form.validateFields();
      
      console.log('提交损耗，参数:', {
        inventoryId,
        quantity: parseFloat(values.quantity),
        reason: values.reason,
        remark: values.remark,
      });

      const response = await inventoryLossApi.createInventoryLoss({
        inventoryId,
        quantity: parseFloat(values.quantity),
        reason: values.reason,
        remark: values.remark,
      });

      console.log('损耗录入响应:', response);

      if (response.code === 0) {
        Toast.show({ content: '损耗录入成功', icon: 'success' });
        setShowLossPopup(false);
        form.resetFields();
        fetchHistory();
      } else if (response.statusCode === 400 || response.statusCode === 401) {
        Toast.show({ 
          content: response.message || '操作失败', 
          icon: 'fail' 
        });
      } else {
        Toast.show({ content: response.message || '损耗录入失败', icon: 'fail' });
      }
    } catch (error) {
      console.error('损耗录入失败:', error);
      if (error.errorFields) {
        Toast.show({ content: '请填写必填项', icon: 'fail' });
      } else {
        const message = error.response?.data?.message || error.message || '损耗录入失败';
        Toast.show({ content: message, icon: 'fail' });
      }
    }
  };

  const renderHistoryItem = (item) => (
    <List.Item
      key={item._id}
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            数量变动: 
            <span style={{ 
              color: item.changeQuantity > 0 ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold',
              marginLeft: 4,
            }}>
              {item.changeQuantity > 0 ? '+' : ''}{item.changeQuantity}
            </span>
          </div>
          <div>单价: ¥{item.price?.toFixed(2)}</div>
          <div>
            库存: {item.quantityBefore} → {item.quantityAfter}
          </div>
          {item.relatedOrderNo && (
            <div style={{ fontSize: 12, color: '#1677ff' }}>
              关联单号: {item.relatedOrderNo}
            </div>
          )}
          {item.reason && (
            <div style={{ fontSize: 12, color: '#999' }}>
              原因: {item.reason}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#999' }}>
            时间: {new Date(item.createdAt).toLocaleString()}
          </div>
        </Space>
      }
      extra={
        <Tag color={changeTypeConfig[item.changeType]?.color}>
          {changeTypeConfig[item.changeType]?.text}
        </Tag>
      }
    >
      <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
    </List.Item>
  );

  return (
    <div className="page-container">
      <NavBar
        backArrow={<LeftOutline />}
        onBack={() => navigate(-1)}
        right={
          <Button
            size="small"
            color="danger"
            fill="none"
            onClick={handleAddLoss}
          >
            <AddOutline /> 录入损耗
          </Button>
        }
      >
        {productName || '库存历史'}
      </NavBar>

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <Tabs.Tab title="全部记录" key="all" />
        <Tabs.Tab title="进货记录" key="purchase" />
        <Tabs.Tab title="损耗记录" key="loss" />
      </Tabs>

      <PullToRefresh onRefresh={handleRefresh}>
        <div style={{ minHeight: '60vh' }}>
          {history.length === 0 && !loading ? (
            <Empty 
              description={
                activeTab === 'all' 
                  ? '暂无历史记录' 
                  : activeTab === 'purchase'
                  ? '暂无进货记录'
                  : '暂无损耗记录'
              } 
            />
          ) : loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
              加载中...
            </div>
          ) : (
            <List>{history.map(renderHistoryItem)}</List>
          )}
        </div>
      </PullToRefresh>

      {/* 录入损耗弹窗 */}
      <Popup
        visible={showLossPopup}
        onMaskClick={() => setShowLossPopup(false)}
        bodyStyle={{ height: '60vh' }}
      >
        <div style={{ padding: 20 }}>
          <h3>录入损耗</h3>
          <Form form={form} layout="horizontal">
            <Form.Item label="商品名称">
              <div>{productName}</div>
            </Form.Item>
            <Form.Item
              name="quantity"
              label="损耗数量"
              rules={[
                { required: true, message: '请输入损耗数量' },
                { 
                  validator: (_, value) => {
                    if (value && parseFloat(value) <= 0) {
                      return Promise.reject(new Error('损耗数量必须大于0'));
                    }
                    return Promise.resolve();
                  }
                },
              ]}
            >
              <Input type="number" placeholder="请输入损耗数量" />
            </Form.Item>
            <Form.Item
              name="reason"
              label="损耗原因"
              rules={[{ required: true, message: '请输入损耗原因' }]}
            >
              <Input placeholder="请输入损耗原因（如：过期、破损等）" />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <TextArea placeholder="选填" rows={3} />
            </Form.Item>
          </Form>
          <Space style={{ marginTop: 20, width: '100%' }}>
            <Button block onClick={() => setShowLossPopup(false)}>
              取消
            </Button>
            <Button block color="primary" onClick={handleSubmitLoss}>
              确认录入
            </Button>
          </Space>
        </div>
      </Popup>
    </div>
  );
}

export default InventoryHistory;
