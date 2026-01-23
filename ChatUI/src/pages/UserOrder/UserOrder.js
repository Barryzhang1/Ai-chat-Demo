import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  TextArea,
  Button,
  Toast,
  Card,
  Tag,
  Dialog,
  List,
} from 'antd-mobile';
import { SendOutline, RedoOutline } from 'antd-mobile-icons';
import './UserOrder.css';

const MOCK_DISHES = [
  { id: 1, name: '宫保鸡丁', price: 38, description: '经典川菜，鸡肉鲜嫩，花生酥脆' },
  { id: 2, name: '红烧肉', price: 48, description: '肥而不腻，入口即化' },
  { id: 3, name: '清蒸鲈鱼', price: 58, description: '鱼肉鲜嫩，原汁原味' },
  { id: 4, name: '麻婆豆腐', price: 28, description: '麻辣鲜香，下饭神器' },
  { id: 5, name: '西红柿炒鸡蛋', price: 22, description: '家常美味，酸甜可口' },
  { id: 6, name: '酸菜鱼', price: 68, description: '鱼肉滑嫩，汤汁酸辣开胃' },
];

const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const UserOrder = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      content: '您好！欢迎使用点餐系统。请告诉我您的需求，比如：人数、预算、忌口、喜好等。',
      role: 'assistant',
      timestamp: Date.now(),
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMenu, setCurrentMenu] = useState(null);
  const [orderRequirements, setOrderRequirements] = useState({});
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const checkOrderRelevance = (text) => {
    const orderKeywords = ['点餐', '吃', '菜', '人', '预算', '忌口', '喜好', '辣', '甜', '咸', '价格', '菜单', '推荐'];
    return orderKeywords.some(keyword => text.includes(keyword));
  };

  const generateMenu = useCallback((requirements) => {
    // 根据需求生成菜单（这里使用模拟数据）
    const shuffled = [...MOCK_DISHES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
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
    const userInput = inputValue.trim();
    setInputValue('');

    setTimeout(() => {
      // 检查是否与点餐相关
      if (!checkOrderRelevance(userInput)) {
        const assistantMessage = {
          id: generateMessageId(),
          content: '我是一个点餐系统，不支持闲聊。请告诉我您的点餐需求。',
          role: 'assistant',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }

      // 记录需求
      setOrderRequirements((prev) => ({
        ...prev,
        [Date.now()]: userInput,
      }));

      // 生成菜单
      const menu = generateMenu(userInput);
      setCurrentMenu(menu);

      const assistantMessage = {
        id: generateMessageId(),
        content: '根据您的需求，我为您推荐以下菜品：',
        role: 'assistant',
        timestamp: Date.now(),
        menu,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  }, [inputValue, isGenerating, generateMenu]);

  const handleRefreshMenu = useCallback(() => {
    const newMenu = generateMenu(orderRequirements);
    setCurrentMenu(newMenu);

    const assistantMessage = {
      id: generateMessageId(),
      content: '已为您重新推荐以下菜品：',
      role: 'assistant',
      timestamp: Date.now(),
      menu: newMenu,
    };
    setMessages((prev) => [...prev, assistantMessage]);
  }, [generateMenu, orderRequirements]);

  const handleConfirmOrder = useCallback(() => {
    if (!currentMenu) return;

    const totalPrice = currentMenu.reduce((sum, dish) => sum + dish.price, 0);
    
    Dialog.confirm({
      content: `确认订单？总计：¥${totalPrice}`,
      onConfirm: () => {
        const orderMessage = {
          id: generateMessageId(),
          content: `订单创建成功！\n订单详情：\n${currentMenu.map(dish => `${dish.name} ¥${dish.price}`).join('\n')}\n总计：¥${totalPrice}`,
          role: 'assistant',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, orderMessage]);

        // 询问是否进行游戏
        setTimeout(() => {
          Dialog.confirm({
            content: '是否进行游戏？',
            confirmText: '开始游戏',
            cancelText: '不了',
            onConfirm: () => {
              Toast.show({
                content: '游戏功能开发中...',
              });
            },
          });
        }, 1000);
      },
    });
  }, [currentMenu]);

  const handleLookAgain = useCallback(() => {
    const assistantMessage = {
      id: generateMessageId(),
      content: '好的，请告诉我您还有什么需求？我会为您重新推荐。',
      role: 'assistant',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  }, []);

  return (
    <div className="user-order-container">
      <NavBar onBack={() => navigate('/home')}>点餐</NavBar>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">
              {message.content}
            </div>
            
            {message.menu && (
              <div className="menu-list">
                {message.menu.map((dish) => (
                  <Card key={dish.id} className="dish-card">
                    <div className="dish-header">
                      <span className="dish-name">{dish.name}</span>
                      <span className="dish-price">¥{dish.price}</span>
                    </div>
                    <div className="dish-description">{dish.description}</div>
                  </Card>
                ))}
                
                <div className="menu-actions">
                  <Button
                    color="primary"
                    size="small"
                    onClick={handleConfirmOrder}
                  >
                    确认
                  </Button>
                  <Button
                    color="default"
                    size="small"
                    onClick={handleLookAgain}
                  >
                    再看看
                  </Button>
                  <Button
                    size="small"
                    onClick={handleRefreshMenu}
                  >
                    <RedoOutline /> 刷新
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <TextArea
          placeholder="请输入您的点餐需求..."
          value={inputValue}
          onChange={setInputValue}
          autoSize={{ minRows: 1, maxRows: 3 }}
          className="input-textarea"
        />
        <Button
          color="primary"
          onClick={handleSendMessage}
          disabled={isGenerating}
          className="send-button"
        >
          <SendOutline />
        </Button>
      </div>
    </div>
  );
};

export default UserOrder;
