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
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import './RevenueStats.css';

const RevenueStats = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
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
        Toast.show({ content: todayRes.message || t('loadDailyDataFailed', language), icon: 'fail' });
      }

      if (monthRes.code === 0) {
        setMonthStats(monthRes.data);
      } else {
        Toast.show({ content: monthRes.message || t('loadMonthlyDataFailed', language), icon: 'fail' });
      }

      if (totalRes.code === 0) {
        setTotalStats(totalRes.data);
      } else {
        Toast.show({ content: totalRes.message || t('loadTotalDataFailed', language), icon: 'fail' });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      Toast.show({ content: t('loadTotalDataFailed', language), icon: 'fail' });
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
        
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">{t('operatingIncome', language)}</span>
            <span className="stat-value revenue">¥{stats.revenue.toFixed(2)}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">{t('totalCost', language)}</span>
            <span className="stat-value cost">¥{stats.cost.toFixed(2)}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">{t('grossProfit', language)}</span>
            <span className="stat-value profit">¥{stats.grossProfit.toFixed(2)}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">{t('grossMargin', language)}</span>
            <span className="stat-value rate">{stats.grossMarginRate.toFixed(2)}%</span>
          </div>
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div className="stat-item highlighted">
          <span className="stat-label">{t('netProfit', language)}</span>
          <span className="stat-value net-profit">¥{stats.netProfit.toFixed(2)}</span>
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div className="extra-info">
          <div className="stat-item-small">
            <span>{t('extraIncome', language)}</span>
            <span className="income">+¥{stats.extraIncome.toFixed(2)}</span>
          </div>
          <div className="stat-item-small">
            <span>{t('extraExpense', language)}</span>
            <span className="expense">-¥{stats.extraExpense.toFixed(2)}</span>
          </div>
          <div className="stat-item-small">
            <span>{t('orderCount', language)}</span>
            <span>{stats.orderCount}</span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="revenue-stats-container">
      <NavBar onBack={() => navigate('/merchant')}>{t('revenueStats', language)}</NavBar>

      <div className="content">
        {/* 操作按钮 */}
        <div className="action-bar">
          <Button
            color="primary"
            size="small"
            onClick={() => navigate('/revenue/transactions')}
          >
            <AddOutline /> {t('manageExtraRevenue', language)}
          </Button>
          <Button
            size="small"
            onClick={loadStats}
          >
            {t('refreshData', language)}
          </Button>
        </div>

        {/* 当日统计 */}
        <div className="section">
          <div className="section-header">
            <h2>{t('dailyData', language)}</h2>
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
                  <ClockCircleOutline /> {t('selectDate', language)}
                </Button>
              )}
            </DatePicker>
          </div>
          {renderStatCard(t('dailyIncomeStats', language), todayStats, todayStats?.date)}
        </div>

        {/* 月度统计 */}
        <div className="section">
          <div className="section-header">
            <h2>{t('monthlyData', language)}</h2>
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
                  <ClockCircleOutline /> {t('selectMonth', language)}
                </Button>
              )}
            </DatePicker>
          </div>
          {renderStatCard(t('monthlyIncomeStats', language), monthStats, monthStats?.month)}
        </div>

        {/* 总体统计 */}
        <div className="section">
          <div className="section-header">
            <h2>{t('overallData', language)}</h2>
          </div>
          {renderStatCard(t('overallIncomeStats', language), totalStats, t('systemRuntime', language))}
        </div>
      </div>
    </div>
  );
};

export default RevenueStats;
