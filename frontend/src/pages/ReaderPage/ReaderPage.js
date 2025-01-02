import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PDFReader from '../../components/PDFReader/PDFReader';
import ChatBox from '../../components/ChatBox/ChatBox';
import './ReaderPage.css';

const ReaderPage = ({ documentId, permissionChallenge }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [readerWidth, setReaderWidth] = useState(75); // 默认75%的宽度
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pageContent, setPageContent] = useState('');

  useEffect(() => {
    const fetchPdfUrl = async () => {
      if (!documentId) return;
      try {
        const response = await fetch(`/api/documents/view/${documentId}.pdf`);
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } catch (error) {
        console.error('Error fetching PDF:', error);
      }
    };

    fetchPdfUrl();
  }, [documentId]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleHorizontalDragStart = () => {
    console.log('handleHorizontalDragStart');
    setIsDraggingHorizontal(true);
  };

  const handleHorizontalDragEnd = () => {
    console.log('handleHorizontalDragEnd');
    setIsDraggingHorizontal(false);
  };

  const handleHorizontalDrag = (e) => {
    if (!isDraggingHorizontal) return;

    const container = e.currentTarget.parentElement;
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX;
    const containerWidth = containerRect.width;
    const relativeX = mouseX - containerRect.left;
    
    // 计算百分比（限制在30-70%之间）
    let percentage = (relativeX / containerWidth) * 100;
    console.log('percentage', percentage);

    percentage = Math.max(30, Math.min(100, percentage));
    setReaderWidth(percentage);
  };

  if (!pdfUrl) {
    return <div className="no-pdf" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>暂无PDF文件，请先在文档管理中选中PDF文件</div>;
  }

  const currentPageContentChanged = (pageContent) => {
    setPageContent(pageContent);
  };

  return (
    <div className="reader-page" 
        onMouseMove={handleHorizontalDrag}
        onMouseUp={handleHorizontalDragEnd}
    >
      <div 
        className="pdf-section"
        style={{ width: `${readerWidth}%` }}
      >
        <PDFReader
          url={pdfUrl}
          onPageChange={handlePageChange}
          documentId={documentId}
          currentPageContentChanged={currentPageContentChanged}
        />
      </div>
      <div 
        className="resizer-horizontal"
        onMouseDown={handleHorizontalDragStart}
      />
      <div 
        className="chat-section"
        style={{ width: `${100 - readerWidth}%`, height: '100%' }}
      >
        <ChatBox pageContent={pageContent} />
      </div>
    </div>
  );
};

export default ReaderPage; 