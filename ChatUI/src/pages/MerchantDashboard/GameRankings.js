import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List } from 'antd-mobile';

function GameRankings() {
  const [gameRankings, setGameRankings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const rankingsData = JSON.parse(localStorage.getItem('gameRankings') || JSON.stringify([
      { rank: 1, userName: '张三', score: 1500 },
      { rank: 2, userName: '李四', score: 1200 },
      { rank: 3, userName: '王五', score: 1000 },
      { rank: 4, userName: '赵六', score: 800 },
      { rank: 5, userName: '钱七', score: 600 },
    ]));
    setGameRankings(rankingsData);
  }, []);

  return (
    <div>
      <NavBar onBack={() => navigate('/merchant')}>游戏排行榜</NavBar>
      <div className="tab-content">
        <List>
          {gameRankings.map(item => (
            <List.Item
              key={item.rank}
              prefix={
                <div className={`rank-badge rank-${item.rank}`}>
                  {item.rank}
                </div>
              }
              extra={
                <div className="score">{item.score}分</div>
              }
            >
              {item.userName}
            </List.Item>
          ))}
        </List>
      </div>
    </div>
  );
}

export default GameRankings;
