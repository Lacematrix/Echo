describe('VoiceInput Component E2E Tests', () => {
  beforeEach(() => {
    // 访问测试页面
    cy.visit('/test-voice-input');
    
    // 等待页面加载完成
    cy.get('[data-testid="voice-input-container"]').should('be.visible');
  });

  describe('基础功能测试', () => {
    it('应该正确渲染语音输入组件', () => {
      // 检查主要元素是否存在
      cy.get('[data-testid="voice-input-container"]').should('be.visible');
      cy.get('[data-testid="record-button"]').should('be.visible');
      cy.get('[data-testid="status-text"]').should('contain', '准备就绪');
      cy.get('[data-testid="transcript-area"]').should('be.visible');
    });

    it('应该显示正确的初始状态', () => {
      // 检查初始状态
      cy.get('[data-testid="record-button"]').should('have.attr', 'aria-label', '开始录音');
      cy.get('[data-testid="status-text"]').should('contain', '准备就绪');
      cy.get('[data-testid="transcript-area"]').should('contain', '点击录音按钮开始语音输入...');
    });

    it('应该支持自定义占位符', () => {
      // 访问带有自定义占位符的组件
      cy.visit('/test-voice-input?placeholder=自定义占位符');
      cy.get('[data-testid="transcript-area"]').should('contain', '自定义占位符');
    });
  });

  describe('录音交互测试', () => {
    it('点击录音按钮应该开始录音', () => {
      // 模拟开始录音
      cy.get('[data-testid="record-button"]').click();
      
      // 检查录音状态
      cy.get('[data-testid="record-button"]').should('have.attr', 'aria-label', '停止录音');
      cy.get('[data-testid="status-text"]').should('contain', '正在聆听');
      cy.get('[data-testid="loading-icon"]').should('be.visible');
    });

    it('录音时应该显示进度条', () => {
      // 开始录音
      cy.get('[data-testid="record-button"]').click();
      
      // 检查进度条是否显示
      cy.get('[data-testid="progress-indicator"]').should('be.visible');
      cy.get('[data-testid="progress-bar"]').should('be.visible');
    });

    it('录音时应该显示倒计时', () => {
      // 开始录音
      cy.get('[data-testid="record-button"]').click();
      
      // 检查倒计时显示
      cy.get('[data-testid="status-text"]').should('match', /正在聆听.*\d+s/);
    });

    it('点击停止按钮应该停止录音', () => {
      // 开始录音
      cy.get('[data-testid="record-button"]').click();
      
      // 等待录音状态
      cy.get('[data-testid="record-button"]').should('have.attr', 'aria-label', '停止录音');
      
      // 停止录音
      cy.get('[data-testid="record-button"]').click();
      
      // 检查停止状态
      cy.get('[data-testid="record-button"]').should('have.attr', 'aria-label', '开始录音');
      cy.get('[data-testid="status-text"]').should('contain', '准备就绪');
    });
  });

  describe('转写结果显示测试', () => {
    it('应该显示转写的文本', () => {
      // 模拟转写结果
      cy.window().then((win) => {
        // 模拟语音识别结果
        win.mockVoiceRecognitionResult('这是测试转写的文本');
      });
      
      // 检查转写结果显示
      cy.get('[data-testid="transcript-area"]').should('contain', '这是测试转写的文本');
    });

    it('转写区域应该有正确的 ARIA 属性', () => {
      cy.get('[data-testid="transcript-area"]')
        .should('have.attr', 'role', 'textbox')
        .and('have.attr', 'aria-label', '语音转写结果');
    });
  });

  describe('控制按钮测试', () => {
    beforeEach(() => {
      // 模拟有转写结果的状态
      cy.window().then((win) => {
        win.mockVoiceRecognitionResult('测试转写文本');
      });
    });

    it('有转写文本时应该显示控制按钮', () => {
      cy.get('[data-testid="control-buttons"]').should('be.visible');
      cy.get('[data-testid="rerecord-button"]').should('be.visible');
      cy.get('[data-testid="clear-button"]').should('be.visible');
    });

    it('点击重新录音按钮应该重置并开始新录音', () => {
      // 点击重新录音
      cy.get('[data-testid="rerecord-button"]').click();
      
      // 检查是否开始新录音
      cy.get('[data-testid="record-button"]').should('have.attr', 'aria-label', '停止录音');
      cy.get('[data-testid="status-text"]').should('contain', '正在聆听');
    });

    it('点击清除按钮应该清除转写文本', () => {
      // 点击清除
      cy.get('[data-testid="clear-button"]').click();
      
      // 检查转写文本是否被清除
      cy.get('[data-testid="transcript-area"]').should('contain', '点击录音按钮开始语音输入...');
    });

    it('showControls=false 时不应该显示控制按钮', () => {
      // 访问不显示控制按钮的组件
      cy.visit('/test-voice-input?showControls=false');
      
      // 模拟转写结果
      cy.window().then((win) => {
        win.mockVoiceRecognitionResult('测试文本');
      });
      
      // 检查控制按钮不显示
      cy.get('[data-testid="control-buttons"]').should('not.exist');
    });
  });

  describe('错误处理测试', () => {
    it('应该显示语音识别错误', () => {
      // 模拟语音识别错误
      cy.window().then((win) => {
        win.mockVoiceRecognitionError('麦克风权限被拒绝');
      });
      
      // 检查错误信息显示
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', '语音识别错误: 麦克风权限被拒绝');
    });

    it('有错误时应该显示控制按钮', () => {
      // 模拟错误
      cy.window().then((win) => {
        win.mockVoiceRecognitionError('测试错误');
      });
      
      // 检查控制按钮显示
      cy.get('[data-testid="control-buttons"]').should('be.visible');
      cy.get('[data-testid="clear-button"]').should('be.visible');
    });
  });

  describe('自动停止功能测试', () => {
    it('autoStop=true 时应该自动停止录音', () => {
      // 访问自动停止的组件
      cy.visit('/test-voice-input?autoStop=true&maxDuration=3');
      
      // 开始录音
      cy.get('[data-testid="record-button"]').click();
      
      // 等待自动停止
      cy.wait(3500); // 等待超过最大时长
      
      // 检查是否自动停止
      cy.get('[data-testid="record-button"]').should('have.attr', 'aria-label', '开始录音');
      cy.get('[data-testid="status-text"]').should('contain', '准备就绪');
    });

    it('autoStop=false 时不应该自动停止录音', () => {
      // 访问不自动停止的组件
      cy.visit('/test-voice-input?autoStop=false&maxDuration=3');
      
      // 开始录音
      cy.get('[data-testid="record-button"]').click();
      
      // 等待超过最大时长
      cy.wait(3500);
      
      // 检查录音仍在进行
      cy.get('[data-testid="record-button"]').should('have.attr', 'aria-label', '停止录音');
    });
  });

  describe('回调函数测试', () => {
    it('开始录音时应该触发 onStart 回调', () => {
      // 监听回调调用
      cy.window().then((win) => {
        win.onStartCallback = cy.stub().as('onStartCallback');
      });
      
      // 开始录音
      cy.get('[data-testid="record-button"]').click();
      
      // 检查回调是否被调用
      cy.get('@onStartCallback').should('have.been.calledOnce');
    });

    it('停止录音时应该触发 onStop 回调', () => {
      // 监听回调调用
      cy.window().then((win) => {
        win.onStopCallback = cy.stub().as('onStopCallback');
      });
      
      // 开始录音
      cy.get('[data-testid="record-button"]').click();
      
      // 停止录音
      cy.get('[data-testid="record-button"]').click();
      
      // 检查回调是否被调用
      cy.get('@onStopCallback').should('have.been.calledOnce');
    });

    it('有转写结果时应该触发 onResult 回调', () => {
      // 监听回调调用
      cy.window().then((win) => {
        win.onResultCallback = cy.stub().as('onResultCallback');
      });
      
      // 模拟转写结果
      cy.window().then((win) => {
        win.mockVoiceRecognitionResult('测试结果');
      });
      
      // 检查回调是否被调用
      cy.get('@onResultCallback').should('have.been.calledWith', '测试结果');
    });
  });

  describe('无障碍性测试', () => {
    it('应该通过无障碍性检查', () => {
      cy.injectAxe();
      cy.checkA11y('[data-testid="voice-input-container"]', {
        rules: {
          'color-contrast': { enabled: true },
          'button-name': { enabled: true },
          'aria-label': { enabled: true }
        }
      });
    });

    it('录音按钮应该有正确的 ARIA 标签', () => {
      cy.get('[data-testid="record-button"]')
        .should('have.attr', 'aria-label', '开始录音');
    });

    it('录音状态时按钮应该有正确的 ARIA 标签', () => {
      // 开始录音
      cy.get('[data-testid="record-button"]').click();
      
      cy.get('[data-testid="record-button"]')
        .should('have.attr', 'aria-label', '停止录音');
    });

    it('转写区域应该有正确的 ARIA 属性', () => {
      cy.get('[data-testid="transcript-area"]')
        .should('have.attr', 'role', 'textbox')
        .and('have.attr', 'aria-label', '语音转写结果');
    });
  });

  describe('主题集成测试', () => {
    it('应该正确应用深色主题', () => {
      // 切换到深色主题
      cy.get('[data-testid="theme-toggle"]').click();
      
      // 检查深色主题样式
      cy.get('[data-testid="voice-input-container"]')
        .should('have.css', 'background-color')
        .and('match', /rgb\(39, 41, 61\)/); // 深色主题背景色
    });

    it('应该正确应用浅色主题', () => {
      // 切换到浅色主题
      cy.get('[data-testid="theme-toggle"]').click();
      
      // 检查浅色主题样式
      cy.get('[data-testid="voice-input-container"]')
        .should('have.css', 'background-color')
        .and('match', /rgb\(255, 255, 255\)/); // 浅色主题背景色
    });
  });

  describe('响应式设计测试', () => {
    it('在移动设备上应该正确显示', () => {
      cy.viewport('iphone-6');
      
      // 检查移动端布局
      cy.get('[data-testid="voice-input-container"]').should('be.visible');
      cy.get('[data-testid="record-button"]').should('be.visible');
      
      // 检查按钮大小适合触摸
      cy.get('[data-testid="record-button"]')
        .should('have.css', 'width', '80px')
        .and('have.css', 'height', '80px');
    });

    it('在桌面设备上应该正确显示', () => {
      cy.viewport(1280, 800);
      
      // 检查桌面端布局
      cy.get('[data-testid="voice-input-container"]').should('be.visible');
      cy.get('[data-testid="record-button"]').should('be.visible');
    });
  });

  describe('边界情况测试', () => {
    it('禁用状态下不应该响应点击', () => {
      // 访问禁用状态的组件
      cy.visit('/test-voice-input?disabled=true');
      
      // 检查按钮是否禁用
      cy.get('[data-testid="record-button"]').should('be.disabled');
      
      // 尝试点击应该不触发任何操作
      cy.get('[data-testid="record-button"]').click({ force: true });
      
      // 检查状态没有改变
      cy.get('[data-testid="status-text"]').should('contain', '准备就绪');
    });

    it('长时间录音应该正确处理', () => {
      // 访问长时间录音的组件
      cy.visit('/test-voice-input?maxDuration=60');
      
      // 开始录音
      cy.get('[data-testid="record-button"]').click();
      
      // 检查长时间录音状态
      cy.get('[data-testid="status-text"]').should('contain', '正在聆听');
      cy.get('[data-testid="progress-indicator"]').should('be.visible');
    });

    it('快速连续点击应该正确处理', () => {
      // 快速连续点击录音按钮
      cy.get('[data-testid="record-button"]').click();
      cy.get('[data-testid="record-button"]').click();
      cy.get('[data-testid="record-button"]').click();
      
      // 检查最终状态
      cy.get('[data-testid="record-button"]').should('have.attr', 'aria-label', '开始录音');
    });
  });
}); 