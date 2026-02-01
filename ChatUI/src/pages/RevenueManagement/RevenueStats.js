import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  Card,
  Grid,
  DatePicker,
  Button,
  Toast,
  DotLoading,
  Space,
  Divider,
} from 'antd-mobile';
import { AddOutline, ClockCircleOutline } from 'antd-mobile-icons';
import { revenueApi } from '../../api/revenueApi';
import './RevenueStats.css';

const RevenueStats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [totalStats, setTotalStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // 加载统计数据
  const loadStats = async () => {
    setLoading(true);
    try {
      // 并发请求三个维度的数据
      const [todayRes, monthRes, totalRes] = await Promise.all([
        revenueApi.getTodayStats(formatDate(selectedDate)),
        revenueApi.getMonthStats(formatMonth(selectedMonth)),
        revenueApi.getTotalStats(),
      ]);

      if (todayRes.code === 0) {
        setTodayStats(todayRes.data);
      } else {
        Toast.show({ content: todayRes.message || '查询当日数据失败', icon: 'fail' });
      }

      if (monthRes.code === 0) {
        setMonthStats(monthRes.data);
      } else {
        Toast.show({ content: monthRes.message || '查询月度数据失败', icon: 'fail' });
      }

      if (totalRes.code === 0) {
        setTotalStats(totalRes.data);
      } else {
        Toast.show({ content: totalRes.message || '查询总体数据失败', icon: 'fail' });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      Toast.show({ content: '加载数据失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // 格式化日期为 YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 格式化月份为 YYYY-MM
  const formatMonth = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // 渲染金额卡片
  const renderStatCard = (title, stats, dateInfo) => {
    if (!stats) {
      return (
        <Card className="stat-card">
          <div className="card-header">
            <h3>{title}</h3>
            {dateInfo && <span className="date-info">{dateInfo}</span>}
          </div>
          <DotLoading />
        </Card>
      );
    }

    return (
      <Card className="stat-card">
        <div className="card-header">
          <h3>{title}</h3>
          {dateInfo && <span className="date-info">{dateInfo}</span>}
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div className="stat-item">
          <span className="stat-label">营业收入</span>
          <span className="stat-value revenue">¥{stats.revenue.toFixed(2)}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">总成本</span>
          <span className="stat-value cost">¥{stats.cost.toFixed(2)}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">毛利润</span>
          <span className="stat-value profit">¥{stats.grossProfit.toFixed(2)}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">毛利率</span>
          <span className="stat-value rate">{stats.grossMarginRate.toFixed(2)}%</span>
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div className="stat-item highlighted">
          <span className="stat-label">净利润</span>
          <span className="stat-value net-profit">¥{stats.netProfit.toFixed(2)}</span>
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div className="extra-info">
          <div className="stat-item-small">
            <span>额外收入</span>
            <span className="income">+¥{stats.extraIncome.toFixed(2)}</span>
          </div>
          <div className="stat-item-small">
            <span>额外支出</span>
            <span className="expense">-¥{stats.extraExpense.toFixed(2)}</span>
          </div>
          <div className="stat-item-small">
            <span>订单数量</span>
            <span>{stats.orderCount}</span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="revenue-stats-container">
      <NavBar onBack={() => navigate('/merchant')}>收入统计</NavBar>

      <div className="content">
        {/* 操作按钮 */}
        <div className="action-bar">
          <Button
            color="primary"
            size="small"
            onClick={() => navigate('/revenue/transactions')}
          >
            <AddOutline /> 管理额外收支
          </Button>
          <Button
            size="small"
            onClick={loadStats}
          >
            刷新数据
          </Button>
        </div>

        {/* 当日统计 */}
        <div className="section">
          <div className="section-header">
            <h2>当日数据</h2>
            <DatePicker
              value={selectedDate}
              max={new Date()}
              onConfirm={(val) => {
                setSelectedDate(val);
                revenueApi.getTodayStats(formatDate(val)).then((res) => {
                  if (res.code === 0) {
                    setTodayStats(res.data);
                  }
                });
              }}
            >
              {(value, { open }) => (
                <Button size="mini" fill="none" onClick={open}>
                  <ClockCircleOutline /> 选择日期
                </Button>
              )}
            </DatePicker>
          </div>
          {renderStatCard('当日收入统计', todayStats, todayStats?.date)}
        </div>

        {/* 月度统计 */}
        <div className="section">
          <div className="section-header">
            <h2>月度数据</h2>
            <DatePicker
              value={selectedMonth}
              max={new Date()}
              precision="month"
              onConfirm={(val) => {
                setSelectedMonth(val);
                revenueApi.getMonthStats(formatMonth(val)).then((res) => {
                  if (res.code === 0) {
                    setMonthStats(res.data);
                  }
                });
              }}
            >
              {(value, { open }) => (
                <Button size="mini" fill="none" onClick={open}>
                  <ClockCircleOutline /> 选择月份
                </Button>
              )}
            </DatePicker>
          </div>
          {renderStatCard('月度收入统计', monthStats, monthStats?.month)}
        </div>

        {/* 总体统计 */}
        <div className="section">
          <div className="section-header">
            <h2>总体数据</h2>
          </div>
          {renderStatCard('总体收入统计', totalStats, '系统运行至今')}
        </div>
      </div>
    </div>
  );
};

export default RevenueStats;
