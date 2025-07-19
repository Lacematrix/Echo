import React, { useState } from 'react';
import styled from 'styled-components';
import VoiceInput from '../components/VoiceInput';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { Button, Card, Space, Switch, InputNumber, Input } from 'antd';

const TestPageContainer = styled.div`
  min-height: 100vh;
  padding: 24px;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

const TestSection = styled(Card)`
  margin-bottom: 24px;
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  
  .ant-card-head {
    background: ${props => props.theme.cardBackground};
    border-bottom: 1px solid ${props => props.theme.border};
  }
  
  .ant-card-head-title {
    color: ${props => props.theme.text};
  }
`;

const ConfigPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: ${props => props.theme.cardBackground};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
`;

const ConfigItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-weight: 600;
    color: ${props => props.theme.text};
  }
`;

const ResultDisplay = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: ${props => props.theme.cardBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  
  h4 {
    margin: 0 0 12px 0;
    color: ${props => props.theme.text};
  }
  
  pre {
    background: ${props => props.theme.background};
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    color: ${props => props.theme.textSecondary};
  }
`;

const TestVoiceInputPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [config, setConfig] = useState({
    disabled: false,
    maxDuration: 30,
    autoStop: true,
    showControls: true,
    placeholder: '点击录音按钮开始语音输入...',
  });
  
  const [results, setResults] = useState({
    onStart: [],
    onStop: [],
    onResult: [],
  });

  // 处理配置变更
  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // 处理回调
  const handleStart = () => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => ({
      ...prev,
      onStart: [...prev.onStart, `录音开始 - ${timestamp}`]
    }));
  };

  const handleStop = () => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => ({
      ...prev,
      onStop: [...prev.onStop, `录音停止 - ${timestamp}`]
    }));
  };

  const handleResult = (transcript) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => ({
      ...prev,
      onResult: [...prev.onResult, `${timestamp}: ${transcript}`]
    }));
  };

  // 清除结果
  const clearResults = () => {
    setResults({
      onStart: [],
      onStop: [],
      onResult: [],
    });
  };

  return (
    <TestPageContainer theme={theme}>
      <h1>VoiceInput 组件测试页面</h1>
      
      {/* 主题切换 */}
      <TestSection theme={theme}>
        <Space>
          <span>当前主题: {theme.isDark ? '深色' : '浅色'}</span>
          <Button onClick={toggleTheme}>
            切换主题
          </Button>
        </Space>
      </TestSection>

      {/* 配置面板 */}
      <TestSection title="组件配置" theme={theme}>
        <ConfigPanel theme={theme}>
          <ConfigItem theme={theme}>
            <label>禁用状态</label>
            <Switch
              checked={config.disabled}
              onChange={(checked) => updateConfig('disabled', checked)}
            />
          </ConfigItem>
          
          <ConfigItem theme={theme}>
            <label>最大录音时长 (秒)</label>
            <InputNumber
              min={5}
              max={300}
              value={config.maxDuration}
              onChange={(value) => updateConfig('maxDuration', value)}
            />
          </ConfigItem>
          
          <ConfigItem theme={theme}>
            <label>自动停止</label>
            <Switch
              checked={config.autoStop}
              onChange={(checked) => updateConfig('autoStop', checked)}
            />
          </ConfigItem>
          
          <ConfigItem theme={theme}>
            <label>显示控制按钮</label>
            <Switch
              checked={config.showControls}
              onChange={(checked) => updateConfig('showControls', checked)}
            />
          </ConfigItem>
          
          <ConfigItem theme={theme}>
            <label>占位符文本</label>
            <Input
              value={config.placeholder}
              onChange={(e) => updateConfig('placeholder', e.target.value)}
              placeholder="输入占位符文本"
            />
          </ConfigItem>
        </ConfigPanel>
      </TestSection>

      {/* 基础功能测试 */}
      <TestSection title="基础功能测试" theme={theme}>
        <VoiceInput
          disabled={config.disabled}
          maxDuration={config.maxDuration}
          autoStop={config.autoStop}
          showControls={config.showControls}
          placeholder={config.placeholder}
          onStart={handleStart}
          onStop={handleStop}
          onResult={handleResult}
        />
      </TestSection>

      {/* 回调结果展示 */}
      <TestSection title="回调结果" theme={theme}>
        <Space style={{ marginBottom: 16 }}>
          <Button onClick={clearResults}>清除结果</Button>
        </Space>
        
        <ResultDisplay theme={theme}>
          <h4>开始录音回调 (onStart)</h4>
          <pre>
            {results.onStart.length > 0 
              ? results.onStart.join('\n') 
              : '暂无记录'
            }
          </pre>
        </ResultDisplay>
        
        <ResultDisplay theme={theme}>
          <h4>停止录音回调 (onStop)</h4>
          <pre>
            {results.onStop.length > 0 
              ? results.onStop.join('\n') 
              : '暂无记录'
            }
          </pre>
        </ResultDisplay>
        
        <ResultDisplay theme={theme}>
          <h4>转写结果回调 (onResult)</h4>
          <pre>
            {results.onResult.length > 0 
              ? results.onResult.join('\n') 
              : '暂无记录'
            }
          </pre>
        </ResultDisplay>
      </TestSection>

      {/* 不同配置的组件展示 */}
      <TestSection title="不同配置展示" theme={theme}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* 最小配置 */}
          <div>
            <h4>最小配置</h4>
            <VoiceInput />
          </div>
          
          {/* 禁用状态 */}
          <div>
            <h4>禁用状态</h4>
            <VoiceInput disabled={true} />
          </div>
          
          {/* 短时长 */}
          <div>
            <h4>短时长 (10秒)</h4>
            <VoiceInput maxDuration={10} />
          </div>
          
          {/* 不自动停止 */}
          <div>
            <h4>不自动停止</h4>
            <VoiceInput autoStop={false} maxDuration={60} />
          </div>
          
          {/* 无控制按钮 */}
          <div>
            <h4>无控制按钮</h4>
            <VoiceInput showControls={false} />
          </div>
          
          {/* 自定义占位符 */}
          <div>
            <h4>自定义占位符</h4>
            <VoiceInput placeholder="请说出您的问题..." />
          </div>
        </div>
      </TestSection>

      {/* 使用说明 */}
      <TestSection title="使用说明" theme={theme}>
        <div style={{ lineHeight: 1.6 }}>
          <h4>组件特性</h4>
          <ul>
            <li>支持语音录制和实时转写</li>
            <li>可配置最大录音时长和自动停止</li>
            <li>提供重新录音和清除功能</li>
            <li>支持主题切换和响应式设计</li>
            <li>完整的无障碍支持</li>
            <li>丰富的回调函数支持</li>
          </ul>
          
          <h4>Props 说明</h4>
          <ul>
            <li><code>onResult</code>: 转写结果回调函数</li>
            <li><code>onStart</code>: 开始录音回调函数</li>
            <li><code>onStop</code>: 停止录音回调函数</li>
            <li><code>disabled</code>: 是否禁用组件</li>
            <li><code>maxDuration</code>: 最大录音时长（秒）</li>
            <li><code>autoStop</code>: 是否自动停止录音</li>
            <li><code>placeholder</code>: 占位符文本</li>
            <li><code>showControls</code>: 是否显示控制按钮</li>
            <li><code>language</code>: 语音识别语言</li>
          </ul>
          
          <h4>浏览器兼容性</h4>
          <ul>
            <li>需要支持 Web Speech API 的现代浏览器</li>
            <li>需要用户授予麦克风权限</li>
            <li>建议使用 HTTPS 环境以获得最佳体验</li>
          </ul>
        </div>
      </TestSection>
    </TestPageContainer>
  );
};

// 包装组件以提供主题上下文
const TestVoiceInputPageWrapper = () => (
  <ThemeProvider>
    <TestVoiceInputPage />
  </ThemeProvider>
);

export default TestVoiceInputPageWrapper; 