import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { 
  AudioOutlined, 
  AudioMutedOutlined, 
  LoadingOutlined,
  SoundOutlined,
  StopOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import useVoice from '../hooks/useVoice';
import { useTheme } from '../contexts/ThemeContext';

// 主容器
const VoiceInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: ${props => props.theme.surface};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.border};
  box-shadow: 0 4px 12px ${props => props.theme.shadowColor};
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
`;

// 录音按钮容器
const RecordButtonContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// 录音按钮
const RecordButton = styled.button`
  background: ${props => props.isRecording 
    ? 'linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%)' 
    : `linear-gradient(135deg, ${props.theme.primary} 0%, ${props.theme.secondary} 100%)`
  };
  color: white;
  border: none;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 24px ${props => props.isRecording 
    ? 'rgba(255, 77, 79, 0.4)' 
    : `${props.theme.shadowColor}`
  };
  position: relative;
  z-index: 2;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 32px ${props => props.isRecording 
      ? 'rgba(255, 77, 79, 0.6)' 
      : `${props.theme.shadowColor}`
    };
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    background: ${props => props.theme.border};
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }
`;

// 录音波纹效果
const RecordRipple = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.theme.primary};
  opacity: 0.2;
  animation: ripple 2s ease-out infinite;
  z-index: 1;
  
  @keyframes ripple {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.3;
    }
    100% {
      transform: translate(-50%, -50%) scale(2.5);
      opacity: 0;
    }
  }
`;

// 状态指示器
const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${props => props.theme.textSecondary};
  font-weight: 500;
`;

// 状态文本
const StatusText = styled.div`
  font-size: 16px;
  color: ${props => props.theme.text};
  text-align: center;
  font-weight: 600;
  margin: 8px 0;
