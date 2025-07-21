import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { toast } from '../components/common/Toast';

// 创建认证上下文
export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
  role: null,
  login: () => { },
  register: () => { },
  logout: () => { },
  clearError: () => { }
});

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  // 尝试从 localStorage 读取持久化的用户信息、token 和角色
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('解析本地用户数据失败', e);
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // 如果 token 存在则默认认为已登录，后续由 checkAuth 进一步验证
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));

  const [loading, setLoading] = useState(true); // 初始加载状态为true
  const [error, setError] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem('userRole') || (user?.role || 'user'));

  // 清除错误
  const clearError = () => setError(null);

  // 设置认证状态
  const setAuth = (userData, authToken, userRole) => {
    localStorage.setItem('token', authToken);
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    }
    setToken(authToken);
    setUser(userData);
    // 持久化用户信息与角色，避免刷新后丢失
    try {
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.warn('无法持久化用户信息到 localStorage', e);
    }
    setRole(userRole || 'user');
    setIsAuthenticated(true);
    setLoading(false);
    apiClient.setAuthToken(authToken);
  };

  // 清除认证状态
  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setRole('user');
    setIsAuthenticated(false);
    setLoading(false);
    apiClient.setAuthToken(null);
  }, []);

  // 登录
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      console.log('开始登录请求...');
      const response = await apiClient.login(username, password);
      console.log('登录响应:', response);

      if (response.success) {
        console.log('登录成功，设置认证状态...');
        setAuth(response.user, response.token, response.user?.role);
        toast.success('登录成功');
        console.log('认证状态已设置，isAuthenticated应该为true');
        return true;
      } else {
        console.log('登录失败:', response.message);
        setError(response.message || '登录失败');
        setLoading(false);
        toast.error(response.message || '登录失败');
        return false;
      }
    } catch (err) {
      console.error('登录异常:', err);
      const errorMessage = err.response?.data?.message || err.message || '登录失败，请稍后再试';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      return false;
    }
  };

  // 注册
  const register = async (username, password, email) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.register(username, password, email);

      if (response.success) {
        setAuth(response.user, response.token, response.user?.role);
        toast.success('注册成功');
        return true;
      } else {
        setError(response.message || '注册失败');
        setLoading(false);
        toast.error(response.message || '注册失败');
        return false;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || '注册失败，请稍后再试';
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      return false;
    }
  };

  // 注销
  const logout = () => {
    clearAuth();
    toast.success('已退出登录');
  };

  // 检查并刷新token
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    const storedUserRaw = localStorage.getItem('user');

    if (!storedToken) {
      // 没有 token，直接退出
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    // 优先使用本地缓存的用户信息，提升用户体验
    if (storedUserRaw) {
      try {
        const cachedUser = JSON.parse(storedUserRaw);
        setUser(cachedUser);
        setRole(cachedUser?.role || 'user');
        setIsAuthenticated(true);
      } catch (e) {
        console.warn('读取本地用户信息失败', e);
      }
    }

    try {
      // 设置API客户端的token
      apiClient.setAuthToken(storedToken);

      // 后台验证 token 并获取最新的用户信息
      const userData = await apiClient.getUserInfo();

      if (userData.success) {
        setUser(userData.user);
        setRole(userData.user?.role || 'user');
        setIsAuthenticated(true);
        setToken(storedToken);
        // 更新本地缓存
        localStorage.setItem('user', JSON.stringify(userData.user));
      } else {
        // 如果后端返回失败且没有本地缓存，清除认证信息
        if (!storedUserRaw) {
          clearAuth();
        }
      }
    } catch (err) {
      console.error('checkAuth 过程中出现错误', err);
      // 仅在明确的 401 情况下清除认证；网络错误等情况下保留本地状态
      if (err.originalError?.response?.status === 401) {
        clearAuth();
      }
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  // 初始化加载用户信息
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 提供上下文值
  const authContextValue = {
    isAuthenticated,
    user,
    token,
    loading,
    error,
    role,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 