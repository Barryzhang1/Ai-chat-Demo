import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  NavBar, 
  List, 
  Tag, 
  Toast, 
  Empty, 
  Picker, 
  Dialog,
  DotLoading
} from 'antd-mobile';
import { usersApi } from '../../api/usersApi';
import './PermissionManagement.css';

const roleOptions = [
  [
    { label: '老板', value: 'BOSS' },
    { label: '员工', value: 'STAFF' },
    { label: '用户', value: 'USER' },
  ],
];

const roleLabels = {
  BOSS: '老板',
  STAFF: '员工',
  USER: '用户',
};

const roleColors = {
  BOSS: 'danger',
  STAFF: 'warning',
  USER: 'default',
};

function PermissionManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAllUsers();
      if (response.success) {
        setUsers(response.data);
      } else {
        Toast.show({
          content: '获取用户列表失败',
          icon: 'fail',
        });
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      Toast.show({
        content: error.message || '获取用户列表失败',
        icon: 'fail',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (user) => {
    setSelectedUser(user);
    setPickerVisible(true);
  };

  const confirmRoleChange = async (value) => {
    if (!selectedUser || !value || value.length === 0) {
      return;
    }

    const newRole = value[0];
    
    // 如果角色没有变化，直接返回
    if (newRole === selectedUser.role) {
      setPickerVisible(false);
      return;
    }

    try {
      const response = await usersApi.updateUserRole(selectedUser.id, newRole);
      
      if (response.success) {
        Toast.show({
          content: '角色修改成功',
          icon: 'success',
        });
        
        // 更新本地用户列表
        setUsers(users.map(user => 
          user.id === selectedUser.id 
            ? { ...user, role: newRole, updatedAt: response.data.updatedAt }
            : user
        ));
      } else {
        Toast.show({
          content: response.message || '角色修改失败',
          icon: 'fail',
        });
      }
    } catch (error) {
      console.error('角色修改失败:', error);
      Toast.show({
        content: error.message || '角色修改失败',
        icon: 'fail',
      });
    } finally {
      setPickerVisible(false);
      setSelectedUser(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="permission-management">
      <NavBar onBack={() => navigate('/merchant')}>
        权限管理
      </NavBar>

      <div className="permission-content">
        {loading ? (
          <div className="loading-container">
            <DotLoading color="primary" />
            <div>加载中...</div>
          </div>
        ) : users.length === 0 ? (
          <Empty description="暂无用户数据" />
        ) : (
          <List header="用户列表">
            {users.map(user => (
              <List.Item
                key={user.id}
                description={
                  <div className="user-info">
                    <div>注册时间：{formatDate(user.createdAt)}</div>
                    <div>更新时间：{formatDate(user.updatedAt)}</div>
                  </div>
                }
                extra={
                  <Tag
                    color={roleColors[user.role]}
                    onClick={() => handleRoleChange(user)}
                    style={{ cursor: 'pointer' }}
                  >
                    {roleLabels[user.role]}
                  </Tag>
                }
              >
                <div className="user-nickname">{user.nickname}</div>
              </List.Item>
            ))}
          </List>
        )}
      </div>

      <Picker
        columns={roleOptions}
        visible={pickerVisible}
        onClose={() => {
          setPickerVisible(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmRoleChange}
        value={selectedUser ? [selectedUser.role] : []}
        title="选择角色"
      />
    </div>
  );
}

export default PermissionManagement;
