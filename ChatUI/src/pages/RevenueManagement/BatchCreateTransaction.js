import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  Form,
  Input,
  Button,
  Toast,
  Space,
  Card,
  DatePicker,
  Picker,
  Dialog,
  TextArea,
} from 'antd-mobile';
import { AddOutline, DeleteOutline, CloseOutline } from 'antd-mobile-icons';
import { revenueApi } from '../../api/revenueApi';
import './BatchCreateTransaction.css';

const BatchCreateTransaction = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState([
    {
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      transactionDate: new Date(),
    },
  ]);

  const typeOptions = [
    [
      { label: '收入', value: 'income' },
      { label: '支出', value: 'expense' },
    ],
  ];

  const categoryOptions = {
    expense: [
      '房租',
      '水电费',
      '人工工资',
      '设备维修',
      '营销费用',
      '原材料采购',
      '其他支出',
    ],
    income: [
      '政府补贴',
      '设备租赁收入',
      '赔偿收入',
      '其他收入',
    ],
  };

  // 添加一行
  const handleAddRow = () => {
    setTransactions([
      ...transactions,
      {
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        transactionDate: new Date(),
      },
    ]);
  };

  // 删除一行
  const handleRemoveRow = (index) => {
    if (transactions.length === 1) {
      Toast.show({ content: '至少保留一条记录', icon: 'fail' });
      return;
    }
    const newTransactions = transactions.filter((_, i) => i !== index);
    setTransactions(newTransactions);
  };

  // 更新某一行的字段
  const handleFieldChange = (index, field, value) => {
    const newTransactions = [...transactions];
    newTransactions[index][field] = value;
    setTransactions(newTransactions);
  };

  // 验证表单
  const validateForm = () => {
    for (let i = 0; i < transactions.length; i++) {
      const item = transactions[i];
      
      if (!item.amount || parseFloat(item.amount) <= 0) {
        Toast.show({ content: `第${i + 1}条: 金额必须大于0`, icon: 'fail' });
        return false;
      }
      
      if (!item.category || item.category.trim() === '') {
        Toast.show({ content: `第${i + 1}条: 请填写分类`, icon: 'fail' });
        return false;
      }
      
      if (!item.transactionDate) {
        Toast.show({ content: `第${i + 1}条: 请选择日期`, icon: 'fail' });
        return false;
      }
      
      // 验证日期不能为未来
      const selectedDate = new Date(item.transactionDate);
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      
      if (selectedDate > now) {
        Toast.show({ content: `第${i + 1}条: 日期不能为未来日期`, icon: 'fail' });
        return false;
      }
    }
    
    return true;
  };

  // 提交
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const result = await Dialog.confirm({
      content: `确定要提交 ${transactions.length} 条记录吗？`,
      confirmText: '提交',
      cancelText: '取消',
    });

    if (!result) {
      return;
    }

    setSubmitting(true);
    try {
      // 格式化数据
      const formattedTransactions = transactions.map((item) => ({
        type: item.type,
        amount: parseFloat(item.amount),
        category: item.category.trim(),
        description: item.description?.trim() || undefined,
        transactionDate: formatDate(item.transactionDate),
      }));

      const res = await revenueApi.batchCreateTransactions(formattedTransactions);
      
      if (res.code === 0) {
        Toast.show({
          content: `成功创建 ${res.data.successCount} 条记录`,
          icon: 'success',
        });
        navigate('/revenue/transactions');
      } else {
        Toast.show({ content: res.message || '提交失败', icon: 'fail' });
      }
    } catch (error) {
      console.error('批量创建失败:', error);
      Toast.show({ content: '提交失败', icon: 'fail' });
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化日期为 YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="batch-create-container">
      <NavBar onBack={() => navigate('/revenue/transactions')}>
        批量录入收支
      </NavBar>

      <div className="content">
        <div className="header-actions">
          <Button
            color="primary"
            size="small"
            onClick={handleAddRow}
          >
            <AddOutline /> 添加一行
          </Button>
          <span className="count-info">共 {transactions.length} 条</span>
        </div>

        {transactions.map((item, index) => (
          <Card
            key={index}
            className="transaction-form-card"
            title={`记录 ${index + 1}`}
            extra={
              transactions.length > 1 && (
                <Button
                  size="mini"
                  color="danger"
                  fill="none"
                  onClick={() => handleRemoveRow(index)}
                >
                  <DeleteOutline />
                </Button>
              )
            }
          >
            <Form layout="vertical">
              <Form.Item label="类型">
                <Picker
                  columns={typeOptions}
                  value={[item.type]}
                  onConfirm={(val) => {
                    const newType = val[0];
                    // 如果类型改变，清空分类
                    if (newType !== item.type) {
                      const newTransactions = [...transactions];
                      newTransactions[index].type = newType;
                      newTransactions[index].category = ''; // 清空分类
                      setTransactions(newTransactions);
                    } else {
                      handleFieldChange(index, 'type', newType);
                    }
                  }}
                >
                  {(items, { open }) => (
                    <Button
                      color={item.type === 'income' ? 'success' : 'danger'}
                      fill="outline"
                      block
                      onClick={open}
                    >
                      {item.type === 'income' ? '收入' : '支出'}
                    </Button>
                  )}
                </Picker>
              </Form.Item>

              <Form.Item label="金额（元）">
                <Input
                  type="number"
                  placeholder="请输入金额"
                  value={item.amount}
                  onChange={(val) => handleFieldChange(index, 'amount', val)}
                  clearable
                />
              </Form.Item>

              <Form.Item label="分类">
                <Picker
                  columns={[
                    categoryOptions[item.type].map((cat) => ({
                      label: cat,
                      value: cat,
                    })),
                  ]}
                  value={item.category ? [item.category] : []}
                  onConfirm={(val) => handleFieldChange(index, 'category', val[0])}
                >
                  {(items, { open }) => (
                    <Button block fill="outline" onClick={open}>
                      {item.category || '选择分类'}
                    </Button>
                  )}
                </Picker>
              </Form.Item>

              <Form.Item label="日期">
                <DatePicker
                  value={item.transactionDate}
                  max={new Date()}
                  onConfirm={(val) => handleFieldChange(index, 'transactionDate', val)}
                >
                  {(value, { open }) => (
                    <Button block fill="outline" onClick={open}>
                      {formatDate(item.transactionDate)}
                    </Button>
                  )}
                </DatePicker>
              </Form.Item>

              <Form.Item label="描述（可选）">
                <TextArea
                  placeholder="详细描述这笔收支..."
                  value={item.description}
                  onChange={(val) => handleFieldChange(index, 'description', val)}
                  maxLength={200}
                  rows={2}
                  showCount
                />
              </Form.Item>
            </Form>
          </Card>
        ))}

        <div className="submit-actions">
          <Button
            block
            color="primary"
            size="large"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting}
          >
            批量提交 ({transactions.length} 条)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BatchCreateTransaction;
