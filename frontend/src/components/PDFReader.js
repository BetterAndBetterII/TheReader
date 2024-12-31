import React from 'react';
import './PDFReader.css';

const PDFReader = ({ url }) => {
  return (
    <div className="pdf-reader">
      <object
        data={url}
        type="application/pdf"
        className="pdf-viewer"
      >
        <div className="pdf-fallback">
          您的浏览器不支持PDF预览，请 <a href={url} target="_blank" rel="noopener noreferrer">点击此处</a> 下载PDF文件
        </div>
      </object>
    </div>
  );
};

export default PDFReader; 