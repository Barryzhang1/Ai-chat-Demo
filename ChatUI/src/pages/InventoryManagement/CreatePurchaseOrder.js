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
import './InventoryManagement.css';

function CreatePurchaseOrder() {
  const navigate = useNavigate();
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
      Toast.show({ content: '请先登录', icon: 'fail' });
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
      Toast.show({ content: `已选择：${product.productName}`, icon: 'success' });
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
      Toast.show({ content: '至少保留一个商品', icon: 'fail' });
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
        Toast.show({ content: '请至少添加一个完整的商品', icon: 'fail' });
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
        Toast.show({ content: '创建成功', icon: 'success' });
        setTimeout(() => {
          navigate('/merchant/inventory/purchase-order');
        }, 1000);
      } else if (response.statusCode === 400 || response.statusCode === 401) {
        Toast.show({ 
          content: response.message || '创建失败，请检查登录状态', 
          icon: 'fail' 
        });
        if (response.statusCode === 401) {
          authUtils.removeToken();
          setTimeout(() => navigate('/'), 1500);
        }
      } else {
        Toast.show({ content: response.message || '创建失败', icon: 'fail' });
        navigate('/merchant/inventory/purchase-order');
      }
    } catch (error) {
      console.error('创建进货单失败:', error);
      if (error.errorFields) {
        Toast.show({ content: '请填写必填项', icon: 'fail' });
      } else {
        Toast.show({ content: '创建失败', icon: 'fail' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <NavBar backArrow={<LeftOutline />} onBack={() => navigate(-1)}>
        创建进货单
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
                  总金额: ¥{calculateTotal().toFixed(2)}
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
                创建进货单
              </Button>
            </Space>
          }
        >
          <Form.Header>基本信息</Form.Header>
          <Form.Item
            name="supplierName"
            label="供应商"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="选填" />
          </Form.Item>

          <Form.Header>采购商品</Form.Header>
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
            <AddCircleOutline fontSize={18} /> 添加商品
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
                    商品 {index + 1}
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
                    删除
                  </Button>
                ) : (
                  <span style={{ 
                    fontSize: 12, 
                    color: '#999',
                    background: '#f5f5f5',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    至少一项
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
                    商品名称
                  </span>
                  <Button
                    size="mini"
                    color="primary"
                    fill="none"
                    onClick={() => handleOpenProductSelector(index)}
                    style={{ fontSize: 12, padding: '0 8px' }}
                  >
                    从库存选择
                  </Button>
                </div>
                <Input
                  placeholder='输入商品名称或点击"从库存选择"'
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
                    数量
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
                    件
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
                    单价
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
                    元
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
                      小计
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
              选择商品
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
              placeholder="搜索食材名称"
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
                {searchText ? '未找到匹配的商品' : '暂无库存商品'}
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
                        <span>当前库存: {product.quantity}</span>
                        <span>最新单价: ¥{product.lastPrice?.toFixed(2) || '0.00'}</span>
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
            💡 选择库存商品会自动填充最新单价
          </div>
        </div>
      </Popup>
    </div>
  );
}

export default CreatePurchaseOrder;