`;

// 转写文本显示区域
const TranscriptArea = styled.div`
  width: 100%;
  min-height: 80px;
  max-height: 200px;
  padding: 16px;
  background: ${props => props.theme.cardBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  color: ${props => props.theme.text};
  font-size: 14px;
  line-height: 1.6;
  overflow-y: auto;
  opacity: ${props => props.hasContent ? '1' : '0.6'};
  transition: all 0.3s ease;
  position: relative;
  
  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

// 错误信息
const ErrorMessage = styled.div`
  color: ${props => props.theme.error};
  font-size: 14px;
  text-align: center;
  padding: 8px 12px;
  background: ${props => props.theme.error}20;
  border-radius: 6px;
  border: 1px solid ${props => props.theme.error}40;
`;

// 控制按钮组
const ControlButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

// 控制按钮
const ControlButton = styled.button`
  background: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: ${props => props.theme.border};
    border-color: ${props => props.theme.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// 进度指示器
const ProgressIndicator = styled.div`
  width: 100%;
  height: 4px;
  background: ${props => props.theme.border};
  border-radius: 2px;
  overflow: hidden;
  margin: 8px 0;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
  border-radius: 2px;
`;

/**
 * 语音输入组件
 * @param {Object} props - 组件属性
 * @param {Function} props.onResult - 录音结果回调
 * @param {Function} props.onStart - 开始录音回调
 * @param {Function} props.onStop - 停止录音回调
 * @param {boolean} props.disabled - 是否禁用
 * @param {number} props.maxDuration - 最大录音时长（秒）
 * @param {boolean} props.autoStop - 是否自动停止录音
 * @param {string} props.placeholder - 占位符文本
 * @param {boolean} props.showControls - 是否显示控制按钮
 * @param {string} props.language - 语音识别语言
 */
const VoiceInput = ({
  onResult,
  onStart,
  onStop,
  disabled = false,
  maxDuration = 30,
  autoStop = true,
  placeholder = '点击录音按钮开始语音输入...',
  showControls = true,
  language = 'zh-CN',
}) => {
  const { theme } = useTheme();
  const { 
    isListening, 
    transcript, 
    error: voiceError, 
    startListening, 
    stopListening,
    reset
  } = useVoice();
  
  const [timeRemaining, setTimeRemaining] = useState(maxDuration);
  const [showRipple, setShowRipple] = useState(false);
  const [statusText, setStatusText] = useState('准备就绪');
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  
  // 处理录音状态和计时
  useEffect(() => {
    if (isListening) {
      setStatusText('正在聆听...');
      setShowRipple(true);
      setTimeRemaining(maxDuration);
      setProgress(0);
      
      // 设置倒计时和进度
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          const newProgress = ((maxDuration - newTime) / maxDuration) * 100;
          setProgress(newProgress);
          
          if (newTime <= 0) {
            // 时间到自动停止
            if (autoStop) {
              stopListening();
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      // 触发开始回调
      if (onStart) {
        onStart();
      }
    } else {
      setStatusText('准备就绪');
      setShowRipple(false);
      setProgress(0);
      clearInterval(timerRef.current);
      
      // 触发停止回调
      if (onStop) {
        onStop();
      }
    }
    
    // 清理计时器
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isListening, maxDuration, autoStop, stopListening, onStart, onStop]);
  
  // 更新错误信息
  useEffect(() => {
    if (voiceError) {
      setError(`语音识别错误: ${voiceError}`);
    } else {
      setError(null);
    }
  }, [voiceError]);
  
  // 当录音停止且有转写文本时，触发结果回调
  useEffect(() => {
    if (!isListening && transcript && onResult) {
      onResult(transcript);
    }
  }, [isListening, transcript, onResult]);
  
  // 处理录音按钮点击
  const handleRecordClick = () => {
    if (disabled) return;
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
      setError(null);
    }
  };
  
  // 处理重置
  const handleReset = () => {
    reset();
    setError(null);
    setTimeRemaining(maxDuration);
    setProgress(0);
  };
  
  // 处理重新录音
  const handleRerecord = () => {
    reset();
    setError(null);
    startListening();
  };
  
  return (
    <VoiceInputContainer theme={theme} data-testid="voice-input-container">
      <RecordButtonContainer>
        {showRipple && <RecordRipple theme={theme} />}
        <RecordButton 
          isRecording={isListening} 
          theme={theme} 
          onClick={handleRecordClick}
          disabled={disabled}
          aria-label={isListening ? '停止录音' : '开始录音'}
          data-testid="record-button"
        >
          {isListening ? <StopOutlined data-testid="stop-icon" /> : <AudioOutlined data-testid="audio-icon" />}
        </RecordButton>
      </RecordButtonContainer>
      
      <StatusIndicator theme={theme}>
        {isListening && <LoadingOutlined spin data-testid="loading-icon" />}
        <StatusText theme={theme} data-testid="status-text">
          {isListening 
            ? `${statusText} (${timeRemaining}s)` 
            : statusText
          }
        </StatusText>
      </StatusIndicator>
      
      {isListening && (
        <ProgressIndicator theme={theme} data-testid="progress-indicator" role="progressbar">
          <ProgressBar theme={theme} progress={progress} data-testid="progress-bar" />
        </ProgressIndicator>
      )}
      
      {error && (
        <ErrorMessage theme={theme} data-testid="error-message">
          {error}
        </ErrorMessage>
      )}
      
      <TranscriptArea 
        theme={theme} 
        hasContent={!!transcript}
        as="div"
        role="textbox"
        aria-label="语音转写结果"
        data-testid="transcript-area"
      >
        {transcript || placeholder}
      </TranscriptArea>
      
      {showControls && (transcript || error) && (
        <ControlButtons data-testid="control-buttons">
          {transcript && !isListening && (
            <ControlButton 
              theme={theme} 
              onClick={handleRerecord}
              disabled={disabled}
              data-testid="rerecord-button"
            >
              <ReloadOutlined data-testid="reload-icon" />
              重新录音
            </ControlButton>
          )}
          <ControlButton 
            theme={theme} 
            onClick={handleReset}
            disabled={disabled}
            data-testid="clear-button"
          >
            <SoundOutlined data-testid="sound-icon" />
            清除
          </ControlButton>
        </ControlButtons>
      )}
    </VoiceInputContainer>
  );
};

export default VoiceInput; 