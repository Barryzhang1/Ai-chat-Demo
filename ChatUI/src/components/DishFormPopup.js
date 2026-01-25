import React, { useEffect } from 'react';
import { Form, Input, Button, Switch, Stepper } from 'antd-mobile';

function DishFormPopup({ form, onFinish, onCancel, editMode = false, initialValues = {} }) {
  useEffect(() => {
    if (editMode && initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [editMode, initialValues, form]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        fontSize: '18px', 
        fontWeight: 'bold', 
        marginBottom: '20px', 
        paddingBottom: '16px',
        textAlign: 'center',
      }}>
        {editMode ? '编辑菜品' : '新品上架'}
      </div>
      <Form
        form={form}
        onFinish={onFinish}
        initialValues={initialValues}
        footer={
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <Button
              block
              onClick={onCancel}
            >
              取消
            </Button>
            <Button block type="submit" color="primary">
              {editMode ? '确认修改' : '确认上新'}
            </Button>
          </div>
        }
      >
        <Form.Item
          name="name"
          label="菜品名称"
          rules={[{ required: true, message: '请输入菜品名称' }]}
        >
          <Input placeholder="请输入菜品名称" clearable />
        </Form.Item>

        <Form.Item
          name="price"
          label="价格"
          rules={[{ required: true, message: '请输入价格' }]}
        >
          <Input type="number" placeholder="请输入价格" clearable />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <Input placeholder="请输入菜品描述" clearable />
        </Form.Item>

        <Form.Item
          name="isSpicy"
          label="是否辣"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="hasScallions"
          label="是否有葱"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="hasCilantro"
          label="是否有香菜"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="hasGarlic"
          label="是否有蒜"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="cookingTime"
          label="出餐时间（分钟）"
        >
          <Stepper min={0} max={120} />
        </Form.Item>
      </Form>
    </div>
  );
}

export default DishFormPopup;
