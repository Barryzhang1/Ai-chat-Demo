import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  NavBar,
  TextArea,
  Button,
  Toast,
  Dialog,
} from 'antd-mobile';
import {
  SendOutline,
  AddOutline,
  AudioOutline,
} from 'antd-mobile-icons';
import { io } from 'socket.io-client';
import './Chat.css';

let socket = null;

const WELCOME_MESSAGE = {
  id: 'welcome',
  content: '你好！我是 AI 助手，有什么我可以帮助你的吗？',
  role: 'assistant',
  timestamp: Date.now(),
};

const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const Chat = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [seatInfo, setSeatInfo] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const textAreaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    // 初始化 Socket.IO 连接
    socket = io('http://localhost:3001/seat', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      // 获取用户信息
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      console.log('UserInfo from localStorage:', userInfo);
      console.log('Nickname to send:', userInfo.nickname);
      // 请求座位（只发送真实用户昵称）
      if (userInfo.nickname) {
        console.log('Emitting requestSeat with nickname:', userInfo.nickname);
        socket.emit('requestSeat', { nickname: userInfo.nickname });
      } else {
        console.log('No nickname found, emitting requestSeat without nickname');
        socket.emit('requestSeat', {});
      }
    });

    socket.on('seatAssigned', (data) => {
      console.log('Seat assigned:', data);
      setSeatInfo(data);
      setQueueInfo(null);
      Toast.show({
        icon: 'success',
        content: `已分配座位：${data.seatNumber}号`,
        duration: 3000,
      });
    });

    socket.on('needQueue', (data) => {
      console.log('Need queue:', data);
      setQueueInfo(data);
      setSeatInfo(null);
      Toast.show({
        icon: 'fail',
        content: `当前座位已满，您在队列中的位置：${data.position}`,
        duration: 3000,
      });
    });

    socket.on('queueUpdate', (data) => {
      console.log('Queue updated:', data);
      setQueueInfo(data);
    });

    socket.on('error', (data) => {
      console.error('Socket error:', data);
      Toast.show({
        icon: 'fail',
        content: data.message || '连接错误',
      });
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const simulateTyping = useCallback((text, messageId) => {
    let currentIndex = 0;
    setIsGenerating(true);

    const typingInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        const partialText = text.slice(0, currentIndex);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, content: partialText } : msg
          )
        );
        currentIndex += 2;
      } else {
        clearInterval(typingInterval);
        setIsGenerating(false);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (inputValue.trim() === '' || isGenerating) return;

    const userMessage = {
      id: generateMessageId(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const assistantMessageId = generateMessageId();
      const assistantMessage = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const responses = [
        '这是一个非常好的问题！让我为你详细解答。',
        '根据你的问题，我理解你想了解这个主题。让我给你一些建议和见解。',
        '很高兴能帮助你！这是一个常见的问题，我来为你解答。',
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      simulateTyping(randomResponse, assistantMessageId);
    }, 500);
  }, [inputValue, isGenerating, simulateTyping]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleStopGenerating = useCallback(() => {
    setIsGenerating(false);
  }, []);

  const renderMessage = useCallback((message) => {
    const isUser = message.role === 'user';

    return (
      <div key={message.id} className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? (
          <div className="user-message">
            <div className="message-bubble user">
              {message.content}
            </div>
          </div>
        ) : (
          <div className="assistant-message">
            <div className="message-text">
              {message.content}
              {message.content === '' && (
                <span className="typing-indicator">•••</span>
              )}
            </div>
            {message.content && (
              <div className="message-actions">
                <button className="action-btn" onClick={() => Toast.show('复制')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button className="action-btn" onClick={() => Toast.show('朗读')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                </button>
                <button className="action-btn" onClick={() => Toast.show('分享')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                    <polyline points="16 6 12 2 8 6"></polyline>
                    <line x1="12" y1="2" x2="12" y2="15"></line>
                  </svg>
                </button>
                <button className="action-btn" onClick={() => Toast.show('更多')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="19" cy="12" r="1"></circle>
                    <circle cx="5" cy="12" r="1"></circle>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, []);

  return (
    <div className="chat-page">
      <NavBar
        className="chat-navbar"
        left={
          <button className="menu-btn" onClick={() => Toast.show('菜单')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        }
        right={
          <Button
            className="register-btn"
            size="small"
            onClick={() => Toast.show('注册')}
          >
            注册
          </Button>
        }
      >
        ChatGPT
      </NavBar>

      <div className="messages-area">
        <div className="messages-wrapper">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-area">
        {isGenerating && (
          <div className="stop-button-container">
            <Button
              size="small"
              color="default"
              fill="outline"
              onClick={handleStopGenerating}
            >
              停止生成
            </Button>
          </div>
        )}
        <div className="input-container">
          <button className="add-btn" onClick={() => Toast.show('添加')}>
            <AddOutline />
          </button>
          <div className="input-wrapper">
            <TextArea
              ref={textAreaRef}
              placeholder="询问任何问题"
              value={inputValue}
              onChange={setInputValue}
              onKeyPress={handleKeyPress}
              className="message-textarea"
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={isGenerating}
            />
            <button className="mic-btn" onClick={() => Toast.show('语音输入')}>
              <AudioOutline />
            </button>
          </div>
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isGenerating}
          >
            <SendOutline style={{ transform: 'rotate(-45deg)' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;