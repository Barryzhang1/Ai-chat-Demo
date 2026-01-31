import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Picker, Selector, Tag, Space, Toast } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import inventoryApi from '../api/inventory/inventoryApi';

function DishFormPopup({ form, onFinish, onCancel, editMode = false, initialValues = {}, categories = [] }) {
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // 获取库存食材列表
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await inventoryApi.getInventoryList();
        console.log('库存食材API响应:', response); // 调试日志
        
        let ingredientsList = [];
        
        if (Array.isArray(response)) {
          // 情况1: 直接返回数组
          ingredientsList = response;
        } else if (response && response.code === 0 && response.data) {
          // 情况2: {code: 0, data: {...}}
          if (Array.isArray(response.data)) {
            // data直接是数组
            ingredientsList = response.data;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            // data.items是数组
            ingredientsList = response.data.items;
          } else if (response.data.list && Array.isArray(response.data.list)) {
            // data.list是数组
            ingredientsList = response.data.list;
          } else if (response.data.records && Array.isArray(response.data.records)) {
            // data.records是数组
            ingredientsList = response.data.records;
          } else {
            console.log('data对象结构:', Object.keys(response.data));
          }
        } else if (response && response.data && Array.isArray(response.data)) {
          // 情况3: 其他格式的response.data
          ingredientsList = response.data;
        }
        
        console.log('设置食材列表:', ingredientsList); // 调试日志
        setAvailableIngredients(ingredientsList);
      } catch (error) {
        console.error('获取库存食材失败:', error);
        Toast.show({
          icon: 'fail',
          content: '加载食材列表失败',
        });
      }
    };
    
    fetchIngredients();
  }, []);

  useEffect(() => {
    // 每次打开弹窗时初始化
    if (editMode && initialValues) {
      form.setFieldsValue(initialValues);
      // 初始化tags
      if (initialValues.tags && Array.isArray(initialValues.tags)) {
        setTags(initialValues.tags);
      } else {
        setTags([]);
      }
      // 初始化ingredients
      if (initialValues.ingredients && Array.isArray(initialValues.ingredients)) {
        setSelectedIngredients(initialValues.ingredients);
      } else {
        setSelectedIngredients([]);
      }
    } else {
      // 新增模式，清空tags和ingredients
      setTags([]);
      setSelectedIngredients([]);
      form.resetFields();
    }
    // 清空输入框
    setTagInput('');
  }, [editMode, initialValues._id, form]); // 使用_id作为依赖，确保每次编辑不同菜品时都会触发

  // 添加标签
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      form.setFieldsValue({ tags: newTags });
      setTagInput('');
    }
  };

  // 删除标签
  const handleDeleteTag = (tagToDelete) => {
    const newTags = tags.filter(tag => tag !== tagToDelete);
    setTags(newTags);
    form.setFieldsValue({ tags: newTags });
  };

  // 删除食材
  const handleDeleteIngredient = (ingredientId) => {
    const newIngredients = selectedIngredients.filter(id => id !== ingredientId);
    setSelectedIngredients(newIngredients);
    form.setFieldsValue({ ingredients: newIngredients });
  };

  // 根据ID获取食材名称
  const getIngredientName = (ingredientId) => {
    const ingredient = availableIngredients.find(item => item._id === ingredientId);
    return ingredient ? ingredient.productName : ingredientId;
  };

  // 检查食材是否缺货
  const isIngredientOutOfStock = (ingredientId) => {
    const ingredient = availableIngredients.find(item => item._id === ingredientId);
    return ingredient && ingredient.quantity === 0;
  };

  // 处理Enter键添加标签
  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

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
          name="tags"
          label="标签"
        >
          <div>
            <div style={{ marginBottom: '8px' }}>
              <Space wrap>
                {tags.map((tag) => (
                  <Tag
                    key={tag}
                    color="primary"
                    fill="outline"
                    style={{ 
                      fontSize: '14px',
                      padding: '4px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {tag}
                    <CloseOutline
                      fontSize={14}
                      onClick={() => handleDeleteTag(tag)}
                      style={{ cursor: 'pointer' }}
                    />
                  </Tag>
                ))}
              </Space>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                value={tagInput}
                onChange={setTagInput}
                placeholder="输入标签名称"
                style={{ flex: 1 }}
              />
              <Button
                size="small"
                color="primary"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                添加
              </Button>
            </div>
          </div>
        </Form.Item>

        <Form.Item
          name="ingredients"
          label="绑定食材"
          help="选择制作此菜品所需的库存食材（可多选）"
        >
          <div>
            <div style={{ marginBottom: '8px' }}>
              <Space wrap>
                {selectedIngredients.map((ingredientId) => {
                  const isOutOfStock = isIngredientOutOfStock(ingredientId);
                  return (
                    <Tag
                      key={ingredientId}
                      color={isOutOfStock ? 'danger' : 'success'}
                      fill="outline"
                      style={{ 
                        fontSize: '14px',
                        padding: '4px 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: isOutOfStock ? 'bold' : 'normal'
                      }}
                    >
                      {isOutOfStock && '⚠️ '}
                      {getIngredientName(ingredientId)}
                      <CloseOutline
                        fontSize={14}
                        onClick={() => handleDeleteIngredient(ingredientId)}
                        style={{ cursor: 'pointer' }}
                      />
                    </Tag>
                  );
                })}
              </Space>
            </div>
            {availableIngredients.length > 0 ? (
              <Picker
                columns={[
                  availableIngredients
                    .filter(item => !selectedIngredients.includes(item._id))
                    .map(item => ({
                      label: `${item.productName} (库存: ${item.quantity || 0})`,
                      value: item._id
                    }))
                ]}
                onConfirm={(val) => {
                  if (val[0] && !selectedIngredients.includes(val[0])) {
                    const newIngredients = [...selectedIngredients, val[0]];
                    setSelectedIngredients(newIngredients);
                    form.setFieldsValue({ ingredients: newIngredients });
                  }
                }}
              >
                {(items, actions) => (
                  <Button
                    size="small"
                    fill="outline"
                    onClick={actions.open}
                    block
                  >
                    请选择食材
                  </Button>
                )}
              </Picker>
            ) : (
              <div style={{ color: '#999', padding: '12px 0' }}>
                暂无库存食材，请先添加食材库存
              </div>
            )}
          </div>
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
    