import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Toast, Dialog, Input, Tag, Space, Grid, NavBar, Tabs } from 'antd-mobile';
import { AddOutline, DeleteOutline, CloseOutline, CheckOutline } from 'antd-mobile-icons';
import { io } from 'socket.io-client';
import { config } from '../../config';
import './MerchantDashboard.css';

const { Item } = Grid;

let socket = null;

const SeatManagement = () => {
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    closed: 0,
    hallStatus: 'open', // 大厅状态
  });
  const [queueLength, setQueueLength] = useState(0);
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hallLoading, setHallLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('seats');

  useEffect(() => {
    // 初始化 Socket.IO 连接
    socket = io(`${config.socketUrl}/seat`, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Merchant socket connected');
      // 请求清理离线用户并获取座位状态
      socket.emit('cleanupOfflineUsers');
    });

    socket.on('merchantSeatStatus', (data) => {
      console.log('Merchant seat status:', data);
      console.log('Seats with occupiedByName:', data.seats?.map(s => ({ 
        seatNumber: s.seatNumber, 
        status: s.status, 
        occupiedByName: s.occupiedByName 
      })));
      setSeats(data.seats || []);
      setStatistics(data.statistics || statistics);
      setQueueLength(data.queueLength || 0);
      setQueueList(data.queueList || []);
    });

    socket.on('merchantSeatUpdate', (data) => {
      console.log('Merchant seat update:', data);
      setSeats(data.seats || []);
      setStatistics(data.statistics || statistics);
      setQueueLength(data.queueLength || 0);
      setQueueList(data.queueList || []);
    });

    socket.on('seatStatus', (stats) => {
      console.log('Seat status updated:', stats);
      setStatistics(stats);
      fetchSeats();
    });

    socket.on('queueStatus', (data) => {
      console.log('Queue status updated:', data);
      setQueueLength(data.queueLength || 0);
    });

    // 监听大厅状态变更
    socket.on('hallStatusChanged', (data) => {
      console.log('Hall status changed:', data);
      Toast.show({
        icon: data.status === 'open' ? 'success' : 'fail',
        content: data.message,
      });
      fetchStatistics();
    });

    // 初始加载座位数据
    fetchSeats();
    fetchStatistics();
    fetchQueueList();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const fetchSeats = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/seats/with-status`);
      if (response.ok) {
        const data = await response.json();
        setSeats(data);
      }
    } catch (error) {
      console.error('获取座位列表失败:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/seats/statistics`);
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  const fetchQueueList = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/seats/queue/list`);
      if (response.ok) {
        const data = await response.json();
        setQueueList(data || []);
      }
    } catch (error) {
      console.error('获取排队列表失败:', error);
    }
  };

  // 关门操作
  const handleCloseHall = async () => {
    const result = await Dialog.confirm({
      content: '确定要关门吗？所有用户将被移出座位，新用户只能排队。',
      confirmText: '确定关门',
      cancelText: '取消',
    });

    if (result) {
      setHallLoading(true);
      try {
        const response = await fetch(`${config.apiUrl}/seats/hall/close`, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          Toast.show({
            icon: 'success',
            content: data.message || '大厅已关闭',
          });
          await fetchSeats();
          await fetchStatistics();
          await fetchQueueList();
          if (socket) {
            socket.emit('getMerchantSeatStatus');
          }
        } else {
          const error = await response.json();
          Toast.show({
            icon: 'fail',
            content: error.message || '关门失败',
          });
        }
      } catch (error) {
        Toast.show({
          icon: 'fail',
          content: '网络错误',
        });
      } finally {
        setHallLoading(false);
      }
    }
  };

  // 开门操作
  const handleOpenHall = async () => {
    const result = await Dialog.confirm({
      content: '确定要开门吗？将按排队顺序为用户分配座位。',
      confirmText: '确定开门',
      cancelText: '取消',
    });

    if (result) {
      setHallLoading(true);
      try {
        const response = await fetch(`${config.apiUrl}/seats/hall/open`, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          Toast.show({
            icon: 'success',
            content: data.message || '大厅已开放',
          });
          await fetchSeats();
          await fetchStatistics();
          await fetchQueueList();
          if (socket) {
            socket.emit('getMerchantSeatStatus');
          }
        } else {
          const error = await response.json();
          Toast.show({
            icon: 'fail',
            content: error.message || '开门失败',
          });
        }
      } catch (error) {
        Toast.show({
          icon: 'fail',
          content: '网络错误',
        });
      } finally {
        setHallLoading(false);
      }
    }
  };

  const handleAddSeat = () => {
    let inputValue = '';

    Dialog.show({
      content: (
        <div style={{ padding: '12px 0' }}>
          <Input
            placeholder="请输入座位号"
            type="number"
            onChange={(val) => {
              inputValue = val;
            }}
            style={{
              '--text-align': 'center',
              '--font-size': '16px',
            }}
          />
        </div>
      ),
      closeOnAction: true,
      actions: [
        {
          key: 'cancel',
          text: '取消',
        },
        {
          key: 'confirm',
          text: '创建',
          primary: true,
          onClick: async () => {
            const seatNumber = parseInt(inputValue);
            if (isNaN(seatNumber) || seatNumber <= 0) {
              Toast.show({
                icon: 'fail',
                content: '请输入有效的座位号',
              });
              return;
            }

            setLoading(true);
            try {
              const response = await fetch(`${config.apiUrl}/seats`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  seatNumber,
                  status: 'available',
                }),
              });

              if (response.ok) {
                Toast.show({
                  icon: 'success',
                  content: '座位创建成功',
                });
                await fetchSeats();
                await fetchStatistics();
                if (socket) {
                  socket.emit('getMerchantSeatStatus');
                }
              } else {
                const error = await response.json();
                Toast.show({
                  icon: 'fail',
                  content: error.message || '创建失败',
                });
              }
            } catch (error) {
              Toast.show({
                icon: 'fail',
                content: '网络错误',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    });
  };

  const handleToggleSeatStatus = async (seat) => {
    const newStatus = seat.status === 'closed' ? 'available' : 'closed';
    const actionText = newStatus === 'closed' ? '关闭' : '开启';

    const result = await Dialog.confirm({
      content: `确定要${actionText}座位 ${seat.seatNumber} 吗？`,
      confirmText: '确定',
      cancelText: '取消',
    });

    if (result) {
      setLoading(true);
      try {
        const response = await fetch(`${config.apiUrl}/seats/${seat._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        });

        if (response.ok) {
          Toast.show({
            icon: 'success',
            content: `座位已${actionText}`,
          });
          await fetchSeats();
          await fetchStatistics();
          if (socket) {
            socket.emit('getMerchantSeatStatus');
          }
        } else {
          Toast.show({
            icon: 'fail',
            content: '操作失败',
          });
        }
      } catch (error) {
        Toast.show({
          icon: 'fail',
          content: '网络错误',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteSeat = async (seat) => {
    const result = await Dialog.confirm({
      content: `确定要删除座位 ${seat.seatNumber} 吗？此操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
    });

    if (result) {
      setLoading(true);
      try {
        const response = await fetch(`${config.apiUrl}/seats/${seat._id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          Toast.show({
            icon: 'success',
            content: '座位已删除',
          });
          await fetchSeats();
          await fetchStatistics();
          if (socket) {
            socket.emit('getMerchantSeatStatus');
          }
        } else {
          Toast.show({
            icon: 'fail',
            content: '删除失败',
          });
        }
      } catch (error) {
        Toast.show({
          icon: 'fail',
          content: '网络错误',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getSeatStatusTag = (status) => {
    switch (status) {
      case 'available':
        return <Tag color="success">空闲</Tag>;
      case 'occupied':
        return <Tag color="primary">用餐中</Tag>;
      case 'closed':
        return <Tag color="default">已关闭</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  return (
    <div className="seat-management">
      <NavBar onBack={() => navigate('/merchant')}>
        座位管理
      </NavBar>

      {/* 统计信息卡片 */}
      <Card title="座位统计" className="statistics-card">
        <Grid columns={4} gap={8}>
          <Item>
            <div className="stat-item">
              <div className="stat-value">{statistics.total}</div>
              <div className="stat-label">总座位</div>
            </div>
          </Item>
          <Item>
            <div className="stat-item stat-available">
              <div className="stat-value">{statistics.available}</div>
              <div className="stat-label">空闲</div>
            </div>
          </Item>
          <Item>
            <div className="stat-item stat-occupied">
              <div className="stat-value">{statistics.occupied}</div>
              <div className="stat-label">用餐中</div>
            </div>
          </Item>
          <Item>
            <div className="stat-item stat-queue">
              <div className="stat-value">{queueLength}</div>
              <div className="stat-label">排队中</div>
            </div>
          </Item>
        </Grid>
      </Card>

      {/* 操作按钮 */}
      <div className="action-bar">
        <Space direction="vertical" block style={{ '--gap': '12px', width: '100%' }}>
          {/* 大厅开关门按钮 */}
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {statistics.hallStatus === 'open' ? (
              <Button
                color="warning"
                size="large"
                onClick={handleCloseHall}
                loading={hallLoading}
                block
                style={{ flex: 1 }}
              >
                <CloseOutline /> 关门
              </Button>
            ) : (
              <Button
                color="success"
                size="large"
                onClick={handleOpenHall}
                loading={hallLoading}
                block
                style={{ flex: 1 }}
              >
                <CheckOutline /> 开门
              </Button>
            )}
            <Button
              color="primary"
              size="large"
              onClick={handleAddSeat}
              loading={loading}
              block
              style={{ flex: 1 }}
            >
              <AddOutline /> 添加座位
            </Button>
          </div>
          
          {/* 大厅状态提示 */}
          <div style={{ 
            padding: '8px 12px', 
            background: statistics.hallStatus === 'open' ? '#f6ffed' : '#fff2e8',
            border: `1px solid ${statistics.hallStatus === 'open' ? '#b7eb8f' : '#ffbb96'}`,
            borderRadius: '8px',
            fontSize: '14px',
            color: statistics.hallStatus === 'open' ? '#52c41a' : '#fa8c16',
            textAlign: 'center'
          }}>
            当前状态：{statistics.hallStatus === 'open' ? '🟢 营业中' : '🔴 已打烊'}
          </div>
        </Space>
      </div>

      {/* Tab标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{
          '--title-font-size': '15px',
          '--content-padding': '12px',
        }}
      >
        <Tabs.Tab title="座位列表" key="seats">
          {/* 座位列表 */}
          <div className="seats-list">
            {seats.length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  暂无座位，点击上方按钮添加座位
                </div>
              </Card>
            ) : (
              seats.map((seat) => (
                <Card key={seat._id} className="seat-card">
                  <div className="seat-header">
                    <div className="seat-number">座位 {seat.seatNumber}</div>
                    <div className="seat-status">{getSeatStatusTag(seat.status)}</div>
                  </div>
                  
                  {seat.status === 'occupied' && seat.occupiedByName && seat.occupiedByName !== '游客' && (
                    <div className="seat-info">
                      <span className="info-label">用户:</span>
                      <span className="info-value">{seat.occupiedByName}</span>
                    </div>
                  )}
                  
                  {seat.status === 'occupied' && seat.occupiedAt && (
                    <div className="seat-info">
                      <span className="info-label">用餐时间:</span>
                      <span className="info-value">
                        {new Date(seat.occupiedAt).toLocaleTimeString('zh-CN')}
                      </span>
                    </div>
                  )}

                  <div className="seat-actions">
                    <Space>
                      {seat.status !== 'occupied' && (
                        <Button
                          size="small"
                          color={seat.status === 'closed' ? 'success' : 'default'}
                          onClick={() => handleToggleSeatStatus(seat)}
                          disabled={loading}
                        >
                          {seat.status === 'closed' ? (
                            <>
                              <CheckOutline /> 开启
                            </>
                          ) : (
                            <>
                              <CloseOutline /> 关闭
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="small"
                        color="danger"
                        onClick={() => handleDeleteSeat(seat)}
                        disabled={loading || seat.status === 'occupied'}
                      >
                        <DeleteOutline /> 删除
                      </Button>
                    </Space>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Tabs.Tab>

        <Tabs.Tab title={`排队列表 (${queueLength})`} key="queue">
          {/* 排队用户列表 */}
          {queueList.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无排队用户
              </div>
            </Card>
          ) : (
            <div className="queue-list">
              {queueList.map((user, index) => (
                <Card key={user.socketId} className="queue-card">
                  <div className="queue-item">
                    <div className="queue-position">
                      <Tag color="primary" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        第{index + 1}位
                      </Tag>
                    </div>
                    <div className="queue-info">
                      <div className="queue-nickname">
                        {user.nickname || '游客'}
                      </div>
                      <div className="queue-time">
                        {new Date(user.queuedAt).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {user.partySize > 1 && (
                      <Tag color="default">{user.partySize}人</Tag>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Tabs.Tab>
      </Tabs>
    </div>
  );
};

export default SeatManagement;
