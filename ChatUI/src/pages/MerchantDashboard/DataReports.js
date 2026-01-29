import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Toast, SpinLoading, Empty, ErrorBlock } from 'antd-mobile';
import { orderApi } from '../../api/orderApi';
import './MerchantDashboard.css';

function DataReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [dishRanking, setDishRanking] = useState([]);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行请求今日收入和菜品排行
      const [revenueResponse, rankingResponse] = await Promise.all([
        orderApi.getTodayRevenue(),
        orderApi.getDishRanking(10)
      ]);

      if (revenueResponse.code === 0) {
        setRevenueData(revenueResponse.data);
      }

      if (rankingResponse.code === 0) {
        setDishRanking(rankingResponse.data);
      }
    } catch (err) {
      console.error('加载报表数据失败:', err);
      setError(err.message || '加载数据失败，请稍后重试');
      Toast.show({
        icon: 'fail',
        content: '加载数据失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `¥${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="merchant-dashboard">
        <NavBar onBack={() => navigate('/merchant')}>数据报表</NavBar>
        <div className="loading-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '60vh',
          flexDirection: 'column'
        }}>
          <SpinLoading style={{ fontSize: 48 }} />
          <div style={{ marginTop: 16, color: '#999' }}>加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="merchant-dashboard">
        <NavBar onBack={() => navigate('/merchant')}>数据报表</NavBar>
        <div style={{ padding: 16 }}>
          <ErrorBlock
            status="default"
            title="加载失败"
            description={error}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="merchant-dashboard">
      <NavBar onBack={() => navigate('/merchant')}>数据报表</NavBar>
      
      <div className="tab-content" style={{ padding: 16 }}>
        {/* 今日营收卡片 */}
        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>今日营收</span>
              <span style={{ fontSize: 12, color: '#999', fontWeight: 'normal' }}>
                {revenueData?.date}
              </span>
            </div>
          } 
          className="revenue-card"
          style={{ marginBottom: 16 }}
        >
          <div style={{ padding: '16px 0' }}>
            <div className="revenue-amount" style={{ 
              fontSize: 36, 
              fontWeight: 'bold', 
              color: '#1677ff',
              marginBottom: 12
            }}>
              {revenueData ? formatCurrency(revenueData.totalRevenue) : '¥0.00'}
            </div>
            <div style={{ fontSize: 14, color: '#999' }}>
              订单数量：{revenueData?.orderCount || 0} 单
            </div>
          </div>
        </Card>

        {/* 菜品排行榜 */}
        <Card 
          title="菜品销量排行榜 TOP 10" 
          className="chart-card"
        >
          {dishRanking.length === 0 ? (
            <Empty
              description="暂无数据"
              style={{ padding: '32px 0' }}
            />
          ) : (
            <div className="bar-chart" style={{ padding: '8px 0' }}>
              {dishRanking.map((item, index) => (
                <div 
                  key={item.dishId} 
                  className="bar-item"
                  style={{ 
                    marginBottom: 16,
                    padding: '8px 0',
                    borderBottom: index < dishRanking.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <span style={{ 
                        display: 'inline-block',
                        width: 24,
                        height: 24,
                        lineHeight: '24px',
                        textAlign: 'center',
                        borderRadius: '50%',
                        marginRight: 8,
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: '#fff',
                        backgroundColor: index < 3 ? ['#ff4d4f', '#ff7a45', '#ffa940'][index] : '#d9d9d9'
                      }}>
                        {index + 1}
                      </span>
                      <span className="bar-label" style={{ 
                        fontSize: 14,
                        fontWeight: 500,
                        flex: 1
                      }}>
                        {item.dishName}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: '#999',
                      marginLeft: 8
                    }}>
                      {formatCurrency(item.totalRevenue)}
                    </div>
                  </div>
                  
                  <div className="bar-container" style={{ 
                    position: 'relative',
                    height: 24,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div 
                      className="bar-fill" 
                      style={{ 
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${(item.totalQuantity / (dishRanking[0]?.totalQuantity || 1)) * 100}%`,
                        backgroundColor: '#1677ff',
                        transition: 'width 0.3s ease',
                        borderRadius: 4
                      }}
                    />
                    <span className="bar-value" style={{ 
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 12,
                      color: '#333',
                      fontWeight: 500,
                      zIndex: 1
                    }}>
                      {item.totalQuantity}份
                    </span>
                  </div>
                  
                  <div style={{ 
                    fontSize: 12, 
                    color: '#999',
                    marginTop: 4
                  }}>
                    出现在 {item.orderCount} 个订单中
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default DataReports;
