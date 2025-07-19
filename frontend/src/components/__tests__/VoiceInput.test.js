import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import VoiceInput from '../VoiceInput';
import { ThemeProvider } from '../../contexts/ThemeContext';

// 扩展 expect 以支持无障碍测试
expect.extend(toHaveNoViolations);

// Mock useVoice hook
jest.mock('../../hooks/useVoice', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock Ant Design icons
jest.mock('@ant-design/icons', () => ({
  AudioOutlined: () => <span data-testid="audio-icon">🎤</span>,
  AudioMutedOutlined: () => <span data-testid="audio-muted-icon">🔇</span>,
  LoadingOutlined: () => <span data-testid="loading-icon">⏳</span>,
  SoundOutlined: () => <span data-testid="sound-icon">🔊</span>,
  StopOutlined: () => <span data-testid="stop-icon">⏹️</span>,
  ReloadOutlined: () => <span data-testid="reload-icon">🔄</span>,
}));

const mockUseVoice = require('../../hooks/useVoice').default;

// 默认的 mock 返回值
const defaultMockReturn = {
  isListening: false,
  transcript: '',
  error: null,
  startListening: jest.fn(),
  stopListening: jest.fn(),
  reset: jest.fn(),
};

// 测试包装器组件
const TestWrapper = ({ children, themeOverride }) => {
  const defaultTheme = {
    theme: {
      primary: '#4FD1C5',
      secondary: '#805AD5',
      background: '#1E1E2F',
      surface: '#27293D',
      text: '#F8F8F8',
      textSecondary: '#A0AEC0',
      border: '#2D3748',
      error: '#FC8181',
      success: '#68D391',
      warning: '#F6E05E',
      cardBackground: '#2D3748',
      shadowColor: 'rgba(0, 0, 0, 0.5)',
    },
    toggleTheme: jest.fn(),
    updateThemeVariable: jest.fn(),
  };

  return (
    <ThemeProvider overrideValue={themeOverride || defaultTheme}>
      {children}
    </ThemeProvider>
  );
};

describe('VoiceInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVoice.mockReturnValue(defaultMockReturn);
  });

  describe('基础渲染', () => {
    test('应该正确渲染组件', () => {
      render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /开始录音/i })).toBeInTheDocument();
      expect(screen.getByText('准备就绪')).toBeInTheDocument();
      expect(screen.getByText('点击录音按钮开始语音输入...')).toBeInTheDocument();
    });

    test('应该支持自定义占位符', () => {
      const customPlaceholder = '自定义占位符文本';
      render(
        <TestWrapper>
          <VoiceInput placeholder={customPlaceholder} />
        </TestWrapper>
      );

      expect(screen.getByText(customPlaceholder)).toBeInTheDocument();
    });

    test('应该支持禁用状态', () => {
      render(
        <TestWrapper>
          <VoiceInput disabled={true} />
        </TestWrapper>
      );

      const recordButton = screen.getByRole('button', { name: /开始录音/i });
      expect(recordButton).toBeDisabled();
    });
  });

  describe('录音状态', () => {
    test('应该显示录音状态', () => {
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
      });

      render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /停止录音/i })).toBeInTheDocument();
      expect(screen.getByText(/正在聆听/)).toBeInTheDocument();
      expect(screen.getByTestId('loading-icon')).toBeInTheDocument();
    });

    test('应该显示倒计时', () => {
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
      });

      render(
        <TestWrapper>
          <VoiceInput maxDuration={30} />
        </TestWrapper>
      );

      expect(screen.getByText(/正在聆听.*30s/)).toBeInTheDocument();
    });

    test('应该显示进度条', () => {
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
      });

      render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      const progressIndicator = screen.getByRole('progressbar', { hidden: true });
      expect(progressIndicator).toBeInTheDocument();
    });
  });

  describe('转写结果显示', () => {
    test('应该显示转写文本', () => {
      const mockTranscript = '这是转写的文本内容';
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        transcript: mockTranscript,
      });

      render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      expect(screen.getByText(mockTranscript)).toBeInTheDocument();
    });

    test('应该正确设置转写区域的 ARIA 属性', () => {
      render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      const transcriptArea = screen.getByRole('textbox', { name: /语音转写结果/i });
      expect(transcriptArea).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    test('应该显示语音识别错误', () => {
      const mockError = '麦克风权限被拒绝';
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        error: mockError,
      });

      render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      expect(screen.getByText(`语音识别错误: ${mockError}`)).toBeInTheDocument();
    });

    test('错误信息应该有正确的样式类', () => {
      const mockError = '测试错误';
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        error: mockError,
      });

      render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      const errorElement = screen.getByText(`语音识别错误: ${mockError}`);
      expect(errorElement).toHaveStyle({
        color: expect.any(String),
      });
    });
  });

  describe('用户交互', () => {
    test('点击录音按钮应该调用 startListening', () => {
      const mockStartListening = jest.fn();
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        startListening: mockStartListening,
      });

      render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      const recordButton = screen.getByRole('button', { name: /开始录音/i });
      fireEvent.click(recordButton);

      expect(mockStartListening).toHaveBeenCalledTimes(1);
    });

    test('录音时点击按钮应该调用 stopListening', () => {
      const mockStopListening = jest.fn();
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
        stopListening: mockStopListening,
      });

      render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      const recordButton = screen.getByRole('button', { name: /停止录音/i });
      fireEvent.click(recordButton);

      expect(mockStopListening).toHaveBeenCalledTimes(1);
    });

    test('禁用状态下点击按钮不应该触发任何操作', () => {
      const mockStartListening = jest.fn();
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        startListening: mockStartListening,
      });

      render(
        <TestWrapper>
          <VoiceInput disabled={true} />
        </TestWrapper>
      );

      const recordButton = screen.getByRole('button', { name: /开始录音/i });
      fireEvent.click(recordButton);

      expect(mockStartListening).not.toHaveBeenCalled();
    });
  });

  describe('控制按钮', () => {
    test('有转写文本时应该显示控制按钮', () => {
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        transcript: '测试文本',
      });

      render(
        <TestWrapper>
          <VoiceInput showControls={true} />
        </TestWrapper>
      );

      expect(screen.getByText('重新录音')).toBeInTheDocument();
      expect(screen.getByText('清除')).toBeInTheDocument();
    });

    test('有错误时应该显示控制按钮', () => {
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        error: '测试错误',
      });

      render(
        <TestWrapper>
          <VoiceInput showControls={true} />
        </TestWrapper>
      );

      expect(screen.getByText('清除')).toBeInTheDocument();
    });

    test('showControls=false 时不应该显示控制按钮', () => {
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        transcript: '测试文本',
      });

      render(
        <TestWrapper>
          <VoiceInput showControls={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('重新录音')).not.toBeInTheDocument();
      expect(screen.queryByText('清除')).not.toBeInTheDocument();
    });

    test('点击重新录音按钮应该调用 reset 和 startListening', () => {
      const mockReset = jest.fn();
      const mockStartListening = jest.fn();
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        transcript: '测试文本',
        reset: mockReset,
        startListening: mockStartListening,
      });

      render(
        <TestWrapper>
          <VoiceInput showControls={true} />
        </TestWrapper>
      );

      const rerecordButton = screen.getByText('重新录音');
      fireEvent.click(rerecordButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockStartListening).toHaveBeenCalledTimes(1);
    });

    test('点击清除按钮应该调用 reset', () => {
      const mockReset = jest.fn();
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        transcript: '测试文本',
        reset: mockReset,
      });

      render(
        <TestWrapper>
          <VoiceInput showControls={true} />
        </TestWrapper>
      );

      const clearButton = screen.getByText('清除');
      fireEvent.click(clearButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('回调函数', () => {
    test('开始录音时应该调用 onStart 回调', async () => {
      const mockOnStart = jest.fn();
      const mockStartListening = jest.fn();
      
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        startListening: mockStartListening,
      });

      render(
        <TestWrapper>
          <VoiceInput onStart={mockOnStart} />
        </TestWrapper>
      );

      const recordButton = screen.getByRole('button', { name: /开始录音/i });
      fireEvent.click(recordButton);

      // 模拟录音开始
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
        startListening: mockStartListening,
      });

      // 重新渲染以反映状态变化
      render(
        <TestWrapper>
          <VoiceInput onStart={mockOnStart} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockOnStart).toHaveBeenCalledTimes(1);
      });
    });

    test('停止录音时应该调用 onStop 回调', async () => {
      const mockOnStop = jest.fn();
      const mockStopListening = jest.fn();
      
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
        stopListening: mockStopListening,
      });

      render(
        <TestWrapper>
          <VoiceInput onStop={mockOnStop} />
        </TestWrapper>
      );

      const recordButton = screen.getByRole('button', { name: /停止录音/i });
      fireEvent.click(recordButton);

      // 模拟录音停止
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        isListening: false,
        stopListening: mockStopListening,
      });

      // 重新渲染以反映状态变化
      render(
        <TestWrapper>
          <VoiceInput onStop={mockOnStop} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockOnStop).toHaveBeenCalledTimes(1);
      });
    });

    test('有转写结果时应该调用 onResult 回调', () => {
      const mockOnResult = jest.fn();
      const mockTranscript = '测试转写结果';
      
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        transcript: mockTranscript,
      });

      render(
        <TestWrapper>
          <VoiceInput onResult={mockOnResult} />
        </TestWrapper>
      );

      expect(mockOnResult).toHaveBeenCalledWith(mockTranscript);
    });
  });

  describe('自动停止功能', () => {
    test('autoStop=true 时应该自动停止录音', async () => {
      jest.useFakeTimers();
      
      const mockStopListening = jest.fn();
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
        stopListening: mockStopListening,
      });

      render(
        <TestWrapper>
          <VoiceInput maxDuration={5} autoStop={true} />
        </TestWrapper>
      );

      // 快进时间到超过最大时长
      act(() => {
        jest.advanceTimersByTime(6000);
      });

      await waitFor(() => {
        expect(mockStopListening).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    test('autoStop=false 时不应该自动停止录音', async () => {
      jest.useFakeTimers();
      
      const mockStopListening = jest.fn();
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
        stopListening: mockStopListening,
      });

      render(
        <TestWrapper>
          <VoiceInput maxDuration={5} autoStop={false} />
        </TestWrapper>
      );

      // 快进时间到超过最大时长
      act(() => {
        jest.advanceTimersByTime(6000);
      });

      expect(mockStopListening).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('无障碍性测试', () => {
    test('应该通过无障碍性检查', async () => {
      const { container } = render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('录音按钮应该有正确的 ARIA 标签', () => {
      render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      const recordButton = screen.getByRole('button', { name: /开始录音/i });
      expect(recordButton).toHaveAttribute('aria-label', '开始录音');
    });

    test('录音状态时按钮应该有正确的 ARIA 标签', () => {
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
      });

      render(
        <TestWrapper>
          <VoiceInput />
        </TestWrapper>
      );

      const recordButton = screen.getByRole('button', { name: /停止录音/i });
      expect(recordButton).toHaveAttribute('aria-label', '停止录音');
    });
  });

  describe('主题集成', () => {
    test('应该正确应用主题样式', () => {
      const customTheme = {
        theme: {
          primary: '#FF0000',
          secondary: '#00FF00',
          surface: '#000000',
          text: '#FFFFFF',
          border: '#CCCCCC',
          error: '#FF0000',
          cardBackground: '#111111',
          shadowColor: 'rgba(255, 0, 0, 0.5)',
        },
        toggleTheme: jest.fn(),
        updateThemeVariable: jest.fn(),
      };

      render(
        <TestWrapper themeOverride={customTheme}>
          <VoiceInput />
        </TestWrapper>
      );

      const container = screen.getByRole('button', { name: /开始录音/i }).closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    test('没有回调函数时不应该报错', () => {
      expect(() => {
        render(
          <TestWrapper>
            <VoiceInput />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    test('组件卸载时应该清理定时器', () => {
      jest.useFakeTimers();
      
      mockUseVoice.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
      });

      const { unmount } = render(
        <TestWrapper>
          <VoiceInput maxDuration={10} />
        </TestWrapper>
      );

      unmount();

      // 确保没有定时器泄漏
      expect(jest.getTimerCount()).toBe(0);

      jest.useRealTimers();
    });
  });
}); 