import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext'; // Assuming AuthContext is needed for user info or token
import apiClient from '../../services/apiClient'; // Assuming a central apiClient exists
import styled from 'styled-components';
import AddServiceForm from './AddServiceForm'; // Import the form component
import SystemHealthPanel from './SystemHealthPanel'; // Import the new health panel
import Modal from '../../components/common/Modal'; // Modal for dialog form

// Icon (simple hamburger)
const BurgerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

// Layout containers
const LayoutContainer = styled.div`
  display: flex;
  min-height: 80vh;
  overflow-x: hidden; /* prevent body shift when sidebar slides */
`;

const Sidebar = styled.aside`
  width: 200px;
  border-right: 1px solid var(--border-color, #eaeaea);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  height: 100vh;
  align-self: flex-start;

  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    background-color: #fff;
    z-index: 1001;
    transform: ${props => (props.open ? 'translateX(0)' : 'translateX(-100%)')};
    transition: transform 0.3s ease;
  }
`;

const SidebarOverlay = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: ${props => (props.open ? 'block' : 'none')};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1000;
  }
`;

const SidebarToggleButton = styled.button`
  display: none;
  @media (max-width: 768px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-primary, #4FD1C5);
    color: white;
    border: none;
    padding: 0.6rem;
    border-radius: 4px;
    cursor: pointer;
  }
`;

const SidebarButton = styled.button`
  width: 100%;
  padding: 0.8rem 1rem;
  background-color: ${props => (props.active ? 'var(--color-primary, #4FD1C5)' : 'transparent')};
  color: ${props => (props.active ? 'white' : 'var(--text-strong, #333)')};
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => (props.active ? '#3dbbab' : '#f6f6f6')};
  }
`;

const ContentArea = styled.main`
  flex: 1;
  padding: 1rem 2rem;
`;

// Basic styling for the page and list (can be moved to a separate CSS file or enhanced)
const PageWrapper = styled.div`
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
`;

const ToolList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 2rem; /* Add some space above the list if form is present */
`;

const ToolListItem = styled.li`
  background-color: var(--surface-lighter, #f9f9f9);
  border: 1px solid var(--border-color, #eee);
  border-radius: var(--radius-base, 8px);
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);

  h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-strong, #333);
  }
  p {
    margin: 0.2rem 0;
    font-size: 0.9rem;
    color: var(--text-secondary, #666);
  }
  span {
    font-weight: bold;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;

  button {
    padding: 0.5rem 0.8rem;
    border: none;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 0.85rem;
    transition: background-color 0.2s ease;
  }
`;

const EditButton = styled.button`
  background-color: var(--color-primary, #4FD1C5);
  color: white;
  &:hover { background-color: #3dbbab; }
`;

const ToggleStatusButton = styled.button`
  background-color: ${props => props.disabled ? 'var(--color-warning, #ECC94B)' : 'var(--color-success, #48BB78)'};
  color: white;
  &:hover { opacity: 0.8; }
`;

const DeleteButton = styled.button`
  background-color: var(--color-error, #F56565);
  color: white;
  &:hover { background-color: #e05252; }
`;

const AddToolButton = styled.button`
  background-color: var(--color-accent, #2c5282);
  color: white;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  border: none;
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
  &:hover { background-color: #224066; }
`;

// Sort control container
const SortContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const SortButton = styled.button`
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--border-color, #ccc);
  border-radius: var(--radius-sm, 4px);
  background-color: ${props => (props.active ? 'var(--color-primary, #4FD1C5)' : 'white')};
  color: ${props => (props.active ? 'white' : 'var(--text-strong, #333)')};
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => (props.active ? '#3dbbab' : '#f7f7f7')};
  }
`;


