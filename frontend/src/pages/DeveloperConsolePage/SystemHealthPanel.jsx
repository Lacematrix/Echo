import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../../services/apiClient';

const PanelWrapper = styled.div`
  padding: 1rem;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color, #eee);
  border-radius: var(--radius-base, 8px);
  padding: 1rem;
  background-color: var(--surface-lighter, #fafafa);
`;

const Title = styled.h3`
  margin: 0 0 0.5rem 0;
  color: var(--text-strong, #333);
`;

const StatusText = styled.span`
  font-weight: bold;
  color: ${props => (props.ok ? 'green' : 'red')};
`;

const RefreshButton = styled.button`
  padding: 0.4rem 0.9rem;
  border: none;
  border-radius: var(--radius-sm, 4px);
  background-color: var(--color-primary, #4FD1C5);
  color: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
  &:hover { background-color: #3dbbab; }
`;

const SystemHealthPanel = () => {
  const [backendHealth, setBackendHealth] = useState(null);
  const [mcpStatus, setMcpStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealthData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [backendData, mcpData] = await Promise.all([
        apiClient.getBackendHealth(),
        apiClient.getMcpServerStatus(),
      ]);
      setBackendHealth(backendData);
      setMcpStatus(mcpData.data);
    } catch (err) {
      console.error('获取健康状态失败:', err);
      setError('无法获取系统健康信息，请稍后再试。');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  if (isLoading) {
    return <PanelWrapper>正在加载健康状态...</PanelWrapper>;
  }

  if (error) {
    return <PanelWrapper style={{ color: 'red' }}>{error}</PanelWrapper>;
  }

  return (
    <PanelWrapper>
      <RefreshButton onClick={fetchHealthData} style={{ marginBottom: '1rem' }}>
        刷新
      </RefreshButton>

      {/* Backend Health */}
      <Section>
        <Title>后端服务器</Title>
        {backendHealth ? (
          <p>
            状态: <StatusText ok={backendHealth.status === 'ok'}>{backendHealth.status}</StatusText>
            {' '}<small>({new Date(backendHealth.timestamp * 1000).toLocaleString()})</small>
          </p>
        ) : (
          <p>无数据</p>
        )}
      </Section>

      {/* MCP Server Status */}
      <Section>
        <Title>MCP Servers</Title>
        {mcpStatus && mcpStatus.servers ? (
          <div>
            <p>
              运行中: <StatusText ok={mcpStatus.summary?.running > 0}> {mcpStatus.summary?.running}/{mcpStatus.summary?.total} </StatusText>
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.3rem 0' }}>Server</th>
                  <th style={{ textAlign: 'left', padding: '0.3rem 0' }}>状态</th>
                  <th style={{ textAlign: 'left', padding: '0.3rem 0' }}>Restart Count</th>
                  <th style={{ textAlign: 'left', padding: '0.3rem 0' }}>Last Restart</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(mcpStatus.servers).map(([name, info]) => (
                  <tr key={name}>
                    <td style={{ padding: '0.3rem 0' }}>{name}</td>
                    <td style={{ padding: '0.3rem 0' }}>
                      <StatusText ok={info.status === 'running'}>{info.status}</StatusText>
                    </td>
                    <td style={{ padding: '0.3rem 0' }}>{info.restart_count}</td>
                    <td style={{ padding: '0.3rem 0' }}>{info.last_restart_time || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>无数据</p>
        )}
      </Section>
    </PanelWrapper>
  );
};

export default SystemHealthPanel; 