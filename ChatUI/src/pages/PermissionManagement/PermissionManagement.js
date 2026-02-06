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
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import './PermissionManagement.css';

// 角色选项和标签将在组件内部动态生成以支持国际化

const roleColors = {
  BOSS: 'danger',
  STAFF: 'warning',
  USER: 'default',
};

function PermissionManagement() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 动态生成角色选项和标签（支持国际化）
  const roleOptions = [
    [
      { label: t('roleBoss', language), value: 'BOSS' },
      { label: t('roleStaff', language), value: 'STAFF' },
      { label: t('roleUser', language), value: 'USER' },
    ],
  ];

  const getRoleLabel = (role) => {
    const roleLabels = {
      BOSS: t('roleBoss', language),
      STAFF: t('roleStaff', language),
      USER: t('roleUser', language),
    };
    return roleLabels[role] || role;
  };

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
          content: t('getUserListFailed', language),
          icon: 'fail',
        });
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      Toast.show({
        content: error.message || t('getUserListFailed', language),
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
          content: t('roleUpdateSuccess', language),
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
          content: response.message || t('roleUpdateFailed', language),
          icon: 'fail',
        });
      }
    } catch (error) {
      console.error('角色修改失败:', error);
      Toast.show({
        content: error.message || t('roleUpdateFailed', language),
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
        {t('permissionManagement', language)}
      </NavBar>

      <div className="permission-content">
        {loading ? (
          <div className="loading-container">
            <DotLoading color="primary" />
            <div>{t('loading', language)}</div>
          </div>
        ) : users.length === 0 ? (
          <Empty description={t('noUserData', language)} />
        ) : (
          <List header={t('userList', language)}>
            {users.map(user => (
              <List.Item
                key={user.id}
                description={
                  <div className="user-info">
                    <div>{t('registrationTime', language)}{formatDate(user.createdAt)}</div>
                    <div>{t('lastUpdateTime', language)}{formatDate(user.updatedAt)}</div>
                  </div>
                }
                extra={
                  <Tag
                    color={roleColors[user.role]}
                    onClick={() => handleRoleChange(user)}
                    style={{ cursor: 'pointer' }}
                  >
                    {getRoleLabel(user.role)}
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
        title={t('selectRole', language)}
      />
    </div>
  );
}

export default PermissionManagement;
