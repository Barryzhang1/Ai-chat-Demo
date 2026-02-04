import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Input, Button, Toast, Popup, SideBar, Divider, Stepper, Empty, Badge, DotLoading, List, Tag, InfiniteScroll, PullToRefresh, SearchBar, Dialog } from 'antd-mobile';
import { RedoOutline, UnorderedListOutline } from 'antd-mobile-icons';
import { ShopOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import { categoryApi } from '../../api/categoryApi';
import { dishApi } from '../../api/dishApi';
import { orderApi } from '../../api/orderApi';
import inventoryApi from '../../api/inventory/inventoryApi';
import { config } from '../../config';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../i18n/translations';
import speakIcon from '../../assets/speak.svg';
import './UserOrder.css';

let socket = null;

function UserOrder() {
  const navigate = useNavigate();
  const { language } = useLanguage();
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
  const [showGameIframe, setShowGameIframe] = useState(false);
  const [seatInfo, setSeatInfo] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);
  const [showMenuPopup, setShowMenuPopup] = useState(false);
  const [categories, setCategories] = useState([]);
  const [allDishes, setAllDishes] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [dishQuantities, setDishQuantities] = useState({});
  const [menuSearchKeyword, setMenuSearchKeyword] = useState('');
  const [showOrderHistoryPopup, setShowOrderHistoryPopup] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [orderHistoryPage, setOrderHistoryPage] = useState(1);
  const [orderHistoryHasMore, setOrderHistoryHasMore] = useState(true);
  const [loadingOrderHistory, setLoadingOrderHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const menuContentRef = useRef(null);
  const categoryRefs = useRef({});
  const updateCartTimerRef = useRef({});

  const [isGenerating, setIsGenerating] = useState(false);  
  const [showQuickButtons, setShowQuickButtons] = useState(true); // 控制快捷按钮显示

  // 快捷按钮配置 - 混合场景
  const quickButtons = [
    { text: t('quickBtn1', language), icon: '🥗' },
    { text: t('quickBtn2', language), icon: '🍖' },
    { text: t('quickBtn3', language), icon: '👨‍👩‍👦' },
    { text: t('quickBtn4', language), icon: '👶' },
    { text: t('quickBtn5', language), icon: '🌶️' },
    { text: t('quickBtn6', language), icon: '🍲' },
    { text: t('quickBtn7', language), icon: '🍰' },
    { text: t('quickBtn8', language), icon: '🍚' },
    { text: t('quickBtn9', language), icon: '💰' },
  ];

  // 获取菜品和分类数据
  const fetchMenuData = async () => {
    try {
      const [categoriesData, dishesData, inventoryData] = await Promise.all([
        categoryApi.getCategories(),
        dishApi.getDishes(),
        inventoryApi.getInventoryList({ page: 1, pageSize: 1000 })
      ]);

      const sortedCategories = (categoriesData || [])
        .filter(cat => cat.isActive)
        .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));

      setCategories(sortedCategories);
      const availableDishes = (dishesData || []).filter(dish => !dish.isDelisted);
      setAllDishes(availableDishes);
      
      // 保存库存列表
      const inventory = inventoryData?.data?.items || inventoryData?.data?.list || inventoryData?.data || [];
      setInventoryList(inventory);

      if (sortedCategories.length > 0) {
        setActiveCategory(sortedCategories[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch menu data:', error);
    }
  };

  // 打开菜单 Popup
  const handleOpenMenuPopup = async (recommendedMenu = null) => {
    // 如果数据未加载，先加载数据
    if (categories.length === 0) {
      await fetchMenuData();
    }
    
    // 先获取购物车数据
    try {
      const cartRes = await orderApi.getCart();
      const cartDishes = cartRes.data?.dishes || [];
      
      // 如果有推荐菜单，优先使用推荐菜单
      if (recommendedMenu && recommendedMenu.length > 0) {
        const quantities = {};
        recommendedMenu.forEach(dish => {
          const dishId = dish.id;
          if (dishId) {
            quantities[dishId] = dish.quantity || 1;
          }
        });
        setDishQuantities(quantities);
      } else if (cartDishes.length > 0) {
        // 否则使用购物车数据初始化
        const quantities = {};
        cartDishes.forEach(dish => {
          quantities[dish.dishId] = dish.quantity;
        });
        setDishQuantities(quantities);
      } else {
        // 清空之前的选择
        setDishQuantities({});
      }
      
      // 使用 requestAnimationFrame 确保状态已更新
      requestAnimationFrame(() => {
        setShowMenuPopup(true);
      });
    } catch (error) {
      console.error('Failed to load cart:', error);
      // 如果获取购物车失败，仍然可以打开菜单
      if (recommendedMenu && recommendedMenu.length > 0) {
        const quantities = {};
        recommendedMenu.forEach(dish => {
          const dishId = dish.id;
          if (dishId) {
            quantities[dishId] = dish.quantity || 1;
          }
        });
        setDishQuantities(quantities);
      } else {
        setDishQuantities({});
      }
      setShowMenuPopup(true);
    }
  };

  // 处理分类切换，滚动到对应分类
  const handleCategoryChange = (key) => {
    setActiveCategory(key);
    
    const element = categoryRefs.current[key];
    if (element && menuContentRef.current) {
      const container = menuContentRef.current;
      const offsetTop = element.offsetTop - container.offsetTop - 10;
      
      container.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  // 监听滚动，更新当前激活的分类
  const handleMenuScroll = () => {
    if (!menuContentRef.current) return;

    const container = menuContentRef.current;
    const scrollTop = container.scrollTop;

    // 找到当前滚动位置对应的分类
    for (let i = categories.length - 1; i >= 0; i--) {
      const category = categories[i];
      const element = categoryRefs.current[category._id];
      
      if (element) {
        const offsetTop = element.offsetTop - container.offsetTop - 100;
        if (scrollTop >= offsetTop) {
          setActiveCategory(category._id);
          break;
        }
      }
    }
  };

  // 检查菜品的食材是否充足
  const hasEnoughIngredients = (dish) => {
    // 如果没有绑定食材，允许展示
    if (!dish.ingredients || dish.ingredients.length === 0) {
      return true;
    }
    
    // 检查所有绑定的食材是否都有库存
    return dish.ingredients.every(ingredientId => {
      const ingredient = inventoryList.find(item => item._id === ingredientId);
      // 如果找不到食材或数量为0，则不充足
      return ingredient && ingredient.quantity > 0;
    });
  };

  // 按分类分组菜品（支持搜索）
  const groupDishesByCategory = () => {
    const grouped = {};
    categories.forEach(category => {
      const categoryDishes = allDishes.filter(dish => {
        // 基本过滤：分类匹配且库存充足
        if (dish.categoryId !== category._id || !hasEnoughIngredients(dish)) {
          return false;
        }
        
        // 搜索过滤：如果有搜索关键词，检查菜品名称或描述是否匹配
        if (menuSearchKeyword) {
          const keyword = menuSearchKeyword.toLowerCase();
          const nameMatch = dish.name?.toLowerCase().includes(keyword);
          const descMatch = dish.description?.toLowerCase().includes(keyword);
          return nameMatch || descMatch;
        }
        
        return true;
      });
      
      grouped[category._id] = {
        category,
        dishes: categoryDishes
      };
    });
    return grouped;
  };

  // 计算每个分类下选中的菜品数量
  const getCategoryDishCount = (categoryId) => {
    const categoryDishes = groupDishesByCategory()[categoryId]?.dishes || [];
    let count = 0;
    categoryDishes.forEach(dish => {
      const quantity = dishQuantities[dish._id] || 0;
      if (quantity > 0) {
        count += quantity;
      }
    });
    return count;
  };

  // 更新菜品数量
  const handleDishQuantityChange = (dishId, value) => {
    // 更新前端状态
    setDishQuantities(prev => {
      const newQuantities = {
        ...prev,
        [dishId]: value
      };
      
      // 防抖更新购物车
      if (updateCartTimerRef.current) {
        clearTimeout(updateCartTimerRef.current);
      }
      
      updateCartTimerRef.current = setTimeout(async () => {
        try {
          // 构建购物车数据
          const cartData = Object.entries(newQuantities)
            .filter(([_, quantity]) => quantity > 0)
            .map(([id, quantity]) => ({
              dishId: id,
              quantity
            }));
          
          // 调用API更新购物车
          await orderApi.updateCart(cartData);
          
          console.log('购物车已实时更新');
        } catch (error) {
          console.error('Failed to update cart:', error);
          // 不显示Toast，避免频繁打扰用户
        }
      }, 800); // 800ms防抖延迟
      
      return newQuantities;
    });
  };

  // 计算选中菜品的总价
  const calculateTotalPrice = () => {
    let total = 0;
    Object.entries(dishQuantities).forEach(([dishId, quantity]) => {
      if (quantity > 0) {
        const dish = allDishes.find(d => d._id === dishId);
        if (dish) {
          total += dish.price * quantity;
        }
      }
    });
    return total;
  };

  // 确认选择的菜品
  const handleConfirmSelection = async () => {
    const selectedDishes = [];
    Object.entries(dishQuantities).forEach(([dishId, quantity]) => {
      if (quantity > 0) {
        const dish = allDishes.find(d => d._id === dishId);
        if (dish) {
          selectedDishes.push({ ...dish, quantity });
        }
      }
    });

    if (selectedDishes.length === 0) {
      Toast.show({ content: t('selectDishes', language) });
      return;
    }

    // 计算总价
    const totalPrice = calculateTotalPrice();

    try {
      // 更新购物车到后端
      const cartData = Object.entries(dishQuantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([dishId, quantity]) => ({
          dishId,
          quantity
        }));
      
      await orderApi.updateCart(cartData);

      // 生成订单消息
      const orderMessage = {
        role: 'user',
        content: t('selectedDishesMsg', language),
        menu: selectedDishes.map(dish => ({
          id: dish._id,
          name: dish.name,
          price: dish.price,
          description: dish.description,
          image: dish.imageUrl || `https://picsum.photos/200/200?random=${dish._id}`,
          spicy: dish.isSpicy,
          quantity: dish.quantity
        })),
        totalPrice: totalPrice,
        timestamp: new Date(),
        isUserOrder: true,
      };

      // 添加到消息列表
      setMessages(prev => [...prev, orderMessage]);
      
      Toast.show({ icon: 'success', content: t('dishSelected', language, { count: selectedDishes.length }) });
      setShowMenuPopup(false);
      
      // 清空选择
      setDishQuantities({});
    } catch (error) {
      console.error('Failed to update cart:', error);
      Toast.show({ icon: 'fail', content: t('cartUpdateFailed', language) });
    }
  };

  useEffect(() => {
    // 初始化：先清空购物车和聊天历史，再获取欢迎消息
    const initializeChat = async () => {
      try {
        // 清空购物车和聊天历史
        await orderApi.clearCart();
        console.log('购物车和聊天历史已清空');
      } catch (error) {
        console.error('清空购物车失败:', error);
        // 即使清空失败，也继续显示欢迎消息
      }
      
      // 显示欢迎词
      setMessages([
        {
          role: 'assistant',
          content: t('orderWelcome', language),
          timestamp: new Date(),
          showQuickButtons: true, // 标记此消息显示快捷按钮
        },
      ]);
      setShowQuickButtons(true); // 重置快捷按钮显示状态
    };
    
    initializeChat();
  }, []);

  // Socket.IO 连接和座位分配
  useEffect(() => {
    // 初始化 Socket.IO 连接
    socket = io(`${config.socketUrl}/seat`, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (userInfo.nickname) {
        socket.emit('requestSeat', { nickname: userInfo.nickname });
      } else {
        socket.emit('requestSeat', {});
      }
    });

    socket.on('seatAssigned', (data) => {
      setSeatInfo(data);
      setQueueInfo(null);
      Toast.show({
        icon: 'success',
        content: t('seatAssigned', language, { seatNumber: data.seatNumber }),
        duration: 3000,
      });
    });

    socket.on('needQueue', (data) => {
      setQueueInfo(data);
      setSeatInfo(null);
      Toast.show({
        icon: 'fail',
        content: t('needQueue', language, { position: data.position }),
        duration: 3000,
      });
    });

    socket.on('queueUpdate', (data) => {
      setQueueInfo(data);
      if (data.position <= 3) {
        Toast.show({
          content: t('queueUpdated', language, { position: data.position }),
          duration: 2000,
        });
      }
    });

    socket.on('error', (data) => {
      Toast.show({
        icon: 'fail',
        content: data.message || t('connectionError', language),
      });
    });

    // 监听大厅状态变更
    socket.on('hallStatusChanged', (data) => {
      if (data.status === 'closed') {
        // 大厅关闭，退出聊天界面
        Toast.show({
          icon: 'fail',
          content: t('hallClosed', language),
          duration: 3000,
        });
        
        // 使用 setTimeout 确保在 Toast 显示后执行退出操作
        setTimeout(() => {
          // 断开socket连接
          if (socket) {
            socket.disconnect();
          }
          // 返回角色选择页面
          navigate('/role-select', { replace: true });
        }, 3000);
      } else if (data.status === 'open') {
        Toast.show({
          icon: 'success',
          content: t('hallOpened', language),
          duration: 2000,
        });
      }
    });

    // 监听关门时的强制排队通知
    socket.on('hallClosed', (data) => {
      setQueueInfo(data);
      setSeatInfo(null);
      Toast.show({
        icon: 'fail',
        content: t('hallClosedQueue', language, { message: data.message, position: data.position }),
        duration: 3000,
      });
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [navigate]);

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
      !msg.isContinueOrder &&
      !msg.isGameRecommend &&
      !msg.isOrderConfirm &&
      (!streamCharCounts[lastIdx] || streamCharCounts[lastIdx] < msg.content.length)
    ) {
      let count = streamCharCounts[lastIdx] || 0;
      const timer = setTimeout(() => {
        setStreamCharCounts(prev => ({
          ...prev,
          [lastIdx]: count + 1
        }));
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [messages, streamCharCounts]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (updateCartTimerRef.current) {
        clearTimeout(updateCartTimerRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 判断是否与点餐相关
  const isOrderRelated = (text) => {
    const keywords = ['点餐', '菜', '吃', '预算', '人', '口味', '辣', '甜', '酸', '咸', '忌口', '推荐', '想要', '来点'];
    return keywords.some(keyword => text.includes(keyword));
  };

  // 处理快捷按钮点击
  const handleQuickButtonClick = (text) => {
    setInputValue(text);
    // 自动发送
    setTimeout(() => {
      handleSendWithText(text);
    }, 100);
  };

  // 处理发送消息（支持传入文本）
  const handleSendWithText = async (messageText) => {
    const content = (messageText || inputValue).trim();
    if (!content || isGenerating) return;

    const userMessage = {
      role: 'user',
      content: content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    // 1. 先插入loading消息
    const loadingMessage = {
      role: 'assistant',
      content: <>{t('checkingMenu', language)}<DotLoading style={{marginLeft: 8}} /></>,
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
       const res = await orderApi.aiOrder(content);
       // 后端返回结构 data: { message: string, cart: { dishes: any[], totalPrice: number } }
       const { message, cart } = res.data || {};
       const dishes = cart?.dishes || [];
       
       let menu = null;
       let totalPrice = cart?.totalPrice || 0;
       
       if (dishes && dishes.length > 0) {
          menu = dishes.map(d => ({
             id: d.dishId,
             name: d.name,
             price: d.price,
             description: d.description,
             image: d.image || d.imageUrl || `https://picsum.photos/200/200?random=${d.price}`,
             isSpicy: d.isSpicy || false,
             quantity: d.quantity || 1
          }));
          setCurrentMenu(menu);
       }

       // 2. 替换loading消息为推荐结果
       setMessages(prev => {
         const idx = prev.findIndex(m => m.isLoading);
         if (idx !== -1) {
           const newMsgs = [...prev];
           newMsgs[idx] = {
             role: 'assistant',
             content: message || t('processingRequest', language),
             menu: menu,
             totalPrice: totalPrice,
             timestamp: new Date(),
           };
           return newMsgs;
         } else {
           // fallback
           return [
             ...prev,
             {
               role: 'assistant',
               content: message || t('processingRequest', language),
               menu: menu,
               totalPrice: totalPrice,
               timestamp: new Date(),
             }
           ];
         }
       });

    } catch(err) {
       // 失败时也替换loading消息为错误
       setMessages(prev => {
         const idx = prev.findIndex(m => m.isLoading);
         if (idx !== -1) {
           const newMsgs = [...prev];
           newMsgs[idx] = {
             role: 'assistant',
             content: t('serviceError', language),
 
             timestamp: new Date(),
           };
           return newMsgs;
         } else {
           return [
             ...prev,
             {
               role: 'assistant',
               content: t('serviceError', language),
 
               timestamp: new Date(),
             }
           ];
         }
       });
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理发送消息（旧函数，保持向后兼容）
  const handleSend = async () => {
    await handleSendWithText(inputValue);
  };

  // 确认订单
  const handleConfirmOrder = async () => {
    // 情况1：从AI推荐菜单创建订单（使用currentMenu）
    // 情况2：从手动选择创建订单（使用dishQuantities）
    let orderItems = [];
    let totalPrice = 0;
    
    if (currentMenu && currentMenu.length > 0) {
      // AI推荐的菜单
      orderItems = currentMenu.map(dish => ({
        dishId: dish.id || dish._id,
        quantity: dish.quantity || 1
      }));
      totalPrice = currentMenu.reduce((sum, dish) => sum + (dish.price * (dish.quantity || 1)), 0);
    } else {
      // 手动选择的菜单
      Object.entries(dishQuantities).forEach(([dishId, quantity]) => {
        if (quantity > 0) {
          const dish = allDishes.find(d => d._id === dishId);
          if (dish) {
            orderItems.push({
              dishId: dishId,
              quantity: quantity
            });
            totalPrice += dish.price * quantity;
          }
        }
      });
    }

    if (orderItems.length === 0) {
      Toast.show({ icon: 'fail', content: t('selectDishFirst', language) });
      return;
    }

    try {
      // 调用后端创建订单接口
      const res = await orderApi.createOrder({ items: orderItems });
      
      // 后端返回格式: { code: 0, message: '订单创建成功', data: { orderId, dishes, totalPrice, status, ... } }
      const orderData = res.data;
      const orderId = orderData.orderId || `ORDER${Date.now()}`;
      
      setOrderConfirmed(true);
      setShowMenuPopup(false);
      setCurrentMenu(null); // 清空当前菜单
      setDishQuantities({}); // 清空选择的菜品
      
      // 显示订单确认消息
      const confirmMessage = {
        role: 'assistant',
        content: t('orderCreateSuccess', language, { orderId, total: totalPrice.toFixed(2) }),
        timestamp: new Date(),
        isOrderConfirm: true,
      };
      setMessages(prev => [...prev, confirmMessage]);
      
      // 1秒后发送游戏推荐消息
      setTimeout(() => {
        const gameMessage = {
          role: 'assistant',
          content: t('playGameWhileWaiting', language),
          timestamp: new Date(),
          isGameRecommend: true,
        };
        setMessages(prev => [...prev, gameMessage]);
      }, 1000);

    } catch (e) {
      const errorMsg = e.response?.data?.message || t('orderCreateFailed', language);
      Toast.show({ icon: 'fail', content: errorMsg });
    }
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

  // 检查麦克风权限
  const checkMicrophonePermission = async () => {
    try {
      // 检查浏览器是否支持权限API
      if (!navigator.permissions) {
        // 不支持权限API，直接尝试获取麦克风
        return { state: 'prompt' };
      }
      
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      return permissionStatus;
    } catch (error) {
      // 某些浏览器可能不支持查询麦克风权限
      console.log('权限查询不支持，将直接请求麦克风访问');
      return { state: 'prompt' };
    }
  };

  // 开始录音
  const handleTouchStart = async () => {
    setIsRecording(true);
    setIsOverCancel(false);
    audioChunksRef.current = [];
    
    try {
      // 检查麦克风权限状态
      const permissionStatus = await checkMicrophonePermission();
      
      // 如果权限被拒绝，显示友好提示
      if (permissionStatus.state === 'denied') {
        Dialog.alert({
          content: t('micPermissionDenied', language),
          confirmText: t('iKnow', language),
        });
        setIsRecording(false);
        return;
      }
      
      // 如果是首次请求，显示引导提示
      if (permissionStatus.state === 'prompt') {
        Toast.show({
          content: t('allowMicAccess', language),
          duration: 2000,
        });
      }
      
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
      
      // 创建 MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      // 收集音频数据
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // 开始录音
      mediaRecorderRef.current.start();
    } catch (error) {
      console.error('麦克风访问错误:', error);
      
      // 根据错误类型提供不同的提示
      let errorMessage = t('cannotAccessMic', language);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = t('micPermissionRejected', language);
      } else if (error.name === 'NotFoundError') {
        errorMessage = t('micNotFound', language);
      } else if (error.name === 'NotReadableError') {
        errorMessage = t('micOccupied', language);
      }
      
      Toast.show({
        content: errorMessage,
        duration: 3000,
      });
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
        Toast.show(t('recordingCancelled', language));
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
            const duration = Math.ceil(tempAudio.duration);
            
            // 添加语音消息到聊天
            const voiceMessage = {
              role: 'user',
              content: t('voiceMessage', language),
              audioUrl: audioUrl,
              audioType: mimeType,
              audioDuration: duration,
              timestamp: new Date(),
            };
            
            setMessages(prev => [...prev, voiceMessage]);
            Toast.show(t('voiceSent', language));
            
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
    Toast.show(t('recordingCancelled', language));
  };

  // 刷新菜单 - 重新获取推荐菜单
  const handleRefreshMenu = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    // 显示加载消息
    const loadingMessage = {
      role: 'assistant',
      content: <>{t('refreshingMenu', language)}<DotLoading style={{marginLeft: 8}} /></>,
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    try {
       const res = await orderApi.refreshMenu();
       const { message, cart } = res.data || {};
       const dishes = cart?.dishes || [];
       
       let menu = null;
       let totalPrice = cart?.totalPrice || 0;
       
       if (dishes && dishes.length > 0) {
          menu = dishes.map(d => ({
             id: d.dishId,
             name: d.name,
             price: d.price,
             description: d.description,
             image: d.image || d.imageUrl || `https://picsum.photos/200/200?random=${d.price}`,
             isSpicy: d.isSpicy || false,
             quantity: d.quantity || 1
          }));
          setCurrentMenu(menu);
       }

       // 替换loading消息为推荐结果
       setMessages(prev => {
         const idx = prev.findIndex(m => m.isLoading);
         if (idx !== -1) {
           const newMsgs = [...prev];
           newMsgs[idx] = {
             role: 'assistant',
             content: message || t('refreshedMenu', language),
             menu: menu,
             totalPrice: totalPrice,
             timestamp: new Date(),
           };
           return newMsgs;
         } else {
           // fallback
           return [
             ...prev,
             {
               role: 'assistant',
               content: message || '已为您重新推荐以下菜品：',
               menu: menu,
               totalPrice: totalPrice,
               timestamp: new Date(),
             }
           ];
         }
       });
       
    } catch(e) {
       // 移除loading消息
       setMessages(prev => prev.filter(m => !m.isLoading));
       Toast.show({
         icon: 'fail',
         content: e.message || t('refreshFailed', language)
       });
    } finally {
       setIsGenerating(false);
    }
  };

  // 加载订单历史
  const loadOrderHistory = async (isRefresh = false) => {
    if (loadingOrderHistory) return;
    
    setLoadingOrderHistory(true);
    try {
      const currentPage = isRefresh ? 1 : orderHistoryPage;
      const params = {
        page: currentPage,
        limit: 10,
      };
      
      const res = await orderApi.getMyOrders(params);
      const { orders: newOrders, totalPages } = res.data;
      
      if (isRefresh) {
        setOrderHistory(newOrders);
        setOrderHistoryPage(2);
        setOrderHistoryHasMore(totalPages > 1);
      } else {
        setOrderHistory(prev => [...prev, ...newOrders]);
        setOrderHistoryPage(currentPage + 1);
        setOrderHistoryHasMore(currentPage < totalPages);
      }
    } catch (error) {
      Toast.show({ icon: 'fail', content: t('loadFailed', language) });
    } finally {
      setLoadingOrderHistory(false);
    }
  };

  // 打开订单历史弹窗
  const handleOpenOrderHistory = () => {
    setShowOrderHistoryPopup(true);
    if (orderHistory.length === 0) {
      loadOrderHistory(true);
    }
  };

  // 下拉刷新订单历史
  const onRefreshOrderHistory = async () => {
    await loadOrderHistory(true);
  };

  // 格式化时间
  const formatOrderTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return t('justNow', language);
    if (minutes < 60) return t('minutesAgo', language, { n: minutes });
    if (hours < 24) return t('hoursAgo', language, { n: hours });
    if (days < 7) return t('daysAgo', language, { n: days });
    return date.toLocaleDateString();
  };

  return (
    <div className="user-order-container">
      <NavBar 
        onBack={() => navigate('/role-select')}
        right={
          <UnorderedListOutline 
            fontSize={24} 
            onClick={handleOpenOrderHistory}
            style={{ cursor: 'pointer' }}
          />
        }
      >
        {t('ordering', language)}
        {seatInfo && (
          <span style={{ fontSize: '14px', marginLeft: '10px', color: '#00b578' }}>
            {t('seatInfo', language, { seatNumber: seatInfo.seatNumber })}
          </span>
        )}
        {queueInfo && (
          <span style={{ fontSize: '14px', marginLeft: '10px', color: '#ff8f1f' }}>
            {t('queueInfo', language, { position: queueInfo.position })}
          </span>
        )}
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
                        {t('startGame', language)}
                      </Button>
                    </div>
                  </div>
                ) : message.isContinueOrder ? (
                  <div className="continue-order-card">
                    <div className="continue-order-content">
                      <div className="continue-order-icon">🍽️</div>
                      <div className="continue-order-text">{message.content}</div>
                    </div>
                    <div className="continue-order-actions">
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenMenuPopup(null)}
                        style={{ flex: '1' }}
                      >
                        {t('continueOrder', language)}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="message-content">
                    {typeof message.content === 'string'
                      ? (message.role === 'assistant' && !message.menu && !message.audioUrl && !message.isContinueOrder && !message.isGameRecommend && !message.isOrderConfirm && !message.isHistoryMessage
                          ? message.content.slice(0, streamCharCounts[index] || 0)
                          : message.content)
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
                  
                  <div className="dishes-container" onClick={() => handleOpenMenuPopup(message.menu)}>
                    {message.menu.map(dish => (
                      <div key={dish.id} className="dish-item">
                        <div className="dish-info">
                          <div className="dish-name">{dish.name}</div>
                          <div className="dish-bottom">
                            <span className="dish-price">¥{dish.price}</span>
                            <span className="dish-quantity">x{dish.quantity || 1}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="menu-footer">
                    <div className="total-info">
                      <span className="label">{t('total', language)}</span>
                      <span className="total-amount">¥{message.totalPrice}</span>
                    </div>
                  </div>
                  
                  {!orderConfirmed && !message.isHistoryMessage && (
                    <div className="menu-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button 
                        size="small" 
                        color="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefreshMenu();
                        }}
                        disabled={isGenerating}
                      >
                        🔄 {t('refresh', language)}
                      </Button>
                      <Button 
                        size="small" 
                        color={queueInfo && !seatInfo ? 'default' : 'success'}
                        onClick={() => {
                          if (queueInfo && !seatInfo) {
                            Toast.show({
                              icon: 'fail',
                              content: t('waitForSeat', language),
                            });
                          } else {
                            handleConfirmOrder();
                          }
                        }}
                        disabled={queueInfo && !seatInfo}
                      >
                        {t('pay', language)}
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
        {/* 快捷按钮区域 - 固定在输入框上方 */}
        <div className="quick-buttons-fixed-container">
          {quickButtons.map((button, btnIndex) => (
            <button
              key={btnIndex}
              className="quick-button-fixed"
              onClick={() => handleQuickButtonClick(button.text)}
            >
              <span className="quick-button-icon">{button.icon}</span>
              <span className="quick-button-text">{button.text}</span>
            </button>
          ))}
        </div>
        
        <div className="input-container">
          <div className="game-tag-container">
            <Tag 
              color="primary" 
              onClick={() => {
                setShowGameIframe(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              🎮 FlappyBird
            </Tag>
          </div>
          <div className="input-row">
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
                  <span className="voice-input-text">{t('holdToSpeak', language)}</span>
                </div>
              ) : (
                <Input
                  placeholder={t('msgPlaceholder', language)}
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
                  <ShopOutlined className="icon-btn" fontSize={32} onClick={handleOpenMenuPopup} />
                </>
              )}
            </div>
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
                {t('cancel', language)}
              </div>
              <div className="action-btn convert-btn">
                {t('slideToConvert', language)}
              </div>
              <div className={`action-btn send-btn ${!isOverCancel ? 'active' : ''}`}>
                {t('releaseToSend', language)}
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
            src={(() => {
              const userName = localStorage.getItem('userName') || '游客';
              return `/game/?playerName=${encodeURIComponent(userName)}`;
            })()}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="Flappy Bird Game"
          />
        </div>
      </Popup>

      {/* 菜单浏览 Popup */}
      <Popup
        visible={showMenuPopup}
        onMaskClick={() => setShowMenuPopup(false)}
        onClose={() => setShowMenuPopup(false)}
        bodyStyle={{ 
          height: '80vh',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          overflow: 'hidden'
        }}
      >
        <div className="menu-popup-container">
          {/* 搜索栏 */}
          <div className="menu-popup-search">
            <SearchBar
              placeholder={t('searchDishes', language)}
              value={menuSearchKeyword}
              onChange={setMenuSearchKeyword}
              onClear={() => setMenuSearchKeyword('')}
            />
          </div>
          
          <div className="menu-popup-content">
            {/* 左侧分类栏 */}
            <div className="menu-popup-sidebar">
              <SideBar
                activeKey={activeCategory}
                onChange={handleCategoryChange}
              >
                {categories.map(category => {
                  const count = getCategoryDishCount(category._id);
                  return (
                    <SideBar.Item
                      key={category._id}
                      title={
                        <Badge content={count > 0 ? count : null} style={{ '--right': '-8px', '--top': '8px' }}>
                          {category.name}
                        </Badge>
                      }
                    />
                  );
                })}
              </SideBar>
            </div>

            {/* 右侧菜品列表 */}
            <div 
              className="menu-popup-dishes"
              ref={menuContentRef}
              onScroll={handleMenuScroll}
            >
              {categories.length === 0 ? (
                <Empty description={t('noCategories', language)} />
              ) : (
                categories.map(category => {
                  const categoryDishes = groupDishesByCategory()[category._id]?.dishes || [];
                  
                  return (
                    <div 
                      key={category._id} 
                      className="popup-category-section"
                      ref={el => categoryRefs.current[category._id] = el}
                    >
                      <Divider contentPosition="left">{category.name}</Divider>

                      {categoryDishes.length === 0 ? (
                        <div className="empty-category">{t('noDishes', language)}</div>
                      ) : (
                        <div className="popup-dishes-list">
                          {categoryDishes.map(dish => {
                            const selected = dishQuantities[dish._id] >= 1;
                            return (
                              <div
                                key={dish._id}
                                className={`popup-dish-card${selected ? ' popup-dish-card-selected' : ''}`}
                              >
                                <div className="popup-dish-info">
                                  <div className="popup-dish-name">{dish.name}</div>
                                  {dish.description && (
                                    <div className="popup-dish-description">
                                      {dish.description}
                                    </div>
                                  )}
                                  <div className="popup-dish-tags">
                                    {dish.isSpicy && <span key={`${dish._id}-spicy`} className="tag spicy">🌶️ {t('spicy', language)}</span>}
                                    {dish.hasScallions && <span key={`${dish._id}-scallions`} className="tag">🧅 {t('scallions', language)}</span>}
                                    {dish.hasCilantro && <span key={`${dish._id}-cilantro`} className="tag">🌿 {t('cilantro', language)}</span>}
                                    {dish.hasGarlic && <span key={`${dish._id}-garlic`} className="tag">🧄 {t('garlic', language)}</span>}
                                  </div>
                                  <div className="popup-dish-bottom">
                                    <span className="popup-dish-price">¥{dish.price}</span>
                                    <Stepper
                                      value={dishQuantities[dish._id] || 0}
                                      onChange={(value) => handleDishQuantityChange(dish._id, value)}
                                      min={0}
                                      max={99}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 底部固定栏 */}
          <div className="menu-popup-footer">
            <div className="total-section">
              <span className="total-label">{t('total', language)}：</span>
              <span className="total-price">¥{calculateTotalPrice()}</span>
            </div>
            <Button
              color={queueInfo && !seatInfo ? 'default' : 'primary'}
              onClick={() => {
                if (queueInfo && !seatInfo) {
                  Toast.show({
                    icon: 'fail',
                    content: t('waitForSeat', language),
                  });
                } else {
                  handleConfirmOrder();
                }
              }}
              disabled={queueInfo && !seatInfo}
              className="confirm-btn"
            >
              {t('pay', language)}{queueInfo && !seatInfo ? t('queuing', language) : ''}
            </Button>
          </div>
        </div>
      </Popup>

      {/* 订单历史 Popup */}
      <Popup
        visible={showOrderHistoryPopup}
        onMaskClick={() => setShowOrderHistoryPopup(false)}
        onClose={() => setShowOrderHistoryPopup(false)}
        bodyStyle={{ 
          height: '80vh',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          overflow: 'hidden'
        }}
      >
        <div className="order-history-popup-container">
          <div className="order-history-header">
            <h3>{t('myOrders', language)}</h3>
          </div>
          
          <div className="order-history-content">
            <PullToRefresh onRefresh={onRefreshOrderHistory}>
              {orderHistory.length === 0 && !loadingOrderHistory ? (
                <Empty description={t('noOrders', language)} />
              ) : (
                <>
                  <List>
                    {orderHistory.map(order => {
                      const statusConfig = {
                        pending: { text: '待制作', color: 'warning' },
                        paid: { text: '已支付', color: 'success' },
                        preparing: { text: '制作中', color: 'primary' },
                        completed: { text: '已完成', color: 'default' },
                        cancelled: { text: '已取消', color: 'danger' },
                      };
                      const status = statusConfig[order.status] || statusConfig.pending;
                      
                      return (
                        <List.Item
                          key={order._id}
                          description={
                            <div>
                              <div style={{ marginBottom: '8px' }}>
                                {t('orderNumber', language)}：{order._id}
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontWeight: '500', marginBottom: '4px' }}>{t('orderDetails', language)}：</div>
                                {order.dishes.map((dish, index) => (
                                  <div key={index} style={{ marginLeft: '8px', color: '#666', fontSize: '13px' }}>
                                    · {dish.name} × {dish.quantity} <span style={{ color: '#ff6430' }}>¥{dish.price.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                              <div style={{ color: '#999', fontSize: '12px' }}>
                                {formatOrderTime(order.createdAt)}
                              </div>
                            </div>
                          }
                          extra={
                            <div style={{ textAlign: 'right' }}>
                              <Tag color={status.color} style={{ marginBottom: '8px' }}>
                                {status.text}
                              </Tag>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff6430' }}>
                                ¥{order.totalPrice.toFixed(2)}
                              </div>
                            </div>
                          }
                        >
                          <div style={{ fontWeight: 500 }}>
                            {t('totalItems', language, { count: order.dishes.reduce((sum, d) => sum + d.quantity, 0) })}
                          </div>
                        </List.Item>
                      );
                    })}
                  </List>
                  <InfiniteScroll 
                    loadMore={() => loadOrderHistory(false)} 
                    hasMore={orderHistoryHasMore} 
                  />
                </>
              )}
            </PullToRefresh>
          </div>
        </div>
      </Popup>

      {/* FlappyBird游戏弹窗 */}
      <Popup
        visible={showGameIframe}
        onMaskClick={() => setShowGameIframe(false)}
        bodyStyle={{
          height: '80vh',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      >
        <div className="game-popup-container">
          <div className="game-popup-header">
            <span className="game-popup-title">🎮 FlappyBird</span>
            <Button 
              size="small" 
              color="default"
              onClick={() => setShowGameIframe(false)}
            >
              {t('close', language)}
            </Button>
          </div>
          <iframe
            src={(() => {
              const userName = localStorage.getItem('userName') || '游客';
              return `/game/?playerName=${encodeURIComponent(userName)}`;
            })()}
            className="game-iframe"
            title="FlappyBird Game"
            frameBorder="0"
            allowFullScreen
          />
        </div>
      </Popup>
    </div>
  );
}

export default UserOrder;
