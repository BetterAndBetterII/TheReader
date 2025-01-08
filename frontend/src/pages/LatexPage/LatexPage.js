import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import './LatexPage.css';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

const LatexPage = () => {
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const processFile = async (file) => {
    setIsLoading(true);
    try {
      // 创建文件预览URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewFile({
        url: previewUrl,
        type: file.type
      });

      // 发送到服务器处理
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', file.type);  // 文件类型：image/png, image/jpg, image/jpeg, application/pdf
      
      const response = await fetch('/api/parse-latex', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setMarkdownContent(data.markdown);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    await processFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    }
  });

  const handlePaste = useCallback(async (event) => {
    const items = event.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        const file = item.getAsFile();
        await processFile(file);
        break;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
      // 清理预览URL
      if (previewFile) {
        URL.revokeObjectURL(previewFile.url);
      }
    };
  }, [handlePaste]);

  const renderPreview = () => {
    if (!previewFile) {
      return (
        <div className="dropzone-content">
          <p>拖放文件到此处，或点击选择文件</p>
          <p className="dropzone-subtitle">支持 PDF 和图片格式</p>
          <p className="dropzone-paste-hint">您也可以随时按 Ctrl+V 粘贴图片</p>
        </div>
      );
    }

    if (previewFile.type.startsWith('image/')) {
      return (
        <img 
          src={previewFile.url} 
          alt="预览" 
          className="preview-image"
        />
      );
    }

    if (previewFile.type === 'application/pdf') {
      return (
        <object
          data={previewFile.url}
          type="application/pdf"
          className="preview-pdf"
          style={{ width: '100%', minHeight: '80vh' }}
        >
          <p>无法显示PDF预览</p>
        </object>
      );
    }

    return null;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopySuccess(true);
    setTimeout(() => {
      setCopySuccess(false);
    }, 2000);
  };

  return (
    <div className="latex-page">
      <div className="latex-page__left">
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>将文件拖放到这里...</p>
          ) : (
            renderPreview()
          )}
        </div>
      </div>
      
      <div className="latex-page__right">
        <div className="content-container">
          <div className="preview-section">
            <h3>预览</h3>
            <div className="preview-content">
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-icon">
                    <CircularProgress />
                  </div>
                  <div className="loading-text">正在解析中...</div>
                </div>
              ) : (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeRaw]}
                >
                  {markdownContent}
                </ReactMarkdown>
              )}
            </div>
          </div>
          <div className="markdown-section">
            <h3>Markdown 内容</h3>
              <div className="markdown-section__header">
              <div className="markdown-section__header__copy">
                <Tooltip title="复制">
                  <button onClick={handleCopy}>
                    {copySuccess ? <CheckIcon /> : markdownContent ? <ContentCopyIcon /> : <></>}
                  </button>
                </Tooltip>
              </div>
            </div>
            <textarea
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              placeholder="解析后的 Markdown 将显示在这里..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatexPage;