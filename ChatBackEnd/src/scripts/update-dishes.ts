import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Dish } from '../modules/dish/entities/dish.entity';
import { Model } from 'mongoose';

async function updateDishes() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dishModel = app.get<Model<Dish>>(getModelToken(Dish.name));

  try {
    // 根据菜品名称更新各个菜品的属性
    const dishUpdates = [
      { name: '宫保鸡丁', isSpicy: true, hasScallions: true, hasCilantro: false, hasGarlic: true, cookingTime: 15 },
      { name: '鱼香肉丝', isSpicy: true, hasScallions: true, hasCilantro: false, hasGarlic: true, cookingTime: 12 },
      { name: '麻婆豆腐', isSpicy: true, hasScallions: true, hasCilantro: false, hasGarlic: true, cookingTime: 10 },
      { name: '红烧排骨', isSpicy: false, hasScallions: true, hasCilantro: true, hasGarlic: true, cookingTime: 45 },
      { name: '西红柿炒鸡蛋', isSpicy: false, hasScallions: true, hasCilantro: false, hasGarlic: false, cookingTime: 8 },
      { name: '清炒时蔬', isSpicy: false, hasScallions: false, hasCilantro: false, hasGarlic: true, cookingTime: 6 },
      { name: '酸辣土豆丝', isSpicy: true, hasScallions: true, hasCilantro: true, hasGarlic: true, cookingTime: 10 },
      { name: '可乐鸡翅', isSpicy: false, hasScallions: true, hasCilantro: true, hasGarlic: true, cookingTime: 30 },
      { name: '水煮肉片', isSpicy: true, hasScallions: true, hasCilantro: true, hasGarlic: true, cookingTime: 18 },
      { name: '地三鲜', isSpicy: false, hasScallions: true, hasCilantro: false, hasGarlic: true, cookingTime: 15 },
    ];

    let updatedCount = 0;
    for (const update of dishUpdates) {
      const { name, ...fields } = update;
      const result = await dishModel.updateOne(
        { name },
        { $set: fields },
      );
      updatedCount += result.modifiedCount;
    }

    console.log(`Updated ${updatedCount} dishes with new fields.`);
  } catch (error) {
    console.error('Error updating dishes:', error);
  } finally {
    await app.close();
  }
}

updateDishes();
