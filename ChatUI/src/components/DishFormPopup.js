import React, { useEffect } from 'react';
import { Form, Input, Button, Switch, Stepper, Selector } from 'antd-mobile';

function DishFormPopup({ form, onFinish, onCancel, editMode = false, initialValues = {}, categories = [] }) {
  useEffect(() => {
    if (editMode && initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [editMode, initialValues, form]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ 
        flexShrink: 0,
        fontSize: '18px', 
        fontWeight: 'bold', 
        padding: '20px 20px 16px 20px',
        textAlign: 'center',
        backgroundColor: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        {editMode ? '编辑菜品' : '新品上架'}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <Form
          form={form}
          onFinish={onFinish}
          initialValues={initialValues}
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
          name="categoryId"
          label="分类"
          rules={[{ required: true, message: '请选择分类' }]}
        >
          <Selector
            columns={2}
            options={categories.map(c => ({ label: c.name, value: c._id }))}
          />
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
      <div style={{
          padding: '16px 20px',
          backgroundColor: '#fff',
          flexShrink: 0,
          display: 'flex',
          gap: '12px'
        }}>
          <Button
            block
            onClick={onCancel}
          >
            取消
          </Button>
          <Button block color="primary" onClick={() => form.submit()}>
            {editMode ? '确认修改' : '确认上新'}
          </Button>
      </div>
    </div>
  );
}

export default DishFormPopup;
    