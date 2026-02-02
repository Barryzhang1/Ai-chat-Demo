import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, List, Empty, Tag, InfiniteScroll, DotLoading, ErrorBlock } from 'antd-mobile';
import inventoryApi from '../../api/inventory/inventoryApi';
import './MerchantDashboard.css';

function IngredientConsumeHistory() {
  const navigate = useNavigate();
  const { id } = useParams(); // 食材ID
  const [consumeRecords, setConsumeRecords] = useState([]);
  const [ingredientInfo, setIngredientInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const pageSize = 20;

  // 获取食材基本信息
  const fetchIngredientInfo = async () => {
    try {
      const response = await inventoryApi.getInventoryDetail(id);
      if (response && response.code === 0 && response.data) {
        setIngredientInfo(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch ingredient info:', error);
    }
  };

  // 获取消耗记录
  const fetchConsumeHistory = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await inventoryApi.getConsumeHistory(id, page, pageSize);
      
      if (response && response.code === 0 && response.data) {
        const { list, total } = response.data;
        
        if (page === 1) {
          setConsumeRecords(list);
        } else {
          setConsumeRecords([...consumeRecords, ...list]);
        }
        
        // 判断是否还有更多数据
        setHasMore(consumeRecords.length + list.length < total);
      } else {
        throw new Error(response?.message || '加载失败');
      }
    } catch (error) {
      console.error('Failed to fetch consume history:', error);
      setError(error.message || '加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredientInfo();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchConsumeHistory();
    }
  }, [page]);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    setPage(page + 1);
  };

  // 格式化时间
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  };

  // 渲染变更类型标签
  const renderChangeTypeTag = (changeType) => {
    const typeMap = {
      order_consume: { text: '订单消耗', color: 'danger' },
      purchase: { text: '进货入库', color: 'success' },
      loss: { text: '损耗出库', color: 'warning' },
      manual_adjust: { text: '手动调整', color: 'default' },
    };
    
    const config = typeMap[changeType] || { text: '未知', color: 'default' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div className="consume-history-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar onBack={() => navigate(-1)}>
        {ingredientInfo ? `${ingredientInfo.productName} - 消耗记录` : '消耗记录'}
      </NavBar>

      {ingredientInfo && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            当前库存: <span style={{ fontSize: '20px', color: '#1677ff', fontWeight: 'bold' }}>{ingredientInfo.quantity}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            最近单价: ¥{ingredientInfo.lastPrice?.toFixed(2) || '0.00'}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {error ? (
          <ErrorBlock
            status="default"
            title="加载失败"
            description={error}
          />
        ) : consumeRecords.length === 0 && !loading ? (
          <Empty description="暂无消耗记录" />
        ) : (
          <>
            <List>
              {consumeRecords.map((record, index) => (
                <List.Item
                  key={`${record._id}-${index}`}
                  description={
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ marginTop: '4px', color: '#999' }}>
                        {formatDate(record.createdAt)}
                      </div>
                      {record.reason && (
                        <div style={{ marginTop: '4px', color: '#666' }}>
                          {record.reason}
                        </div>
                      )}
                      {record.relatedOrderNo && (
                        <div style={{ marginTop: '4px' }}>
                          <Tag color="primary" fill="outline" style={{ fontSize: '11px' }}>
                            订单: {record.relatedOrderNo}
                          </Tag>
                        </div>
                      )}
                    </div>
                  }
                  extra={
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold',
                        color: record.changeQuantity < 0 ? '#ff3b30' : '#34c759'
                      }}>
                        {record.changeQuantity > 0 ? '+' : ''}{record.changeQuantity}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {record.quantityBefore} → {record.quantityAfter}
                      </div>
                    </div>
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {renderChangeTypeTag(record.changeType)}
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {record.productName}
                    </span>
                  </div>
                </List.Item>
              ))}
            </List>

            <InfiniteScroll loadMore={loadMore} hasMore={hasMore}>
              {hasMore ? (
                <div style={{ textAlign: 'center', padding: '12px', color: '#999' }}>
                  <DotLoading />
                  <span style={{ marginLeft: '8px' }}>加载中...</span>
                </div>
              ) : consumeRecords.length > 0 ? (
                <div style={{ textAlign: 'center', padding: '12px', color: '#999' }}>
                  没有更多了
                </div>
              ) : null}
            </InfiniteScroll>
          </>
        )}
      </div>
    </div>
  );
}

export default IngredientConsumeHistory;
