import React, { useState, useEffect, useRef } from 'react';
import './TranslateSection.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import Tooltip from '@mui/material/Tooltip';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const TranslateSection = ({ documentId, currentPage, currentPageContentChanged, toggleTranslatePosition, isTranslateOnRight, JumpTo }) => {
  const [documentInfo, setDocumentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isChineseMode, setIsChineseMode] = useState(true);
  const [showRawText, setShowRawText] = useState(false);
  const [mindmapData, setMindmapData] = useState(null);
  const [showMindmap, setShowMindmap] = useState(false);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [currentCopySuccess, setCurrentCopySuccess] = useState(false);
  const [nearbyCopySuccess, setNearbyCopySuccess] = useState(false);
  const mindmapRef = useRef(null);
  const markmapRef = useRef(null);

  useEffect(() => {
    const fetchDocumentInfo = async () => {
      if (!documentId || !currentPage) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/documents/${documentId}/`);
        if (response.ok) {
          const data = await response.json();
          setDocumentInfo(data.document);
        } else {
          console.error('获取文档信息失败');
          setDocumentInfo(null);
        }
      } catch (error) {
        console.error('获取文档信息出错:', error);
        setDocumentInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentInfo();
  }, [documentId]);

  const getNearbyPageContent = () => {
    const totalPages = documentInfo?.chinese_sections?.pages?.length || 0;
    const previousPage = currentPage - 1 < 1 ? 1 : currentPage - 1;
    const nextPage = currentPage + 1 > totalPages ? totalPages : currentPage + 1;
    const currentPageContent = getPageContent(currentPage);
    const previousPageContent = getPageContent(previousPage);
    const nextPageContent = getPageContent(nextPage);
    return `${previousPageContent}\n\n${currentPageContent}\n\n${nextPageContent}`;
  };

  useEffect(() => {
    currentPageContentChanged(getNearbyPageContent());
  }, [currentPage, documentInfo, isChineseMode]);

  const getPageContent = (page) => {
    if (!documentInfo) return '';
    const pageIndex = page - 1;
    if (isChineseMode) {
      return documentInfo.chinese_sections?.pages[pageIndex]?.content || '暂无翻译';
    }
    return documentInfo.english_sections?.pages[pageIndex]?.content || '暂无内容';
  };

  const getCurrentContent = () => {
    if (!documentInfo) return '';
    const pageIndex = currentPage - 1;
    if (isChineseMode) {
      return documentInfo.chinese_sections?.pages[pageIndex]?.content || '暂无翻译';
    }
    return documentInfo.english_sections?.pages[pageIndex]?.content || '暂无内容';
  };

  const toggleLanguage = () => {
    setIsChineseMode(!isChineseMode);
  };

  const toggleRawText = () => {
    setShowRawText(!showRawText);
  };

  useEffect(() => {
    if (mindmapData && showMindmap) {
      console.log(mindmapData);
      // 使用 markmap 渲染思维导图
      if (mindmapRef.current) {
        const transformer = new Transformer();
        const { root } = transformer.transform(mindmapData.mindmap);
        if (markmapRef.current) {
          markmapRef.current.destroy();
        }
        markmapRef.current = Markmap.create(mindmapRef.current, undefined, root);
        markmapRef.current.fit();
      }
    }
  }, [showMindmap, mindmapData]);

  const handleMindmapClick = async () => {
    if (!documentId) return;
    setMindmapLoading(false);
    if (mindmapData) {
      setShowMindmap(true);
      return;
    }
    setMindmapLoading(true);
    try {
        // 获取所有页面的内容
        const allPagesContent = documentInfo?.chinese_sections?.pages?.map(page => page.content).join('\n\n');
        const response = await fetch('/api/mindmaps/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docid: documentId,
          prompt: allPagesContent
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMindmapData(data);
        setShowMindmap(true);
      } else if (response.status === 403) {
        throw new Error('No permission');
      } else {
        throw new Error('重新生成思维导图失败');
      }
    } catch (error) {
      if (error.message === 'No permission') {
        setMindmapData({
          mindmap: "# 抱歉，您没有权限使用此功能。"
        });
        setShowMindmap(true);
      }
      console.error('获取思维导图出错:', error);
    } finally {
      setMindmapLoading(false);
    }
  };

  const handleRegenerateMindmap = async (retry=false) => {
    setMindmapLoading(true);
    try {
      const allPagesContent = documentInfo?.chinese_sections?.pages?.map(page => page.content).join('\n\n');
      const response = await fetch('/api/mindmaps/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docid: documentId,
          prompt: allPagesContent,
          retry: retry
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMindmapData(data);
      } else if (response.status === 403) {
        throw new Error('No permission');
      } else {
        console.error('重新生成思维导图失败');
        throw new Error('重新生成思维导图失败');
      }
    } catch (error) {
      if (error.message === 'No permission') {
        setMindmapData({
          mindmap: "# 抱歉，您没有权限使用此功能。"
        });
        setShowMindmap(true);
        return;
      }
      console.error('重新生成思维导图出错:', error);
    } finally {
      setMindmapLoading(false);
    }
  };

  const closeMindmap = () => {
    setShowMindmap(false);
    if (markmapRef.current) {
      markmapRef.current.destroy();
    }
  };

  const handleExportImage = () => {
    if (!mindmapRef.current) return;
    
    const svg = mindmapRef.current;
    if (!svg) return;

    // 克隆SVG并添加样式
    const svgClone = svg.cloneNode(true);

    // 设置背景色
    svgClone.style.backgroundColor = 'white';
    
    // 设置合适的视图框和尺寸
    const bbox = svg.getBBox();
    const viewBox = `${bbox.x - 10} ${bbox.y - 10} ${bbox.width + 20} ${bbox.height + 20}`;
    svgClone.setAttribute('viewBox', viewBox);
    svgClone.setAttribute('width', String(bbox.width + 20));
    svgClone.setAttribute('height', String(bbox.height + 20));

    // 转换为图片
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // 2倍清晰度
      canvas.width = (bbox.width + 20) * scale;
      canvas.height = (bbox.height + 20) * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 绘制图片
      ctx.scale(scale, scale);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, bbox.width + 20, bbox.height + 20);
      
      // 导出为PNG
      const link = document.createElement('a');
      link.download = '思维导图.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopyCurrentPage = () => {
    const currentPageContent = getCurrentContent();
    navigator.clipboard.writeText(currentPageContent);
    setCurrentCopySuccess(true);
    setTimeout(() => {
      setCurrentCopySuccess(false);
    }, 2000);
  };

  const handleCopyNearbyPage = () => {
    const nearbyPageContent = getNearbyPageContent();
    navigator.clipboard.writeText(nearbyPageContent);
    setNearbyCopySuccess(true);
    setTimeout(() => {
      setNearbyCopySuccess(false);
    }, 2000);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      JumpTo(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < documentInfo?.chinese_sections?.pages?.length) {
      JumpTo(currentPage + 1);
    }
  };

  return (
    <div className={`translate-section ${isTranslateOnRight ? 'translate-section-right' : ''}`}>
      <div className={`translate-header ${isTranslateOnRight ? 'translate-header-right' : ''}`}>
        <div className="translate-title">
          {!isTranslateOnRight && <h3>Summary</h3>}
          <div className={`button-group ${isTranslateOnRight ? 'button-group-right' : ''}`}>
            <button 
              className={`language-toggle ${isChineseMode ? 'chinese' : 'english'}`}
              onClick={toggleLanguage}
            >
              {isChineseMode ? '切换至英文' : '切换至中文'}
            </button>
            <button 
              className={`format-toggle ${showRawText ? 'raw' : 'formatted'}`}
              onClick={toggleRawText}
            >
              {showRawText ? '显示格式化' : '显示原文'}
            </button>
            <button 
              className={`mindmap-toggle ${mindmapLoading ? 'loading' : ''}`}
              onClick={handleMindmapClick}
              disabled={mindmapLoading}
            >
              {mindmapLoading ? '生成中...' : '生成思维导图'}
            </button>
            <button 
              className="layout-toggle"
              onClick={toggleTranslatePosition}
            >
              切换Summary位置
            </button>
          </div>
        </div>
        <span className="page-indicator">当前页: {currentPage}</span>
      </div>
        <div className="translate-content">
        <div className="control-buttons">
          <div className="nav-page-buttons">
            <Tooltip title="上一页">
              <button onClick={handlePreviousPage}>
              <ArrowBackIcon />
            </button>
          </Tooltip>
          <Tooltip title="下一页">
            <button onClick={handleNextPage}>
              <ArrowForwardIcon />
            </button>
          </Tooltip>
          </div>
          <div className="clipboard-buttons">
            <Tooltip title="复制当前页内容">
              <button onClick={handleCopyCurrentPage} className={`${currentCopySuccess ? 'success' : ''}`}>
                {currentCopySuccess ? <CheckIcon /> : <ContentCopyIcon />}
              </button>
            </Tooltip>
            <Tooltip title="复制附近内容">
              <button onClick={handleCopyNearbyPage} className={`${nearbyCopySuccess ? 'success' : ''}`}>
                {nearbyCopySuccess ? <CheckIcon /> : <CopyAllIcon />}
              </button>
            </Tooltip>
          </div>
        </div>
        <div className="translation-text">
          {showRawText ? (
            <pre className="raw-text">{getCurrentContent()}</pre>
          ) : (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
            >
              {getCurrentContent()}
            </ReactMarkdown>
          )}
          </div>
        </div>

      {showMindmap && (
        <div className="mindmap-modal">
          <div className="mindmap-modal-content">
            <div className="mindmap-modal-header">
              <h2>思维导图</h2>
              <div className="modal-actions">
                <button 
                  className="export-button"
                  onClick={handleExportImage}
                >
                  <DownloadIcon />
                  导出图片
                </button>
                <button 
                  className="regenerate-button"
                  onClick={() => handleRegenerateMindmap(true)}
                  disabled={mindmapLoading}
                >
                  <RefreshIcon />
                  {mindmapLoading ? '生成中...' : '重新生成'}
                </button>
                <button className="close-button" onClick={closeMindmap}>
                  <CloseIcon />
                </button>
              </div>
            </div>
            <div className="mindmap-container">
              <svg ref={mindmapRef} className="mindmap"></svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslateSection; 