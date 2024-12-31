import React from 'react';
import './App.css';
import PDFReader from './components/PDFReader';

function App() {
  // 使用本地PDF文件进行测试
  const pdfUrl = "/sample.pdf";  // 这个文件需要放在public目录下

  return (
    <div className="App">
      <PDFReader url={pdfUrl} />
    </div>
  );
}

export default App;