const DeveloperConsolePage = () => {
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [activeTab, setActiveTab] = useState('api'); // 'api' | 'health'
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useContext(AuthContext); // Get user info, potentially for filtering or display

  const fetchDeveloperTools = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // apiClient should be configured to send auth token if required by the backend for /api/dev/tools
      const response = await apiClient.get('/dev/tools');
      console.log(response.data);
      setTools(response.data.tools || []);
    } catch (err) {
      console.error("Failed to fetch developer tools:", err);
      setError('无法加载您的工具，请稍后再试。');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && user.role === 'developer') { // Ensure user is a developer before fetching
      fetchDeveloperTools();
    }
  }, [user]); // Refetch if user changes, though role change during session is unlikely

  const handleServiceAdded = () => {
    fetchDeveloperTools(); // Callback to refresh the list after a new service is added
  };

  const handleToggleStatus = async (toolId, currentStatus) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    try {
      const response = await apiClient.put(`/dev/tools/${toolId}`, { status: newStatus });
      setTools(prevTools =>
        prevTools.map(tool => tool.tool_id === toolId ? { ...tool, status: newStatus } : tool)
      );
      // TODO: Add Toast notification for success
    } catch (err) {
      console.error("Failed to toggle tool status:", err);
      // TODO: Add Toast notification for error
      setError(`更新工具 ${toolId} 状态失败。`);
    }
  };

  const handleDeleteTool = async (toolId) => {
    if (window.confirm('您确定要删除这个工具吗？此操作无法撤销。')) {
      try {
        await apiClient.delete(`/dev/tools/${toolId}`);
        setTools(prevTools => prevTools.filter(tool => tool.tool_id !== toolId));
        // TODO: Add Toast notification for success
      } catch (err) {
        console.error("Failed to delete tool:", err);
        // TODO: Add Toast notification for error
        setError(`删除工具 ${toolId} 失败。`);
      }
    }
  };

  // Derived list sorted by created_at
  const sortedTools = React.useMemo(() => {
    const sorted = [...tools].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  }, [tools, sortOrder]);

  // Placeholder for future navigation or modal for adding/editing tools
  // const handleAddTool = () => { // This button and handler will be removed
  //   console.log("Navigate to Add Tool form or open modal.");
  // };

  const handleEditTool = (toolId) => {
    console.log(`Navigate to Edit Tool form for ${toolId} or open modal.`);
    // Example: history.push(`/developer/tools/edit/${toolId}`)
  };

  const openAddModal = () => setAddModalOpen(true);
  const closeAddModal = () => setAddModalOpen(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    closeSidebar();
  };

  const handleServiceAddedAndClose = () => {
    handleServiceAdded();
    closeAddModal();
  };

  if (!user || user.role !== 'developer') {
    return (
      <PageWrapper>
        <h1>访问受限</h1>
        <p>您需要以开发者身份登录才能访问此页面。</p>
      </PageWrapper>
    );
  }

  // Separate early loading state for API tab; Health panel handles its own loading
  const showApiLoading = activeTab === 'api' && isLoading;

  return (
    <LayoutContainer>
      {/* Overlay for mobile */}
      <SidebarOverlay open={isSidebarOpen} onClick={closeSidebar} />

      {/* Sidebar */}
      <Sidebar open={isSidebarOpen}>
        <SidebarButton active={activeTab === 'api'} onClick={() => handleTabClick('api')}>API 管理</SidebarButton>
        <SidebarButton active={activeTab === 'health'} onClick={() => handleTabClick('health')}>系统健康</SidebarButton>
      </Sidebar>

      {/* Main content area */}
      <ContentArea>
        {activeTab === 'api' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h1>开发者控制台</h1>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AddToolButton onClick={openAddModal}>添加服务</AddToolButton>
                <SidebarToggleButton onClick={toggleSidebar}>
                  <BurgerIcon />
                </SidebarToggleButton>
              </div>
            </div>

            {/* Sort controls */}
            <SortContainer>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #666)' }}>提交历史排序:</span>
              <SortButton
                active={sortOrder === 'desc'}
                onClick={() => setSortOrder('desc')}
              >最新</SortButton>
              <SortButton
                active={sortOrder === 'asc'}
                onClick={() => setSortOrder('asc')}
              >最早</SortButton>
            </SortContainer>

            {error && <p style={{ color: 'red' }}>列表更新错误: {error}</p>}
            {showApiLoading && <p>正在加载列表...</p>}
            {!showApiLoading && sortedTools.length === 0 && !error && (
              <p>您还没有上传任何工具。</p>
            )}
            {!showApiLoading && sortedTools.length > 0 && (
              <ToolList>
                {sortedTools.map(tool => (
                  <ToolListItem key={tool.tool_id}>
                    <div>
                      <h3>{tool.name}</h3>
                      <p>ID: <span>{tool.tool_id}</span></p>
                      <p>提交时间: <span>{tool.created_at}</span></p>
                      <p>平台: <span>{tool.endpoint?.platform_type?.toUpperCase() || 'N/A'}</span></p>
                      <p>状态: <span style={{ color: tool.status === 'enabled' ? 'green' : 'orange' }}>
                        {tool.status === 'enabled' ? '已启用' : '已禁用'}
                      </span></p>
                      <p>描述: {tool.description || '无描述'}</p>
                    </div>
                    <ActionsContainer>
                      <EditButton onClick={() => handleEditTool(tool.tool_id)}>编辑</EditButton>
                      <ToggleStatusButton
                        onClick={() => handleToggleStatus(tool.tool_id, tool.status)}
                        disabled={tool.status === 'disabled'}
                      >
                        {tool.status === 'enabled' ? '禁用' : '启用'}
                      </ToggleStatusButton>
                      <DeleteButton onClick={() => handleDeleteTool(tool.tool_id)}>删除</DeleteButton>
                    </ActionsContainer>
                  </ToolListItem>
                ))}
              </ToolList>
            )}
          </>
        )}

        {activeTab === 'health' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h1>系统健康监控</h1>
              <SidebarToggleButton onClick={toggleSidebar}>
                <BurgerIcon />
              </SidebarToggleButton>
            </div>
            <SystemHealthPanel />
          </>
        )}
      </ContentArea>

      {/* Add Service Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        title="添加新服务"
        width="90%"
        maxWidth="800px"
      >
        <AddServiceForm onServiceAdded={handleServiceAddedAndClose} />
      </Modal>
    </LayoutContainer>
  );
};

export default DeveloperConsolePage; 