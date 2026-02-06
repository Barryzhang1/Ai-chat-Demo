import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  Form,
  Input,
  Button,
  Toast,
  List,
  Space,
  Card,
  Divider,
  Grid,
  Popup,
  SearchBar,
} from 'antd-mobile';
import { LeftOutline, AddCircleOutline } from 'antd-mobile-icons';
import { purchaseOrderApi, inventoryApi } from '../../api/inventory';
import { authUtils } from '../../utils/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import './InventoryManagement.css';

function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [form] = Form.useForm();
  const [items, setItems] = useState([
    { productName: '', quantity: '', price: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [inventoryList, setInventoryList] = useState([]);
  const [filteredInventoryList, setFilteredInventoryList] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      Toast.show({ content: t('loginFirst', language), icon: 'fail' });
      navigate('/');
      return;
    }
    fetchInventoryList();
  }, [navigate]);

  const fetchInventoryList = async () => {
    try {
      const response = await inventoryApi.getInventoryList({
        page: 1,
        pageSize: 1000,
      });
      if (response.code === 0) {
        const list = response.data.list || [];
        setInventoryList(list);
        setFilteredInventoryList(list);
      }
    } catch (error) {
      console.error('获取库存列表失败:', error);
    }
  };

  const handleOpenProductSelector = (index) => {
    setCurrentEditIndex(index);
    setSearchText('');
    setFilteredInventoryList(inventoryList);
    setShowProductSelector(true);
  };

  const handleSelectProduct = (product) => {
    if (currentEditIndex !== null) {
      const newItems = [...items];
      newItems[currentEditIndex].productName = product.productName;
      newItems[currentEditIndex].price = product.lastPrice || '';
      setItems(newItems);
      setShowProductSelector(false);
      Toast.show({ content: `${product.productName}`, icon: 'success' });
    }
  };

  const handleSearchProduct = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredInventoryList(inventoryList);
    } else {
      const filtered = inventoryList.filter(item =>
        item.productName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredInventoryList(filtered);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { productName: '', quantity: '', price: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      Toast.show({ content: t('keepOneItemWarning', language), icon: 'fail' });
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return total + quantity * price;
    }, 0);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证商品列表（允许数量为0，但必须有商品名称和单价）
      const validItems = items.filter(
        (item) => item.productName && item.quantity !== '' && item.price !== ''
      );

      if (validItems.length === 0) {
        Toast.show({ content: t('addCompleteItemWarning', language), icon: 'fail' });
        return;
      }

      const formattedItems = validItems.map((item) => ({
        productName: item.productName,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
      }));

      setSubmitting(true);
      const response = await purchaseOrderApi.createPurchaseOrder({
        supplierName: values.supplierName,
        items: formattedItems,
        remark: values.remark,
      });

      if (response.code === 0) {
        Toast.show({ content: t('createSuccess', language), icon: 'success' });
        setTimeout(() => {
          navigate('/merchant/inventory/purchase-order');
        }, 1000);
      } else if (response.statusCode === 400 || response.statusCode === 401) {
        Toast.show({ 
          content: response.message || t('createFailedCheckLogin', language), 
          icon: 'fail' 
        });
        if (response.statusCode === 401) {
          authUtils.removeToken();
          setTimeout(() => navigate('/'), 1500);
        }
      } else {
        Toast.show({ content: response.message || t('createFailed', language), icon: 'fail' });
        navigate('/merchant/inventory/purchase-order');
      }
    } catch (error) {
      console.error('创建进货单失败:', error);
      if (error.errorFields) {
        Toast.show({ content: t('fillRequiredFields', language), icon: 'fail' });
      } else {
        Toast.show({ content: t('createFailed', language), icon: 'fail' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <NavBar backArrow={<LeftOutline />} onBack={() => navigate(-1)}>
        {t('createPurchaseOrder', language)}
      </NavBar>

      <div style={{ 
        padding: 12, 
        height: 'calc(100vh - 45px)',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <Form
          form={form}
          layout="horizontal"
          footer={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Card>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                  {t('totalAmountLabel', language)}: ¥{calculateTotal().toFixed(2)}
                </div>
              </Card>
              <Button
                block
                type="submit"
                color="primary"
                size="large"
                loading={submitting}
                onClick={handleSubmit}
              >
                {t('createPurchaseOrder', language)}
              </Button>
            </Space>
          }
        >
          <Form.Header>{t('purchaseBasicInfo', language)}</Form.Header>
          <Form.Item
            name="supplierName"
            label={t('supplier', language)}
            rules={[{ required: true, message: t('enterSupplierName', language) }]}
          >
            <Input placeholder={t('enterSupplierName', language)} />
          </Form.Item>
          <Form.Item name="remark" label={t('remarkLabel', language)}>
            <Input placeholder={t('optional', language)} />
          </Form.Item>

          <Form.Header>{t('purchaseGoodsHeader', language)}</Form.Header>
        </Form>

        <div style={{ marginBottom: 12 }}>
          <Button
            block
            color="primary"
            fill="outline"
            onClick={handleAddItem}
            style={{ 
              borderStyle: 'dashed',
              fontSize: 14
            }}
          >
            <AddCircleOutline fontSize={18} /> {t('addItem', language)}
          </Button>
        </div>

        {items.map((item, index) => (
          <Card
            key={index}
            style={{ 
              marginBottom: 16,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
            title={
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '4px 0'
              }}>
                <Space align="center">
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                  <span style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                    {t('productNameLabel', language)} {index + 1}
                  </span>
                </Space>
                {items.length > 1 ? (
                  <Button
                    size="mini"
                    color="danger"
                    fill="outline"
                    onClick={() => handleRemoveItem(index)}
                    style={{ fontSize: 12, marginLeft: 20 }}
                  >
                    {t('delete', language)}
                  </Button>
                ) : (
                  <span style={{ 
                    fontSize: 12, 
                    color: '#999',
                    background: '#f5f5f5',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    {t('atLeastOneTag', language)}
                  </span>
                )}
              </div>
            }
          >
            <div style={{ padding: '8px 0' }}>
              {/* 商品名称 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  fontSize: 13, 
                  color: '#666', 
                  marginBottom: 8,
                  fontWeight: '500',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>
                    <span style={{ color: '#ff4d4f' }}>* </span>
                    {t('productNameLabel', language)}
                  </span>
                  <Button
                    size="mini"
                    color="primary"
                    fill="none"
                    onClick={() => handleOpenProductSelector(index)}
                    style={{ fontSize: 12, padding: '0 8px' }}
                  >
                    {t('fromInventory', language)}
                  </Button>
                </div>
                <Input
                  placeholder={t('productInputPlaceholder', language)}
                  value={item.productName}
                  onChange={(val) => handleItemChange(index, 'productName', val)}
                  style={{ 
                    '--font-size': '15px',
                    '--placeholder-color': '#bfbfbf'
                  }}
                />
              </div>

              {/* 数量和单价 */}
              <Grid columns={2} gap={12}>
                <Grid.Item>
                  <div style={{ 
                    fontSize: 13, 
                    color: '#666', 
                    marginBottom: 8,
                    fontWeight: '500'
                  }}>
                    <span style={{ color: '#ff4d4f' }}>* </span>
                    {t('quantityLabel', language)}
                  </div>
                  <Input
                    type="number"
                    placeholder="0"
                    value={item.quantity}
                    onChange={(val) => handleItemChange(index, 'quantity', val)}
                    style={{ 
                      '--font-size': '15px',
                      '--placeholder-color': '#bfbfbf'
                    }}
                  />
                  <div style={{ 
                    fontSize: 12, 
                    color: '#999', 
                    marginTop: 4,
                    textAlign: 'right'
                  }}>
                    {t('quantityUnitPieces', language)}
                  </div>
                </Grid.Item>
                <Grid.Item>
                  <div style={{ 
                    fontSize: 13, 
                    color: '#666', 
                    marginBottom: 8,
                    fontWeight: '500'
                  }}>
                    <span style={{ color: '#ff4d4f' }}>* </span>
                    {t('unitPriceLabel', language)}
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={item.price}
                    onChange={(val) => handleItemChange(index, 'price', val)}
                    style={{ 
                      '--font-size': '15px',
                      '--placeholder-color': '#bfbfbf'
                    }}
                  />
                  <div style={{ 
                    fontSize: 12, 
                    color: '#999', 
                    marginTop: 4,
                    textAlign: 'right'
                  }}>
                    {t('priceUnitYuan', language)}
                  </div>
                </Grid.Item>
              </Grid>

              {/* 小计显示 */}
              {item.quantity && item.price && (
                <>
                  <Divider style={{ margin: '16px 0' }} />
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                    borderRadius: 8
                  }}>
                    <span style={{ 
                      fontSize: 14, 
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      {t('subtotal', language)}
                    </span>
                    <span style={{ 
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: '#667eea',
                      letterSpacing: '0.5px'
                    }}>
                      ¥{(parseFloat(item.quantity) * parseFloat(item.price)).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* 商品选择弹窗 */}
      <Popup
        visible={showProductSelector}
        onMaskClick={() => setShowProductSelector(false)}
        bodyStyle={{ 
          height: '70vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden'
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%' 
        }}>
          {/* 标题栏 */}
          <div style={{ 
            padding: '16px 20px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>
              {t('selectProductTitle', language)}
            </h3>
            <Button
              size="small"
              fill="none"
              onClick={() => setShowProductSelector(false)}
            >
              取消
            </Button>
          </div>

          {/* 搜索框 */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <SearchBar
              placeholder={t('searchIngredient', language)}
              value={searchText}
              onChange={handleSearchProduct}
              onClear={() => handleSearchProduct('')}
            />
          </div>

          {/* 商品列表 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {filteredInventoryList.length === 0 ? (
              <div style={{ 
                padding: 40, 
                textAlign: 'center', 
                color: '#999' 
              }}>
                {searchText ? t('noMatchingProduct', language) : t('noInventoryProducts', language)}
              </div>
            ) : (
              <List>
                {filteredInventoryList.map((product) => (
                  <List.Item
                    key={product._id}
                    onClick={() => handleSelectProduct(product)}
                    clickable
                    arrow={false}
                    description={
                      <Space direction="vertical" style={{ fontSize: 12, color: '#999' }}>
                        <span>{t('currentStock', language)}: {product.quantity}</span>
                        <span>{t('latestPrice', language)}: ¥{product.lastPrice?.toFixed(2) || '0.00'}</span>
                      </Space>
                    }
                  >
                    <div style={{ 
                      fontSize: 15, 
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      {product.productName}
                    </div>
                  </List.Item>
                ))}
              </List>
            )}
          </div>

          {/* 底部提示 */}
          <div style={{ 
            padding: '12px 16px',
            background: '#f7f8fa',
            borderTop: '1px solid #eee',
            fontSize: 12,
            color: '#999',
            textAlign: 'center'
          }}>
            {t('selectorFooterTip', language)}
          </div>
        </div>
      </Popup>
    </div>
  );
}

export default CreatePurchaseOrder;
