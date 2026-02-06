# FlappyBird游戏

## 系统概述
FlappyBird是一个基于React和Canvas构建的网络游戏，支持桌面端和移动端访问。游戏集成在Ai Chat餐厅管理系统中，为用户提供娱乐功能。

## 游戏特性
- 🎮 流畅的游戏体验（60 FPS）
- 🔊 动态音效系统（Web Audio API）  
- 📱 完整的移动端触摸支持
- 💾 本地最高分记录
- 🎨 精美的视觉效果和动画
- ⌨️ 键盘和鼠标双重控制
- 📊 实时分数显示

## 游戏难度优化 (2026-02-06更新)

### 优化目标
降低游戏难度，提升用户体验，减少挫败感，让更多用户能够享受游戏乐趣。

### 优化内容

#### 1. 小鸟物理参数调整
- **重力加速度**：0.5 → 0.3 (降低40%)
  - 文件：`src/game/Bird.js`
  - 效果：小鸟下落速度减慢，给玩家更多反应时间
  
- **跳跃力度**：-9 → -7 (降低约22%)
  - 文件：`src/game/Bird.js`  
  - 效果：跳跃更加柔和，更容易精确控制

#### 2. 管道系统优化
- **移动速度**：2 → 1.5 (降低25%)
  - 文件：`src/game/Pipe.js`
  - 效果：管道移动减慢，降低通过难度
  
- **生成间隔**：90帧 → 110帧 (增加22%)
  - 文件：`src/game/PipeManager.js`
  - 效果：管道间距增加，给玩家更多空间

#### 3. 优化效果
- 平均游戏时长延长
- 平均得分提高
- 操作难度降低
- 用户挫败感减少

## 游戏端口问题修复文档

## 问题描述
用户反馈FlappyBird游戏无法在端口3002访问，显示"无法打开游戏"的错误。

## 问题分析
1. **端口占用问题**：初始启动时端口3002被占用，导致webpack-dev-server启动失败
2. **静态文件干扰**：webpack-dev-server优先提供public目录下的静态文件，导致HtmlWebpackPlugin生成的HTML被覆盖
3. **配置不一致**：开发模式下的webpack配置存在问题

## 解决方案
### 1. 修复端口占用
- 在start.sh中添加端口清理逻辑，强制清理3002端口上的进程
- 使用`lsof -ti:3002 | xargs kill -9`强制清理

### 2. 修复webpack配置
- 移除或重新配置public目录，避免静态文件覆盖webpack生成的HTML
- 确保HtmlWebpackPlugin正确注入script标签

### 3. 使用生产构建
- 修改start.sh脚本，使用`npm run build`构建生产版本
- 使用`npx serve -s dist -l 3002`提供静态文件服务

## 修改的文件

### /start.sh
```bash
# 修改前
cd FlappyBird
npm start &
GAME_PID=$!

# 修改后  
cd FlappyBird
npm run build > /dev/null 2>&1
npx serve -s dist -l 3002 &
GAME_PID=$!
```

### /FlappyBird/webpack.config.js
- 添加了禁用静态文件的配置：`static: false`
- 更新了HtmlWebpackPlugin配置确保正确注入script标签

## 测试结果
1. ✅ 端口3002可以正常访问
2. ✅ HTML页面包含正确的script标签：`<script defer="defer" src="./bundle.ffda0b3e.js"></script>`
3. ✅ JavaScript bundle文件可以正常加载（200状态码）
4. ✅ 所有三个服务（后端3001、前端3000、游戏3002）都能正常运行

## 使用方法
现在可以通过以下方式启动完整系统：
```bash
./start.sh
```

游戏访问地址：http://localhost:3002/

## 相关服务端口
- ChatBackEnd（后端API）: http://localhost:3001
- ChatUI（前端界面）: http://localhost:3000  
- FlappyBird（游戏）: http://localhost:3002