import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  List,
  Tag,
  Button,
  Toast,
  Empty,
  Dialog,
  DotLoading,
  Card,
  Space,
  DatePicker,
  SearchBar,
  FloatingBubble,
  Dropdown,
  Radio,
} from 'antd-mobile';
import { AddOutline, DeleteOutline } from 'antd-mobile-icons';
import { revenueApi } from '../../api/revenueApi';
import './TransactionList.css';

const TransactionList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const dropdownRef = useRef(null);
  
  // 筛选条件
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    keyword: '',
  });
  const [dateRangeType, setDateRangeType] = useState('all');

  // 加载列表数据
  const loadTransactions = async (currentPage = 1, currentFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        ...currentFilters,
        page: currentPage,
        pageSize,
      };

      // 移除空值
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const res = await revenueApi.queryTransactions(params);
      
      if (res.code === 0) {
        setTransactions(res.data.list);
        setSummary(res.data.summary);
        setTotal(res.data.total);
        setPage(currentPage);
      } else {
        Toast.show({ content: res.message || '查询失败', icon: 'fail' });
      }
    } catch (error) {
      console.error('加载额外收支列表失败:', error);
      Toast.show({ content: '加载数据失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // 快速日期选择
  const handleDateQuickSelect = (type) => {
    setDateRangeType(type);
    
    if (type === 'custom') return;

    const now = new Date();
    let start = '';
    let end = '';

    if (type === 'today') {
      start = formatDate(now);
      end = formatDate(now);
    } else if (type === 'week') {
      // 近7天（包含今天）
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 6);
      start = formatDate(oneWeekAgo);
      end = formatDate(now);
    } else if (type === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      start = formatDate(firstDay);
      end = formatDate(now);
    }

    const newFilters = { ...filters, startDate: start, endDate: end };
    setFilters(newFilters);
    loadTransactions(1, newFilters);
    dropdownRef.current?.close();
  };

  // 类型选择
  const handleTypeSelect = (type) => {
    const newFilters = { ...filters, type };
    setFilters(newFilters);
    loadTransactions(1, newFilters);
    dropdownRef.current?.close();
  };

  // 删除记录
  const handleDelete = async (item) => {
    const result = await Dialog.confirm({
      content: `确定要删除这条${item.type === 'income' ? '收入' : '支出'}记录吗？`,
      confirmText: '删除',
      cancelText: '取消',
    });

    if (result) {
      try {
        const res = await revenueApi.deleteTransaction(item._id);
        if (res.code === 0) {
          Toast.show({ content: '删除成功', icon: 'success' });
          loadTransactions(page);
        } else {
          Toast.show({ content: res.message || '删除失败', icon: 'fail' });
        }
      } catch (error) {
        console.error('删除记录失败:', error);
        Toast.show({ content: '删除失败', icon: 'fail' });
      }
    }
  };

  // 确认自定义日期
  const confirmCustomDate = () => {
    loadTransactions(1, filters);
    dropdownRef.current?.close();
  };

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 格式化时间
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="transaction-list-container">
      <NavBar
        onBack={() => navigate('/revenue')}
      >
        额外收支管理
      </NavBar>

      <Dropdown ref={dropdownRef}>
        <Dropdown.Item key='type' title={filters.type === '' ? '类型' : (filters.type === 'income' ? '收入' : '支出')}>
          <div style={{ padding: 12 }}>
            <Radio.Group value={filters.type} onChange={handleTypeSelect}>
              <Space direction='vertical' block>
                <Radio value=''>全部类型</Radio>
                <Radio value='income'>收入</Radio>
                <Radio value='expense'>支出</Radio>
              </Space>
            </Radio.Group>
          </div>
        </Dropdown.Item>
        <Dropdown.Item key='date' title={
          dateRangeType === 'all' ? '日期' : 
          (dateRangeType === 'custom' ? '自定义' : 
          (dateRangeType === 'today' ? '今天' : 
          (dateRangeType === 'week' ? '近7天' : '本月')))
        }>
          <div style={{ padding: 12 }}>
            <Radio.Group value={dateRangeType} onChange={handleDateQuickSelect}>
              <Space direction='vertical' block>
                <Radio value='all'>全部日期</Radio>
                <Radio value='today'>今天</Radio>
                <Radio value='week'>近7天</Radio>
                <Radio value='month'>本月</Radio>
                <Radio value='custom'>自定义范围</Radio>
              </Space>
            </Radio.Group>
            
            {dateRangeType === 'custom' && (
              <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
                <Space direction='vertical' block>
                  <div className="filter-item">
                    <span className="filter-label">开始日期</span>
                    <DatePicker
                      value={filters.startDate ? new Date(filters.startDate) : null}
                      max={new Date()}
                      onConfirm={(val) => {
                        setFilters({ ...filters, startDate: formatDate(val) });
                      }}
                    >
                      {(value, { open }) => (
                        <Button size="small" onClick={open} block>
                          {filters.startDate || '选择开始日期'}
                        </Button>
                      )}
                    </DatePicker>
                  </div>
                  <div className="filter-item">
                    <span className="filter-label">结束日期</span>
                    <DatePicker
                      value={filters.endDate ? new Date(filters.endDate) : null}
                      max={new Date()}
                      onConfirm={(val) => {
                        setFilters({ ...filters, endDate: formatDate(val) });
                      }}
                    >
                      {(value, { open }) => (
                        <Button size="small" onClick={open} block>
                          {filters.endDate || '选择结束日期'}
                        </Button>
                      )}
                    </DatePicker>
                  </div>
                  <Button color='primary' block onClick={confirmCustomDate}>确认</Button>
                </Space>
              </div>
            )}
          </div>
        </Dropdown.Item>
      </Dropdown>

      <div style={{ padding: '8px 12px', background: '#fff' }}>
        <SearchBar 
          placeholder="搜索描述内容"
          value={filters.keyword}
          onChange={(val) => setFilters(prev => ({ ...prev, keyword: val }))}
          onSearch={() => loadTransactions(1, filters)}
          style={{ '--background': '#f5f5f5' }}
        />
      </div>

      <div className="content">


        {/* 统计摘要 */}
        <Card className="summary-card">
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">收入总额</span>
              <span className="summary-value income">
                +¥{summary.totalIncome.toFixed(2)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">支出总额</span>
              <span className="summary-value expense">
                -¥{summary.totalExpense.toFixed(2)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">净额</span>
              <span className={`summary-value ${summary.netAmount >= 0 ? 'income' : 'expense'}`}>
                {summary.netAmount >= 0 ? '+' : ''}¥{summary.netAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        {/* 列表 */}
        {loading ? (
          <div className="loading-container">
            <DotLoading />
          </div>
        ) : transactions.length === 0 ? (
          <Empty description="暂无记录" />
        ) : (
          <List>
            {transactions.map((item) => (
              <List.Item
                key={item._id}
                prefix={
                  <Tag
                    color={item.type === 'income' ? 'success' : 'danger'}
                    style={{ borderRadius: 4 }}
                  >
                    {item.type === 'income' ? '收入' : '支出'}
                  </Tag>
                }
                description={
                  <Space direction="vertical" style={{ width: '100%', fontSize: 12 }}>
                    {item.description && <div style={{ color: '#666' }}>{item.description}</div>}
                    <div style={{ color: '#999' }}>
                      日期: {formatDate(item.transactionDate)}
                    </div>
                    <div style={{ color: '#999' }}>
                      记录时间: {formatDateTime(item.createdAt)}
                    </div>
                  </Space>
                }
                extra={
                  <Space direction="vertical" align="end">
                    <span
                      className={`amount ${item.type === 'income' ? 'income' : 'expense'}`}
                    >
                      {item.type === 'income' ? '+' : '-'}¥{item.amount.toFixed(2)}
                    </span>
                    <Button
                      size="mini"
                      color="danger"
                      fill="none"
                      onClick={() => handleDelete(item)}
                    >
                      <DeleteOutline />
                    </Button>
                  </Space>
                }
              >
                <div style={{ fontWeight: 500 }}>{item.category}</div>
              </List.Item>
            ))}
          </List>
        )}

        {/* 分页信息 */}
        {total > 0 && (
          <div className="pagination-info">
            共 {total} 条记录，第 {page} / {Math.ceil(total / pageSize)} 页
          </div>
        )}

        {/* 加载更多 */}
        {total > page * pageSize && (
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <Button onClick={() => loadTransactions(page + 1)}>
              加载更多
            </Button>
          </div>
        )}
      </div>

      {/* 浮动添加按钮 */}
      <FloatingBubble
        style={{
          '--initial-position-bottom': '80px',
          '--initial-position-right': '24px',
          '--background': '#1677ff',
        }}
        onClick={() => navigate('/revenue/transactions/create')}
      >
        <AddOutline fontSize={24} color="#fff" />
      </FloatingBubble>
    </div>
  );
};

export default TransactionList;
