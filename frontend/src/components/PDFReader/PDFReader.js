import React from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';
import { zoomPlugin } from '@react-pdf-viewer/zoom';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import './PDFReader.css';

const PDFReader = ({ url, onPageChange }) => {
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
    onPageChange(pageNumber);
  };

  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
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
  );
};

export default PDFReader;