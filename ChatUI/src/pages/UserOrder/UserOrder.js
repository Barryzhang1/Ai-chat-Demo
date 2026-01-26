import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Input, Button, Toast, Dialog, Popup } from 'antd-mobile';
import { SendOutline, CameraOutline, AddCircleOutline, RedoOutline } from 'antd-mobile-icons';
import speakIcon from '../../assets/speak.svg';
import './UserOrder.css';

// 模拟菜品数据库
const MOCK_DISHES = [
  { 
    id: 1, 
    name: '宫保鸡丁', 
    price: 38, 
    description: '经典川菜，鸡肉鲜嫩，花生酥脆',
    image: 'https://picsum.photos/200/200?random=1',
    spicy: true
  },
  { 
    id: 2, 
    name: '鱼香肉丝', 
    price: 35, 
    description: '酸甜可口，下饭必备',
    image: 'https://picsum.photos/200/200?random=2',
    spicy: false
  },
  { 
    id: 3, 
    name: '麻婆豆腐', 
    price: 28, 
    description: '麻辣鲜香，豆腐嫩滑',
    image: 'https://picsum.photos/200/200?random=3',
    spicy: true
  },
  { 
    id: 4, 
    name: '水煮鱼', 
    price: 68, 
    description: '麻辣鲜香，鱼肉细嫩',
    image: 'https://picsum.photos/200/200?random=4',
    spicy: true
  },
  { 
    id: 5, 
    name: '回锅肉', 
    price: 42, 
    description: '肥而不腻，香气扑鼻',
    image: 'https://picsum.photos/200/200?random=5',
    spicy: false
  },
  { 
    id: 6, 
    name: '糖醋里脊', 
    price: 45, 
    description: '酸甜适中，外酥里嫩',
    image: 'https://picsum.photos/200/200?random=6',
    spicy: false
  },
  { 
    id: 7, 
    name: '清蒸鲈鱼', 
    price: 78, 
    description: '鱼肉鲜美，清淡健康',
    image: 'https://picsum.photos/200/200?random=7',
    spicy: false
  },
  { 
    id: 8, 
    name: '红烧排骨', 
    price: 58, 
    description: '色泽红亮，肉质酥烂',
    image: 'https://picsum.photos/200/200?random=8',
    spicy: false
  },
  { 
    id: 9, 
    name: '蒜蓉西兰花', 
    price: 25, 
    description: '清淡爽口，营养丰富',
    image: 'https://picsum.photos/200/200?random=9',
    spicy: false
  },
  { 
    id: 10, 
    name: '酸辣土豆丝', 
    price: 18, 
    description: '酸辣开胃，清脆爽口',
    image: 'https://picsum.photos/200/200?random=10',
    spicy: true
  },
];

