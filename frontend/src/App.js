import React from 'react';
import './App.css';
import ChatBox from './components/ChatBox/ChatBox';
import APIKeyForm from './components/APIKeyForm/APIKeyForm';
function App() {
  return (
    <div className="App">

      <main>
        <h2>设置API密钥</h2>
        <APIKeyForm />
        <ChatBox />
      </main>
    </div>
  );
}

export default App;
