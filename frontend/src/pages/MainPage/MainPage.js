// frontend/src/pages/MainPage/MainPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import VoiceRecorder from '../../components/VoiceRecorder/VoiceRecorder';
import StatusBar from '../../components/StatusBar/StatusBar';
import ToolsList from '../../components/ToolsList';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import apiClient from '../../services/apiClient';
import useTTS from '../../hooks/useTTS';
import useVoice from '../../hooks/useVoice';
import ConfirmationModal from '../../components/ConfirmationModal';
import ResultDisplay from '../../components/ResultDisplay';
import { motion, AnimatePresence } from 'framer-motion';
import './MainPage.css';
import useIntent from '../../hooks/useIntent';

console.log('Test persistence');

const MainPage = () => {
    const [status, setStatus] = useState('idle');
    const [lastTranscript, setLastTranscript] = useState('');
    const [lastResponse, setLastResponse] = useState(null);
    const sessionIdRef = useRef(null);
    const { speak, cancel: cancelTTS, isSpeaking } = useTTS();
    const { startListening, transcript: voiceTranscript, isListening, error: voiceError, reset: resetVoice, stopListening } = useVoice();
    const { classifyIntent } = useIntent();

    const [pendingAction, setPendingAction] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // 多轮对话消息历史
    const [messages, setMessages] = useState([]);

    // 统一添加消息的工具函数
    const addMessage = useCallback((content, role = 'ai') => {
        setMessages(prev => [...prev, { id: Date.now() + Math.random(), role, content }]);
    }, []);

    // 确认弹窗文本与结果数据
    const [confirmText, setConfirmText] = useState('');
    const [resultData, setResultData] = useState(null);

    // 侧边栏状态
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // 添加自动重置计时器引用
    const resetTimerRef = useRef(null);
    const errorCountRef = useRef(0);

    useEffect(() => {
        if (!sessionIdRef.current) {
            sessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            console.log('Initialized Session ID:', sessionIdRef.current);
        }
    }, []);

    // 添加重置函数
    const resetUIState = useCallback(() => {
        console.log('重置界面状态...');
        setStatus('idle');
        setPendingAction(null);
        setIsConfirmModalOpen(false);
        setResultData(null);
        setIsConfirming(false); // 重置确认状态锁
        errorCountRef.current = 0;
        resetVoice();
        // 保留最后一次的文本记录，但可以选择清除
        // setLastTranscript('');
        // setLastResponse(null);
    }, [resetVoice]);

    // 进度条阶段管理函数
    const runProgressStages = useCallback(async (transcript, currentSessionId) => {
        console.log(`[ProgressBar] 开始四阶段进度流程`);

        // 阶段1: 识别中 (listening) - 已经完成，显示1秒
        setStatus('listening');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 阶段2: 理解中 (thinking)
        console.log(`[ProgressBar] 进入理解阶段`);
        setStatus('thinking');

        try {
            // 构造会话历史 + 当前用户发言
            const conversationPayload = (() => {
                const pairs = [];
                let lastUser = null;
                messages.forEach(msg => {
                    if (msg.role === 'user') {
                        lastUser = msg.content;
                    } else if (msg.role === 'ai' && lastUser !== null) {
                        pairs.push({ user: lastUser, assistant: msg.content });
                        lastUser = null;
                    }
                });
                // 添加当前这次用户发言
                pairs.push({ user: transcript });
                return JSON.stringify(pairs);
            })();

            const result = await apiClient.interpret(conversationPayload, currentSessionId, 1);
            // 暂时使用本地测试数据
            // const result = {
            //     sessionId: currentSessionId,
            //     tool_calls: [],
            //     confirm_text: '您确定要执行此操作吗？',
            //     confirmText: '您确定要执行此操作吗？',
            // };
            console.log(`[Session: ${currentSessionId}] Interpret API Result:`, result);

            // 检查并保存返回的sessionId
            if (result.sessionId && result.sessionId !== currentSessionId) {
                console.log(`更新sessionId: ${currentSessionId} -> ${result.sessionId}`);
                sessionIdRef.current = result.sessionId;
            }

            // 阶段3: 执行中 (executing)
            console.log(`[ProgressBar] 进入执行阶段`);
            setStatus('executing');

            // 模拟执行时间，让用户看到执行阶段
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 处理API结果
            if (result.tool_calls && result.tool_calls.length > 0) {
                console.log(`[Session: ${result.sessionId || currentSessionId}] Tool call required. Pending action set.`);
                setPendingAction(result);
                const textToConfirm = result.confirm_text || result.confirmText || '您确定要执行此操作吗？';
                setConfirmText(textToConfirm);
                // 记录 AI 消息
                addMessage(textToConfirm, 'ai');

                // 阶段4: 完成 (completed) - 短暂显示
                setStatus('completed');
                await new Promise(resolve => setTimeout(resolve, 800));

                // 然后显示确认对话框
                setIsConfirmModalOpen(true);
                setStatus('idle'); // 等待用户确认

                // 注意：TTS播报由ConfirmationModal组件负责，这里不再重复调用

            } else if (result.action === 'respond' && result.content) {
                console.log(`[Session: ${result.sessionId || currentSessionId}] Direct response received.`);

                // 阶段4: 完成 (completed)
                setStatus('completed');
                await new Promise(resolve => setTimeout(resolve, 800));

                setLastResponse({ status: 'info', message: result.content });
                addMessage(result.content, 'ai');
                setStatus('speaking');
                speak(result.content, resetUIState);

            } else {
                const textToConfirm = result.confirm_text || result.confirmTex || result.content;
                if (textToConfirm) {
                    console.log(`[Session: ${result.sessionId || currentSessionId}] Confirmation text only received.`);
                    setPendingAction(result);
                    setConfirmText(textToConfirm);
                    // 记录 AI 消息
                    addMessage(textToConfirm, 'ai');

                    // 阶段4: 完成 (completed)
                    setStatus('completed');
                    await new Promise(resolve => setTimeout(resolve, 800));

                    setIsConfirmModalOpen(true);
                    setStatus('idle');
                    // 注意：TTS播报由ConfirmationModal组件负责，这里不再重复调用
                } else {
                    console.log(`[Session: ${result.sessionId || currentSessionId}] Response format detection:`, result);

                    // 阶段4: 完成 (completed)
                    setStatus('completed');
                    await new Promise(resolve => setTimeout(resolve, 800));

                    const message = JSON.stringify(result);
                    setLastResponse({ status: 'info', message: `收到未知格式的响应: ${message}` });
                    addMessage(`收到未知格式的响应: ${message}`, 'ai');
                    setStatus('speaking');
                    speak("收到未知格式的响应，请检查控制台", resetUIState);
                }
            }
        } catch (error) {
            console.error(`[Session: ${currentSessionId}] Interpret API call failed:`, error);

            // 即使出错也要显示完成阶段
            setStatus('completed');
            await new Promise(resolve => setTimeout(resolve, 500));

            const message = `抱歉，理解您的指令时出错：${error.message || '网络请求失败'}`;
            setLastResponse({ status: 'error', message });
            addMessage(message, 'ai');
            setStatus('error');
            speak(message, resetUIState);

            // 增加错误计数
            errorCountRef.current += 1;

            // 错误后5秒自动重置
            resetTimerRef.current = setTimeout(resetUIState, 5000);
        }
    }, [speak, resetUIState, startListening, isListening, stopListening, addMessage, messages]);

    const handleVoiceResult = useCallback(async (transcript) => {
        // 清除任何现有的重置计时器
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }

        // 记录用户消息
        if (transcript) {
            addMessage(transcript, 'user');
        }

        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) {
            console.error('Session ID is not initialized.');
            setStatus('error');
            setLastResponse({ status: 'error', message: '会话初始化失败，请刷新页面重试。' });
            return;
        }

        console.log(`[Session: ${currentSessionId}] Received transcript:`, transcript);
        setLastTranscript(transcript);
        setLastResponse(null);
        setResultData(null);
        setPendingAction(null);
        setIsConfirmModalOpen(false);

        // 运行四阶段进度流程
        await runProgressStages(transcript, currentSessionId);
    }, [runProgressStages, addMessage]);

    // 提取工具执行和结果处理逻辑到单独的函数
    const executeToolAndHandleResult = useCallback(async (toolId, params, currentSessionId, userId) => {
        try {
            const execResult = await apiClient.execute(toolId, params, currentSessionId, userId);
            console.log(`[Session: ${currentSessionId}] Execute API Result:`, execResult);

            // 检查并保存返回的sessionId
            if (execResult.sessionId && execResult.sessionId !== currentSessionId) {
                console.log(`执行后更新sessionId: ${currentSessionId} -> ${execResult.sessionId}`);
                sessionIdRef.current = execResult.sessionId;
            }

            if (execResult.success && execResult.data) {
                console.log(`[Session: ${execResult.sessionId || currentSessionId}] Tool execution successful.`);
                setResultData({ status: 'success', data: execResult.data });
                setStatus('speaking');

                // 优化播报内容选择
                let textToSpeak;
                if (execResult.data.summary) {
                    textToSpeak = execResult.data.summary;
                } else if (execResult.data.tts_message) {
                    textToSpeak = execResult.data.tts_message;
                } else if (typeof execResult.data === 'string') {
                    textToSpeak = execResult.data;
                } else if (execResult.data.result || execResult.data.message) {
                    textToSpeak = execResult.data.result || execResult.data.message;
                } else {
                    // 如果没有合适的字段，尝试提取有用信息
                    const simplifiedData = {};
                    const keyOrder = ['message', 'result', 'summary', 'status', 'city', 'date', 'weather'];

                    // 优先提取特定关键字段
                    keyOrder.forEach(key => {
                        if (execResult.data[key] !== undefined) {
                            simplifiedData[key] = execResult.data[key];
                        }
                    });

                    // 尝试将简化后的对象转为字符串播报
                    const simpleString = Object.entries(simplifiedData)
                        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                        .join(', ');
                    textToSpeak = simpleString || "操作成功，但没有提供详细信息";
                }

                console.log(`[Session: ${execResult.sessionId || currentSessionId}] 即将播报结果: "${textToSpeak}"`);

                // 记录 AI 消息
                addMessage(textToSpeak, 'ai');

                // 使用增强的流式语音播报，确保状态正确更新
                speak(textToSpeak, () => {
                    setIsConfirming(false); // 重置确认状态锁
                    resetUIState();
                });
            } else {
                console.error(`[Session: ${execResult.sessionId || currentSessionId}] Tool execution failed:`, execResult.error);
                const message = `抱歉，执行操作时失败：${execResult.error?.message || '未知错误'}`;
                setResultData({ status: 'error', message });
                setStatus('error');
                addMessage(message, 'ai');
                speak(message, () => {
                    setIsConfirming(false);
                    resetUIState();
                });

                // 错误后5秒自动重置
                resetTimerRef.current = setTimeout(resetUIState, 5000);
            }
        } catch (error) {
            console.error(`[Session: ${currentSessionId}] Execute API call failed:`, error);
            const message = `抱歉，执行操作时出错：${error.message || '网络请求失败'}`;
            setResultData({ status: 'error', message });
            setStatus('error');
            addMessage(message, 'ai');
            speak(message, () => {
                setIsConfirming(false);
                resetUIState();
            });

            // 错误后5秒自动重置
            resetTimerRef.current = setTimeout(resetUIState, 5000);
        }
    }, [speak, resetUIState, addMessage]);

    const [isConfirming, setIsConfirming] = useState(false); // 添加确认状态锁

    const handleUserConfirm = useCallback(() => {
        // 防止重复调用
        if (isConfirming) {
            console.log(`[Session: ${sessionIdRef.current}] 操作正在确认中，忽略重复调用`);
            return;
        }

        console.log(`[Session: ${sessionIdRef.current}] 用户确认了操作`);
        setIsConfirming(true); // 设置确认状态锁
        setIsConfirmModalOpen(false);

        // 跳转（滚动）到触发弹窗的位置，方便用户继续查看
        if (typeof document !== 'undefined') {
            document.querySelector('.messages-container')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }

        // 取消可能正在播放的确认文本
        if (isSpeaking) {
            cancelTTS();
        }
        if (isListening) {
            // stopListening(); // useVoice Hook 的 onresult 后会自动停止
        }

        // 如果 pendingAction 存在工具调用，则执行；否则继续对话
        if (pendingAction?.tool_calls && pendingAction.tool_calls.length > 0) {
            setStatus('executing');

            const firstToolCall = pendingAction.tool_calls[0];
            const toolId = firstToolCall.tool_id;
            const params = firstToolCall.parameters || {};
            const userId = 1;
            const currentSessionId = sessionIdRef.current;

            // 清除任何现有的自动重置计时器
            if (resetTimerRef.current) {
                clearTimeout(resetTimerRef.current);
                resetTimerRef.current = null;
            }

            console.log(`[Session: ${currentSessionId}] 准备执行工具: ${toolId}，参数:`, params);
            executeToolAndHandleResult(toolId, params, currentSessionId, userId);
        } else {
            console.log(`[Session: ${sessionIdRef.current}] 无工具调用，继续之前的对话`);
            setStatus('idle');
            setIsConfirming(false);
            // 重新开始监听，继续对话流程
            if (!isListening) {
                startListening();
            }
        }
    }, [isConfirming, pendingAction, cancelTTS, executeToolAndHandleResult, isListening, isSpeaking, startListening]);

    const handleUserRetry = useCallback(() => {
        cancelTTS();
        setIsConfirmModalOpen(false);
        setIsConfirming(false); // 重置确认状态锁
        console.log('User chose to retry – removing last dialogue');

        // 删除上一次对话（最后一条 AI 确认文本及其之前的用户语句）
        setMessages(prev => {
            const newMsgs = [...prev];
            if (newMsgs.length === 0) return prev;

            // 移除末尾 AI 确认文本（与 confirmText 内容相同）
            if (newMsgs[newMsgs.length - 1].role === 'ai' && newMsgs[newMsgs.length - 1].content === confirmText) {
                newMsgs.pop();
            }

            // 移除对应的用户发言
            if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'user') {
                newMsgs.pop();
            }

            return newMsgs;
        });

        setStatus('idle');
        setLastResponse(null);
        setPendingAction(null);
    }, [cancelTTS, confirmText]);

    const handleUserCancel = useCallback(() => {
        console.log(`[Session: ${sessionIdRef.current}] 用户取消了操作`);
        setIsConfirmModalOpen(false);
        setIsConfirming(false); // 重置确认状态锁
        speak("好的，操作已取消。", resetUIState);
    }, [speak, resetUIState]);

    useEffect(() => {
        if (!isSpeaking && (status === 'speaking' || status === 'error' || status === 'info')) {
            console.log('TTS finished, setting status to idle.');
            setStatus('idle');
        }
    }, [isSpeaking, status]);

    useEffect(() => {
        return () => {
            // 组件卸载时清理资源
            cancelTTS();
            if (resetTimerRef.current) {
                clearTimeout(resetTimerRef.current);
            }
        };
    }, [cancelTTS]);

    const handleVoiceError = useCallback((error) => {
        console.error('VoiceRecorder Error:', error);
        setStatus('error');
        setLastResponse({ status: 'error', message: `语音识别错误: ${error}` });

        // 错误次数累计
        errorCountRef.current += 1;

        // 如果连续错误超过3次，延长自动重置时间或显示特殊提示
        if (errorCountRef.current >= 3) {
            speak('语音识别似乎遇到了持续问题，您可能需要检查麦克风权限或刷新页面。');
            errorCountRef.current = 0;
        } else {
            resetTimerRef.current = setTimeout(resetUIState, 5000);
        }
    }, [speak, resetUIState]);

    // 添加手动重置按钮处理函数
    const handleReset = useCallback(() => {
        resetUIState();
    }, [resetUIState]);

    // 处理侧边栏切换
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    // 处理工具选择
    const handleToolSelect = useCallback((toolId) => {
        // 这里可以实现选择工具后的操作，比如直接触发工具调用或显示工具详情
        console.log(`Selected tool: ${toolId}`);
        setIsSidebarOpen(false);
    }, []);

    // 注意：语音确认处理已经移动到ConfirmationModal组件中，避免重复处理

    // 添加TTS完成回调函数
    const handleTTSCompleted = useCallback(() => {
        console.log("MainPage: ConfirmationModal TTS播报完成，准备监听用户确认");
        setStatus('listening_confirm');
    }, []);

    // 清除历史对话
    const handleClearHistory = useCallback(() => {
        setMessages([]);
        setLastTranscript('');
        setLastResponse(null);
        setResultData(null);
    }, []);

    // UI Rendering
    return (
        <motion.div
            className="main-page"
            data-testid="main-page"
            role="region"
            aria-label="语音助手主界面"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <StatusBar currentStatus={status} lastTranscript={lastTranscript} lastResponse={lastResponse} />

            {/* 进度条弹窗 */}
            <AnimatePresence>
                {(status === 'listening' || status === 'thinking' || status === 'executing' || status === 'completed') && (
                    <motion.div
                        className="progress-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="progress-modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ProgressBar
                                currentStage={status}
                                visible={true}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 侧边栏切换按钮 */}
            <button
                className="sidebar-toggle-btn"
                onClick={toggleSidebar}
                aria-label={isSidebarOpen ? "关闭工具菜单" : "打开工具菜单"}
            >
                {isSidebarOpen ? "×" : "≡"}
            </button>

            <div className="main-content-wrapper">
                {/* 侧边栏 */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            className="sidebar"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ duration: 0.3 }}
                        >
                            <ToolsList onToolSelect={handleToolSelect} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 主内容区 */}
                <div className="content-area">
                    <div className="conversation-box">
                        <div className="messages-container">
                            {/* 清除历史按钮 */}
                            {messages.length > 0 && (
                                <button className="clear-history-btn" onClick={handleClearHistory}>
                                    清除历史
                                </button>
                            )}

                            {/* 多轮对话渲染 */}
                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    className={`${msg.role === 'user' ? 'transcript user-message' : 'ai-response system-message'}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="message-header">{msg.role === 'user' ? '你说' : 'AI'}</div>
                                    <div className="message-content">{msg.content}</div>
                                </motion.div>
                            ))}

                            {/* 已移除单条渲染，改由 messages 数组统一渲染 */}

                            {lastResponse && typeof lastResponse === 'object' && lastResponse.status !== 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="result-container"
                                >
                                    <ResultDisplay
                                        status={lastResponse.status}
                                        message={lastResponse.message}
                                        autoSpeak={false}
                                    />
                                </motion.div>
                            )}

                            {resultData && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="result-container"
                                >
                                    <ResultDisplay
                                        status={resultData.status}
                                        data={resultData.data}
                                        message={resultData.message}
                                        autoSpeak={true}
                                        onDismiss={handleReset}
                                    />
                                </motion.div>
                            )}
                        </div>
                        {/* Voice Recorder 放置对话框底部 */}
                        <VoiceRecorder
                            onResult={handleVoiceResult}
                            onError={handleVoiceError}
                            setStatus={setStatus}
                            disabled={!['idle', 'listening'].includes(status)}
                        />
                    </div>

                    {/* 重置按钮 */}
                    {status !== 'idle' && status !== 'listening' && (
                        <motion.button
                            className="reset-button"
                            onClick={handleReset}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            重新开始
                        </motion.button>
                    )}
                </div>

                {/* 确认对话框 */}
                <AnimatePresence>
                    {isConfirmModalOpen && (
                        <ConfirmationModal
                            isOpen={isConfirmModalOpen}
                            confirmText={confirmText}
                            onConfirm={handleUserConfirm}
                            onRetry={handleUserRetry}
                            onCancel={handleUserCancel}
                            isListening={isListening}
                            isTTSSpeaking={isSpeaking}
                            useVoiceConfirmation={true}
                            startSTTListening={startListening}
                            stopSTTListening={stopListening}
                            onTTSCompleted={handleTTSCompleted}
                            voiceTranscript={voiceTranscript}
                        />
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default MainPage; 