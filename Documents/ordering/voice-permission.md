# 语音权限请求功能实现文档

## 1. 系统概述

### 1.1 功能描述
在用户聊天界面点击"按住说话"按钮时，智能检测和请求浏览器麦克风权限，提供友好的用户引导和错误提示。

### 1.2 实现目标
- ✅ 在录音前检查麦克风权限状态
- ✅ 根据权限状态提供不同的用户引导
- ✅ 处理权限被拒绝的各种场景
- ✅ 提供友好的错误提示信息
- ✅ 符合项目前端规范（antd-mobile组件）

---

## 2. 架构设计

### 2.1 权限检查流程

```
用户点击"按住说话" 
    ↓
检查浏览器是否支持权限API
    ↓
查询麦克风权限状态
    ↓
    ├─→ granted (已授权) → 直接开始录音
    ├─→ prompt (未决定) → 显示引导提示 → 请求权限
    └─→ denied (已拒绝) → 显示Dialog提示用户修改浏览器设置
         ↓
    权限请求结果
         ↓
    ├─→ 允许 → 开始录音
    └─→ 拒绝 → 显示错误提示并重置状态
```

### 2.2 组件依赖
```javascript
- React Hooks: useState, useRef, useEffect
- antd-mobile: Toast, Dialog
- Web APIs: 
  - navigator.permissions
  - navigator.mediaDevices.getUserMedia
  - MediaRecorder
```

---

## 3. 功能特性

### 3.1 权限状态检测
使用 `navigator.permissions.query()` API 检测麦克风权限状态：
- **granted**: 权限已授予
- **prompt**: 尚未决定，需要询问用户
- **denied**: 权限已被拒绝

### 3.2 兼容性处理
- 检测浏览器是否支持 `navigator.permissions` API
- 不支持时直接尝试获取麦克风（向后兼容）
- 支持多种音频格式（webm、mp4、ogg）

### 3.3 用户引导
- **首次请求**: 显示Toast提示用户允许权限
- **权限拒绝**: 显示Dialog引导用户前往浏览器设置
- **错误处理**: 根据不同错误类型显示对应提示

### 3.4 错误处理
| 错误类型 | 错误名称 | 提示信息 |
|---------|---------|---------|
| 权限拒绝 | NotAllowedError / PermissionDeniedError | 您拒绝了麦克风权限，无法使用语音功能 |
| 设备未找到 | NotFoundError | 未检测到麦克风设备 |
| 设备被占用 | NotReadableError | 麦克风被其他应用占用 |
| 其他错误 | - | 无法访问麦克风 |

---

## 4. 技术实现

### 4.1 核心函数

#### checkMicrophonePermission
检查麦克风权限状态

```javascript
const checkMicrophonePermission = async () => {
  try {
    // 检查浏览器是否支持权限API
    if (!navigator.permissions) {
      return { state: 'prompt' };
    }
    
    const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
    return permissionStatus;
  } catch (error) {
    // 不支持权限查询，返回prompt状态
    console.log('权限查询不支持，将直接请求麦克风访问');
    return { state: 'prompt' };
  }
};
```

#### handleTouchStart (优化后)
开始录音并处理权限请求

```javascript
const handleTouchStart = async () => {
  setIsRecording(true);
  setIsOverCancel(false);
  audioChunksRef.current = [];
  
  try {
    // 1. 检查麦克风权限状态
    const permissionStatus = await checkMicrophonePermission();
    
    // 2. 如果权限被拒绝，显示Dialog提示
    if (permissionStatus.state === 'denied') {
      Dialog.alert({
        content: '麦克风权限已被禁止，请在浏览器设置中允许使用麦克风',
        confirmText: '我知道了',
      });
      setIsRecording(false);
      return;
    }
    
    // 3. 如果是首次请求，显示引导提示
    if (permissionStatus.state === 'prompt') {
      Toast.show({
        content: '请允许使用麦克风以发送语音消息',
        duration: 2000,
      });
    }
    
    // 4. 请求麦克风权限并创建MediaRecorder
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // 5. 选择浏览器支持的音频格式
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
    
    // 6. 创建并启动录音
    mediaRecorderRef.current = new MediaRecorder(stream, options);
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    mediaRecorderRef.current.start();
    
  } catch (error) {
    // 7. 错误处理
    console.error('麦克风访问错误:', error);
    
    let errorMessage = '无法访问麦克风';
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = '您拒绝了麦克风权限，无法使用语音功能';
    } else if (error.name === 'NotFoundError') {
      errorMessage = '未检测到麦克风设备';
    } else if (error.name === 'NotReadableError') {
      errorMessage = '麦克风被其他应用占用';
    }
    
    Toast.show({
      content: errorMessage,
      duration: 3000,
    });
    setIsRecording(false);
  }
};
```

