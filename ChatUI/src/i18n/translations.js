export const translations = {
  zh: {
    // Register page
    welcome: '欢迎使用点餐系统',
    enterName: '请输入您的名字开始使用',
    namePlaceholder: '请输入您的名字',
    startUsing: '开始使用',
    registerSuccess: '注册成功！',
    pleaseEnterName: '请输入您的名字',

    // RoleSelect page
    welcomeUser: '欢迎，{name}！',
    selectRole: '请选择您的身份',
    imUser: '我是用户',
    imMerchant: '我是商家',
    userDesc: '开始点餐，享受美食',
    merchantDesc: '管理订单，查看数据',
    orderingSystem: '点餐系统',

    // UserOrder page
    ordering: '点餐',
    orderWelcome: '您好！欢迎使用点餐系统。请告诉我您的需求，比如：人数、预算、忌口、喜好等。',
    notSupportChat: '我是一个点餐系统，不支持闲聊。请告诉我您的点餐需求。',
    recommendDishes: '根据您的需求，我为您推荐以下菜品：',
    refreshedMenu: '已为您重新推荐以下菜品：',
    confirm: '确认',
    lookAgain: '再看看',
    refresh: '刷新',
    confirmOrder: '确认订单？总计：¥{total}',
    orderSuccess: '订单创建成功！\n订单详情：\n{details}\n总计：¥{total}',
    playGame: '是否进行游戏？',
    startGame: '开始游戏',
    noThanks: '不了',
    gameDev: '游戏功能开发中...',
    askMoreNeeds: '好的，请告诉我您还有什么需求？我会为您重新推荐。',
    inputPlaceholder: '请输入您的点餐需求...',

    // MerchantDashboard page
    merchantBackend: '商家后台',
    orders: '订单',
    inventory: '库存',
    rankings: '排行榜',
    reports: '报表',
    orderList: '订单列表',
    time: '时间',
    completed: '已完成',
    inProgress: '进行中',
    dishInventory: '菜品库存',
    addDish: '上新菜',
    stock: '库存',
    addDishTitle: '上新菜品',
    dishName: '菜品名称',
    price: '价格',
    description: '描述',
    stockAmount: '库存',
    enterDishName: '请输入菜品名称',
    enterPrice: '请输入价格',
    enterDescription: '请输入描述',
    enterStock: '请输入库存',
    addSuccess: '上新成功！',
    gameRankings: '游戏排行榜',
    score: '分',
    todayRevenue: '今日营收',
    increaseFromYesterday: '较昨日增长 {percent}%',
    topTenDishes: '销售前十菜品',
  },
  en: {
    // Register page
    welcome: 'Welcome to Ordering System',
    enterName: 'Please enter your name to start',
    namePlaceholder: 'Enter your name',
    startUsing: 'Get Started',
    registerSuccess: 'Registration successful!',
    pleaseEnterName: 'Please enter your name',

    // RoleSelect page
    welcomeUser: 'Welcome, {name}!',
    selectRole: 'Please select your role',
    imUser: "I'm a User",
    imMerchant: "I'm a Merchant",
    userDesc: 'Start ordering, enjoy food',
    merchantDesc: 'Manage orders, view data',
    orderingSystem: 'Ordering System',

    // UserOrder page
    ordering: 'Ordering',
    orderWelcome: 'Hello! Welcome to the ordering system. Please tell me your requirements, such as: number of people, budget, dietary restrictions, preferences, etc.',
    notSupportChat: 'I am an ordering system and do not support chatting. Please tell me your ordering requirements.',
    recommendDishes: 'Based on your requirements, I recommend the following dishes:',
    refreshedMenu: 'Here are the refreshed recommendations:',
    confirm: 'Confirm',
    lookAgain: 'Look Again',
    refresh: 'Refresh',
    confirmOrder: 'Confirm order? Total: ¥{total}',
    orderSuccess: 'Order created successfully!\nOrder details:\n{details}\nTotal: ¥{total}',
    playGame: 'Would you like to play a game?',
    startGame: 'Start Game',
    noThanks: 'No, thanks',
    gameDev: 'Game feature is under development...',
    askMoreNeeds: 'Sure, what else do you need? I will recommend again.',
    inputPlaceholder: 'Enter your ordering requirements...',

    // MerchantDashboard page
    merchantBackend: 'Merchant Backend',
    orders: 'Orders',
    inventory: 'Inventory',
    rankings: 'Rankings',
    reports: 'Reports',
    orderList: 'Order List',
    time: 'Time',
    completed: 'Completed',
    inProgress: 'In Progress',
    dishInventory: 'Dish Inventory',
    addDish: 'Add Dish',
    stock: 'Stock',
    addDishTitle: 'Add New Dish',
    dishName: 'Dish Name',
    price: 'Price',
    description: 'Description',
    stockAmount: 'Stock',
    enterDishName: 'Enter dish name',
    enterPrice: 'Enter price',
    enterDescription: 'Enter description',
    enterStock: 'Enter stock',
    addSuccess: 'Added successfully!',
    gameRankings: 'Game Rankings',
    score: ' pts',
    todayRevenue: 'Today\'s Revenue',
    increaseFromYesterday: '{percent}% increase from yesterday',
    topTenDishes: 'Top 10 Dishes',
  },
};

export const t = (key, language = 'zh', params = {}) => {
  let text = translations[language]?.[key] || translations.zh[key] || key;
  
  // Replace parameters like {name}, {total}, etc.
  Object.keys(params).forEach(param => {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
  });
  
  return text;
};
