import React, { useState, useEffect } from 'react';
import './App.css';
import ReaderPage from './pages/ReaderPage/ReaderPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import DocumentPage from './pages/DocumentPage/DocumentPage';

function App() {
  const [documentId, setDocumentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const url = new URL(window.location.href);
    const page = url.searchParams.get('page');
    const documentId = url.searchParams.get('documentId');
    setDocumentId(documentId);
    return page || 'reader';
  });

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

  return (
    <div className="App">
      <nav className="app-nav">
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
          className={`nav-button ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentPage('settings')}
        >
          设置
        </button>
      </nav>

      <main className="app-main">
        {currentPage === 'reader' && (
          <ReaderPage documentId={documentId}/>
        )}
        {currentPage === 'settings' && <SettingsPage />}
        {currentPage === 'upload' && (
          <DocumentPage onViewDocument={handleViewDocument} />
        )}
      </main>
    </div>
  );
}

export default App;
