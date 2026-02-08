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
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import './BatchCreateTransaction.css';

const BatchCreateTransaction = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
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
      { label: t('income', language), value: 'income' },
      { label: t('expense', language), value: 'expense' },
    ],
  ];

  const categoryOptions = {
    expense: [
      t('rent', language),
      t('utilities', language),
      t('laborCost', language),
      t('equipmentMaintenance', language),
      t('marketingCost', language),
      t('materialPurchase', language),
      t('otherExpense', language),
    ],
    income: [
      t('governmentSubsidy', language),
      t('equipmentRental', language),
      t('compensationIncome', language),
      t('otherIncome', language),
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
      Toast.show({ content: t('keepOneRecord', language), icon: 'fail' });
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
        Toast.show({ content: t('amountMustBePositive', language, {index: i + 1}), icon: 'fail' });
        return false;
      }
      
      if (!item.category || item.category.trim() === '') {
        Toast.show({ content: t('categoryRequired', language, {index: i + 1}), icon: 'fail' });
        return false;
      }
      
      if (!item.transactionDate) {
        Toast.show({ content: t('dateRequired', language, {index: i + 1}), icon: 'fail' });
        return false;
      }
      
      // 验证日期不能为未来
      const selectedDate = new Date(item.transactionDate);
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      
      if (selectedDate > now) {
        Toast.show({ content: t('dateCannotBeFuture', language, {index: i + 1}), icon: 'fail' });
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
      content: t('confirmSubmitTransactions', language, { count: transactions.length }),
      confirmText: t('submit', language),
      cancelText: t('cancel', language),
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
          content: t('createSuccess', language, { count: res.data.successCount }),
          icon: 'success',
        });
        navigate('/revenue/transactions');
      } else {
        Toast.show({ content: res.message || t('createFailed', language), icon: 'fail' });
      }
    } catch (error) {
      console.error('批量创建失败:', error);
      Toast.show({ content: t('createFailed', language), icon: 'fail' });
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
        {t('batchCreateTransaction', language)}
      </NavBar>

      <div className="content">
        <div className="header-actions">
          <Button
            color="primary"
            size="small"
            onClick={handleAddRow}
          >
            <AddOutline /> {t('addRow', language)}
          </Button>
          <span className="count-info">
            {t('totalRecordsCount', language, { count: transactions.length })}
          </span>
        </div>

        {transactions.map((item, index) => (
          <Card
            key={index}
            className="transaction-form-card"
            title={`${t('record', language)} ${index + 1}`}
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
              <Form.Item label={t('type', language)}>
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
                      {item.type === 'income' ? t('income', language) : t('expense', language)}
                    </Button>
                  )}
                </Picker>
              </Form.Item>

              <Form.Item label={t('amount', language)}>
                <Input
                  type="number"
                  placeholder={t('enterAmount', language)}
                  value={item.amount}
                  onChange={(val) => handleFieldChange(index, 'amount', val)}
                  clearable
                />
              </Form.Item>

              <Form.Item label={t('category', language)}>
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
                      {item.category || t('selectCategory', language)}
                    </Button>
                  )}
                </Picker>
              </Form.Item>

              <Form.Item label={t('date', language)}>
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

              <Form.Item label={t('description', language)}>
                <TextArea
                  placeholder={t('descriptionPlaceholder', language)}
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
            {t('batchSubmit', language)} ({transactions.length} 条)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BatchCreateTransaction;