### 4.2 代码位置
- **文件路径**: `/ChatUI/src/pages/UserOrder/UserOrder.js`
- **相关函数**: 
  - `checkMicrophonePermission()` (新增)
  - `handleTouchStart()` (优化)
- **导入组件**: 
  ```javascript
  import { Dialog } from 'antd-mobile';
  ```

---

## 5. 使用指南

### 5.1 用户操作流程

#### 首次使用语音功能
1. 进入用户点餐界面 (`/user-order`)
2. 点击底部输入框左侧的语音图标切换到语音模式
3. 按住中间的"按住 说话"按钮
4. 看到Toast提示："请允许使用麦克风以发送语音消息"
5. 浏览器弹出权限请求，点击"允许"
6. 开始录音，显示录音界面和波形动画
7. 说完后松开按钮发送语音消息

#### 权限被拒绝时
1. 如果点击了"拒绝"或"阻止"
2. 会看到Toast提示："您拒绝了麦克风权限，无法使用语音功能"
3. 下次再点击"按住说话"时，会弹出Dialog提示
4. 引导用户前往浏览器设置中允许麦克风权限

### 5.2 如何恢复麦克风权限

#### Chrome浏览器
1. 点击地址栏左侧的锁图标
2. 找到"麦克风"选项
3. 选择"允许"
4. 刷新页面

#### Safari浏览器
1. 打开"设置" > "Safari" > "网站设置"
2. 找到"麦克风"
3. 选择"允许"

---

## 6. 浏览器兼容性

### 6.1 权限API支持
| 浏览器 | `navigator.permissions` | `getUserMedia` | `MediaRecorder` |
|--------|------------------------|----------------|-----------------|
| Chrome 88+ | ✅ 完全支持 | ✅ | ✅ |
| Safari 15.4+ | ⚠️ 部分支持 | ✅ | ✅ |
| Firefox 90+ | ✅ 完全支持 | ✅ | ✅ |
| Edge 88+ | ✅ 完全支持 | ✅ | ✅ |

### 6.2 兼容性说明
- Safari对`navigator.permissions.query()`的支持有限，代码中已做兼容处理
- 不支持权限API的浏览器会直接请求麦克风权限
- 所有现代浏览器都支持`getUserMedia`和`MediaRecorder`

---

## 7. 测试验证

### 7.1 功能测试
详见：[voice-permission.testcase.md](./voice-permission.testcase.md)

### 7.2 测试要点
- ✅ 首次请求权限的提示是否正确
- ✅ 权限被拒绝时的提示是否清晰
- ✅ 各种错误场景的处理是否恰当
- ✅ 兼容性处理是否有效
- ✅ 不影响其他功能的正常使用

---

## 8. 相关文档

### 8.1 项目文档
- [ChatUI项目简介](.github/fontend-instructions.md)
- [前端代码规范](.github/skills/fontend/SKILL.md)
- [Web UI设计规范](.github/web-ui-specification-instruction.md)

### 8.2 语音功能相关
- [聊天历史记录展示](./chat-history-display.md)
- [AI点餐流程](./ai-ordering.md)
- [用户订单整合](./user-order-integration.md)

### 8.3 Web API参考
- [Permissions API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
- [MediaDevices.getUserMedia() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MediaRecorder API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

---

## 9. 版本历史

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-02-02 | 初始版本，实现麦克风权限智能检测和请求 | - |

---

## 10. 未来优化方向

### 10.1 功能增强
- [ ] 添加权限状态监听，实时更新UI
- [ ] 提供"前往设置"的快捷链接（移动端）
- [ ] 记录用户权限偏好，避免重复提示
- [ ] 支持语音识别权限检测

### 10.2 用户体验
- [ ] 优化首次使用的引导流程
- [ ] 添加权限说明动画
- [ ] 提供"稍后再说"选项
- [ ] 在设置页面添加权限管理入口
