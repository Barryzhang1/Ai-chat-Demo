/**
 * 随机分配分类脚本
 * 为所有菜品随机分配一个分类
 * 
 * 使用方法:
 * npm run random-assign-category
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DishService } from '../modules/dish/dish.service';
import { CategoryService } from '../modules/category/category.service';

async function bootstrap() {
  console.log('======================================');
  console.log('  随机分配分类脚本');
  console.log('======================================\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dishService = app.get(DishService);
    const categoryService = app.get(CategoryService);

    // 1. 获取所有分类
    console.log('📂 正在获取所有分类...');
    const categories = await categoryService.findAll();
    
    if (categories.length === 0) {
      console.error('❌ 错误：未找到任何分类，请先创建分类');
      process.exit(1);
    }
    
    console.log(`✅ 找到 ${categories.length} 个分类:`);
    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name}`);
    });
    console.log();

    // 2. 获取所有菜品
    console.log('🍽️  正在获取所有菜品...');
    const dishes = await dishService.findAll();
    
    if (dishes.length === 0) {
      console.log('⚠️  警告：未找到任何菜品');
      return;
    }
    
    console.log(`✅ 找到 ${dishes.length} 道菜品\n`);

    // 3. 开始随机分配
    console.log('🔄 开始随机分配分类...');
    let updatedCount = 0;
    let failedCount = 0;

    for (const dish of dishes) {
      try {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        // 使用类型断言来访问MongoDB的_id字段
        const dishId = (dish as any)._id.toString();
        const categoryId = (randomCategory as any)._id.toString();
        
        await dishService.update(dishId, { categoryId });
        
        updatedCount++;
        process.stdout.write(`\r   进度: ${updatedCount}/${dishes.length} 道菜品已更新`);
      } catch (error) {
        failedCount++;
        console.error(`\n❌ 更新菜品失败: ${(dish as any).name} - ${error.message}`);
      }
    }

    console.log('\n');
    console.log('======================================');
    console.log('  分配完成');
    console.log('======================================');
    console.log(`✅ 成功更新: ${updatedCount} 道菜品`);
    if (failedCount > 0) {
      console.log(`❌ 更新失败: ${failedCount} 道菜品`);
    }
    console.log('======================================\n');

  } catch (error) {
    console.error('\n❌ 执行过程中发生错误:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
