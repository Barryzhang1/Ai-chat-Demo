import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List, Tabs, Toast, Empty, Card, PullToRefresh, Tag } from 'antd-mobile';
import { StarFill, FireFill } from 'antd-mobile-icons';
import { gameScoreApi } from '../../api/gameScoreApi';
import './MerchantDashboard.css';

function GameRankings() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePeriod, setActivePeriod] = useState('all');
  const navigate = useNavigate();

  // 获取排行榜数据
  const fetchLeaderboard = async (period = 'all') => {
    setLoading(true);
    try {
      const response = await gameScoreApi.getLeaderboard({
        gameType: 'FlappyBird',
        period,
        page: 1,
        limit: 100,
      });

      if (response.code === 200 && response.data) {
        setLeaderboard(response.data.list || []);
      } else {
        Toast.show({
          icon: 'fail',
          content: '获取排行榜失败',
        });
      }
    } catch (error) {
      console.error('获取排行榜失败:', error);
      Toast.show({
        icon: 'fail',
        content: '获取排行榜失败，请检查网络连接',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await gameScoreApi.getGameStats('FlappyBird');
      if (response.code === 200 && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activePeriod);
    fetchStats();
  }, [activePeriod]);

  // 下拉刷新
  const onRefresh = async () => {
    await Promise.all([
      fetchLeaderboard(activePeriod),
      fetchStats(),
    ]);
  };

  // 获取排名徽章颜色
  const getRankBadgeClass = (rank) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-normal';
  };

  // 获取排名图标
  const getRankIcon = (rank) => {
    if (rank <= 3) {
      return <StarFill fontSize={20} />;
    }
    return null;
  };

  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="game-rankings">
      <NavBar onBack={() => navigate('/merchant')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FireFill fontSize={20} color="var(--adm-color-primary)" />
          <span>游戏排行榜</span>
        </div>
      </NavBar>

      <PullToRefresh onRefresh={onRefresh}>
        <div className="rankings-content" style={{ padding: '16px' }}>
          {/* 统计卡片 */}
          {stats && (
            <Card
              title="游戏统计"
              style={{ marginBottom: '16px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--adm-color-primary)' }}>
                    {stats.totalPlays}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    总游戏次数
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {stats.uniquePlayers}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    参与玩家
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {stats.highestScore}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    最高分
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                    {stats.averageScore}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    平均分
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 时间范围切换 */}
          <Tabs
            activeKey={activePeriod}
            onChange={setActivePeriod}
            style={{ marginBottom: '16px' }}
          >
            <Tabs.Tab title="总榜" key="all" />
            <Tabs.Tab title="日榜" key="today" />
            <Tabs.Tab title="周榜" key="week" />
            <Tabs.Tab title="月榜" key="month" />
          </Tabs>

          {/* 排行榜列表 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              加载中...
            </div>
          ) : leaderboard.length === 0 ? (
            <Empty
              description="暂无排行数据"
              style={{ padding: '40px 0' }}
            />
          ) : (
            <List mode="card">
              {leaderboard.map((item) => (
                <List.Item
                  key={item._id}
                  prefix={
                    <div 
                      className={`rank-badge ${getRankBadgeClass(item.rank)}`}
                      style={{
                        minWidth: '36px',
                        height: '36px',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '16px',
                      }}
                    >
                      {getRankIcon(item.rank) || item.rank}
                    </div>
                  }
                  description={
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      {formatTime(item.createdAt)}
                      {item.playTime && (
                        <span style={{ marginLeft: '8px' }}>
                          时长: {item.playTime}秒
                        </span>
                      )}
                    </div>
                  }
                  extra={
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: item.rank <= 3 ? 'var(--adm-color-primary)' : '#333' 
                      }}>
                        {item.score}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>分</div>
                    </div>
                  }
                >
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>
                    {item.playerName}
                  </div>
                </List.Item>
              ))}
            </List>
          )}
        </div>
      </PullToRefresh>

      <style>
        {`
          .rank-badge.rank-gold {
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
            color: #fff;
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
          }
          
          .rank-badge.rank-silver {
            background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
            color: #fff;
            box-shadow: 0 2px 8px rgba(192, 192, 192, 0.4);
          }
          
          .rank-badge.rank-bronze {
            background: linear-gradient(135deg, #cd7f32 0%, #e89653 100%);
            color: #fff;
            box-shadow: 0 2px 8px rgba(205, 127, 50, 0.4);
          }
          
          .rank-badge.rank-normal {
            background: #f5f5f5;
            color: #666;
          }
          
          .game-rankings .adm-card-header-title {
            font-weight: 600;
            font-size: 16px;
          }
        `}
      </style>
    </div>
  );
}

export default GameRankings;
