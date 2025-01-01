import React, { useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import TranslateSection from './TranslateSection';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import './PDFReader.css';

const PDFReader = ({ url, onPageChange, documentId, currentPageContentChanged }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [viewerHeight, setViewerHeight] = useState(55); // 默认70%的高度

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
  };

  const handleVerticalDragStart = () => {
    setIsDraggingVertical(true);
  };

  const handleVerticalDragEnd = () => {
    setIsDraggingVertical(false);
  };

  const handleVerticalDrag = (e) => {
    if (!isDraggingVertical) return;
    
    const container = e.currentTarget.parentElement;
    const containerRect = container.getBoundingClientRect();
    const mouseY = e.clientY;
    const containerHeight = containerRect.height;
    const relativeY = mouseY - containerRect.top;
    
    // 计算百分比（限制在20-80%之间）
    let percentage = (relativeY / containerHeight) * 100;
    percentage = Math.max(20, Math.min(80, percentage));
    
    setViewerHeight(percentage);
  };

  return (
    <div className="pdf-reader-container"
        onMouseMove={handleVerticalDrag}
        onMouseUp={handleVerticalDragEnd}
    >
      <div 
        className="pdf-viewer-section"
        style={{ height: `${viewerHeight}%` }}
      >
        <Worker workerUrl="/pdf.worker.min.js">
          <div className="pdf-reader">
            <Viewer
              fileUrl={url}
              onPageChange={handlePageChange}
              defaultScale={1}
              plugins={[
                defaultLayoutPluginInstance,
                searchPluginInstance,
                zoomPluginInstance,
              ]}
            />
          </div>
        </Worker>
      </div>
      <div 
        className="resizer-vertical"
        onMouseDown={handleVerticalDragStart}
      />
      <div className="translate-section-container">
        <TranslateSection documentId={documentId} currentPage={currentPage} currentPageContentChanged={currentPageContentChanged} />
      </div>
    </div>
  );
};

export default PDFReader;