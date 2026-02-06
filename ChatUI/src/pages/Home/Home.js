import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  List,
  Dialog,
  Ellipsis,
} from 'antd-mobile';
import {
  AddOutline,
  MessageOutline,
  DeleteOutline,
  MoreOutline,
} from 'antd-mobile-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import './Home.css';

const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-1',
    title: '新对话',
    preview: '如何学习React Hooks？',
    timestamp: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'conv-2',
    title: 'JavaScript 最佳实践',
    preview: '能否介绍一下JavaScript的闭包概念...',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'conv-3',
    title: 'CSS布局技巧',
    preview: 'Flexbox和Grid的区别是什么？',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
  },
];

const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
};

const Home = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);

  const handleNewChat = useCallback(() => {
    const newConv = {
      id: `conv-${Date.now()}`,
      title: '新对话',
      preview: '',
      timestamp: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);
    navigate('/chat', { state: { conversationId: newConv.id } });
  }, [navigate]);

  const handleConversationClick = useCallback((conversation) => {
    navigate('/chat', { state: { conversationId: conversation.id } });
  }, [navigate]);

  const handleDeleteConversation = useCallback((convId, event) => {
    event.stopPropagation();
    Dialog.confirm({
      content: t('confirmDeleteConversation', language),
      confirmText: t('delete', language),
      cancelText: t('cancel', language),
      onConfirm: () => {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
      },
    });
  }, []);

  return (
    <div className="home-page">
      <div className="home-header">
        <h1 className="app-title">ChatGPT</h1>
        <Button
          className="new-chat-btn"
          color="primary"
          fill="solid"
          size="large"
          onClick={handleNewChat}
        >
          <AddOutline /> 新对话
        </Button>
      </div>

      <div className="conversations-container">
        {conversations.length === 0 ? (
          <div className="empty-state">
            <MessageOutline style={{ fontSize: 48, color: '#999' }} />
            <p>还没有对话记录</p>
            <Button color="primary" onClick={handleNewChat}>
              开始新对话
            </Button>
          </div>
        ) : (
          <List className="conversations-list">
            {conversations.map((conversation) => (
              <List.Item
                key={conversation.id}
                className="conversation-item"
                onClick={() => handleConversationClick(conversation)}
                arrow={false}
                extra={
                  <Button
                    fill="none"
                    color="danger"
                    size="small"
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  >
                    <DeleteOutline />
                  </Button>
                }
              >
                <div className="conversation-content">
                  <div className="conversation-title">
                    <MessageOutline className="title-icon" />
                    <span>{conversation.title}</span>
                  </div>
                  <div className="conversation-preview">
                    <Ellipsis
                      direction="end"
                      content={conversation.preview || '开始新对话...'}
                      rows={1}
                    />
                  </div>
                  <div className="conversation-time">
                    {formatTimeAgo(conversation.timestamp)}
                  </div>
                </div>
              </List.Item>
            ))}
          </List>
        )}
      </div>
    </div>
  );
};

export default Home;