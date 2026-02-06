import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Toast, Dialog, Input, Tag, Space, Grid, NavBar, Tabs } from 'antd-mobile';
import { AddOutline, DeleteOutline, CloseOutline, CheckOutline } from 'antd-mobile-icons';
import { io } from 'socket.io-client';
import { config } from '../../config';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
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
  const { language } = useLanguage();

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
      content: t('confirmCloseHall', language),
      confirmText: t('confirmCloseBtn', language),
      cancelText: t('cancel', language),
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
            content: data.message || t('hallClosedMsg', language),
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
            content: error.message || t('closeFailed', language),
          });
        }
      } catch (error) {
        Toast.show({
          icon: 'fail',
          content: t('networkError', language),
        });
      } finally {
        setHallLoading(false);
      }
    }
  };

  // 开门操作
  const handleOpenHall = async () => {
    const result = await Dialog.confirm({
      content: t('confirmOpenHall', language),
      confirmText: t('confirmOpenBtn', language),
      cancelText: t('cancel', language),
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
            content: data.message || t('hallOpenedMsg', language),
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
            content: error.message || t('openFailed', language),
          });
        }
      } catch (error) {
        Toast.show({
          icon: 'fail',
          content: t('networkError', language),
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
            placeholder={t('enterSeatNumber', language)}
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
          text: t('cancel', language),
        },
        {
          key: 'confirm',
          text: t('create', language),
          primary: true,
          onClick: async () => {
            const seatNumber = parseInt(inputValue);
            if (isNaN(seatNumber) || seatNumber <= 0) {
              Toast.show({
                icon: 'fail',
                content: t('enterValidSeatNumber', language),
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
                  content: t('seatCreated', language),
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
                  content: error.message || t('createFailed', language),
                });
              }
            } catch (error) {
              Toast.show({
                icon: 'fail',
                content: t('networkError', language),
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
    const actionText = newStatus === 'closed' ? t('closeSeat', language) : t('openSeat', language);

    const result = await Dialog.confirm({
      content: t('confirmAction', language, { action: actionText, seatNumber: seat.seatNumber }),
      confirmText: t('confirm', language),
      cancelText: t('cancel', language),
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
            content: t('seatOpSuccess', language),
          });
          await fetchSeats();
          await fetchStatistics();
          if (socket) {
            socket.emit('getMerchantSeatStatus');
          }
        } else {
          Toast.show({
            icon: 'fail',
            content: t('seatOpFailed', language),
          });
        }
      } catch (error) {
        Toast.show({
          icon: 'fail',
          content: t('networkError', language),
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteSeat = async (seat) => {
    const result = await Dialog.confirm({
      content: t('confirmDeleteSeat', language, { seatNumber: seat.seatNumber }),
      confirmText: t('delete', language),
      cancelText: t('cancel', language),
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
            content: t('seatDeleted', language),
          });
          await fetchSeats();
          await fetchStatistics();
          if (socket) {
            socket.emit('getMerchantSeatStatus');
          }
        } else {
          Toast.show({
            icon: 'fail',
            content: t('deleteFailed', language),
          });
        }
      } catch (error) {
        Toast.show({
          icon: 'fail',
          content: t('networkError', language),
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getSeatStatusTag = (status) => {
    switch (status) {
      case 'available':
        return <Tag color="success">{t('seatAvailable', language)}</Tag>;
      case 'occupied':
        return <Tag color="primary">{t('seatOccupied', language)}</Tag>;
      case 'closed':
        return <Tag color="default">{t('seatClosed', language)}</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  return (
    <div className="seat-management">
      <NavBar onBack={() => navigate('/merchant')}>
        {t('seatManagement', language)}
      </NavBar>

      {/* 统计信息卡片 */}
      <Card title={t('seatStats', language)} className="statistics-card">
        <Grid columns={4} gap={8}>
          <Item>
            <div className="stat-item">
              <div className="stat-value">{statistics.total}</div>
              <div className="stat-label">{t('totalSeats', language) || t('seatList', language)}</div>
            </div>
          </Item>
          <Item>
            <div className="stat-item stat-available">
              <div className="stat-value">{statistics.available}</div>
              <div className="stat-label">{t('seatAvailable', language)}</div>
            </div>
          </Item>
          <Item>
            <div className="stat-item stat-occupied">
              <div className="stat-value">{statistics.occupied}</div>
              <div className="stat-label">{t('seatOccupied', language)}</div>
            </div>
          </Item>
          <Item>
            <div className="stat-item stat-queue">
              <div className="stat-value">{queueLength}</div>
              <div className="stat-label">{t('queuing', language)}</div>
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
                <CloseOutline /> {t('closeHall', language)}
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
                <CheckOutline /> {t('openHall', language)}
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
              <AddOutline /> {t('addSeat', language) || t('create', language)}
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
            {t('currentStatus', language)}
            {statistics.hallStatus === 'open' ? '🟢 ' + t('hallOpen', language) : '🔴 ' + t('hallClosedStatus', language)}
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
        <Tabs.Tab title={t('seatList', language)} key="seats">
          {/* 座位列表 */}
          <div className="seats-list">
            {seats.length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  {t('noSeats', language)}
                </div>
              </Card>
            ) : (
              seats.map((seat) => (
                <Card key={seat._id} className="seat-card">
                  <div className="seat-header">
                    <div className="seat-number">{t('seatNumber', language)} {seat.seatNumber}</div>
                    <div className="seat-status">{getSeatStatusTag(seat.status)}</div>
                  </div>
                  
                  {seat.status === 'occupied' && seat.occupiedByName && seat.occupiedByName !== '游客' && (
                    <div className="seat-info">
                      <span className="info-label">{t('user', language)}:</span>
                      <span className="info-value">{seat.occupiedByName}</span>
                    </div>
                  )}
                  
                  {seat.status === 'occupied' && seat.occupiedAt && (
                    <div className="seat-info">
                      <span className="info-label">{t('occupiedAt', language)}:</span>
                      <span className="info-value">
                        {new Date(seat.occupiedAt).toLocaleTimeString(language === 'en' ? 'en-US' : 'zh-CN')}
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
                              <CheckOutline /> {t('openSeat', language)}
                            </>
                          ) : (
                            <>
                              <CloseOutline /> {t('closeSeat', language)}
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
                        <DeleteOutline /> {t('delete', language)}
                      </Button>
                    </Space>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Tabs.Tab>

        <Tabs.Tab title={`${t('queueList', language)} (${queueLength})`} key="queue">
          {/* 排队用户列表 */}
          {queueList.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                {t('noQueue', language)}
              </div>
            </Card>
          ) : (
            <div className="queue-list">
              {queueList.map((user, index) => (
                <Card key={user.socketId} className="queue-card">
                  <div className="queue-item">
                    <div className="queue-position">
                      <Tag color="primary" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {t('queuePosition', language, { n: index + 1 })}
                      </Tag>
                    </div>
                    <div className="queue-info">
                      <div className="queue-nickname">
                        {user.nickname || t('unknownUser', language)}
                      </div>
                      <div className="queue-time">
                        {new Date(user.queuedAt).toLocaleString(language === 'en' ? 'en-US' : 'zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {user.partySize > 1 && (
                      <Tag color="default">{t('partySizeLabel', language, { n: user.partySize })}</Tag>
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
