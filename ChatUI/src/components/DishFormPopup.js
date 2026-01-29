import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Selector, Tag, Space } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';

function DishFormPopup({ form, onFinish, onCancel, editMode = false, initialValues = {}, categories = [] }) {
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

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
    } else {
      // 新增模式，清空tags
      setTags([]);
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
                placeholder="输入标签后按回车或点击添加"
                value={tagInput}
                onChange={setTagInput}
                onKeyPress={handleTagInputKeyPress}
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
    