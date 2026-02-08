import React, { useEffect } from 'react';
import { Form, Input, Button, TextArea } from 'antd-mobile';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/translations';

/**
 * 库存损耗录入表单弹窗组件
 * 参考DishFormPopup的设计，保持一致的UI风格
 * 
 * @param {Object} form - Ant Design Mobile Form实例
 * @param {Function} onFinish - 表单提交成功回调
 * @param {Function} onCancel - 取消操作回调
 * @param {Object} inventoryItem - 当前操作的库存项（包含productName、quantity等信息）
 */
function InventoryLossFormPopup({ form, onFinish, onCancel, inventoryItem = {} }) {
  const { language } = useLanguage();
  
  // 每次打开弹窗时重置表单
  useEffect(() => {
    form.resetFields();
  }, [inventoryItem._id, form]);

  // 自定义验证器：损耗数量必须大于0且不超过当前库存
  const validateQuantity = (_, value) => {
    if (!value || parseFloat(value) <= 0) {
      return Promise.reject(new Error(t('lossQuantityMustBePositive', language)));
    }
    if (inventoryItem.quantity && parseFloat(value) > inventoryItem.quantity) {
      return Promise.reject(
        new Error(t('lossQuantityExceedStock', language, { quantity: inventoryItem.quantity }))
      );
    }
    return Promise.resolve();
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      overflow: 'hidden' 
    }}>
      {/* 标题栏 - 固定顶部 */}
      <div style={{ 
        flexShrink: 0,
        fontSize: '18px', 
        fontWeight: 'bold', 
        padding: '20px 20px 16px 20px',
        textAlign: 'center',
        backgroundColor: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: '1px solid #f0f0f0'
      }}>
        {t('recordLoss', language)}
      </div>

      {/* 表单区 - 可滚动 */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        backgroundColor: '#fff'
      }}>
        <Form
          form={form}
          onFinish={onFinish}
          layout="horizontal"
          mode="card"
        >
          {/* 当前信息展示 */}
          <div style={{ 
            backgroundColor: '#f0f9ff',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #bae7ff'
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#595959',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>{t('productName', language)}</span>
              <span style={{ fontWeight: 'bold', color: '#262626' }}>
                {inventoryItem.productName || '-'}
              </span>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#595959',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{t('currentStock', language)}</span>
              <span style={{ 
                fontSize: '20px',
                fontWeight: 'bold', 
                color: inventoryItem.quantity < 10 ? '#ff4d4f' : '#52c41a'
              }}>
                {inventoryItem.quantity || 0}
              </span>
            </div>
          </div>

          {/* 损耗数量 */}
          <Form.Item
            name="quantity"
            label={t('lossQuantity', language)}
            rules={[
              { required: true, message: t('enterLossQuantity', language) },
              { validator: validateQuantity }
            ]}
            help={t('lossQuantityHelp', language)}
          >
            <Input 
              type="number" 
              placeholder={t('enterLossQuantity', language)}
              clearable
              step="0.01"
              min="0"
            />
          </Form.Item>

          {/* 损耗原因 */}
          <Form.Item
            name="reason"
            label={t('lossReason', language)}
            rules={[
              { required: true, message: t('enterLossReason', language) },
              { max: 100, message: t('lossReasonTooLong', language) }
            ]}
            help={t('lossReasonHelp', language)}
          >
            <Input 
              placeholder={t('lossReasonPlaceholder', language)}
              clearable
            />
          </Form.Item>

          {/* 备注 */}
          <Form.Item
            name="remark"
            label={t('remarkDetail', language)}
            help={t('remarkHelp', language)}
          >
            <TextArea 
              placeholder={t('remarkPlaceholder', language)}
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </div>

      {/* 按钮区 - 固定底部 */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#fff',
        flexShrink: 0,
        display: 'flex',
        gap: '12px',
        borderTop: '1px solid #f0f0f0',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <Button
          block
          onClick={onCancel}
          style={{ 
            flex: 1,
            height: '44px',
            fontSize: '16px'
          }}
        >
          {t('cancel', language)}
        </Button>
        <Button 
          block 
          color="primary" 
          onClick={() => form.submit()}
          style={{ 
            flex: 1,
            height: '44px',
            fontSize: '16px'
          }}
        >
          {t('confirmRecordLoss', language)}
        </Button>
      </div>
    </div>
  );
}

export default InventoryLossFormPopup;
