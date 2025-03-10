import React, { useState, useEffect } from 'react';
import './App.css';
import ReaderPage from './pages/ReaderPage/ReaderPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import DocumentPage from './pages/DocumentPage/DocumentPage';
import LatexPage from './pages/LatexPage/LatexPage';
import axios from 'axios';
import { clarity } from 'react-microsoft-clarity';
import { FaGithub } from 'react-icons/fa';

clarity.init("pr8nj6r20z");

function App() {
  const [documentId, setDocumentId] = useState(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentPage, setCurrentPage] = useState(() => {
    const url = new URL(window.location.href);
    const page = url.searchParams.get('page');
    const documentId = url.searchParams.get('documentId');
    setDocumentId(documentId);
    return page || 'reader';
  });

  // 检查登录状态
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await axios.get('/api/permissions/login/');
        setIsSuperuser(response.data.is_superuser);
      } catch (error) {
        console.error('获取权限失败:', error);
      }
    };
    checkPermission();
  }, []);

  // 检查是否显示更新提示
  useEffect(() => {
    const lastDismissed = localStorage.getItem('updateDialogDismissed');
    const currentDate = new Date().toDateString();
    if (lastDismissed !== currentDate) {
      setShowUpdateDialog(true);
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post('/api/permissions/login/', {
        password: password
      });
      if (response.data.message === '登录成功') {
        setIsSuperuser(true);
        setShowLoginDialog(false);
        setPassword('');
        setLoginError('');
      }
    } catch (error) {
      setLoginError('密码错误');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/permissions/logout/');
      setIsSuperuser(false);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const handleViewDocument = (documentId) => {
    const currentUrlBase = new URL(window.location.href);
    currentUrlBase.searchParams.set('documentId', documentId);
    setCurrentPage('reader');
    setDocumentId(documentId);
    window.history.pushState({}, '', currentUrlBase.toString());
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    // 修改为当前页面
    url.searchParams.set('page', currentPage);
    window.history.pushState({}, '', url.toString());
  }, [currentPage]);

  const permissionChallenge = async () => {
    setShowLoginDialog(true);
  };

  const handleDismissUpdate = () => {
    setShowUpdateDialog(false);
    localStorage.setItem('updateDialogDismissed', new Date().toDateString());
  };

  return (
    <div className="App" style={{ height: currentPage === 'reader' ? '100vh' : 'max-content', overflow: 'hidden' }}>
      <nav className="app-nav">
        <div className="nav-left">
          <button 
            className={`nav-button ${currentPage === 'reader' ? 'active' : ''}`}
            onClick={() => setCurrentPage('reader')}
          >
            阅读器
          </button>
          <button 
            className={`nav-button ${currentPage === 'upload' ? 'active' : ''}`}
            onClick={() => setCurrentPage('upload')}
          >
            文档管理
          </button>
          <button 
            className={`nav-button ${currentPage === 'latex' ? 'active' : ''}`}
            onClick={() => setCurrentPage('latex')}
          >
            公式解析器
          </button>
          <button 
            className={`nav-button ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            设置
          </button>
        </div>
        <div className="nav-right">
          <span className="user-identity">{isSuperuser ? '管理员' : '访客'}</span>
          <button 
            className="nav-button login-button"
            onClick={isSuperuser ? handleLogout : () => setShowLoginDialog(true)}
          >
            {isSuperuser ? '登出' : '登录'}
          </button>
          <a
            href="https://github.com/BetterAndBetterII/TheReader"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
          >
            <FaGithub size={28} />
          </a>
        </div>
      </nav>

      {showLoginDialog && (
        <div className="login-dialog">
          <div className="login-dialog-content">
            <h2>管理员登录</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            {loginError && <p className="login-error">{loginError}</p>}
            <div className="login-dialog-buttons">
              <button onClick={handleLogin}>登录</button>
              <button onClick={() => {
                setShowLoginDialog(false);
                setPassword('');
                setLoginError('');
              }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {showUpdateDialog && (
        <div className="login-dialog">
          <div className="login-dialog-content">
            <h2>新版本提示</h2>
            <p>欢迎使用TheReader！现在可以前往 <a href="https://ai.gitfetch.dev" target="_blank" rel="noopener noreferrer">ai.gitfetch.dev</a> 体验The Lab （The Reader 2.0版本）。</p>
            <div className="login-dialog-buttons">
              <button onClick={() => window.open('https://ai.gitfetch.dev', '_blank')}>立即体验</button>
              <button onClick={handleDismissUpdate}>继续使用</button>
            </div>
          </div>
        </div>
      )}

      <main className="app-main" style={{ height: currentPage === 'reader' ? `calc(100vh - 45px)` : 'max-content', overflow: 'hidden' }}>
        {currentPage === 'reader' && (
          <ReaderPage documentId={documentId} permissionChallenge={permissionChallenge} />
        )}
        {currentPage === 'settings' && <SettingsPage permissionChallenge={permissionChallenge}/>}
        {currentPage === 'upload' && (
          <DocumentPage onViewDocument={handleViewDocument} permissionChallenge={permissionChallenge} />
        )}
        {currentPage === 'latex' && (
          <LatexPage />
        )}
      </main>
    </div>
  );
}

export default App;
