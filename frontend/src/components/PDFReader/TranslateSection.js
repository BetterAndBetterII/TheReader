import React, { useState, useEffect } from 'react';
import './TranslateSection.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const TranslateSection = ({ documentId, currentPage }) => {
  const [documentInfo, setDocumentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isChineseMode, setIsChineseMode] = useState(true);
  const [showRawText, setShowRawText] = useState(false);

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

  return (
    <div className="translate-section">
      <div className="translate-header">
        <div className="translate-title">
          <h3>Summary</h3>
          <div className="button-group">
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
          </div>
        </div>
        <span className="page-indicator">当前页: {currentPage}</span>
      </div>
      <div className="translate-content">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="translation-text">
            {showRawText ? (
              <pre className="raw-text">{getCurrentContent()}</pre>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {getCurrentContent()}
              </ReactMarkdown>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslateSection; 