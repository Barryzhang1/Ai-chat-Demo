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
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import './InventoryManagement.css';

const changeTypeConfig = {
  purchase: { textKey: 'purchaseIn', color: 'success' },
  loss: { textKey: 'lossOut', color: 'danger' },
  manual_adjust: { textKey: 'manualAdjust', color: 'warning' },
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
  const { language } = useLanguage();

  useEffect(() => {
    if (!inventoryId) {
      Toast.show({ content: t('missingInventoryId', language), icon: 'fail' });
      navigate(-1);
      return;
    }
  }, [inventoryId, navigate, language]);

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
        Toast.show({ content: t('loginExpired', language), icon: 'fail' });
        navigate('/');
      } else {
        Toast.show({ content: response.message || t('fetchHistoryFailed', language), icon: 'fail' });
      }
    } catch (error) {
      console.error('获取库存历史失败:', error);
      Toast.show({ content: t('fetchHistoryFailed', language), icon: 'fail' });
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
        Toast.show({ content: t('recordLossSuccess', language), icon: 'success' });
        setShowLossPopup(false);
        form.resetFields();
        fetchHistory();
      } else if (response.statusCode === 400 || response.statusCode === 401) {
        Toast.show({ 
          content: response.message || t('operationFailed', language), 
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

  const renderHistoryItem = (item) => (
    <List.Item
      key={item._id}
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            {t('quantityChange', language)}: 
            <span style={{ 
              color: item.changeQuantity > 0 ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold',
              marginLeft: 4,
            }}>
              {item.changeQuantity > 0 ? '+' : ''}{item.changeQuantity}
            </span>
          </div>
          <div>{t('unitPrice', language)}: ¥{item.price?.toFixed(2)}</div>
          <div>
            {t('inventory', language)}: {item.quantityBefore} 
            
            → {item.quantityAfter}
          </div>
          {item.relatedOrderNo && (
            <div style={{ fontSize: 12, color: '#1677ff' }}>
              {t('relatedOrderNo', language)}: {item.relatedOrderNo}
            </div>
          )}
          {item.reason && (
            <div style={{ fontSize: 12, color: '#999' }}>
              {t('reason', language)}: {item.reason}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#999' }}>
            {t('time', language)}: {new Date(item.createdAt).toLocaleString()}
          </div>
        </Space>
      }
      extra={
        <Tag color={changeTypeConfig[item.changeType]?.color}>
          {t(changeTypeConfig[item.changeType]?.textKey || 'unknown', language)}
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
            <AddOutline /> {t('recordLoss', language)}
          </Button>
        }
      >
        {productName || t('inventoryHistory', language)}
      </NavBar>

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <Tabs.Tab title={t('allRecords', language)} key="all" />
        <Tabs.Tab title={t('purchaseRecords', language)} key="purchase" />
        <Tabs.Tab title={t('lossRecords', language)} key="loss" />
      </Tabs>

      <PullToRefresh onRefresh={handleRefresh}>
        <div style={{ minHeight: '60vh' }}>
          {history.length === 0 && !loading ? (
            <Empty 
              description={
                activeTab === 'all' 
                  ? t('noHistory', language)
                  : activeTab === 'purchase'
                  ? t('noPurchaseHistory', language)
                  : t('noLossHistory', language)
              } 
            />
          ) : loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
              {t('loading', language)}
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
          <h3>{t('recordLoss', language)}</h3>
          <Form form={form} layout="horizontal">
            <Form.Item label={t('productName', language)}>
              <div>{productName}</div>
            </Form.Item>
            <Form.Item
              name="quantity"
              label={t('lossQuantity', language)}
              rules={[
                { required: true, message: t('enterLossQuantity', language) },
                { 
                  validator: (_, value) => {
                    if (value && parseFloat(value) <= 0) {
                      return Promise.reject(new Error(t('lossQuantityMustBePositive', language)));
                    }
                    return Promise.resolve();
                  }
                },
              ]}
            >
              <Input type="number" placeholder={t('enterLossQuantity', language)} />
            </Form.Item>
            <Form.Item
              name="reason"
              label={t('lossReason', language)}
              rules={[{ required: true, message: t('enterLossReason', language) }]}
            >
              <Input placeholder={t('lossReasonPlaceholder', language)} />
            </Form.Item>
            <Form.Item name="remark" label={t('remark', language)}>
              <TextArea placeholder={t('optional', language)} rows={3} />
            </Form.Item>
          </Form>
          <Space style={{ marginTop: 20, width: '100%' }}>
            <Button block onClick={() => setShowLossPopup(false)}>
              {t('cancel', language)}
            </Button>
            <Button block color="primary" onClick={handleSubmitLoss}>
              {t('confirmRecordLoss', language)}
            </Button>
          </Space>
        </div>
      </Popup>
    </div>
  );
}

export default InventoryHistory;
