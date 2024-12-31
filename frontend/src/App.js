import React, { useState } from 'react';
import './App.css';
import ChatBox from './components/ChatBox/ChatBox';
import APIKeyForm from './components/APIKeyForm/APIKeyForm';
import DocumentUploader from './components/DocumentUploader/DocumentUploader';
import DocumentList from './components/DocumentList/DocumentList';
import PDFReader from './components/PDFReader/PDFReader';

function App() {
  // 更新时间：12-31 15:00:00
  const [updateTime, setUpdateTime] = useState(new Date().toLocaleString());
  const [pdfUrl, setPdfUrl] = useState(null);
  const handleUploadSuccess = () => {
      setUpdateTime(new Date().toLocaleString());
  };
  const handleViewDocument = (docUrl) => {
    const currentUrlBase = new URL(window.location.href);
    const url = currentUrlBase.origin;
    setPdfUrl(`${url}${docUrl}`);
  };
  const handlePageChange = (page) => {
    console.log(`Page changed to: ${page}`);
  };
  return (
    <div className="App">

      <main>
        <h2>设置API密钥</h2>
        <APIKeyForm />
        <ChatBox />
      </main>
      <div>
          <DocumentUploader onUploadSuccess={handleUploadSuccess} />
          <DocumentList updateTime={updateTime} onViewDocument={handleViewDocument} />
      </div>
      <div>
        {pdfUrl && <PDFReader url={pdfUrl} onPageChange={handlePageChange} />}
      </div>
    </div>
  );
}

export default App;
