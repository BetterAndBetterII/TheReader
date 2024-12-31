import React, { useState, useCallback } from 'react';
import axios from 'axios';
import './ChatBox.css';

const ChatBox = () => {
    const [input, setInput] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imageData, setImageData] = useState(null);

    const handlePaste = useCallback(async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                const reader = new FileReader();
                
                reader.onload = () => {
                    const base64String = reader.result.split(',')[1];
                    setImageData(base64String);
                };
                
                reader.readAsDataURL(file);
                break;
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() && !imageData) return;

        setIsLoading(true);
        setResponse('');
        try {
            const result = await axios.post('/api/gemini_chat_image', {
                prompt: input,
                image_data: imageData
            });
            setResponse(result.data.response || '未获取到回答');
            // 清除已发送的图片数据
            setImageData(null);
        } catch (error) {
            console.error('Error:', error);
            setResponse('抱歉，发生了一些错误，请稍后再试。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-response">
                {response && <div className="response-text">{response}</div>}
                {isLoading && (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="请输入您的问题...（可以粘贴图片）"
                    className="chat-input"
                />
                {imageData && (
                    <div className="image-preview">
                        <img 
                            src={`data:image/jpeg;base64,${imageData}`} 
                            alt="已粘贴的图片" 
                            style={{ maxWidth: '100px', maxHeight: '100px' }}
                        />
                        <button 
                            type="button" 
                            onClick={() => setImageData(null)}
                            className="remove-image"
                        >
                            ×
                        </button>
                    </div>
                )}
                <button 
                    type="submit" 
                    className="send-button"
                    disabled={isLoading}
                >
                    发送
                </button>
            </form>
        </div>
    );
};

export default ChatBox; 