function UserOrder() {
  const [messages, setMessages] = useState([]);
  // 用于流式展示assistant消息的字数
  const [streamCharCounts, setStreamCharCounts] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [currentMenu, setCurrentMenu] = useState(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [userRequirements, setUserRequirements] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isOverCancel, setIsOverCancel] = useState(false);
  const [playingAudioIndex, setPlayingAudioIndex] = useState(null);
  const [showGamePopup, setShowGamePopup] = useState(false);
  const messagesEndRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 初始欢迎消息
    setMessages([
      {
        role: 'assistant',
        content: '您好！欢迎使用智能点餐系统。请告诉我您的点餐需求，比如：人数、预算、口味偏好、忌口等信息，我会为您推荐合适的菜品。',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // 流式展示系统消息
  useEffect(() => {
    if (!messages.length) return;
    // 找到最后一个需要流式展示的assistant消息
    const lastIdx = messages.length - 1;
    const msg = messages[lastIdx];
    if (
      msg.role === 'assistant' &&
      !msg.menu &&
      !msg.audioUrl &&
      (!streamCharCounts[lastIdx] || streamCharCounts[lastIdx] < msg.content.length)
    ) {
      let count = streamCharCounts[lastIdx] || 0;
      const timer = setTimeout(() => {
        setStreamCharCounts(prev => ({ ...prev, [lastIdx]: count + 1 }));
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [messages, streamCharCounts]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 判断是否与点餐相关
  const isOrderRelated = (text) => {
    const keywords = ['点餐', '菜', '吃', '预算', '人', '口味', '辣', '甜', '酸', '咸', '忌口', '推荐', '想要', '来点'];
    return keywords.some(keyword => text.includes(keyword));
  };

  // 根据用户需求生成菜单
  const generateMenu = (requirements) => {
    // 简单的推荐逻辑：随机选择4-6道菜
    const count = Math.floor(Math.random() * 3) + 4; // 4-6道菜
    const shuffled = [...MOCK_DISHES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // 处理发送消息
  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // 判断是否与点餐相关
    if (!isOrderRelated(inputValue)) {
      const replyMessage = {
        role: 'assistant',
        content: '抱歉，我是一个点餐系统，不支持闲聊。请告诉我您的点餐需求。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, replyMessage]);
      setInputValue('');
      return;
    }

    // 合并用户需求
    const newRequirements = userRequirements ? `${userRequirements} ${inputValue}` : inputValue;
    setUserRequirements(newRequirements);

    // 生成菜单
    const menu = generateMenu(newRequirements);
    setCurrentMenu(menu);

    // 计算总价
    const totalPrice = menu.reduce((sum, dish) => sum + dish.price, 0);

    const replyMessage = {
      role: 'assistant',
      content: '根据您的需求，为您推荐以下菜品：',
      menu: menu,
      totalPrice: totalPrice,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, replyMessage]);
    setInputValue('');
  };

  // 确认订单
  const handleConfirmOrder = () => {
    if (!currentMenu) return;

    const totalPrice = currentMenu.reduce((sum, dish) => sum + dish.price, 0);
    
    // 创建订单
    const order = {
      id: `ORDER${Date.now()}`,
      dishes: currentMenu,
      totalPrice: totalPrice,
      timestamp: new Date(),
      userName: localStorage.getItem('userName'),
    };

    // 保存订单到 localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    setOrderConfirmed(true);

    const confirmMessage = {
      role: 'assistant',
      content: `订单创建成功！\n订单号：${order.id}\n总金额：¥${totalPrice}\n感谢您的订购！`,
      timestamp: new Date(),
      isOrderConfirm: true,
    };

    setMessages(prev => [...prev, confirmMessage]);

    // 发送游戏推荐消息
    setTimeout(() => {
      const gameMessage = {
        role: 'assistant',
        content: '订单已确认，等待期间可以玩游戏哦～',
        timestamp: new Date(),
        isGameRecommend: true,
      };
      setMessages(prev => [...prev, gameMessage]);
    }, 1000);
  };

  // 再看看
  const handleLookAgain = () => {
    const message = {
      role: 'assistant',
      content: '好的，请告诉我您还有什么其他需求吗？我会为您重新推荐。',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  // 切换语音模式
  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
  };

  // 播放语音
  const handlePlayAudio = (audioUrl, index) => {
    if (playingAudioIndex === index) {
      // 如果正在播放，则暂停
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingAudioIndex(null);
      }
    } else {
      // 播放新音频
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setPlayingAudioIndex(index);
      
      // 播放完成后重置状态
      audioRef.current.onended = () => {
        setPlayingAudioIndex(null);
      };
    }
  };

  // 开始录音
  const handleTouchStart = async () => {
    setIsRecording(true);
    setIsOverCancel(false);
    audioChunksRef.current = [];
    
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 尝试不同的音频格式，选择浏览器支持的
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          options = { mimeType: 'audio/ogg' };
        } else {
          options = {};
        }
      }
      
      console.log('使用音频格式:', options.mimeType || 'default');
      
      // 创建 MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      // 收集音频数据
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('收集音频块:', event.data.size, 'bytes');
        }
      };
      
      // 开始录音
      mediaRecorderRef.current.start();
      console.log('开始录音...');
    } catch (error) {
      console.error('麦克风权限错误:', error);
      Toast.show('无法访问麦克风，请检查权限设置');
      setIsRecording(false);
    }
  };

  // 触摸移动
  const handleTouchMove = (e) => {
    if (!isRecording) return;
    
    const touch = e.touches?.[0] || e;
    const x = touch.clientX;
    const y = touch.clientY;
    
    // 检查是否在取消按钮区域
    if (cancelBtnRef.current) {
      const rect = cancelBtnRef.current.getBoundingClientRect();
      const isOver = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      setIsOverCancel(isOver);
    }
  };

  // 结束录音
  const handleTouchEnd = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      // 停止所有音轨
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (isOverCancel) {
        // 取消录音
        Toast.show('已取消录音');
        audioChunksRef.current = [];
      } else {
        // 处理录音数据
        mediaRecorderRef.current.onstop = () => {
          const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // 创建临时音频元素获取实际时长
          const tempAudio = new Audio(audioUrl);
          tempAudio.addEventListener('loadedmetadata', () => {
            const duration = Math.ceil(tempAudio.duration); // 向上取整到秒
            
            console.log('录音完成');
            console.log('音频格式:', mimeType);
            console.log('音频大小:', audioBlob.size, 'bytes');
            console.log('音频URL:', audioUrl);
            console.log('音频时长:', duration, '秒');
            console.log('音频块数量:', audioChunksRef.current.length);
            
            // 添加语音消息到聊天
            const voiceMessage = {
              role: 'user',
              content: '[语音消息]',
              audioUrl: audioUrl,
              audioType: mimeType,
              audioDuration: duration,
              timestamp: new Date(),
            };
            
            setMessages(prev => [...prev, voiceMessage]);
            Toast.show(`语音发送成功`);
            
            // 清空音频块
            audioChunksRef.current = [];
          });
        };
      }
    }
    
    setIsRecording(false);
    setIsOverCancel(false);
  };

  // 取消录音
  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsOverCancel(false);
    Toast.show('已取消录音');
  };

  // 刷新菜单
  const handleRefreshMenu = () => {
    if (!userRequirements) {
      Toast.show('请先告诉我您的点餐需求');
      return;
    }

    const menu = generateMenu(userRequirements);
    setCurrentMenu(menu);
    const totalPrice = menu.reduce((sum, dish) => sum + dish.price, 0);

    const message = {
      role: 'assistant',
      content: '为您重新推荐以下菜品：',
      menu: menu,
      totalPrice: totalPrice,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
  };

  return (
    <div className="user-order-container">
      <NavBar onBack={() => navigate('/role-select')}>
        智能点餐
      </NavBar>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.audioUrl ? (
              <>
                <div 
                  className={`voice-message ${playingAudioIndex === index ? 'playing' : ''}`}
                  onClick={() => handlePlayAudio(message.audioUrl, index)}
                >
                  <div className="voice-duration">{message.audioDuration}"</div>

                </div>
              </>
            ) : (
              <div className="message-bubble">
                {message.isOrderConfirm ? (
                  <div className="order-confirm-card">
                    <div className="order-confirm-content">{message.content}</div>
                  </div>
                ) : message.isGameRecommend ? (
                  <div className="game-recommend-card">
                    <div className="game-recommend-content">
                      <div className="game-icon">🎮</div>
                      <div className="game-text">{message.content}</div>
                    </div>
                    <div className="game-actions">
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => setShowGamePopup(true)}
                        style={{ flex: '1' }}
                      >
                        开始游戏
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="message-content">
                    {message.role === 'assistant' && !message.menu && !message.audioUrl
                      ? message.content.slice(0, streamCharCounts[index] || 0)
                      : message.content}
                  </div>
                )}
                
                {message.menu && (
                <div className="menu-list">
                  <div className="menu-header">
                    <div className="restaurant-info">
                      <span className="restaurant-icon">🍜</span>
                      <span className="restaurant-name">渝味鲜烤 · 烤串（高新店）</span>
                    </div>
                  </div>
                  
                  <div className="dishes-container">
                    {message.menu.map(dish => (
                      <div key={dish.id} className="dish-item">
                        <img src={dish.image} alt={dish.name} className="dish-image" />
                        <div className="dish-info">
                          <div className="dish-name">{dish.name}</div>
                          <div className="dish-tags">
                            {!dish.spicy && <span className="tag">不辣🌶️</span>}
                          </div>
                          <div className="dish-bottom">
                            <span className="dish-price">¥{dish.price}</span>
                            <span className="dish-quantity">x1</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="menu-footer">
                    <div className="total-info">
                      <span className="label">总计</span>
                      <span className="total-amount">¥{message.totalPrice}</span>
                    </div>
                  </div>
                  
                  {!orderConfirmed && (
                    <div className="menu-actions">
                      <Button 
                        size="small"
                        color="warning"
                        onClick={handleLookAgain}
                        style={{ flex: '0 0 auto' }}
                      >
                        再看看
                      </Button>
                      <Button 
                        size="small"
                        color="primary"
                        onClick={handleRefreshMenu}
                        icon={<RedoOutline />}
                        style={{ flex: '0 0 auto' }}
                      >
                        刷新
                      </Button>
                      <Button 
                        size="small" 
                        color="success" 
                        onClick={handleConfirmOrder}
                        style={{ flex: '1' }}
                      >
                        确认订单
                      </Button>
                    </div>
                  )}
                </div>
              )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bottom-container">
        <div className="input-container">
          {!isVoiceMode && (
            <div className="voice-button" onClick={toggleVoiceMode}>
              <img src={speakIcon} alt="voice" className="voice-icon" />
            </div>
          )}
          <div className={isVoiceMode ? "voice-input-wrapper" : "input-wrapper"}>
            {isVoiceMode ? (
              <div 
                className="voice-input-area"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onContextMenu={(e) => e.preventDefault()}
              >
                <span className="voice-input-text">按住 说话</span>
              </div>
            ) : (
              <Input
                placeholder="发消息或按住说话..."
                value={inputValue}
                onChange={setInputValue}
                onEnterPress={handleSend}
                className="input-field"
              />
            )}
          </div>
          <div className="right-buttons">
            {isVoiceMode ? (
              <div className="close-voice-btn" onClick={toggleVoiceMode}>×</div>
            ) : (
              <>
                <CameraOutline className="icon-btn" fontSize={24} />
                <AddCircleOutline className="icon-btn" fontSize={24} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* 录音弹出框 */}
      {isRecording && (
        <div 
          className="recording-modal"
          onContextMenu={(e) => e.preventDefault()}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
        >
          <div className="recording-content">
            <div className={`recording-bubble ${isOverCancel ? 'cancel-state' : ''}`}>
              <div className="voice-wave">
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
              </div>
            </div>
            <div className="recording-actions">
              <div 
                ref={cancelBtnRef}
                className={`action-btn cancel-btn ${isOverCancel ? 'active' : ''}`}
              >
                取消
              </div>
              <div className="action-btn convert-btn">
                滑到这里 转文字
              </div>
              <div className={`action-btn send-btn ${!isOverCancel ? 'active' : ''}`}>
                松开 发送
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 游戏弹窗 */}
      <Popup
        visible={showGamePopup}
        onMaskClick={() => setShowGamePopup(false)}
        position='right'
        bodyStyle={{ 
          width: '100vw', 
          height: '100vh',
          padding: 0,
          backgroundColor: '#4EC0CA'
        }}
      >
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Button
            color="primary"
            onClick={() => setShowGamePopup(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              padding: 0,
              fontSize: '24px'
            }}
          >
            ✕
          </Button>
          <iframe
            src={process.env.REACT_APP_GAME_URL || 'http://localhost:3002'}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="Flappy Bird Game"
          />
        </div>
      </Popup>
    </div>
  );
}

export default UserOrder;
