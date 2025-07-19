# VoiceInput 组件

一个功能完整的语音输入组件，支持语音录制、实时转写和多种配置选项。

## 功能特性

- 🎤 **语音录制**: 支持点击录音和停止录音
- 📝 **实时转写**: 基于 Web Speech API 的语音识别
- ⏱️ **时长控制**: 可配置最大录音时长和自动停止
- 🎨 **主题支持**: 完全支持深色/浅色主题切换
- ♿ **无障碍支持**: 完整的 ARIA 属性和键盘导航
- 📱 **响应式设计**: 适配移动端和桌面端
- 🔧 **灵活配置**: 丰富的 Props 配置选项
- 🎯 **回调支持**: 完整的事件回调机制

## 安装依赖

确保项目中已安装以下依赖：

```bash
npm install styled-components @ant-design/icons
```

## 基础用法

```jsx
import VoiceInput from './components/VoiceInput';

function App() {
  const handleResult = (transcript) => {
    console.log('转写结果:', transcript);
  };

  return (
    <VoiceInput 
      onResult={handleResult}
      placeholder="请说出您的问题..."
    />
  );
}
```

## Props 说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `onResult` | `Function` | - | 转写结果回调函数，参数为转写文本 |
| `onStart` | `Function` | - | 开始录音回调函数 |
| `onStop` | `Function` | - | 停止录音回调函数 |
| `disabled` | `boolean` | `false` | 是否禁用组件 |
| `maxDuration` | `number` | `30` | 最大录音时长（秒） |
| `autoStop` | `boolean` | `true` | 是否自动停止录音 |
| `placeholder` | `string` | `'点击录音按钮开始语音输入...'` | 占位符文本 |
| `showControls` | `boolean` | `true` | 是否显示控制按钮 |
| `language` | `string` | `'zh-CN'` | 语音识别语言 |

## 高级用法

### 完整配置示例

```jsx
import VoiceInput from './components/VoiceInput';

function AdvancedVoiceInput() {
  const handleStart = () => {
    console.log('开始录音');
  };

  const handleStop = () => {
    console.log('停止录音');
  };

  const handleResult = (transcript) => {
    console.log('转写结果:', transcript);
    // 可以在这里处理转写结果，比如发送到后端
  };

  return (
    <VoiceInput
      onStart={handleStart}
      onStop={handleStop}
      onResult={handleResult}
      maxDuration={60}
      autoStop={false}
      showControls={true}
      placeholder="请说出您的问题，最长60秒..."
      disabled={false}
    />
  );
}
```

### 禁用状态

```jsx
<VoiceInput disabled={true} />
```

### 自定义时长

```jsx
// 10秒短录音
<VoiceInput maxDuration={10} />

// 2分钟长录音
<VoiceInput maxDuration={120} />
```

### 不自动停止

```jsx
<VoiceInput autoStop={false} maxDuration={60} />
```

### 隐藏控制按钮

```jsx
<VoiceInput showControls={false} />
```

## 主题集成

组件完全支持主题系统，会自动应用当前主题的样式：

```jsx
import { ThemeProvider } from '../contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <VoiceInput />
    </ThemeProvider>
  );
}
```

## 浏览器兼容性

### 支持的浏览器

- Chrome 25+
- Edge 79+
- Safari 14.1+
- Firefox 44+

### 要求

- 支持 Web Speech API
- 用户授予麦克风权限
- HTTPS 环境（生产环境推荐）

### 检测支持

```jsx
const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

if (!isSupported) {
  console.warn('当前浏览器不支持语音识别');
}
```

## 错误处理

组件会自动处理以下错误情况：

- 麦克风权限被拒绝
- 网络连接问题
- 语音识别服务不可用
- 浏览器不支持语音识别

错误信息会显示在组件中，用户可以看到具体的错误原因。

## 无障碍支持

组件包含完整的无障碍支持：

- 正确的 ARIA 标签
- 键盘导航支持
- 屏幕阅读器友好
- 高对比度支持

### ARIA 属性

- `aria-label`: 录音按钮的标签
- `role="textbox"`: 转写结果区域
- `aria-label="语音转写结果"`: 转写结果区域的标签

## 测试

### 单元测试

```bash
npm test VoiceInput.test.js
```

### E2E 测试

```bash
npm run cypress:open
# 然后运行 voice_input.cy.js
```

### 测试页面

访问 `/test-voice-input` 页面可以查看组件的各种配置和功能演示。

## 样式定制

组件使用 styled-components，可以通过主题系统进行样式定制：

```jsx
// 在主题中定义自定义样式
const customTheme = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  // ... 其他主题变量
};
```

## 性能优化

- 使用 `useCallback` 优化回调函数
- 使用 `useRef` 避免不必要的重新渲染
- 自动清理定时器和事件监听器
- 支持组件卸载时的资源清理

## 常见问题

### Q: 为什么录音按钮没有响应？

A: 请检查：
1. 浏览器是否支持 Web Speech API
2. 是否已授予麦克风权限
3. 是否在 HTTPS 环境下（某些浏览器要求）

### Q: 转写结果不准确怎么办？

A: 
1. 确保环境安静
2. 说话清晰
3. 检查麦克风质量
4. 尝试调整语言设置

### Q: 如何支持多语言？

A: 通过 `language` 属性设置：

```jsx
<VoiceInput language="en-US" /> // 英语
<VoiceInput language="zh-CN" /> // 中文
<VoiceInput language="ja-JP" /> // 日语
```

### Q: 如何自定义样式？

A: 可以通过主题系统或直接修改 styled-components：

```jsx
const CustomVoiceInput = styled(VoiceInput)`
  .record-button {
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  }
`;
```

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础语音录制和转写
- 完整的主题支持
- 无障碍功能

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个组件。

## 许可证

MIT License 