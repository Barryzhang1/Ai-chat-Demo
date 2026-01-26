#!/usr/bin/env node

const { MongoClient } = require('mongodb');

// 连接配置
const uri = 'mongodb://root:password@47.118.22.92:27017/?authSource=admin';
const dbName = 'restaurant';
const collectionName = 'dishes';

// 菜品名称库
const dishNames = [
  '宫保鸡丁', '鱼香肉丝', '麻婆豆腐', '红烧排骨', '西红柿炒鸡蛋',
  '清炒时蔬', '酸辣土豆丝', '可乐鸡翅', '水煮肉片', '地三鲜',
  '糖醋里脊', '回锅肉', '蒜蓉西兰花', '干煸四季豆', '青椒肉丝',
  '酸菜鱼', '毛血旺', '剁椒鱼头', '东坡肉', '佛跳墙',
  '梅菜扣肉', '口水鸡', '夫妻肺片', '辣子鸡', '小炒肉',
  '蚂蚁上树', '锅包肉', '京酱肉丝', '鱼头豆腐汤', '酸辣粉',
  '酸汤肥牛', '干锅花菜', '农家小炒肉', '蒜香排骨', '香辣虾',
  '水晶虾仁', '清蒸鲈鱼', '糟溜鱼片', '椒盐排骨', '红烧狮子头'
];

const descriptions = [
  '经典川菜，色香味俱全',
  '家常美味，营养丰富',
  '香辣可口，下饭必备',
  '鲜香嫩滑，老少皆宜',
  '清淡爽口，健康之选',
  '麻辣鲜香，口感十足',
  '酸甜可口，开胃佳品',
  '色泽红亮，味道鲜美',
  '咸鲜入味，回味无穷',
  '浓郁醇香，肥而不腻',
  '外酥里嫩，香气扑鼻',
  '软糯可口，营养丰富',
  '清新爽口，口感丰富',
  '鲜嫩多汁，风味独特',
  '滋味醇厚，令人难忘'
];

// 生成随机菜品
function generateRandomDish(index) {
  const name = dishNames[index % dishNames.length];
  const basePrice = Math.floor(Math.random() * 50) + 15; // 15-65元
  const price = Math.round(basePrice / 5) * 5; // 取整到5的倍数
  
  return {
    name: name,
    price: price,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    isDelisted: false,
    isSpicy: Math.random() > 0.6, // 40% 概率是辣的
    hasScallions: Math.random() > 0.5, // 50% 概率有葱
    hasCilantro: Math.random() > 0.7, // 30% 概率有香菜
    hasGarlic: Math.random() > 0.4, // 60% 概率有蒜
    cookingTime: Math.floor(Math.random() * 30) + 5, // 5-35分钟
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function seedDishes() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔌 正在连接到 MongoDB...');
    await client.connect();
    console.log('✅ 连接成功！');
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // 清空现有数据（可选）
    console.log('\n📋 检查现有数据...');
    const existingCount = await collection.countDocuments();
    console.log(`当前数据库中有 ${existingCount} 条菜品数据`);
    
    // 生成20条随机菜品
    console.log('\n🎲 生成 20 条随机菜品数据...');
    const dishes = [];
    for (let i = 0; i < 20; i++) {
      dishes.push(generateRandomDish(i));
    }
    
    // 插入数据
    console.log('📥 插入数据到数据库...');
    const result = await collection.insertMany(dishes);
    console.log(`✅ 成功插入 ${result.insertedCount} 条菜品数据！`);
    
    // 显示插入的数据
    console.log('\n📊 插入的菜品列表：');
    console.log('-----------------------------------');
    dishes.forEach((dish, index) => {
      const spicyTag = dish.isSpicy ? '🌶️' : '';
      const tags = [];
      if (dish.hasScallions) tags.push('葱');
      if (dish.hasCilantro) tags.push('香菜');
      if (dish.hasGarlic) tags.push('蒜');
      const tagStr = tags.length > 0 ? `[${tags.join(',')}]` : '';
      
      console.log(`${index + 1}. ${dish.name} ${spicyTag} - ¥${dish.price} ${tagStr}`);
      console.log(`   ${dish.description} (${dish.cookingTime}分钟)`);
    });
    console.log('-----------------------------------');
    
    // 统计信息
    const totalCount = await collection.countDocuments();
    const spicyCount = await collection.countDocuments({ isSpicy: true });
    const avgPrice = await collection.aggregate([
      { $group: { _id: null, avgPrice: { $avg: '$price' } } }
    ]).toArray();
    
    console.log('\n📈 数据统计：');
    console.log(`总菜品数: ${totalCount}`);
    console.log(`辣味菜品: ${spicyCount}`);
    console.log(`平均价格: ¥${Math.round(avgPrice[0].avgPrice)}`);
    
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 连接已关闭');
  }
}

// 运行脚本
console.log(`
╔════════════════════════════════════════════╗
║       MongoDB 菜品数据生成器               ║
║   数据库: ${dbName}                        
║   集合: ${collectionName}                  
╚════════════════════════════════════════════╝
`);

seedDishes();
