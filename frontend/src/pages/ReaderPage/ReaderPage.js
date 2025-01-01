import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PDFReader from '../../components/PDFReader/PDFReader';
import ChatBox from '../../components/ChatBox/ChatBox';
import './ReaderPage.css';

const ReaderPage = ({ documentId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [readerWidth, setReaderWidth] = useState(65); // 默认65%的宽度
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    const fetchPdfUrl = async () => {
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
    return <div className="no-pdf">暂无PDF文件，请先在文档管理中选中PDF文件</div>;
  }

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
        <ChatBox documentId={documentId} currentPage={currentPage} />
      </div>
    </div>
  );
};

export default ReaderPage; 