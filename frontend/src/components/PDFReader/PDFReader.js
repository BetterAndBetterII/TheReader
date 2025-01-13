import React, { useState, useEffect, useRef } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import TranslateSection from './TranslateSection';
import ChatBox from '../ChatBox/ChatBox';
import FloatingMenu from './FloatingMenu';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import './PDFReader.css';

const PDFReader = ({ url, onPageChange, documentId, currentPageContentChanged, toggleTranslatePosition, isTranslateOnRight }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [viewerHeight, setViewerHeight] = useState(55); // 默认70%的高度
  const [viewerWidth, setViewerWidth] = useState(55); // 默认70%的宽度
  // 切换tab
  const [tab, setTab] = useState('reader');  // reader, chatbox
  const viewerRef = useRef(null);
  const [pageContent, setPageContent] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const chatBoxRef = useRef(null);

  const getInitialPage = () => {
    try{
      const doc_info = JSON.parse(localStorage.getItem(`doc_${documentId}`));
      if (doc_info && doc_info.pageNumber) {
        return parseInt(doc_info.pageNumber);
      }
      return 1;
    } catch(e) {
      return 1;
    }
    
  };

  const getInitialZoom = () => {
    try {
      const doc_info = JSON.parse(localStorage.getItem(`doc_${documentId}`));
      if (doc_info && doc_info.zoom) {
        return parseFloat(doc_info.zoom);
      }
      return 1;
    } catch(e) {
      return 1;
    }
    
  };

  // 创建插件实例
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => defaultTabs,
  });

  const searchPluginInstance = searchPlugin({
    keyword: '',
  });

  const zoomPluginInstance = zoomPlugin();

  // 页面变化回调
  const handlePageChange = (e) => {
    const pageNumber = e.currentPage + 1;
    setCurrentPage(pageNumber);
    onPageChange(pageNumber);
    // storage current page
    if(pageNumber !== 1) {
      try {
        const doc = JSON.parse(localStorage.getItem(`doc_${documentId}`));
        if(doc) {
          localStorage.setItem(`doc_${documentId}`, JSON.stringify({
            ...doc,
            "pageNumber": pageNumber,
          }));
        } else {
          localStorage.setItem(`doc_${documentId}`, JSON.stringify({
            "pageNumber": pageNumber,
          }));
        }
      } catch (error) {
        localStorage.setItem(`doc_${documentId}`, JSON.stringify({
          "pageNumber": pageNumber,
        }));
      }
    }
  };

  const handleZoomChange = (e) => {
    if(e.scale) {
      try {
        const doc = JSON.parse(localStorage.getItem(`doc_${documentId}`));
        if(doc) {
          localStorage.setItem(`doc_${documentId}`, JSON.stringify({
            ...doc,
            "zoom": e.scale,
          }));
        } else {
          localStorage.setItem(`doc_${documentId}`, JSON.stringify({
            "zoom": e.scale,
          }));
        }
      } catch (error) {
        localStorage.setItem(`doc_${documentId}`, JSON.stringify({
          "zoom": e.scale,
        }));
      }
    }
  };

  const handleVerticalDragStart = () => {
    setIsDraggingVertical(true);
  };

  const handleHorizontalDragStart = () => {
    setIsDraggingHorizontal(true);
  };

  const handleVerticalDragEnd = () => {
    setIsDraggingVertical(false);
    setIsDraggingHorizontal(false);
  };

  const handleVerticalDrag = (e) => {
    if (!isDraggingVertical && !isDraggingHorizontal) return;
    if (isDraggingVertical) {
      const container = e.currentTarget.parentElement;
      const containerRect = container.getBoundingClientRect();
      const mouseY = e.clientY;
      const containerHeight = containerRect.height;
      const relativeY = mouseY - containerRect.top;
      
      // 计算百分比（限制在20-80%之间）
      let percentage = (relativeY / containerHeight) * 100;
      percentage = Math.max(20, Math.min(80, percentage));
      
      setViewerHeight(percentage);
    }
    if (isDraggingHorizontal) {
      const container = e.currentTarget.parentElement;
      const containerRect = container.getBoundingClientRect();
      const mouseX = e.clientX;
      const containerWidth = containerRect.width;
      const relativeX = mouseX - containerRect.left;

      let percentage = (relativeX / containerWidth) * 100;
      percentage = Math.max(20, Math.min(80, percentage));
      
      setViewerWidth(percentage);
    }
  };

  useEffect(() => {
    if (isTranslateOnRight) {
      setViewerHeight(100);
      setViewerWidth(75);
    } else {
      setViewerHeight(55);
      setViewerWidth(100);
    }
  }, [isTranslateOnRight]);

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const JumpTo = (pageIndex) => {
    setCurrentPage(pageIndex);
    console.log(pageIndex);
    pageNavigationPluginInstance.jumpToPage(pageIndex - 1);
  };

  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setMenuPosition({
          x: rect.left + (rect.width / 2),
          y: rect.bottom + 10
        });
        setShowMenu(true);
      } else {
        setShowMenu(false);
      }
    };

    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, []);

  const handleTranslate = (text) => {
    setTab('chatbox');
    setShowMenu(false);
    setTimeout(() => {
      chatBoxRef.current?.handleTranslate(text);
    }, 100);
  };

  const handleExplain = (text) => {
    setTab('chatbox');
    setShowMenu(false);
    setTimeout(() => {
      chatBoxRef.current?.handleExplain(text);
    }, 100);
  };

  const handleAsk = (text) => {
    setTab('chatbox');
    setShowMenu(false);
    setTimeout(() => {
      chatBoxRef.current?.handleAsk(text);
    }, 100);
  };

  return (
    <div className={`pdf-reader-container ${isTranslateOnRight ? 'pdf-reader-container-right' : ''}`}
        onMouseMove={handleVerticalDrag}
        onMouseUp={handleVerticalDragEnd}
    >
      {showMenu && (
        <FloatingMenu
          position={menuPosition}
          selectedText={selectedText}
          onTranslate={handleTranslate}
          onExplain={handleExplain}
          onAsk={handleAsk}
          onClose={() => setShowMenu(false)}
        />
      )}
      <div 
        className={`pdf-viewer-section ${isTranslateOnRight ? 'pdf-viewer-section-right' : ''}`}
        style={{ height: `${viewerHeight}%`, width: `${viewerWidth}%` }}
      >
        <Worker workerUrl="/pdf.worker.min.js">
          <div className="pdf-reader">
            <Viewer
              fileUrl={url}
              onPageChange={handlePageChange}
              onZoom={handleZoomChange}
              defaultScale={getInitialZoom()}
              initialPage={getInitialPage() - 1}
              plugins={[
                defaultLayoutPluginInstance,
                searchPluginInstance,
                zoomPluginInstance,
                pageNavigationPluginInstance
              ]}
              ref={viewerRef}
            />
          </div>
        </Worker>
      </div>
      {!isTranslateOnRight ? <>
        <div 
          className="resizer-vertical"
          onMouseDown={handleVerticalDragStart}
        />
        <div className="translate-section-container">
          <TranslateSection 
            documentId={documentId} 
            currentPage={currentPage} 
            currentPageContentChanged={currentPageContentChanged} 
            toggleTranslatePosition={toggleTranslatePosition} 
            isTranslateOnRight={isTranslateOnRight}
            JumpTo={JumpTo}
          />
        </div>
      </> : <>
        <div 
          className="resizer-horizontal"
          onMouseDown={handleHorizontalDragStart}
        />
        <div className="translate-section-container-right">
          <div className="tab-switcher">
            <button 
              className={`tab-button ${tab === 'reader' ? 'active' : ''}`}
              onClick={() => setTab('reader')}
            >
              翻译
            </button>
            <button 
              className={`tab-button ${tab === 'chatbox' ? 'active' : ''}`}
              onClick={() => setTab('chatbox')}
            >
              聊天
            </button>
          </div>
          {tab === 'reader' ? (
            <TranslateSection 
              documentId={documentId} 
              currentPage={currentPage} 
              currentPageContentChanged={(content) => {
                setPageContent(content);
                currentPageContentChanged(content);
              }}
              toggleTranslatePosition={toggleTranslatePosition} 
              isTranslateOnRight={isTranslateOnRight}
              JumpTo={JumpTo}
            />
          ) : null}
          <div style={{ display: tab === 'chatbox' ? 'block' : 'none', height: '100%' }}>
            <ChatBox ref={chatBoxRef} pageContent={pageContent} className="chat-box" />
          </div>
        </div>
      </>}
    </div>
  );
};

export default PDFReader;