# 🐦 Flappy Bird Game

一个使用 React 和 Canvas 构建的 Flappy Bird 游戏，支持桌面和移动端。

## ✨ 特性

- 🎮 流畅的游戏体验（60 FPS）
- 🔊 动态音效系统（Web Audio API）
- 📱 完整的移动端触摸支持
- 💾 本地最高分记录
- 🎨 精美的视觉效果和动画
- ⌨️ 键盘和鼠标双重控制
- 📊 实时分数显示

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

游戏将自动在浏览器中打开，地址为 `http://localhost:8080`

### 构建生产版本

```bash
npm run build
```

## 🎮 游戏玩法

- **开始游戏**: 点击屏幕或按空格键
- **控制小鸟**: 持续点击或按空格键使小鸟飞行
- **目标**: 避开管道，穿过缝隙得分
- **挑战**: 获得尽可能高的分数！

## 🎯 游戏控制

### 桌面端
- **空格键**: 使小鸟跳跃
- **鼠标点击**: 使小鸟跳跃

### 移动端
- **触摸屏幕**: 使小鸟跳跃

## 📁 项目结构

```
FlappyBird/
├── public/
│   └── index.html          # HTML 模板
├── src/
│   ├── components/
│   │   └── Game.js         # 游戏主组件
│   ├── game/
│   │   ├── Bird.js         # 小鸟类
│   │   ├── Pipe.js         # 管道类
│   │   └── PipeManager.js  # 管道管理器
│   ├── utils/
│   │   ├── draw.js         # 绘制工具函数
│   │   └── sound.js        # 音效系统
│   ├── styles/
│   │   ├── global.css      # 全局样式
│   │   ├── App.css         # 应用样式
│   │   └── Game.css        # 游戏样式
│   ├── App.js              # 应用入口
│   └── index.js            # React 入口
├── webpack.config.js        # Webpack 配置
├── package.json            # 项目配置
└── README.md               # 项目文档
```

## 🔧 技术栈

- **React 18.2** - UI 框架
- **Canvas API** - 游戏渲染
- **Web Audio API** - 音效系统
- **Webpack 5** - 模块打包
- **Babel** - JavaScript 编译

## 🎨 游戏特色

### 物理引擎
- 真实的重力模拟
- 平滑的跳跃动画
- 小鸟旋转效果

### 视觉效果
- 渐变天空背景
- 动态云朵
- 移动的地面
- 精美的管道设计

### 音效系统
- 跳跃音效
- 得分音效
- 碰撞音效
- 游戏结束音效

## 📊 游戏参数

可在代码中调整以下参数来改变游戏难度：

- `gravity`: 重力加速度（默认 0.5）
- `jumpForce`: 跳跃力度（默认 -9）
- `pipeSpeed`: 管道移动速度（默认 2）
- `gapHeight`: 管道间隙高度（默认 150）
- `spawnInterval`: 管道生成间隔（默认 90 帧）

## 🌟 未来功能

- [ ] 多种游戏模式（简单/困难）
- [ ] 皮肤系统（不同的小鸟和背景）
- [ ] 成就系统
- [ ] 排行榜（在线）
- [ ] 更多音效和背景音乐
- [ ] 道具系统

## 📄 许可证

MIT License

## 👨‍💻 开发者

开发愉快！🎮
