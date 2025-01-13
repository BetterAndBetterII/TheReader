import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import './FloatingMenu.css';

const FloatingMenu = ({ position, selectedText, onTranslate, onExplain, onAsk, onClose }) => {
  if (!selectedText) return null;

  return (
    <div 
      className="floating-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <button onClick={() => onTranslate(selectedText)} className="menu-item">
        <i className="fas fa-language"></i> 翻译
      </button>
      <button onClick={() => onExplain(selectedText)} className="menu-item">
        <i className="fas fa-info-circle"></i> 解释
      </button>
      <button onClick={() => onAsk(selectedText)} className="menu-item">
        <i className="fas fa-question-circle"></i> 解答
      </button>
      <button onClick={onClose} className="menu-item close">
        <CloseIcon fontSize="small" />
      </button>
    </div>
  );
};

export default FloatingMenu; 